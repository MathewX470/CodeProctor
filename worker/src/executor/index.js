import { createTempEnvironment, cleanupTempEnvironment } from '../utils/fileSystem.js';
import { compileContainer, startExecutionContainer, runTestCase, killContainer } from '../docker/index.js';
import { languageConfig } from '../languages/index.js';
import { prisma } from '../db.js';

export async function executeSubmission(jobData) {
  const { submissionId } = jobData;

  // 1. Fetch submission details
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { problem: true, language: true }
  });

  if (!submission) {
    console.error(`Submission ${submissionId} not found.`);
    return;
  }

  const langConfig = languageConfig[submission.language.slug];
  if (!langConfig) {
    console.error(`Language config not found for slug: ${submission.language?.slug}`);
    await updateSubmissionVerdict(submissionId, 'RUNTIME_ERROR');
    return;
  }

  // Action type logic from context - if it's not a contest practice might want to run all testcases
  // The Next.js frontend marks contestId if it belongs to a contest.
  // We'll fetch testcases based on whether it's a RUN (practice) or SUBMIT (all)
  // For simplicity, we just run all test cases associated with the problem.
  // If you need "RUN" vs "SUBMIT", the Next.js app can pass `actionType: 'RUN'` in jobData to filter `isHidden: false`.
  const isRun = jobData.actionType === 'RUN';
  const testCases = await prisma.testCase.findMany({
    where: {
      problemId: submission.problemId,
      ...(isRun ? { isHidden: false } : {}) // Only public if it's a RUN
    },
    orderBy: { createdAt: 'asc' }
  });

  // Update status to COMPILING
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: 'RUNNING' } // Or COMPILING if you added it to the enum
  });

  const containerName = `sub-${submissionId}`;
  let tmpDir;
  
  try {
    tmpDir = await createTempEnvironment(submission.sourceCode, langConfig.fileName);

    // 2. Compilation Phase
    const compileResult = await compileContainer(langConfig.image, tmpDir, langConfig.compileCommand);
    
    if (!compileResult.success) {
      await updateSubmissionVerdict(submissionId, 'COMPILATION_ERROR', 0, 0);
      return;
    }

    // 3. Start Execution Container
    await startExecutionContainer(langConfig.image, tmpDir, containerName);
    
    let aggregateVerdict = 'ACCEPTED';
    let maxExecutionTime = 0;
    
    // 4. Run Test Cases Loop
    for (const testCase of testCases) {
      const tcResult = await runTestCase(
        containerName, 
        langConfig.runCommand, 
        testCase.input, 
        submission.problem.timeLimit
      );
      
      const tcExecutionTime = tcResult.executionTime || 0;
      maxExecutionTime = Math.max(maxExecutionTime, tcExecutionTime);
      
      let tcVerdict = 'ACCEPTED';
      
      if (!tcResult.success) {
         tcVerdict = tcResult.errorType;
      } else {
         const actualOut = tcResult.stdout.trim();
         const expectedOut = testCase.expectedOutput.trim();
         if (actualOut !== expectedOut) {
            tcVerdict = 'WRONG_ANSWER';
         }
      }

      // Save SubmissionTestCase
      await prisma.submissionTestCase.upsert({
         where: {
           submissionId_testCaseId: {
             submissionId: submissionId,
             testCaseId: testCase.id
           }
         },
         create: {
           submissionId: submissionId,
           testCaseId: testCase.id,
           verdict: tcVerdict,
           executionTime: tcExecutionTime,
           memoryUsed: 0, // Mocked for now, needs cgroup stat extraction
           actualOutput: tcResult.stdout.substring(0, 500) // Truncate large outputs
         },
         update: {
           verdict: tcVerdict,
           executionTime: tcExecutionTime,
           memoryUsed: 0,
           actualOutput: tcResult.stdout.substring(0, 500)
         }
      });
      
      // Fail Fast (if not ACCEPTED, stop running subsequent cases)
      if (tcVerdict !== 'ACCEPTED') {
         aggregateVerdict = tcVerdict;
         break;
      }
    }
    
    // 5. Finalize Submission Verdict
    await updateSubmissionVerdict(submissionId, aggregateVerdict, maxExecutionTime, 0);
    return { verdict: aggregateVerdict };

  } catch (error) {
    console.error(`[Execution Error] sub-${submissionId}:`, error);
    await updateSubmissionVerdict(submissionId, 'RUNTIME_ERROR');
    return { verdict: 'RUNTIME_ERROR' };
  } finally {
    // 6. Cleanup
    await killContainer(containerName);
    if (tmpDir) {
      await cleanupTempEnvironment(tmpDir);
    }
  }
}

async function updateSubmissionVerdict(submissionId, verdict, time = 0, memory = 0) {
  await prisma.submission.update({
    where: { id: submissionId },
    data: { 
      status: 'COMPLETED',
      verdict: verdict,
      executionTime: time,
      memoryUsed: memory,
      judgedAt: new Date()
    }
  });
}

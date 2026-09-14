import { createTempEnvironment, cleanupTempEnvironment } from '../utils/fileSystem.js';
import { compileContainer, startExecutionContainer, runTestCase, killContainer } from '../docker/index.js';
import { languageConfig } from '../languages/index.js';
import { prisma } from '../db.js';

export async function executeSubmission(jobData) {
  const { submissionId } = jobData;

  // 1. Fetch submission details
  console.log(`[Executor sub-${submissionId}] 🔍 Fetching submission from database...`);
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

  // Update status to RUNNING
  console.log(`[Executor sub-${submissionId}] 🚀 Updating status to RUNNING...`);
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: 'RUNNING' } // Or COMPILING if you added it to the enum
  });

  const containerName = `sub-${submissionId}`;
  let tmpDir;
  
  try {
    tmpDir = await createTempEnvironment(submission.sourceCode, langConfig.fileName);

    // 2. Compilation Phase
    console.log(`[Executor sub-${submissionId}] ⚙️  Compiling inside container...`);
    const compileResult = await compileContainer(langConfig.image, tmpDir, langConfig.compileCommand);
    
    if (!compileResult.success) {
      if (compileResult.stderr) {
        try {
          await prisma.executionLog.create({
            data: {
              submissionId,
              stage: 'compile',
              message: compileResult.stderr.substring(0, 2000)
            }
          });
        } catch (e) {
          console.error("Failed to log compilation error", e);
        }
      }
      await updateSubmissionVerdict(submissionId, 'COMPILATION_ERROR', 0, 0);
      return;
    }

    // 3. Start Execution Container
    console.log(`[Executor sub-${submissionId}] 🐳 Starting execution container ${containerName}...`);
    await startExecutionContainer(langConfig.image, tmpDir, containerName);
    
    let aggregateVerdict = 'ACCEPTED';
    let maxExecutionTime = 0;
    let maxMemory = 0;
    let firstFailedVerdict = null;
    let passedTestCasesCount = 0;
    
    // 4. Run Test Cases Loop
    console.log(`[Executor sub-${submissionId}] 🧪 Running ${testCases.length} test cases...`);
    for (const testCase of testCases) {
      const tcResult = await runTestCase(
        containerName, 
        tmpDir,
        langConfig.runCommand, 
        testCase.input, 
        submission.problem.timeLimit
      );
      
      const tcExecutionTime = tcResult.executionTime || 0;
      const tcMemory = tcResult.memoryUsed || 0;
      maxExecutionTime = Math.max(maxExecutionTime, tcExecutionTime);
      maxMemory = Math.max(maxMemory, tcMemory);
      
      let tcVerdict = 'ACCEPTED';
      
      if (!tcResult.success) {
         tcVerdict = tcResult.errorType;
         if (tcResult.stderr) {
           try {
             await prisma.executionLog.create({
               data: {
                 submissionId,
                 stage: 'run',
                 message: tcResult.stderr.substring(0, 2000)
               }
             });
           } catch (e) {
             console.error("Failed to log runtime error", e);
           }
         }
      } else {
         const actualOut = tcResult.stdout.trim();
         const expectedOut = testCase.expectedOutput.trim();
         if (actualOut !== expectedOut) {
            tcVerdict = 'WRONG_ANSWER';
         }
      }

      if (tcVerdict === 'ACCEPTED') {
         passedTestCasesCount++;
      } else if (!firstFailedVerdict) {
         firstFailedVerdict = tcVerdict;
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
           memoryUsed: tcMemory,
           actualOutput: tcResult.stdout.substring(0, 500) // Truncate large outputs
         },
         update: {
           verdict: tcVerdict,
           executionTime: tcExecutionTime,
           memoryUsed: tcMemory,
           actualOutput: tcResult.stdout.substring(0, 500)
         }
      });
    }

    // Determine aggregate verdict: ACCEPTED only if 100% of cases passed
    if (testCases.length > 0 && passedTestCasesCount === testCases.length) {
      aggregateVerdict = 'ACCEPTED';
    } else if (testCases.length > 0) {
      aggregateVerdict = firstFailedVerdict || 'WRONG_ANSWER';
    }
    
    // 5. Finalize Submission Verdict
    await updateSubmissionVerdict(submissionId, aggregateVerdict, maxExecutionTime, maxMemory);
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

import { createTempEnvironment, cleanupTempEnvironment } from '../utils/fileSystem.js';
import { runDockerContainer } from '../docker/index.js';
import { languageConfig } from '../languages/index.js';

export async function executeSubmission(jobData) {
  const { submissionId, sourceCode, languageId, testCases, timeLimit = 2000, memoryLimit = 128000 } = jobData;

  const langConfig = languageConfig[languageId];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${languageId}`);
  }

  let tmpDir;
  try {
    // 1. Prepare Environment
    tmpDir = await createTempEnvironment(sourceCode, langConfig.fileName);

    // 2. Prepare Command (For simplicity, we are running all test cases inside a single command or one by one.
    // In a real implementation, you might want to inject inputs via stdin and read outputs.)
    // Here we'll just run the code once for demonstration of the executor flow.
    const runCommand = langConfig.getRunCommand();
    
    const startTime = Date.now();
    
    // 3. Execute
    const result = await runDockerContainer(
      langConfig.image,
      tmpDir,
      runCommand,
      timeLimit,
      memoryLimit
    );

    const executionTime = Date.now() - startTime;

    // 4. Return result (In a real system, you'd compare result.stdout with test case expected outputs)
    // We are mocking a successful verdict if it executed without error
    if (result.success) {
      return {
        submissionId,
        verdict: 'ACCEPTED',
        executionTime,
        memoryUsed: 0, // Would be parsed from Docker stats or time command
        stdout: result.stdout,
        stderr: result.stderr
      };
    } else {
      return {
        submissionId,
        verdict: result.errorType || 'RUNTIME_ERROR',
        executionTime,
        memoryUsed: 0,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

  } catch (error) {
    console.error('[Execution Error]', error);
    return {
      submissionId,
      verdict: 'RUNTIME_ERROR',
      error: error.message
    };
  } finally {
    // 5. Cleanup
    if (tmpDir) {
      await cleanupTempEnvironment(tmpDir);
    }
  }
}

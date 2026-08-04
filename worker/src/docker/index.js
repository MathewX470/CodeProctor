import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Runs a command inside a docker container.
 * @param {string} image - The Docker image to use.
 * @param {string} tempDirPath - Absolute path to the host directory to mount.
 * @param {string} runCommand - The command to run inside the container.
 * @param {number} timeLimit - Time limit in milliseconds.
 * @param {number} memoryLimit - Memory limit in KB.
 */
export async function runDockerContainer(image, tempDirPath, runCommand, timeLimit, memoryLimit) {
  // We use docker run --rm to remove the container after execution.
  // We mount the temp dir as read-write to /workspace.
  // We set memory limit (memoryLimit is in KB, so convert to MB or bytes).
  // Egress network is disabled.
  
  const memoryLimitMB = Math.max(4, Math.ceil(memoryLimit / 1024)); // Minimum 4MB for Docker
  
  const dockerCmd = `docker run --rm -v "${tempDirPath}:/workspace" --network none --memory="${memoryLimitMB}m" --workdir /workspace ${image} sh -c "${runCommand}"`;
  
  try {
    const { stdout, stderr } = await execAsync(dockerCmd, { 
      timeout: timeLimit,
      killSignal: 'SIGKILL' // Kill if timeout is reached
    });
    
    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
  } catch (error) {
    if (error.killed) {
      return {
        success: false,
        errorType: 'TIME_LIMIT_EXCEEDED',
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || ''
      };
    }
    
    // If exit code is not 0
    return {
      success: false,
      errorType: 'RUNTIME_ERROR', // Could also be compilation error if runCommand includes compilation
      exitCode: error.code,
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message
    };
  }
}

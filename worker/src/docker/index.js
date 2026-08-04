import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Compiles the source code inside a Docker container.
 */
export async function compileContainer(image, tempDirPath, compileCommand, timeoutMs = 15000) {
  if (!compileCommand) return { success: true }; // Interpreted language

  // We compile inside the container. We map the workspace and run the compiler.
  // We use memory limit for compilation (e.g. 256MB)
  const dockerCmd = `docker run --rm -v "${tempDirPath}:/workspace" --network none --memory="256m" --workdir /workspace ${image} sh -c "${compileCommand}"`;
  
  try {
    const { stdout, stderr } = await execAsync(dockerCmd, { 
      timeout: timeoutMs,
      killSignal: 'SIGKILL'
    });
    
    return { success: true, stdout, stderr };
  } catch (error) {
    if (error.killed) {
      return { success: false, errorType: 'COMPILATION_TIMEOUT', stderr: 'Compilation timed out.' };
    }
    return {
      success: false,
      errorType: 'COMPILATION_ERROR',
      stderr: error.stderr || error.message
    };
  }
}

/**
 * Starts a background execution container.
 * Uses security flags to lock down the container.
 */
export async function startExecutionContainer(image, tempDirPath, containerName) {
  // Sleep infinity keeps it alive
  // Security options included
  const dockerCmd = `docker run -d --rm --name "${containerName}" -v "${tempDirPath}:/workspace" --network none --memory="128m" --cpus="1" --pids-limit="64" --read-only --security-opt=no-new-privileges --tmpfs /tmp --workdir /workspace ${image} sleep infinity`;
  
  await execAsync(dockerCmd);
}

/**
 * Runs a specific test case against the running container using docker exec.
 */
export async function runTestCase(containerName, tempDirPath, runCommand, input, timeLimitMs = 2000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdoutData = '';
    let stderrData = '';
    
    // We use /usr/bin/time (busybox time) to write exact execution stats to a file inside the container's /workspace (which maps to tempDirPath).
    // The -v flag gives us verbose output, and -o outputs it to the file so it doesn't pollute stderr.
    // We wrap runCommand so that if it fails, the exit code is preserved.
    const wrappedCommand = `time -v -o /workspace/time.txt sh -c '${runCommand.replace(/'/g, "'\\''")}'; exit_code=$?; exit $exit_code`;
    
    // docker exec -i runs the command interactively so we can pipe stdin
    const child = spawn('docker', ['exec', '-i', containerName, 'sh', '-c', wrappedCommand]);
    
    // Setup timeout kill
    const timeoutId = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({
        success: false,
        errorType: 'TIME_LIMIT_EXCEEDED',
        executionTime: timeLimitMs,
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
        exitCode: null
      });
    }, timeLimitMs + 500); // 500ms grace period for docker overhead
    
    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
    
    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });
    
    child.on('close', async (code) => {
      clearTimeout(timeoutId);
      const infrastructureTime = Date.now() - startTime;
      
      let executionTime = infrastructureTime;
      let memoryUsed = 0;
      
      // Attempt to read the time.txt file written by `time -v`
      try {
        const timeFile = path.join(tempDirPath, 'time.txt');
        const timeOutput = await fs.readFile(timeFile, 'utf8');
        
        // Parse "Elapsed (wall clock) time (h:mm:ss or m:ss): 0m 0.02s"
        const timeMatch = timeOutput.match(/Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): (?:(\d+)h )?(?:(\d+)m )?([0-9.]+)s/);
        // Parse "Maximum resident set size (kbytes): 3072"
        const memMatch = timeOutput.match(/Maximum resident set size \(kbytes\): (\d+)/);
        
        if (timeMatch) {
          const h = parseInt(timeMatch[1] || '0');
          const m = parseInt(timeMatch[2] || '0');
          const s = parseFloat(timeMatch[3] || '0');
          executionTime = Math.round((h * 3600 + m * 60 + s) * 1000);
          
          // If the timer is 0ms, give a realistic minimum of 1ms
          if (executionTime === 0) executionTime = 1;
        }
        
        if (memMatch) {
          memoryUsed = parseInt(memMatch[1]);
        }
      } catch (err) {
        // Fallback to infrastructure time if parsing fails
        console.error("Failed to parse time:", err.message);
      }
      
      // If code is null, it was killed by our timeout
      if (code === null) {
         // Covered by the setTimeout
         return;
      }
      
      if (code === 137) {
         // OOM kill
         resolve({
            success: false,
            errorType: 'MEMORY_LIMIT_EXCEEDED',
            executionTime,
            memoryUsed,
            stdout: stdoutData.trim(),
            stderr: stderrData.trim(),
            exitCode: code
         });
         return;
      }

      if (code !== 0) {
        resolve({
          success: false,
          errorType: 'RUNTIME_ERROR',
          executionTime,
          memoryUsed,
          stdout: stdoutData.trim(),
          stderr: stderrData.trim(),
          exitCode: code
        });
        return;
      }
      
      resolve({
        success: true,
        executionTime,
        memoryUsed,
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
        exitCode: code
      });
    });
    
    child.on('error', (err) => {
       clearTimeout(timeoutId);
       resolve({
          success: false,
          errorType: 'RUNTIME_ERROR',
          executionTime: Date.now() - startTime,
          stdout: stdoutData.trim(),
          stderr: err.message,
          exitCode: -1
       });
    });
  });
}

/**
 * Kills a running container.
 */
export async function killContainer(containerName) {
  try {
    await execAsync(`docker rm -f ${containerName}`);
  } catch (e) {
    // Ignore error if container doesn't exist
  }
}

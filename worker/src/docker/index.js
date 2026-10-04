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

  const containerName = `compile-${path.basename(tempDirPath)}`;
  
  try {
    // Start a temporary container for compilation
    await execAsync(`docker run -d --rm --name "${containerName}" --network none --memory="256m" --workdir /workspace ${image} sleep infinity`);
    
    // Copy source files from the worker container into the compilation container
    await execAsync(`docker cp "${tempDirPath}/." "${containerName}:/workspace/"`);
    
    // Run the compiler inside the container
    const { stdout, stderr } = await execAsync(`docker exec "${containerName}" sh -c "${compileCommand}"`, { 
      timeout: timeoutMs,
      killSignal: 'SIGKILL'
    });
    
    // Copy the compiled binaries back to the worker container
    await execAsync(`docker cp "${containerName}:/workspace/." "${tempDirPath}/"`);
    
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
  } finally {
    // Ensure we kill the compilation container
    try { await execAsync(`docker rm -f "${containerName}"`); } catch(e) {}
  }
}

/**
 * Starts a background execution container.
 * Uses security flags to lock down the container.
 */
export async function startExecutionContainer(image, tempDirPath, containerName) {
  // Start the execution container without volume mounts
  const dockerCmd = `docker run -d --rm --name "${containerName}" --network none --memory="128m" --cpus="1" --pids-limit="64" --security-opt=no-new-privileges --workdir /workspace ${image} sleep infinity`;
  
  await execAsync(dockerCmd);
  
  // Copy the source code / compiled binaries into the execution container
  await execAsync(`docker cp "${tempDirPath}/." "${containerName}:/workspace/"`);
}

/**
 * Runs a specific test case against the running container using docker exec.
 */
export async function runTestCase(containerName, tempDirPath, runCommand, input, timeLimitMs = 2000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdoutData = '';
    let stderrData = '';
    
    // We wrap runCommand so that if it fails, the exit code is preserved.
    const wrappedCommand = `sh -c '${runCommand.replace(/'/g, "'\\''")}'; exit_code=$?; exit $exit_code`;
    
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
        // Fallback to infrastructure time if parsing fails (Expected since we removed GNU time)
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

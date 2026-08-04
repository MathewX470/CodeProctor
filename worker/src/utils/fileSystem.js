import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Creates a temporary directory for execution and writes the source code to it.
 * @param {string} sourceCode 
 * @param {string} fileName 
 * @returns {Promise<string>} The absolute path to the temporary directory.
 */
export async function createTempEnvironment(sourceCode, fileName) {
  const tmpId = crypto.randomUUID();
  const tmpDir = path.join(process.cwd(), 'tmp', tmpId);
  
  await fs.mkdir(tmpDir, { recursive: true });
  
  const filePath = path.join(tmpDir, fileName);
  await fs.writeFile(filePath, sourceCode, 'utf-8');
  
  return tmpDir;
}

/**
 * Cleans up the temporary directory.
 * @param {string} tmpDir 
 */
export async function cleanupTempEnvironment(tmpDir) {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`[Cleanup Error] Failed to delete temp dir ${tmpDir}:`, error);
  }
}

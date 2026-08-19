import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTempEnvironment, cleanupTempEnvironment } from './fileSystem.js';
import fs from 'fs/promises';
import path from 'path';

describe('fileSystem utils', () => {
  it('should create and clean up a temporary environment', async () => {
    const sourceCode = 'print("hello world")';
    const fileName = 'main.py';

    // Create the temporary environment
    const tmpDir = await createTempEnvironment(sourceCode, fileName);

    // Verify directory exists
    const dirStat = await fs.stat(tmpDir);
    assert.equal(dirStat.isDirectory(), true);

    // Verify file exists and content is correct
    const filePath = path.join(tmpDir, fileName);
    const content = await fs.readFile(filePath, 'utf-8');
    assert.equal(content, sourceCode);

    // Clean up
    await cleanupTempEnvironment(tmpDir);

    // Verify directory is deleted
    await assert.rejects(
      fs.stat(tmpDir),
      { code: 'ENOENT' }
    );
  });
});

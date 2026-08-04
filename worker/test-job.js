import dotenv from 'dotenv';
dotenv.config();

import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Connect to Upstash
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const queue = new Queue('submission-queue', { connection });

async function addTestJob() {
  console.log('Adding test job to the queue...');
  
  // A simple Javascript test case
  const testJob = {
    submissionId: 'test-sub-123',
    languageId: 'javascript',
    sourceCode: 'console.log("Hello from Docker Sandbox!");',
    timeLimit: 2000,
    memoryLimit: 128000
  };

  await queue.add('submission', testJob);
  console.log('Job added successfully!');
  process.exit(0);
}

addTestJob().catch(console.error);

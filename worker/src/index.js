import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import { connection } from './queue/index.js';
import { executeSubmission } from './executor/index.js';

const QUEUE_NAME = 'submission-queue';

console.log(`[Worker] Starting CodeProctor worker...`);
console.log(`[Worker] Connecting to queue: ${QUEUE_NAME}`);

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`[Job ${job.id}] Received submission execution job.`);
    const result = await executeSubmission(job.data);
    return result;
  },
  { connection }
);

worker.on('completed', (job, returnvalue) => {
  console.log(`[Job ${job.id}] Completed successfully. Verdict: ${returnvalue?.verdict || 'N/A'}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Job ${job?.id}] Failed with error:`, err);
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log(`[Worker] Shutting down gracefully...`);
  await worker.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

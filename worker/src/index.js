import 'dotenv/config.js';

import { Worker } from 'bullmq';
import { connection } from './queue/index.js';
import { executeSubmission } from './executor/index.js';

const QUEUE_NAME = 'submission-queue';

console.log(`[Worker] Starting CodeProctor worker...`);
console.log(`[Worker] Connecting to queue: ${QUEUE_NAME}`);

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const startTime = Date.now();
    console.log(`[Job ${job.id}] ⏳ Received submission execution job.`);
    
    const result = await executeSubmission(job.data);
    
    const durationMs = Date.now() - startTime;
    console.log(`[Job ${job.id}] ✅ Execution finished in ${durationMs}ms. Verdict: ${result?.verdict || 'N/A'}`);
    
    return { ...result, totalDurationMs: durationMs };
  },
  { 
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10)
  }
);

worker.on('completed', (job, returnvalue) => {
  console.log(`[Queue] Job ${job.id} officially completed. Total Turnaround: ${returnvalue?.totalDurationMs}ms`);
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

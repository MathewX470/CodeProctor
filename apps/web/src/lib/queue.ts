import { Queue } from "bullmq";
import Redis from "ioredis";

// Use Upstash Redis URL from environment variables
const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const submissionQueue = new Queue("submission-queue", { connection });

import { Queue } from "bullmq";
import { redis } from "./redis";

export const submissionQueue = new Queue("submission-queue", { connection: redis });

import 'dotenv/config.js';
import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  console.warn('[Warning] REDIS_URL not set in environment. Falling back to localhost.');
}

// Ensure the Upstash Redis URL uses the rediss:// protocol for TLS if it is Upstash
let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('[Redis Error]', err);
});

connection.on('connect', () => {
  console.log('[Redis] Connected to queue broker.');
});

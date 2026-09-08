import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';
import {
  DEFAULT_QUEUE,
  type DefaultQueueJobName,
  type DefaultQueueJobs,
} from './queues/default.queue';

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker<DefaultQueueJobs[DefaultQueueJobName], void, DefaultQueueJobName>(
  DEFAULT_QUEUE,
  async (job) => {
    switch (job.name) {
      case 'hello':
        console.log(`[worker] processing job ${job.id} (${job.name})`, job.data);
        break;
      default:
        job.name satisfies never;
    }
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
});

console.log(`[worker] listening on queue "${DEFAULT_QUEUE}"`);

async function shutdown() {
  console.log('[worker] shutting down...');
  await worker.close();
  connection.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

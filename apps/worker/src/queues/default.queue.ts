export const DEFAULT_QUEUE = 'default';

/**
 * Job name -> payload shape for the default queue. Must stay in sync with
 * apps/api/src/infra/bullmq/bullmq.types.ts (the producer side).
 */
export interface DefaultQueueJobs {
  hello: { message: string };
}

export type DefaultQueueJobName = keyof DefaultQueueJobs & string;

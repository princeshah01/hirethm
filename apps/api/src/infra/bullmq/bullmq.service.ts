import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { type Job, type JobsOptions, Queue } from 'bullmq';
import Redis from 'ioredis';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';
import { DEFAULT_QUEUE } from './bullmq.constants';
import type { DefaultQueueJobName, DefaultQueueJobs } from './bullmq.types';

@Injectable()
export class BullmqService implements OnModuleDestroy {
  private readonly logger = new Logger(BullmqService.name);
  private readonly connection: Redis;
  public readonly defaultQueue: Queue<
    DefaultQueueJobs[DefaultQueueJobName],
    void,
    DefaultQueueJobName
  >;

  constructor(@Inject(ENV) env: Env) {
    // BullMQ requires its own connection with maxRetriesPerRequest disabled.
    this.connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    this.defaultQueue = new Queue(DEFAULT_QUEUE, { connection: this.connection });
  }

  /**
   * Type-safe job enqueue: `name` is restricted to the keys of
   * `DefaultQueueJobs`, and `data` must match that job's payload shape.
   */
  addJob<K extends DefaultQueueJobName>(
    name: K,
    data: DefaultQueueJobs[K],
    opts?: JobsOptions,
  ): Promise<Job<DefaultQueueJobs[K], void, K>> {
    return this.defaultQueue.add(name, data, opts) as Promise<Job<DefaultQueueJobs[K], void, K>>;
  }

  async onModuleDestroy() {
    await this.defaultQueue.close();
    this.connection.disconnect();
    this.logger.log('BullMQ queues closed');
  }
}

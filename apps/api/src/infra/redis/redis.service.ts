import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public readonly client: Redis;

  constructor(@Inject(ENV) env: Env) {
    this.client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis client error', err.message);
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      await this.client.ping();
      this.logger.log('Redis connected successfully');
    } catch (err) {
      this.logger.error('Failed to connect to Redis', err instanceof Error ? err.stack : err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

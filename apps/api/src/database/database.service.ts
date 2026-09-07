import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;
  public readonly db: NodePgDatabase<typeof schema>;

  constructor(@Inject(ENV) env: Env) {
    this.pool = new Pool({ connectionString: env.DATABASE_URL });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected pool error', err.message);
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Database connected successfully');
    } catch (err) {
      this.logger.error(
        'Failed to connect to the database',
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

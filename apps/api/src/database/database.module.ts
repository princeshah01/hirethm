import { Global, Logger, Module, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { db, pool } from './database.providers';

export const DRIZZLE = Symbol('DRIZZLE');

@Global()
@Module({
  providers: [{ provide: DRIZZLE, useValue: db }],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);

  async onModuleInit() {
    try {
      await pool.query('SELECT 1');
    } catch (err) {
      this.logger.error(
        'Failed to connect to the database',
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
  }

  async onModuleDestroy() {
    await pool.end();
  }
}

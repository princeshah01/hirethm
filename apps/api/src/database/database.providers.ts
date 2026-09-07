import { Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

export const pool = new Pool({ connectionString: env.DATABASE_URL });

const logger = new Logger('DatabaseProvider');

pool.on('error', (err) => {
  logger.error('Unexpected pool error:', err.message);
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;

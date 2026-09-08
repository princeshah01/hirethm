import { createNestEnv } from '@repo/env/node';
import { string, url } from '@repo/env/schema';

export const env = createNestEnv({
  server: {
    NODE_ENV: string({ default: 'development' }),
    REDIS_URL: url(),
  },
});

export type Env = typeof env;

import { createNestEnv } from '@repo/env/node';
import { port, secret, string, url } from '@repo/env/schema';

export const env = createNestEnv({
  server: {
    NODE_ENV: string({ default: 'development' }),
    API_PORT: port({ default: 3001 }),
    DATABASE_URL: url(),
    REDIS_URL: url(),
    BETTER_AUTH_SECRET: secret({ minLength: 32 }),
    BETTER_AUTH_URL: url(),
  },
});

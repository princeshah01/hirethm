import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';
import { createNextEnv } from '../src/next';
import { createNestEnv } from '../src/node';
import { createReactEnv } from '../src/react';
import { port, secret, string, url } from '../src/schema/index';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('createNestEnv', () => {
  it('validates and coerces process.env, preserving per-key types', () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '4000';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
    process.env.BETTER_AUTH_SECRET = 'x'.repeat(32);

    const env = createNestEnv({
      server: {
        NODE_ENV: string(),
        PORT: port(),
        DATABASE_URL: url(),
        BETTER_AUTH_SECRET: secret({ minLength: 32 }),
      },
    });

    expectTypeOf(env.PORT).toEqualTypeOf<number>();
    expectTypeOf(env.DATABASE_URL).toEqualTypeOf<string>();
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toBe('postgresql://localhost:5432/db');
  });

  it('fails fast when a required variable is missing', () => {
    delete process.env.PORT;

    expect(() =>
      createNestEnv({
        server: { PORT: port() },
      }),
    ).toThrow();
  });
});

describe('createNextEnv', () => {
  it('keeps server and client values separate and both typed', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/db';

    const env = createNextEnv({
      server: { DATABASE_URL: url() },
      client: { NEXT_PUBLIC_API_URL: url() },
      runtimeEnv: {
        NEXT_PUBLIC_API_URL: 'https://api.hirethm.com',
      },
    });

    expectTypeOf(env.DATABASE_URL).toEqualTypeOf<string>();
    expectTypeOf(env.NEXT_PUBLIC_API_URL).toEqualTypeOf<string>();
    expect(env.DATABASE_URL).toBe('postgresql://localhost:5432/db');
    expect(env.NEXT_PUBLIC_API_URL).toBe('https://api.hirethm.com');
  });

  it('rejects a client key without the NEXT_PUBLIC_ prefix at runtime', () => {
    // Not a compile-time rejection here - see NextEnvOptions.client's doc
    // comment for why, and createReactEnv's test below for the case where
    // it is.
    expect(() =>
      createNextEnv({
        client: { API_URL: url() },
        runtimeEnv: { API_URL: 'https://api.hirethm.com' },
      }),
    ).toThrow();
  });
});

describe('createReactEnv', () => {
  it('rejects a non-VITE_ client key, at compile time and runtime', () => {
    expect(() =>
      // @ts-expect-error - "API_URL" is not prefixed with VITE_
      createReactEnv({ client: { API_URL: url() } }),
    ).toThrow();
  });
});

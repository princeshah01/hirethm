import { createEnv } from '@t3-oss/env-core';
import type { EnvShape, InferEnv } from './types/index';

export interface NestEnvOptions<TServer extends EnvShape> {
  /** Server-only variables. There is no client concept for a Node process. */
  server: TServer;
  /** Skip validation entirely, e.g. for `tsc --noEmit`/lint-only invocations. */
  skipValidation?: boolean;
}

/**
 * Validates and types a server-only Node process's environment (NestJS API,
 * NestJS/BullMQ worker, etc).
 *
 * Every variable is read from `process.env`, which is safe here because a
 * Node process always runs with the full environment available - there is
 * no bundler stripping variables for a browser build.
 */
export function createNestEnv<TServer extends EnvShape>(
  options: NestEnvOptions<TServer>,
): InferEnv<TServer> {
  return createEnv({
    server: options.server,
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
    skipValidation: options.skipValidation,
    // see InferEnv - createEnv's own return type loses literal inference
    // once it flows through this wrapper's generics.
  }) as InferEnv<TServer>;
}

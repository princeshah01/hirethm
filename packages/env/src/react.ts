import { type ClientOptions, createEnv } from '@t3-oss/env-core';
import type { EnvShape, InferEnv } from './types/index';

declare global {
  interface ImportMetaEnv {
    [key: string]: string | boolean | undefined;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export interface ReactEnvOptions<TClient extends EnvShape>
  extends Omit<ClientOptions<'VITE_', TClient>, 'clientPrefix'> {
  skipValidation?: boolean;
}

const VITE_PREFIX = 'VITE_';

/**
 * Validates and types a Vite-powered React app's client environment.
 *
 * Reads from `import.meta.env`, which Vite replaces wholesale at build time -
 * unlike Next.js/webpack, Vite injects the full object, so dynamic property
 * access here is safe and doesn't need per-variable literal references.
 *
 * Reuses `@t3-oss/env-core`'s own `ClientOptions` type (rather than
 * re-deriving an equivalent one) for the `VITE_` prefix check - TypeScript's
 * inference for a branded conditional type like this is reliable only when
 * it's the exact type the underlying generic function itself expects.
 */
export function createReactEnv<TClient extends EnvShape>(
  options: ReactEnvOptions<TClient>,
): InferEnv<TClient> {
  // @t3-oss/env-core's `clientPrefix` has no actual runtime check that a
  // client key is prefixed - it's purely a compile-time (branded-type)
  // guard, and only gates *server* var access from a client context at
  // runtime. Check for real here so a mismatched key can't slip through.
  for (const key of Object.keys(options.client)) {
    if (!key.startsWith(VITE_PREFIX)) {
      throw new Error(
        `❌ Invalid client environment variable "${key}": must be prefixed with "${VITE_PREFIX}"`,
      );
    }
  }

  // options is already validated against the VITE_ prefix by this function's
  // own public signature above; re-checking it against createEnv's own
  // (separately-inferred) branding here would conflict with that outer
  // check, so the whole call is escape-hatched to `any` and the precise
  // return type is re-derived independently via InferEnv below.
  return createEnv({
    clientPrefix: 'VITE_',
    client: options.client,
    runtimeEnv: import.meta.env,
    emptyStringAsUndefined: true,
    skipValidation: options.skipValidation,
  } as never) as InferEnv<TClient>;
}

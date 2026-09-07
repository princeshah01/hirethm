import { createEnv } from '@t3-oss/env-nextjs';
import type { EnvShape, InferEnv, PrefixedShape } from './types/index';

type ClientRuntimeEnv<TClient extends EnvShape> = keyof TClient extends never
  ? { runtimeEnv?: never }
  : {
      /**
       * Next.js only statically analyzes (and inlines into the client
       * bundle) a literal `process.env.NEXT_PUBLIC_X` reference - it can't
       * see through a dynamic lookup performed inside this package. Every
       * client variable must therefore be re-declared here with a literal
       * `process.env.NEXT_PUBLIC_X` reference so the Next.js compiler can
       * find and inline it. Server variables need no such mapping - Next
       * doesn't strip server-side `process.env` access, so this package
       * reads those directly.
       */
      runtimeEnv: { [K in keyof TClient]: string | undefined };
    };

export interface NextEnvOptions<
  TServer extends EnvShape = Record<string, never>,
  TClient extends EnvShape = Record<string, never>,
> {
  /** Server-only variables - never sent to the browser. */
  server?: TServer;
  /**
   * Client variables, must be prefixed with `NEXT_PUBLIC_`.
   *
   * Note: unlike `createReactEnv`, a mismatched key here is only caught at
   * runtime (immediately, on app boot), not at compile time. Branding a
   * `client` key against its `NEXT_PUBLIC_` prefix at the type level only
   * works when it's the *sole* generic inferred from the call; combined
   * with `server` (a second, independent generic) in the same object
   * literal, TypeScript's inference can't resolve the branded conditional
   * type reliably - a verified compiler limitation, not an oversight.
   */
  client?: TClient;
  skipValidation?: boolean;
}

const NEXT_PUBLIC_PREFIX = 'NEXT_PUBLIC_';

/**
 * Validates and types a Next.js app's server and client environment.
 */
export function createNextEnv<
  TServer extends EnvShape = Record<string, never>,
  TClient extends PrefixedShape<'NEXT_PUBLIC_'> = Record<string, never>,
>(
  options: NextEnvOptions<TServer, TClient> & ClientRuntimeEnv<TClient>,
): InferEnv<TServer> & InferEnv<TClient> {
  // The underlying libraries only reject a mismatched client prefix at the
  // type level (see NextEnvOptions.client's doc comment) - there's no actual
  // runtime guard, so a wrongly-named key with a same-named runtimeEnv value
  // would otherwise validate "successfully" and then silently never reach
  // the browser. Check for real here instead of trusting the type system.
  const client = options.client ?? ({} as TClient);
  for (const key of Object.keys(client)) {
    if (!key.startsWith(NEXT_PUBLIC_PREFIX)) {
      throw new Error(
        `❌ Invalid client environment variable "${key}": must be prefixed with "${NEXT_PUBLIC_PREFIX}"`,
      );
    }
  }

  return createEnv({
    server: options.server ?? {},
    client,
    experimental__runtimeEnv: options.runtimeEnv ?? {},
    emptyStringAsUndefined: true,
    skipValidation: options.skipValidation,
  } as never) as InferEnv<TServer> & InferEnv<TClient>;
}

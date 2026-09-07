# @repo/env

Typed, validated environment variables for the monorepo, built on
[`@t3-oss/env-core`](https://github.com/t3-oss/t3-env) + [`zod`](https://zod.dev).
Apps never touch `process.env`, `zod`, or `@t3-oss/env-core` directly - they
import schema helpers and a framework factory from `@repo/env`, get a fully
typed `env` object, and the app fails fast on boot if anything's missing or
malformed.

## Why this shape

- **No build step.** `@repo/env`'s `package.json` `exports` point straight at
  `src/*.ts` (the same convention `@repo/ui` uses) - each consuming app's own
  compiler (`tsc`/Nest, Next's SWC/Turbopack, Vite/esbuild) compiles it as
  part of its own build. That's why `apps/api` (and any other Node app that
  imports this package) must run as ESM (`"type": "module"` +
  `module`/`moduleResolution: NodeNext`) - `@t3-oss/env-core` ships ESM-only,
  and plain `node dist/main.js` can't `require()` an ESM-only package or
  resolve a raw `.ts` dependency the way a bundler can. `apps/api` runs via
  [`tsx`](https://tsx.is) (`tsx src/main.ts`) instead of compiling to
  `dist/` and running plain `node` for exactly this reason.
- **Subpath exports, not one barrel file.** `@repo/env/schema`,
  `@repo/env/node`, `@repo/env/next`, `@repo/env/react` - a Vite app never
  pulls in NestJS-only code and vice versa.
- **`.env` loading is not this package's job.** Next.js and Vite already load
  `.env*` files themselves; a NestJS/Node app should use its own loader
  (`dotenv`, `@nestjs/config`, or just rely on the process environment set by
  pm2/systemd/the container) *before* calling `createNestEnv`. This package
  only validates and types whatever's already in the environment.

## Schema helpers (`@repo/env/schema`)

```ts
import { string, number, boolean, url, port, secret, email } from '@repo/env/schema';
```

Each helper is a thin, opinionated zod builder - not a 1:1 zod passthrough:

| Helper | Notes |
| --- | --- |
| `string({ minLength?, maxLength?, optional?, default? })` | Plain string, with constraints. |
| `number({ min?, max?, int?, optional?, default? })` | Coerces `"8080"` → `8080` (env vars are always strings). |
| `boolean({ optional?, default? })` | Accepts `"true"/"1"/"yes"/"on"` and their opposites via zod's `stringbool()`. |
| `url({ optional?, default? })` | Validated URL string. |
| `port({ optional?, default? })` | Coerced number, clamped to `1–65535`. |
| `secret({ minLength = 32 })` | **No `optional`/`default`.** A secret that falls back to a hardcoded value in production is a vulnerability, not a convenience - it must always come from a real variable, or fail. |
| `email({ optional?, default? })` | Validated email string. |

Passing `optional: true` or a `default` narrows the return type accordingly
(`env.PORT` is `number`, not `number | undefined`, unless you opted in) -
each helper uses TS overloads so the schema you get back exactly matches the
options you passed, not a union of every possibility.

## `createNestEnv` (`@repo/env/node`) - NestJS API / BullMQ worker

Server-only; reads straight from `process.env` since a Node process always
has the full environment available.

```ts
// apps/api/src/env.ts
import { createNestEnv } from '@repo/env/node';
import { number, port, secret, string, url } from '@repo/env/schema';

export const env = createNestEnv({
  server: {
    NODE_ENV: string({ default: 'development' }),
    PORT: port({ default: 3001 }),
    DATABASE_URL: url(),
    REDIS_URL: url(),
    BETTER_AUTH_SECRET: secret({ minLength: 32 }),
  },
});

// apps/api/src/main.ts
import { env } from './env.js';
await app.listen(env.PORT); // number, not string
```

Import errors (a missing `DATABASE_URL`, a `PORT` that isn't numeric) throw
immediately when `env.ts` is first imported - i.e. at app boot, before any
request is handled.

## `createReactEnv` (`@repo/env/react`) - Vite

Client-only; reads from `import.meta.env`, which Vite replaces wholesale at
build time (including inside published packages it processes), so dynamic
per-key access here is safe.

```ts
import { createReactEnv } from '@repo/env/react';
import { url } from '@repo/env/schema';

export const env = createReactEnv({
  client: {
    VITE_API_URL: url(),
  },
});
```

A client key not prefixed with `VITE_` is rejected both at compile time
(`ts-expect-error`-worthy) and at runtime.

## `createNextEnv` (`@repo/env/next`) - Next.js

```ts
import { createNextEnv } from '@repo/env/next';
import { secret, url } from '@repo/env/schema';

export const env = createNextEnv({
  server: {
    DATABASE_URL: url(),
    BETTER_AUTH_SECRET: secret({ minLength: 32 }),
  },
  client: {
    NEXT_PUBLIC_API_URL: url(),
  },
  // Required whenever `client` is non-empty - see below.
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
```

**Why `runtimeEnv` is required for client variables:** Next.js inlines a
`NEXT_PUBLIC_*` value into the browser bundle by statically finding and
replacing the literal text `process.env.NEXT_PUBLIC_X` at build time. It
cannot see through a dynamic `process.env[key]` lookup performed inside this
package, so every client variable must be re-declared with a literal
`process.env.NEXT_PUBLIC_X` reference in *your app's own source* (`env.ts`)
for Next's compiler to find and inline it. `server` variables need no such
mapping - Next doesn't strip server-side `process.env` access, so this
package reads those directly from `process.env`.

**A known TypeScript limitation, and how it's handled:** ideally, a `client`
key that doesn't start with `NEXT_PUBLIC_` would be a compile-time error, the
way it is for `createReactEnv`. It isn't, here - branding a key against its
prefix at the type level only works reliably when it's the *sole* generic
TypeScript has to infer from the call; combined with `server` (a second,
independent generic) in the same object literal, the checker can't resolve
the branded conditional type (verified against multiple isolated
reproductions - a real compiler limitation, not an oversight). Since
`@t3-oss/env-core`'s own `clientPrefix` is *also* only a compile-time check
(reading its source: at runtime it's used solely to stop a server variable
being read from client code, never to validate that a client key is
correctly prefixed), `createNextEnv` adds an explicit runtime check of its
own so a mismatched key always fails fast, at boot, in both dev and
production - never silently.

## Design notes

- **`runtimeEnv: process.env` vs. explicit mapping.** For `createNestEnv`
  (and the server half of `createNextEnv`), this package passes `process.env`
  directly (`@t3-oss/env-core`'s "loose" mode) rather than manually
  destructuring every key. A Node process's `process.env` is never
  tree-shaken or bundled, so there's nothing to lose by reading it directly,
  and it means adding a new server var never requires touching this
  package - only the app's own `env.ts` shape. Client variables are the
  exception (see `createNextEnv` above) precisely because bundlers *do*
  tree-shake/inline `process.env`/`import.meta.env` access, and only a
  literal reference survives that process.
- **Why the return type is computed independently (`InferEnv`).**
  `@t3-oss/env-core`'s own `createEnv` return type is a deeply
  conditional/generic type that collapses to `Record<string, unknown>` once
  it flows back out through a wrapper function's generics (verified with
  plain `tsc`, not a bug in this package's build). Each factory here
  re-derives the exact return type itself from the schema shape via zod's
  own `z.output<T>`, so `env.PORT` is `number`, `env.DATABASE_URL` is
  `string`, etc. - not `unknown`.
- **Bundling `@t3-oss/env-core`/`@t3-oss/env-nextjs`/`zod`.** These stay
  regular `dependencies` of `@repo/env`, not bundled into anything - since
  the package ships raw source and every consumer already resolves workspace
  dependencies through pnpm, apps only ever need `"@repo/env": "workspace:*"`
  in their own `package.json` to get full type inference and runtime
  behavior; they never need to install `zod` or `@t3-oss/env-core`
  themselves.

## Tests

`pnpm --filter @repo/env test` runs the vitest suite (schema coercion/limits,
fail-fast on missing vars, server/client separation, prefix rejection).
`pnpm --filter @repo/env check-types` type-checks both `src/` and `tests/`
(including the `@ts-expect-error` assertions - vitest's own test runner
doesn't type-check, so this is what actually proves invalid usage is
rejected at compile time).

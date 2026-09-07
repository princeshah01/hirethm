import type { ZodType, z } from 'zod';

/** A map of env var names to the schema helpers that validate them. */
export type EnvShape = Record<string, ZodType>;

/**
 * A loose hint that a shape's keys should start with `TPrefix` - editor
 * autocomplete only, not a hard compile-time rejection (a template-literal
 * `Record` doesn't get excess-property checking, so a mismatched key isn't
 * actually an error here). Used where a stronger per-key branded check
 * isn't reliable to infer - see `createNextEnv`'s doc comment.
 */
export type PrefixedShape<TPrefix extends string> = Record<`${TPrefix}${string}`, ZodType>;

/**
 * The validated, typed env object for a given shape.
 *
 * `@t3-oss/env-core`'s own `createEnv` return type collapses to
 * `Record<string, unknown>` once it flows back through a generic wrapper
 * function like ours (the literal key/value types don't survive being
 * re-exported through a second layer of generics). We compute the precise
 * type ourselves from `TShape` using zod's own inference instead, so callers
 * still get exact per-key types (e.g. `env.PORT: number`).
 */
export type InferEnv<TShape extends EnvShape> = Readonly<{
  [K in keyof TShape]: z.output<TShape[K]>;
}>;

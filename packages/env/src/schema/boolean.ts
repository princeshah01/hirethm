import { z } from 'zod';

export interface BooleanOptions {
  optional?: boolean;
  default?: boolean;
}

type StringBool = z.ZodCodec<z.ZodString, z.ZodBoolean>;

/**
 * Accepts the common env-var boolean spellings ("true"/"1"/"yes"/"on" and
 * their opposites) instead of forcing exact "true"/"false" strings.
 */
export function boolean(options?: Record<string, never>): StringBool;
export function boolean(options: { optional: true }): z.ZodOptional<StringBool>;
export function boolean(options: { default: boolean }): z.ZodDefault<StringBool>;
export function boolean(options: BooleanOptions = {}) {
  const schema = z.stringbool();

  if (options.default !== undefined) {
    return schema.default(options.default);
  }
  if (options.optional) {
    return schema.optional();
  }
  return schema;
}

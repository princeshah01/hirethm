import { z } from 'zod';

export interface NumberBaseOptions {
  min?: number;
  max?: number;
  int?: boolean;
}

export interface NumberOptions extends NumberBaseOptions {
  optional?: boolean;
  default?: number;
}

function withConstraints(options: NumberBaseOptions) {
  let schema = z.coerce.number();
  if (options.int) {
    schema = schema.int();
  }
  if (options.min !== undefined) {
    schema = schema.min(options.min);
  }
  if (options.max !== undefined) {
    schema = schema.max(options.max);
  }
  return schema;
}

type CoercedNumber = ReturnType<typeof withConstraints>;

/**
 * Env vars always arrive as strings, so this coerces "8080" -> 8080
 * instead of failing validation on a type mismatch.
 */
export function number(options?: NumberBaseOptions): CoercedNumber;
export function number(
  options: NumberBaseOptions & { optional: true },
): z.ZodOptional<CoercedNumber>;
export function number(
  options: NumberBaseOptions & { default: number },
): z.ZodDefault<CoercedNumber>;
export function number(options: NumberOptions = {}) {
  const schema = withConstraints(options);

  if (options.default !== undefined) {
    return schema.default(options.default);
  }
  if (options.optional) {
    return schema.optional();
  }
  return schema;
}

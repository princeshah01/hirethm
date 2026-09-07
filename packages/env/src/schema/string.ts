import { z } from 'zod';

export interface StringBaseOptions {
  minLength?: number;
  maxLength?: number;
}

export interface StringOptions extends StringBaseOptions {
  optional?: boolean;
  default?: string;
}

function withConstraints(options: StringBaseOptions) {
  let schema = z.string();
  if (options.minLength !== undefined) {
    schema = schema.min(options.minLength);
  }
  if (options.maxLength !== undefined) {
    schema = schema.max(options.maxLength);
  }
  return schema;
}

export function string(options?: StringBaseOptions): z.ZodString;
export function string(options: StringBaseOptions & { optional: true }): z.ZodOptional<z.ZodString>;
export function string(options: StringBaseOptions & { default: string }): z.ZodDefault<z.ZodString>;
export function string(options: StringOptions = {}) {
  const schema = withConstraints(options);

  if (options.default !== undefined) {
    return schema.default(options.default);
  }
  if (options.optional) {
    return schema.optional();
  }
  return schema;
}

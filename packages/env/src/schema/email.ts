import { z } from 'zod';

export interface EmailOptions {
  optional?: boolean;
  default?: string;
}

export function email(options?: Record<string, never>): z.ZodEmail;
export function email(options: { optional: true }): z.ZodOptional<z.ZodEmail>;
export function email(options: { default: string }): z.ZodDefault<z.ZodEmail>;
export function email(options: EmailOptions = {}) {
  const schema = z.email();

  if (options.default !== undefined) {
    return schema.default(options.default);
  }
  if (options.optional) {
    return schema.optional();
  }
  return schema;
}

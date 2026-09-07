import { z } from 'zod';

export interface UrlOptions {
  optional?: boolean;
  default?: string;
}

export function url(options?: Record<string, never>): z.ZodURL;
export function url(options: { optional: true }): z.ZodOptional<z.ZodURL>;
export function url(options: { default: string }): z.ZodDefault<z.ZodURL>;
export function url(options: UrlOptions = {}) {
  const schema = z.url();

  if (options.default !== undefined) {
    return schema.default(options.default);
  }
  if (options.optional) {
    return schema.optional();
  }
  return schema;
}

import { z } from 'zod';

export interface PortOptions {
  optional?: boolean;
  default?: number;
}

const MIN_PORT = 1;
const MAX_PORT = 65535;

function basePortSchema() {
  return z.coerce.number().int().min(MIN_PORT).max(MAX_PORT);
}

type PortNumber = ReturnType<typeof basePortSchema>;

export function port(options?: Record<string, never>): PortNumber;
export function port(options: { optional: true }): z.ZodOptional<PortNumber>;
export function port(options: { default: number }): z.ZodDefault<PortNumber>;
export function port(options: PortOptions = {}) {
  const schema = basePortSchema();

  if (options.default !== undefined) {
    return schema.default(options.default);
  }
  if (options.optional) {
    return schema.optional();
  }
  return schema;
}

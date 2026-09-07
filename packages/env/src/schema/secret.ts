import { z } from 'zod';

export interface SecretOptions {
  minLength?: number;
}

const DEFAULT_MIN_SECRET_LENGTH = 32;

/**
 * Intentionally has no `optional` or `default`. A secret that silently falls
 * back to a hardcoded value in production is a vulnerability, not a
 * convenience - every secret must come from a real environment variable.
 */
export function secret(options: SecretOptions = {}) {
  const minLength = options.minLength ?? DEFAULT_MIN_SECRET_LENGTH;
  return z.string().min(minLength, `must be at least ${minLength} characters long`);
}

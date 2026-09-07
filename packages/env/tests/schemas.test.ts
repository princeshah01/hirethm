import { describe, expect, it } from 'vitest';
import { boolean, email, number, port, secret, string, url } from '../src/schema/index';

describe('string', () => {
  it('parses a plain string', () => {
    expect(string().parse('hello')).toBe('hello');
  });

  it('enforces minLength/maxLength', () => {
    expect(() => string({ minLength: 5 }).parse('hi')).toThrow();
    expect(() => string({ maxLength: 2 }).parse('hello')).toThrow();
  });

  it('applies a default when optional and unset', () => {
    expect(string({ default: 'fallback' }).parse(undefined)).toBe('fallback');
  });
});

describe('number', () => {
  it('coerces numeric strings', () => {
    expect(number().parse('8080')).toBe(8080);
  });

  it('rejects non-numeric strings', () => {
    expect(() => number().parse('not-a-number')).toThrow();
  });

  it('enforces int/min/max', () => {
    expect(() => number({ int: true }).parse('1.5')).toThrow();
    expect(() => number({ min: 10 }).parse('5')).toThrow();
    expect(() => number({ max: 10 }).parse('50')).toThrow();
  });
});

describe('boolean', () => {
  it('parses common truthy/falsy spellings', () => {
    expect(boolean().parse('true')).toBe(true);
    expect(boolean().parse('1')).toBe(true);
    expect(boolean().parse('false')).toBe(false);
    expect(boolean().parse('0')).toBe(false);
  });
});

describe('url', () => {
  it('accepts a valid URL', () => {
    expect(url().parse('https://hirethm.com')).toBe('https://hirethm.com');
  });

  it('rejects an invalid URL', () => {
    expect(() => url().parse('not-a-url')).toThrow();
  });
});

describe('port', () => {
  it('coerces a valid port', () => {
    expect(port().parse('4000')).toBe(4000);
  });

  it('rejects ports outside 1-65535', () => {
    expect(() => port().parse('0')).toThrow();
    expect(() => port().parse('70000')).toThrow();
  });
});

describe('secret', () => {
  it('enforces the default minimum length of 32', () => {
    expect(() => secret().parse('too-short')).toThrow();
    expect(secret().parse('x'.repeat(32))).toBe('x'.repeat(32));
  });

  it('respects a custom minLength', () => {
    expect(() => secret({ minLength: 8 }).parse('short1')).toThrow();
    expect(secret({ minLength: 8 }).parse('longenough')).toBe('longenough');
  });

  it('has no default/optional escape hatch, at compile time', () => {
    // @ts-expect-error - secret() intentionally has no `default` option
    secret({ default: 'insecure-fallback' });
  });
});

describe('email', () => {
  it('accepts a valid email', () => {
    expect(email().parse('a@hirethm.com')).toBe('a@hirethm.com');
  });

  it('rejects an invalid email', () => {
    expect(() => email().parse('not-an-email')).toThrow();
  });
});

import { describe, expect, it } from 'vitest';

import {
  isRecord,
  readArray,
  readNestedId,
  readNumber,
  readRecord,
  readString,
  readStringOrNumber,
} from './unknown-readers';

describe('unknown-readers', () => {
  describe('isRecord and readRecord', () => {
    it('identifies plain objects and rejects arrays and primitives', () => {
      expect(isRecord({ a: 1 })).toBe(true);
      expect(isRecord({})).toBe(true);
      expect(isRecord([])).toBe(false);
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord('string')).toBe(false);
      expect(isRecord(123)).toBe(false);

      expect(readRecord({ foo: 'bar' })).toEqual({ foo: 'bar' });
      expect(readRecord(null)).toBeNull();
      expect(readRecord([])).toBeNull();
    });
  });

  describe('readArray', () => {
    it('returns array if provided or empty array fallback', () => {
      expect(readArray([1, 2, 3])).toEqual([1, 2, 3]);
      expect(readArray(null)).toEqual([]);
      expect(readArray(undefined)).toEqual([]);
      expect(readArray({})).toEqual([]);
    });
  });

  describe('readString', () => {
    it('returns trimmed string or null for empty/non-strings', () => {
      expect(readString('hello')).toBe('hello');
      expect(readString('  spaces  ')).toBe('spaces');
      expect(readString('')).toBeNull();
      expect(readString('   ')).toBeNull();
      expect(readString(123)).toBeNull();
      expect(readString(null)).toBeNull();
    });
  });

  describe('readNumber', () => {
    it('parses finite numbers and numeric strings', () => {
      expect(readNumber(42)).toBe(42);
      expect(readNumber(0)).toBe(0);
      expect(readNumber(-3.14)).toBe(-3.14);
      expect(readNumber('100')).toBe(100);
      expect(readNumber(' 2.5 ')).toBe(2.5);
      expect(readNumber('abc')).toBeNull();
      expect(readNumber('')).toBeNull();
      expect(readNumber(Number.NaN)).toBeNull();
      expect(readNumber(Number.POSITIVE_INFINITY)).toBeNull();
      expect(readNumber(null)).toBeNull();
    });
  });

  describe('readStringOrNumber', () => {
    it('formats strings and numbers to non-empty string', () => {
      expect(readStringOrNumber('abc')).toBe('abc');
      expect(readStringOrNumber(123)).toBe('123');
      expect(readStringOrNumber(0)).toBe('0');
      expect(readStringOrNumber('')).toBeNull();
      expect(readStringOrNumber(null)).toBeNull();
      expect(readStringOrNumber({})).toBeNull();
    });
  });

  describe('readNestedId', () => {
    it('resolves direct string IDs', () => {
      expect(readNestedId('uuid-123')).toBe('uuid-123');
      expect(readNestedId('   ')).toBeNull();
    });

    it('resolves { value: "uuid-123" }', () => {
      expect(readNestedId({ value: 'uuid-123' })).toBe('uuid-123');
    });

    it('resolves { id: "uuid-123" }', () => {
      expect(readNestedId({ id: 'uuid-123' })).toBe('uuid-123');
    });

    it('resolves double-nested { id: { value: "uuid-123" } }', () => {
      expect(readNestedId({ id: { value: 'uuid-123' } })).toBe('uuid-123');
    });

    it('returns null on invalid structures', () => {
      expect(readNestedId(null)).toBeNull();
      expect(readNestedId({})).toBeNull();
      expect(readNestedId({ id: null })).toBeNull();
      expect(readNestedId({ id: { value: '' } })).toBeNull();
    });
  });
});

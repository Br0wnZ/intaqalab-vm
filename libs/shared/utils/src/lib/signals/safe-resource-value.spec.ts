import { safeResourceValue } from './safe-resource-value';

describe('safeResourceValue', () => {
  it('should return undefined if resource has no hasValue and throws', () => {
    const resource = {
      value: () => {
        throw new Error('Signal is not initialized');
      },
    };
    expect(safeResourceValue(resource)).toBeUndefined();
  });

  it('should return value if resource has no hasValue but returns a value', () => {
    const resource = {
      value: () => 'test-value',
    };
    expect(safeResourceValue(resource)).toBe('test-value');
  });

  it('should return undefined if hasValue is false', () => {
    const resource = {
      hasValue: () => false,
      value: () => 'test-value',
    };
    expect(safeResourceValue(resource)).toBeUndefined();
  });

  it('should return value if hasValue is true', () => {
    const resource = {
      hasValue: () => true,
      value: () => 'test-value',
    };
    expect(safeResourceValue(resource)).toBe('test-value');
  });
});

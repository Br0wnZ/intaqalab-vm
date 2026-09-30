import { describe, expect, it } from 'vitest';

import { fromPosition, numToField, parseNum, toPosition } from './mao-topography.mapper';

describe('mao-topography.mapper', () => {
  it('converts field values to a position using locale decimals', () => {
    expect(toPosition({ value: '10,5', unit: 'm' }, { value: '20.25', unit: 'm' }, { value: '30', unit: 'm' })).toEqual(
      { x: 10.5, y: 20.25, z: 30, unit: 'm' },
    );
  });

  it('formats a position for the form', () => {
    expect(fromPosition({ x: 10.5, y: null, z: 30, unit: 'm' })).toEqual({
      x: { value: '10.5', unit: 'm' },
      y: null,
      z: { value: '30.0', unit: 'm' },
    });
  });

  it('parses numeric fields and preserves empty values as null', () => {
    expect(parseNum({ value: '12,50', unit: 'm' })).toBe(12.5);
    expect(parseNum(null)).toBeNull();
    expect(numToField(null, 'm', 1)).toBeNull();
  });
});

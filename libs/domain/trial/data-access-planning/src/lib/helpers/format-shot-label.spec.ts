import { describe, expect, it } from 'vitest';

import { formatShotLabel } from './planning-selectors';

describe('formatShotLabel', () => {
  it('uses globalNumber when available', () => {
    expect(formatShotLabel(7, 0)).toBe('Disparo 7');
  });

  it('falls back to the 1-based index when globalNumber is missing', () => {
    expect(formatShotLabel(undefined, 2)).toBe('Disparo 3');
    expect(formatShotLabel(null, 0)).toBe('Disparo 1');
  });

  it('pads the number with the padded style', () => {
    expect(formatShotLabel(5, 0, 'padded')).toBe('Disparo #05');
    expect(formatShotLabel(undefined, 11, 'padded')).toBe('Disparo #12');
  });
});

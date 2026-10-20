import { describe, expect, it } from 'vitest';

import { buildTrialResourceUrl } from './trial-resource-url';

describe('buildTrialResourceUrl', () => {
  it('should build the trial resource url without the center prefix', () => {
    expect(
      buildTrialResourceUrl(
        'http://localhost:3000/api/planning',
        { centerId: null, fireTrialId: 't1' },
        'planning/series',
      ),
    ).toBe('http://localhost:3000/api/planning/fire-trials/t1/planning/series');
  });

  it('should omit the center prefix when centerId is undefined', () => {
    expect(
      buildTrialResourceUrl('http://localhost:3000/api/planning', { fireTrialId: 't1' }, 'planning/conditions'),
    ).toBe('http://localhost:3000/api/planning/fire-trials/t1/planning/conditions');
  });

  it('should prepend the center prefix when centerId is provided', () => {
    expect(
      buildTrialResourceUrl('https://api.inta.es/planning', { centerId: 'c1', fireTrialId: 't1' }, 'planning/armament'),
    ).toBe('https://api.inta.es/planning/centers/c1/fire-trials/t1/planning/armament');
  });
});

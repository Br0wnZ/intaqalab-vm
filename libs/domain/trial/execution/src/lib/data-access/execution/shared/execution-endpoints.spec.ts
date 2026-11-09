import { describe, expect, it } from 'vitest';

import { executionTrialUrl, fireTrialUrl, planningUrl, warehouseUrl } from './execution-endpoints';

describe('execution-endpoints', () => {
  it('builds execution trial URLs without duplicate slashes', () => {
    expect(executionTrialUrl('http://localhost:3000/api/execution/', 'trial-1', 'state')).toBe(
      'http://localhost:3000/api/execution/fire-trials/trial-1/execution/state',
    );
  });

  it('builds nested execution URLs with series and shot ids', () => {
    expect(
      executionTrialUrl(
        'http://localhost:3000/api/execution',
        'trial-1',
        'velocities',
        'series',
        'series-1',
        'shots',
        'shot-1',
      ),
    ).toBe('http://localhost:3000/api/execution/fire-trials/trial-1/execution/velocities/series/series-1/shots/shot-1');
  });

  it('builds fire trial lifecyle URLs', () => {
    expect(fireTrialUrl('http://localhost:3000/api/fire-trials', 'trial-1', 'start')).toBe(
      'http://localhost:3000/api/fire-trials/trial-1/start',
    );
  });

  it('builds planning and warehouse URLs', () => {
    expect(planningUrl('http://localhost:3000/api/planning', 'equipment', 'items')).toBe(
      'http://localhost:3000/api/planning/equipment/items',
    );
    expect(warehouseUrl('http://localhost:3000/api/warehouse', 'denominations')).toBe(
      'http://localhost:3000/api/warehouse/denominations',
    );
  });
});

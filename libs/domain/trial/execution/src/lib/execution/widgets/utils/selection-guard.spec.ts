import { describe, expect, it } from 'vitest';

import { createSelectionGuard, shotSelectionKey } from './selection-guard';

describe('shotSelectionKey', () => {
  it('builds a key from serie and disparo', () => {
    expect(shotSelectionKey('s1', 'd1')).toBe('s1|d1');
  });

  it('handles null values', () => {
    expect(shotSelectionKey(null, null)).toBe('|');
    expect(shotSelectionKey('s1', null)).toBe('s1|');
  });
});

describe('createSelectionGuard', () => {
  it('ticket is fresh when key and version are unchanged', () => {
    const key = 's1|d1';
    const guard = createSelectionGuard(() => key);
    const ticket = guard.begin();

    expect(ticket.isFresh('s1|d1')).toBe(true);
  });

  it('ticket is stale when the selection changed mid-flight', () => {
    let key = 's1|d1';
    const guard = createSelectionGuard(() => key);
    const ticket = guard.begin();

    key = 's1|d2';

    expect(ticket.isFresh('s1|d1')).toBe(false);
  });

  it('a new begin() invalidates previous tickets', () => {
    let key = 's1|d1';
    const guard = createSelectionGuard(() => key);
    const first = guard.begin();
    const second = guard.begin();

    expect(first.isFresh('s1|d1')).toBe(false);
    expect(second.isFresh('s1|d1')).toBe(true);

    key = 's1|d2';
    expect(second.isFresh('s1|d1')).toBe(false);
  });
});

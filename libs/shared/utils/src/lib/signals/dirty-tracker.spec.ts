import { signal } from '@angular/core';

import { createDirtyTracker, deepEqual } from './dirty-tracker';

describe('deepEqual', () => {
  it('returns true for identical primitives', () => {
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual(null, 'a')).toBe(false);
  });

  it('treats NaN as equal to NaN', () => {
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual({ value: NaN }, { value: NaN })).toBe(true);
    expect(deepEqual(NaN, 0)).toBe(false);
  });

  it('compares flat objects structurally regardless of key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });

  it('compares nested objects and arrays', () => {
    expect(deepEqual({ a: [1, { b: 'x' }] }, { a: [1, { b: 'x' }] })).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([], {})).toBe(false);
  });
});

describe('createDirtyTracker', () => {
  it('starts clean when editable fields match initial snapshot', () => {
    const model = signal({ arma: 'w1', tubo: 't1' });
    const tracker = createDirtyTracker(() => model());
    expect(tracker.isDirty()).toBe(false);
  });

  it('becomes dirty when an editable field changes', () => {
    const model = signal({ arma: 'w1', tubo: 't1' });
    const tracker = createDirtyTracker(() => model());

    model.set({ arma: 'w2', tubo: 't1' });

    expect(tracker.isDirty()).toBe(true);
  });

  it('is reactive to model changes', () => {
    const model = signal({ value: 'a' });
    const tracker = createDirtyTracker(() => model());

    model.set({ value: 'b' });
    expect(tracker.isDirty()).toBe(true);

    model.set({ value: 'a' });
    expect(tracker.isDirty()).toBe(false);
  });

  it('syncSnapshot marks current values as saved', () => {
    const model = signal({ observations: '' });
    const tracker = createDirtyTracker(() => model());

    model.set({ observations: 'nueva observación' });
    expect(tracker.isDirty()).toBe(true);

    tracker.syncSnapshot();
    expect(tracker.isDirty()).toBe(false);
  });

  it('does not mutate the tracked object when syncing', () => {
    const model = signal({ nested: { count: 1 } });
    const tracker = createDirtyTracker(() => model());

    model().nested.count = 5;
    expect(tracker.isDirty()).toBe(true);

    tracker.syncSnapshot();
    expect(tracker.isDirty()).toBe(false);
  });
});

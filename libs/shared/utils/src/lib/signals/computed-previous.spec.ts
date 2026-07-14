import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { computedPrevious } from './computed-previous';

describe('computedPrevious', () => {
  it('returns the current value on first read (no previous yet)', () => {
    const source = signal(10);
    const previous = computedPrevious(source);

    expect(previous()).toBe(10);
  });

  it('returns the previous value after a change', () => {
    const source = signal(1);
    const previous = computedPrevious(source);

    expect(previous()).toBe(1);
    source.set(2);
    expect(previous()).toBe(1);
    source.set(3);
    expect(previous()).toBe(2);
  });

  it('works with object references', () => {
    const first = { id: 1 };
    const second = { id: 2 };
    const source = signal(first);
    const previous = computedPrevious(source);

    expect(previous()).toBe(first);
    source.set(second);
    expect(previous()).toBe(first);
  });

  it('is pull-based: intermediate values between reads are collapsed', () => {
    const source = signal('a');
    const previous = computedPrevious(source);

    expect(previous()).toBe('a');
    source.set('b');
    source.set('c'); // 'b' never read → not retained as previous
    expect(previous()).toBe('a');
    source.set('d');
    expect(previous()).toBe('c');
  });

  it('does not shift when the value is set to the same reference', () => {
    const source = signal(5);
    const previous = computedPrevious(source);

    expect(previous()).toBe(5);
    source.set(6);
    expect(previous()).toBe(5);
    source.set(6); // no real change
    expect(previous()).toBe(5);
  });
});

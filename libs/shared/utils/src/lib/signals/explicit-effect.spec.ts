import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { explicitEffect } from './explicit-effect';

describe('explicitEffect', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('runs on init with the current dep values', () => {
    const count = signal(1);
    const calls: number[][] = [];

    TestBed.runInInjectionContext(() => explicitEffect([count], ([value]) => calls.push([value])));
    TestBed.tick();

    expect(calls).toEqual([[1]]);
  });

  it('re-runs when a dep changes', () => {
    const count = signal(0);
    const calls: number[][] = [];

    TestBed.runInInjectionContext(() => explicitEffect([count], ([value]) => calls.push([value])));
    TestBed.tick();
    count.set(5);
    TestBed.tick();

    expect(calls).toEqual([[0], [5]]);
  });

  it('does NOT track signals read inside the effect body', () => {
    const dep = signal(0);
    const notTracked = signal(0);
    const calls: number[] = [];

    TestBed.runInInjectionContext(() =>
      explicitEffect([dep], ([value]) => {
        notTracked(); // read but must not become a dependency
        calls.push(value);
      }),
    );
    TestBed.tick();
    expect(calls).toEqual([0]);

    notTracked.set(99);
    TestBed.tick();
    expect(calls).toEqual([0]); // no re-run

    dep.set(1);
    TestBed.tick();
    expect(calls).toEqual([0, 1]);
  });

  it('passes all dep values as a tuple', () => {
    const a = signal('a');
    const b = signal(1);
    const calls: [string, number][] = [];

    TestBed.runInInjectionContext(() => explicitEffect([a, b], ([va, vb]) => calls.push([va, vb])));
    TestBed.tick();
    b.set(2);
    TestBed.tick();

    expect(calls).toEqual([
      ['a', 1],
      ['a', 2],
    ]);
  });

  describe('defer option', () => {
    it('skips the first run and reacts to changes only', () => {
      const count = signal(0);
      const calls: number[] = [];

      TestBed.runInInjectionContext(() => explicitEffect([count], ([value]) => calls.push(value), { defer: true }));
      TestBed.tick();
      expect(calls).toEqual([]);

      count.set(7);
      TestBed.tick();
      expect(calls).toEqual([7]);
    });
  });

  it('invokes registered cleanup before the next run', () => {
    const count = signal(0);
    const cleanup = vi.fn();

    TestBed.runInInjectionContext(() => explicitEffect([count], (_values, onCleanup) => onCleanup(cleanup)));
    TestBed.tick();
    expect(cleanup).not.toHaveBeenCalled();

    count.set(1);
    TestBed.tick();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('stops running after destroy()', () => {
    const count = signal(0);
    const calls: number[] = [];

    const ref = TestBed.runInInjectionContext(() => explicitEffect([count], ([value]) => calls.push(value)));
    TestBed.tick();
    ref.destroy();

    count.set(1);
    TestBed.tick();
    expect(calls).toEqual([0]);
  });
});

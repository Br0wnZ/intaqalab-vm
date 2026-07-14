import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { debouncedSignal } from './debounced-signal';

describe('debouncedSignal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with the current source value', () => {
    const source = signal('initial');
    const debounced = TestBed.runInInjectionContext(() => debouncedSignal(source, 300));

    expect(debounced()).toBe('initial');
  });

  it('propagates a change only after the debounce window', () => {
    const source = signal('a');
    const debounced = TestBed.runInInjectionContext(() => debouncedSignal(source, 300));
    TestBed.tick();

    source.set('b');
    TestBed.tick();
    expect(debounced()).toBe('a');

    vi.advanceTimersByTime(299);
    expect(debounced()).toBe('a');

    vi.advanceTimersByTime(1);
    expect(debounced()).toBe('b');
  });

  it('collapses rapid changes into the last value', () => {
    const source = signal('');
    const debounced = TestBed.runInInjectionContext(() => debouncedSignal(source, 300));
    TestBed.tick();

    source.set('p');
    TestBed.tick();
    vi.advanceTimersByTime(100);

    source.set('pr');
    TestBed.tick();
    vi.advanceTimersByTime(100);

    source.set('pre');
    TestBed.tick();
    expect(debounced()).toBe(''); // still nothing landed

    vi.advanceTimersByTime(300);
    expect(debounced()).toBe('pre'); // only the last one
  });

  it('accepts an explicit injector outside an injection context', () => {
    const source = signal(1);
    const injector = TestBed.inject(Injector);

    const debounced = debouncedSignal(source, 100, { injector });
    TestBed.tick();

    source.set(2);
    TestBed.tick();
    vi.advanceTimersByTime(100);

    expect(debounced()).toBe(2);
  });

  it('throws when called outside an injection context without injector', () => {
    const source = signal(0);

    expect(() => debouncedSignal(source, 100)).toThrowError(/injection context/i);
  });
});

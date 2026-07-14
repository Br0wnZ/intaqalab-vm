import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { throttledSignal } from './throttled-signal';

describe('throttledSignal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with the current source value', () => {
    const source = signal('initial');
    const throttled = TestBed.runInInjectionContext(() => throttledSignal(source, 300));

    expect(throttled()).toBe('initial');
  });

  it('propagates the first change immediately (leading)', () => {
    const source = signal(0);
    const throttled = TestBed.runInInjectionContext(() => throttledSignal(source, 300));
    TestBed.tick();
    vi.advanceTimersByTime(300); // move past the initial emission window

    source.set(1);
    TestBed.tick();

    expect(throttled()).toBe(1);
  });

  it('emits the last value when the window closes (trailing)', () => {
    const source = signal(0);
    const throttled = TestBed.runInInjectionContext(() => throttledSignal(source, 300));
    TestBed.tick();
    vi.advanceTimersByTime(300);

    source.set(1); // leading — lands immediately
    TestBed.tick();
    source.set(2);
    TestBed.tick();
    source.set(3);
    TestBed.tick();
    expect(throttled()).toBe(1);

    vi.advanceTimersByTime(300);
    expect(throttled()).toBe(3); // trailing: only the latest
  });

  it('opens a new window after a silent period', () => {
    const source = signal(0);
    const throttled = TestBed.runInInjectionContext(() => throttledSignal(source, 300));
    TestBed.tick();
    vi.advanceTimersByTime(300);

    source.set(1);
    TestBed.tick();
    vi.advanceTimersByTime(500); // silence, window closed

    source.set(2);
    TestBed.tick();
    expect(throttled()).toBe(2); // new leading emission
  });

  it('throws when called outside an injection context without injector', () => {
    const source = signal(0);

    expect(() => throttledSignal(source, 100)).toThrowError(/injection context/i);
  });
});

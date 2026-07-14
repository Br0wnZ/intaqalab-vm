import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { injectIdleStatus } from './inject-idle-status';

describe('injectIdleStatus', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts active (not idle)', () => {
    const status = TestBed.runInInjectionContext(() => injectIdleStatus({ idleAfterMs: 1000 }));

    expect(status.idle()).toBe(false);
  });

  it('turns idle after the configured silence', () => {
    const status = TestBed.runInInjectionContext(() => injectIdleStatus({ idleAfterMs: 1000 }));

    vi.advanceTimersByTime(999);
    expect(status.idle()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(status.idle()).toBe(true);
  });

  it('activity resets the timer and clears idle', () => {
    const status = TestBed.runInInjectionContext(() => injectIdleStatus({ idleAfterMs: 1000 }));

    vi.advanceTimersByTime(1000);
    expect(status.idle()).toBe(true);

    window.dispatchEvent(new Event('pointerdown'));
    expect(status.idle()).toBe(false);

    vi.advanceTimersByTime(999);
    expect(status.idle()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(status.idle()).toBe(true);
  });

  it('updates lastActivityAt on activity', () => {
    const status = TestBed.runInInjectionContext(() => injectIdleStatus({ idleAfterMs: 1000 }));
    const initial = status.lastActivityAt();

    vi.advanceTimersByTime(500);
    window.dispatchEvent(new Event('keydown'));

    expect(status.lastActivityAt()).toBe(initial + 500);
  });

  it('supports custom activity events', () => {
    const status = TestBed.runInInjectionContext(() =>
      injectIdleStatus({ idleAfterMs: 1000, activityEvents: ['focus'] }),
    );

    vi.advanceTimersByTime(1000);
    expect(status.idle()).toBe(true);

    window.dispatchEvent(new Event('pointerdown')); // not in list → ignored
    expect(status.idle()).toBe(true);

    window.dispatchEvent(new Event('focus'));
    expect(status.idle()).toBe(false);
  });

  it('stops listening and timing after injector destroy', () => {
    const parent = TestBed.inject(EnvironmentInjector);
    const child = createEnvironmentInjector([], parent);
    const status = runInInjectionContext(child, () => injectIdleStatus({ idleAfterMs: 1000 }));

    child.destroy();

    vi.advanceTimersByTime(5000);
    expect(status.idle()).toBe(false); // timer cleared, never fired
  });

  it('throws when called outside an injection context without injector', () => {
    expect(() => injectIdleStatus()).toThrowError(/injection context/i);
  });
});

import { EnvironmentInjector, createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCountdown } from './create-countdown';

describe('createCountdown', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts stopped with the full duration', () => {
    const countdown = TestBed.runInInjectionContext(() => createCountdown(30_000));

    expect(countdown.remainingMs()).toBe(30_000);
    expect(countdown.running()).toBe(false);
    expect(countdown.finished()).toBe(false);
  });

  it('counts down while running', () => {
    const countdown = TestBed.runInInjectionContext(() => createCountdown(1000, { tickMs: 100 }));

    countdown.start();
    expect(countdown.running()).toBe(true);

    vi.advanceTimersByTime(300);
    expect(countdown.remainingMs()).toBe(700);
  });

  it('finishes at zero and stops ticking', () => {
    const countdown = TestBed.runInInjectionContext(() => createCountdown(500, { tickMs: 100 }));

    countdown.start();
    vi.advanceTimersByTime(500);

    expect(countdown.remainingMs()).toBe(0);
    expect(countdown.finished()).toBe(true);
    expect(countdown.running()).toBe(false);
  });

  it('pause freezes the remaining time; resume continues', () => {
    const countdown = TestBed.runInInjectionContext(() => createCountdown(1000, { tickMs: 100 }));

    countdown.start();
    vi.advanceTimersByTime(400);
    countdown.pause();

    expect(countdown.running()).toBe(false);
    const frozen = countdown.remainingMs();
    expect(frozen).toBe(600);

    vi.advanceTimersByTime(5000); // paused: nothing moves
    expect(countdown.remainingMs()).toBe(frozen);

    countdown.resume();
    vi.advanceTimersByTime(600);
    expect(countdown.finished()).toBe(true);
  });

  it('start accepts a new duration', () => {
    const countdown = TestBed.runInInjectionContext(() => createCountdown(1000, { tickMs: 100 }));

    countdown.start(2000);
    vi.advanceTimersByTime(500);

    expect(countdown.remainingMs()).toBe(1500);
  });

  it('reset stops and restores the duration without starting', () => {
    const countdown = TestBed.runInInjectionContext(() => createCountdown(1000, { tickMs: 100 }));

    countdown.start();
    vi.advanceTimersByTime(300);
    countdown.reset();

    expect(countdown.remainingMs()).toBe(1000);
    expect(countdown.running()).toBe(false);
  });

  it('resume is a no-op when finished', () => {
    const countdown = TestBed.runInInjectionContext(() => createCountdown(200, { tickMs: 100 }));

    countdown.start();
    vi.advanceTimersByTime(200);
    countdown.resume();

    expect(countdown.running()).toBe(false);
    expect(countdown.finished()).toBe(true);
  });

  it('stops ticking when the owning injector is destroyed', () => {
    const parent = TestBed.inject(EnvironmentInjector);
    const child = createEnvironmentInjector([], parent);
    const countdown = runInInjectionContext(child, () => createCountdown(1000, { tickMs: 100 }));

    countdown.start();
    vi.advanceTimersByTime(200);
    child.destroy();

    const atDestroy = countdown.remainingMs();
    vi.advanceTimersByTime(1000);
    expect(countdown.remainingMs()).toBe(atDestroy); // interval cleared
  });

  it('throws when called outside an injection context without injector', () => {
    expect(() => createCountdown(1000)).toThrowError(/injection context/i);
  });
});

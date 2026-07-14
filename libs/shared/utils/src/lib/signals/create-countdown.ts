import type { Injector, Signal } from '@angular/core';
import { DestroyRef, assertInInjectionContext, computed, inject, runInInjectionContext, signal } from '@angular/core';

export interface CreateCountdownOptions {
  /** Tick resolution in ms (UI refresh rate, not precision). Default: 100. */
  tickMs?: number;
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

export interface Countdown {
  /** Remaining time in ms. Never negative. */
  readonly remainingMs: Signal<number>;
  /** `true` while counting down. */
  readonly running: Signal<boolean>;
  /** `true` once the countdown reached zero (until the next `start`/`reset`). */
  readonly finished: Signal<boolean>;
  /** Starts (or restarts) the countdown. Optional new duration in ms. */
  start(durationMs?: number): void;
  /** Freezes the countdown keeping the remaining time. */
  pause(): void;
  /** Resumes a paused countdown. No-op when running or already finished. */
  resume(): void;
  /** Stops and restores the full duration (or a new one) without starting. */
  reset(durationMs?: number): void;
}

/**
 * Pausable countdown as signals (own utility, designed for the safety count
 * in trial execution).
 *
 * Drift-free: the remaining time derives from a deadline timestamp, not from
 * accumulating ticks — pausing the JS thread does not stretch the countdown.
 * The interval only exists while running and is cleared on injector destroy.
 *
 * @example
 * readonly safetyCount = createCountdown(30_000);
 *
 * // template:
 * // <span class="text-4xl font-mono">{{ safetyCount.remainingMs() / 1000 | intaDecimal:'1.0-0' }}</span>
 * // @if (safetyCount.finished()) { <inta-fire-enabled-badge /> }
 */
export function createCountdown(durationMs: number, options?: CreateCountdownOptions): Countdown {
  if (!options?.injector) {
    assertInInjectionContext(createCountdown);
  }

  const setup = (): Countdown => {
    const tickMs = options?.tickMs ?? 100;

    const remainingMs = signal(durationMs);
    const running = signal(false);
    const finished = computed(() => remainingMs() === 0);

    let deadline = 0;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const stopTicking = (): void => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
      running.set(false);
    };

    const tick = (): void => {
      const left = Math.max(0, deadline - Date.now());
      remainingMs.set(left);
      if (left === 0) stopTicking();
    };

    const startTicking = (fromMs: number): void => {
      stopTicking();
      if (fromMs <= 0) {
        remainingMs.set(0);
        return;
      }
      deadline = Date.now() + fromMs;
      remainingMs.set(fromMs);
      running.set(true);
      intervalId = setInterval(tick, tickMs);
    };

    inject(DestroyRef).onDestroy(stopTicking);

    return {
      remainingMs: remainingMs.asReadonly(),
      running: running.asReadonly(),
      finished,

      start(newDurationMs?: number): void {
        startTicking(newDurationMs ?? durationMs);
      },

      pause(): void {
        if (!running()) return;
        tick();
        stopTicking();
      },

      resume(): void {
        if (running() || remainingMs() === 0) return;
        startTicking(remainingMs());
      },

      reset(newDurationMs?: number): void {
        stopTicking();
        remainingMs.set(newDurationMs ?? durationMs);
      },
    };
  };

  return options?.injector ? runInInjectionContext(options.injector, setup) : setup();
}

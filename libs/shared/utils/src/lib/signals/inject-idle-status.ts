import type { Injector, Signal } from '@angular/core';
import { DestroyRef, assertInInjectionContext, inject, runInInjectionContext, signal } from '@angular/core';

/** Default activity threshold: 5 minutes. */
const DEFAULT_IDLE_AFTER_MS = 5 * 60 * 1000;

/** DOM events counted as user activity. */
const DEFAULT_ACTIVITY_EVENTS: readonly string[] = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'touchstart',
  'scroll',
];

export interface InjectIdleStatusOptions {
  /** Milliseconds without activity before `idle` turns `true`. Default: 5 min. */
  idleAfterMs?: number;
  /** Window events counted as activity. Default: pointer/key/wheel/touch/scroll. */
  activityEvents?: readonly string[];
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

export interface IdleStatus {
  /** `true` after `idleAfterMs` without user activity. */
  readonly idle: Signal<boolean>;
  /** Epoch ms of the last detected activity. */
  readonly lastActivityAt: Signal<number>;
}

/**
 * User inactivity as signals (own utility, replaces the classic ng2-idle use case).
 *
 * Listens to activity events on `window` (passive listeners) and flips `idle`
 * to `true` after `idleAfterMs` of silence. Any activity flips it back and
 * refreshes `lastActivityAt`. Timer and listeners are cleaned up when the
 * owning injector is destroyed.
 *
 * Typical use: session auto-logout / re-lock combined with the OIDC client,
 * or dimming live dashboards when nobody is watching.
 *
 * @example
 * readonly idleStatus = injectIdleStatus({ idleAfterMs: 15 * 60 * 1000 });
 *
 * explicitEffect([this.idleStatus.idle], ([idle]) => {
 *   if (idle) this.auth.logoff();
 * }, { defer: true });
 */
export function injectIdleStatus(options?: InjectIdleStatusOptions): IdleStatus {
  if (!options?.injector) {
    assertInInjectionContext(injectIdleStatus);
  }

  const setup = (): IdleStatus => {
    const idleAfterMs = options?.idleAfterMs ?? DEFAULT_IDLE_AFTER_MS;
    const activityEvents = options?.activityEvents ?? DEFAULT_ACTIVITY_EVENTS;

    const idle = signal(false);
    const lastActivityAt = signal(Date.now());

    let timeoutId: ReturnType<typeof setTimeout>;
    const armTimer = (): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => idle.set(true), idleAfterMs);
    };

    const onActivity = (): void => {
      lastActivityAt.set(Date.now());
      if (idle()) idle.set(false);
      armTimer();
    };

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }
    armTimer();

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(timeoutId);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, onActivity);
      }
    });

    return { idle: idle.asReadonly(), lastActivityAt: lastActivityAt.asReadonly() };
  };

  return options?.injector ? runInInjectionContext(options.injector, setup) : setup();
}

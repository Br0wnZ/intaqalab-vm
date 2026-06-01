import type { Signal } from '@angular/core';

/**
 * ⏰ Opciones para esperar cambios en signals
 */
export interface WaitForSignalOptions {
  /** Timeout en ms (default: 3000) */
  timeout?: number;
  /** Intervalo de chequeo en ms (default: 50) */
  interval?: number;
  /** Mensaje de error personalizado */
  errorMessage?: string;
}

/**
 * ⏳ Esperar a que un signal cumpla una condición
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * count.set(5);
 * await waitForSignal(count, (val) => val === 5);
 * ```
 */
export async function waitForSignal<T>(
  signalFn: Signal<T> | (() => T),
  condition: (value: T) => boolean,
  options: WaitForSignalOptions = {},
): Promise<void> {
  const { timeout = 3000, interval = 50, errorMessage = 'Timeout waiting for signal condition' } = options;

  const startTime = Date.now();
  const getValue = typeof signalFn === 'function' ? signalFn : () => (signalFn as Signal<T>)();

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      try {
        const value = getValue();

        if (condition(value)) {
          clearInterval(checkInterval);
          resolve();
          return;
        }

        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error(`${errorMessage}. Last value: ${JSON.stringify(value)}`));
        }
      } catch (error) {
        clearInterval(checkInterval);
        reject(error);
      }
    }, interval);
  });
}

/**
 * ⏳ Esperar a que un signal tenga un valor específico
 *
 * @example
 * ```typescript
 * await waitForSignalValue(status, 'resolved');
 * ```
 */
export async function waitForSignalValue<T>(
  signalFn: Signal<T> | (() => T),
  expectedValue: T,
  options?: WaitForSignalOptions,
): Promise<void> {
  return waitForSignal(signalFn, (value) => value === expectedValue, {
    ...options,
    errorMessage: options?.errorMessage ?? `Timeout waiting for signal to equal ${JSON.stringify(expectedValue)}`,
  });
}

/**
 * ⏳ Esperar a que un signal cambie de valor
 *
 * @example
 * ```typescript
 * const count = signal(0);
 * const promise = waitForSignalChange(count);
 * count.set(1);
 * await promise;
 * ```
 */
export async function waitForSignalChange<T>(
  signalFn: Signal<T> | (() => T),
  options?: WaitForSignalOptions,
): Promise<T> {
  const getValue = typeof signalFn === 'function' ? signalFn : () => (signalFn as Signal<T>)();
  const initialValue = getValue();

  await waitForSignal(signalFn, (value) => value !== initialValue, {
    ...options,
    errorMessage: options?.errorMessage ?? 'Timeout waiting for signal to change',
  });

  return getValue();
}

/**
 * 📊 Capturar el historial de cambios de un signal
 *
 * @example
 * ```typescript
 * const tracker = trackSignalChanges(count);
 * count.set(1);
 * count.set(2);
 * count.set(3);
 * expect(tracker.history).toEqual([0, 1, 2, 3]);
 * tracker.stop();
 * ```
 */
export function trackSignalChanges<T>(
  signalFn: Signal<T> | (() => T),
  interval = 10,
): {
  history: T[];
  stop: () => void;
} {
  const getValue = typeof signalFn === 'function' ? signalFn : () => (signalFn as Signal<T>)();
  const history: T[] = [getValue()];
  let previousValue = getValue();

  const checkInterval = setInterval(() => {
    const currentValue = getValue();
    if (currentValue !== previousValue) {
      history.push(currentValue);
      previousValue = currentValue;
    }
  }, interval);

  return {
    history,
    stop: () => clearInterval(checkInterval),
  };
}

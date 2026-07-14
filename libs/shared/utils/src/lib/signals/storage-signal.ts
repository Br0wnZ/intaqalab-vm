import type { Injector, WritableSignal } from '@angular/core';
import { DestroyRef, assertInInjectionContext, inject, runInInjectionContext, signal } from '@angular/core';

export interface StorageSignalOptions<T> {
  /** Backing storage. Default: `localStorage`. Use `sessionStorage` for per-tab state. */
  storage?: Storage;
  /** Converts the raw stored string into the value. Default: `JSON.parse`. */
  parse?: (raw: string) => T;
  /** Converts the value into the stored string. Default: `JSON.stringify`. */
  serialize?: (value: T) => string;
  /**
   * Sync the signal when another tab writes the same key (`storage` event).
   * Default: `true`. Only meaningful with `localStorage`.
   */
  crossTab?: boolean;
  /** Injector to use when called outside an injection context. */
  injector?: Injector;
}

/**
 * Writable signal persisted in Web Storage (own utility, no external inspiration).
 *
 * - Reads the initial value from storage; falls back to `initialValue` when the
 *   key is absent or the stored payload cannot be parsed.
 * - `set()`/`update()` write through to storage synchronously.
 * - With `crossTab` (default), writes from other tabs update the signal live.
 *
 * Typical use: UI preferences that must survive reload but do not belong to the
 * backend — execution grid layout, table density, collapsed panels.
 *
 * @example
 * readonly gridLayout = storageSignal<GridLayout>('execution.grid-layout', DEFAULT_LAYOUT);
 * readonly density = storageSignal<'compact' | 'comfortable'>('ui.density', 'comfortable', {
 *   storage: sessionStorage,
 *   crossTab: false,
 * });
 */
export function storageSignal<T>(key: string, initialValue: T, options?: StorageSignalOptions<T>): WritableSignal<T> {
  if (!options?.injector) {
    assertInInjectionContext(storageSignal);
  }

  const setup = (): WritableSignal<T> => {
    const storage = options?.storage ?? localStorage;
    const parse = options?.parse ?? ((raw: string) => JSON.parse(raw) as T);
    const serialize = options?.serialize ?? ((value: T) => JSON.stringify(value));

    const readStored = (raw: string | null): T => {
      if (raw === null) return initialValue;
      try {
        return parse(raw);
      } catch {
        // Corrupt/legacy payload: fall back instead of breaking the app.
        return initialValue;
      }
    };

    const state = signal(readStored(storage.getItem(key)));
    const applyLocally = state.set.bind(state);

    const setAndPersist = (value: T): void => {
      applyLocally(value);
      const serialized = serialize(value);
      // JSON.stringify(undefined) yields undefined — treat it as a removal.
      if (serialized === undefined) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, serialized);
      }
    };

    state.set = setAndPersist;
    state.update = (updateFn: (value: T) => T) => setAndPersist(updateFn(state()));

    if (options?.crossTab !== false) {
      const onStorage = (event: StorageEvent): void => {
        if (event.key !== key || event.storageArea !== storage) return;
        applyLocally(readStored(event.newValue));
      };
      window.addEventListener('storage', onStorage);
      inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', onStorage));
    }

    return state;
  };

  return options?.injector ? runInInjectionContext(options.injector, setup) : setup();
}

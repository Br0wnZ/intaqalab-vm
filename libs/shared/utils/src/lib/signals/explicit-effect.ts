import type { CreateEffectOptions, EffectCleanupRegisterFn, EffectRef, Signal } from '@angular/core';
import { effect, untracked } from '@angular/core';

/** Maps a tuple of signals to a tuple of their unwrapped values. */
type SignalValues<TDeps extends readonly Signal<unknown>[]> = {
  [K in keyof TDeps]: TDeps[K] extends Signal<infer V> ? V : never;
};

export interface ExplicitEffectOptions extends CreateEffectOptions {
  /**
   * When `true`, skips the first execution: the effect only runs
   * from the first *change* of any dependency onwards.
   */
  defer?: boolean;
}

/**
 * `effect()` with an explicit dependency array (inspired by ngxtension's `explicitEffect`).
 *
 * Only the signals listed in `deps` are tracked. The effect body runs inside
 * `untracked()`, so any signal read within it does NOT become a dependency.
 * This enforces by construction the project rule "read all signals before the
 * first `await` / avoid accidental dependencies".
 *
 * @example
 * // Runs only when `trialId` changes — `status` is read but not tracked:
 * explicitEffect([this.store.trialId], ([trialId]) => {
 *   console.log(trialId, this.store.status());
 * });
 *
 * @example
 * // Skip the initial run (react to changes only):
 * explicitEffect([query], ([q]) => this.search(q), { defer: true });
 */
export function explicitEffect<const TDeps extends readonly Signal<unknown>[]>(
  deps: TDeps,
  effectFn: (values: SignalValues<TDeps>, onCleanup: EffectCleanupRegisterFn) => void,
  options?: ExplicitEffectOptions,
): EffectRef {
  const { defer = false, ...effectOptions } = options ?? {};
  let skipFirstRun = defer;

  return effect((onCleanup) => {
    // Reading deps here registers them as the ONLY reactive dependencies.
    const values = deps.map((dep) => dep()) as SignalValues<TDeps>;

    if (skipFirstRun) {
      skipFirstRun = false;
      return;
    }

    untracked(() => effectFn(values, onCleanup));
  }, effectOptions);
}

import type { Signal, WritableSignal } from '@angular/core';
import { computed, signal, untracked } from '@angular/core';

export interface SignalHistoryOptions {
  /** Maximum number of undo steps kept. Oldest entries are dropped. Default: 50. */
  capacity?: number;
}

export interface SignalHistory<T> {
  /** `true` when there is at least one undo step available. */
  readonly canUndo: Signal<boolean>;
  /** `true` when there is at least one redo step available. */
  readonly canRedo: Signal<boolean>;
  /** Full timeline: past values plus the current one (last element). */
  readonly history: Signal<readonly T[]>;
  /** Restores the previous value. No-op when there is none. */
  undo(): void;
  /** Re-applies the value undone last. No-op when there is none. */
  redo(): void;
  /** Drops all undo/redo steps, keeping the current value. */
  clear(): void;
}

/**
 * Adds undo/redo tracking to a writable signal (own utility).
 *
 * Instruments `set`/`update` on `source`: every *distinct* write pushes the
 * replaced value onto the undo stack and clears the redo stack — exactly like
 * an editor. `undo()`/`redo()` write back through the original setter, so the
 * signal keeps working everywhere (templates, effects, `httpResource`).
 *
 * Needs no injection context and registers no effects: recording is synchronous.
 *
 * @example
 * readonly layout = signal<GridLayout>(DEFAULT_LAYOUT);
 * readonly layoutHistory = signalHistory(this.layout, { capacity: 20 });
 *
 * // template:
 * // <button matIconButton [disabled]="!layoutHistory.canUndo()" (click)="layoutHistory.undo()">
 */
export function signalHistory<T>(source: WritableSignal<T>, options?: SignalHistoryOptions): SignalHistory<T> {
  const capacity = options?.capacity ?? 50;

  const past = signal<readonly T[]>([]);
  const future = signal<readonly T[]>([]);
  const applyToSource = source.set.bind(source);

  const push = (list: readonly T[], value: T): readonly T[] =>
    list.length >= capacity ? [...list.slice(1), value] : [...list, value];

  const record = (value: T): void => {
    const current = untracked(source);
    if (!Object.is(value, current)) {
      past.update((list) => push(list, current));
      future.set([]);
    }
    applyToSource(value);
  };

  source.set = record;
  source.update = (updateFn: (value: T) => T) => record(updateFn(untracked(source)));

  return {
    canUndo: computed(() => past().length > 0),
    canRedo: computed(() => future().length > 0),
    history: computed(() => [...past(), source()]),

    undo(): void {
      const list = untracked(past);
      if (list.length === 0) return;
      const previous = list[list.length - 1];
      past.set(list.slice(0, -1));
      future.update((redoList) => [...redoList, untracked(source)]);
      applyToSource(previous);
    },

    redo(): void {
      const list = untracked(future);
      if (list.length === 0) return;
      const next = list[list.length - 1];
      future.set(list.slice(0, -1));
      past.update((undoList) => push(undoList, untracked(source)));
      applyToSource(next);
    },

    clear(): void {
      past.set([]);
      future.set([]);
    },
  };
}

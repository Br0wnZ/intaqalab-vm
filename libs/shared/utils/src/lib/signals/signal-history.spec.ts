import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { signalHistory } from './signal-history';

describe('signalHistory', () => {
  it('starts with empty undo/redo stacks', () => {
    const value = signal('a');
    const history = signalHistory(value);

    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.history()).toEqual(['a']);
  });

  it('records each distinct set()', () => {
    const value = signal('a');
    const history = signalHistory(value);

    value.set('b');
    value.set('c');

    expect(history.history()).toEqual(['a', 'b', 'c']);
    expect(history.canUndo()).toBe(true);
  });

  it('does not record writes with the same value', () => {
    const value = signal('a');
    const history = signalHistory(value);

    value.set('a');

    expect(history.canUndo()).toBe(false);
  });

  it('undo restores the previous value', () => {
    const value = signal(1);
    const history = signalHistory(value);

    value.set(2);
    history.undo();

    expect(value()).toBe(1);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it('redo re-applies the undone value', () => {
    const value = signal(1);
    const history = signalHistory(value);

    value.set(2);
    history.undo();
    history.redo();

    expect(value()).toBe(2);
    expect(history.canRedo()).toBe(false);
    expect(history.canUndo()).toBe(true);
  });

  it('a new write clears the redo stack', () => {
    const value = signal('a');
    const history = signalHistory(value);

    value.set('b');
    history.undo();
    value.set('c'); // diverge → 'b' unreachable

    expect(history.canRedo()).toBe(false);
    expect(history.history()).toEqual(['a', 'c']);
  });

  it('update() is also recorded', () => {
    const value = signal(10);
    const history = signalHistory(value);

    value.update((v) => v + 5);
    history.undo();

    expect(value()).toBe(10);
  });

  it('undo/redo are no-ops on empty stacks', () => {
    const value = signal('a');
    const history = signalHistory(value);

    history.undo();
    history.redo();

    expect(value()).toBe('a');
  });

  it('respects capacity dropping the oldest entries', () => {
    const value = signal(0);
    const history = signalHistory(value, { capacity: 2 });

    value.set(1);
    value.set(2);
    value.set(3);

    // capacity 2 → only [1, 2] retained as undo steps
    history.undo();
    expect(value()).toBe(2);
    history.undo();
    expect(value()).toBe(1);
    expect(history.canUndo()).toBe(false);
  });

  it('clear() drops both stacks keeping the current value', () => {
    const value = signal('a');
    const history = signalHistory(value);

    value.set('b');
    history.undo();
    history.clear();

    expect(value()).toBe('a');
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.history()).toEqual(['a']);
  });
});

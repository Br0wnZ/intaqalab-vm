import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { storageSignal } from './storage-signal';

interface Prefs {
  density: string;
  columns: number;
}

describe('storageSignal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('falls back to the initial value when the key is absent', () => {
    const prefs = TestBed.runInInjectionContext(() =>
      storageSignal<Prefs>('prefs', { density: 'comfortable', columns: 3 }),
    );

    expect(prefs()).toEqual({ density: 'comfortable', columns: 3 });
  });

  it('reads the stored value on creation', () => {
    localStorage.setItem('prefs', JSON.stringify({ density: 'compact', columns: 5 }));

    const prefs = TestBed.runInInjectionContext(() =>
      storageSignal<Prefs>('prefs', { density: 'comfortable', columns: 3 }),
    );

    expect(prefs()).toEqual({ density: 'compact', columns: 5 });
  });

  it('falls back to the initial value on corrupt payload', () => {
    localStorage.setItem('prefs', '{not json');

    const prefs = TestBed.runInInjectionContext(() =>
      storageSignal<Prefs>('prefs', { density: 'comfortable', columns: 3 }),
    );

    expect(prefs()).toEqual({ density: 'comfortable', columns: 3 });
  });

  it('set() updates signal and persists to storage', () => {
    const counter = TestBed.runInInjectionContext(() => storageSignal('counter', 0));

    counter.set(42);

    expect(counter()).toBe(42);
    expect(localStorage.getItem('counter')).toBe('42');
  });

  it('update() persists the derived value', () => {
    const counter = TestBed.runInInjectionContext(() => storageSignal('counter', 10));

    counter.update((value) => value + 1);

    expect(counter()).toBe(11);
    expect(localStorage.getItem('counter')).toBe('11');
  });

  it('uses the provided storage (sessionStorage)', () => {
    const flag = TestBed.runInInjectionContext(() =>
      storageSignal('flag', false, { storage: sessionStorage, crossTab: false }),
    );

    flag.set(true);

    expect(sessionStorage.getItem('flag')).toBe('true');
    expect(localStorage.getItem('flag')).toBeNull();
  });

  it('supports custom parse/serialize', () => {
    const when = TestBed.runInInjectionContext(() =>
      storageSignal<Date>('when', new Date(0), {
        parse: (raw) => new Date(Number(raw)),
        serialize: (value) => String(value.getTime()),
      }),
    );

    when.set(new Date(1500));

    expect(localStorage.getItem('when')).toBe('1500');
  });

  it('syncs from other tabs via the storage event', () => {
    const counter = TestBed.runInInjectionContext(() => storageSignal('counter', 0));

    window.dispatchEvent(new StorageEvent('storage', { key: 'counter', newValue: '7', storageArea: localStorage }));

    expect(counter()).toBe(7);
  });

  it('ignores storage events for other keys', () => {
    const counter = TestBed.runInInjectionContext(() => storageSignal('counter', 0));

    window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: '99', storageArea: localStorage }));

    expect(counter()).toBe(0);
  });

  it('resets to the initial value when another tab removes the key', () => {
    const counter = TestBed.runInInjectionContext(() => storageSignal('counter', 5));
    counter.set(20);

    window.dispatchEvent(new StorageEvent('storage', { key: 'counter', newValue: null, storageArea: localStorage }));

    expect(counter()).toBe(5);
  });

  it('throws when called outside an injection context without injector', () => {
    expect(() => storageSignal('x', 0)).toThrowError(/injection context/i);
  });
});

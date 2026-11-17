import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { apply, form } from '@angular/forms/signals';

import { boundedNumberSchema, nonNegativeSchema, percentageSchema } from './domain-schemas';

describe('domain-schemas', () => {
  describe('percentageSchema', () => {
    it('accepts null and values within [0, 100]', () => {
      const model = signal<{ pct: number | null }>({ pct: null });
      const f = form(
        model,
        (p) => {
          apply(p.pct, percentageSchema);
        },
        { injector: TestBed.inject(Injector) },
      );

      expect(f.pct().valid()).toBe(true);

      model.set({ pct: 0 });
      expect(f.pct().valid()).toBe(true);

      model.set({ pct: 50 });
      expect(f.pct().valid()).toBe(true);

      model.set({ pct: 100 });
      expect(f.pct().valid()).toBe(true);
    });

    it('rejects values below 0 or above 100', () => {
      const model = signal<{ pct: number | null }>({ pct: -0.01 });
      const f = form(
        model,
        (p) => {
          apply(p.pct, percentageSchema);
        },
        { injector: TestBed.inject(Injector) },
      );

      expect(f.pct().valid()).toBe(false);

      model.set({ pct: 100.01 });
      expect(f.pct().valid()).toBe(false);
    });
  });

  describe('nonNegativeSchema', () => {
    it('accepts null and values >= 0', () => {
      const model = signal<{ value: number | null }>({ value: null });
      const f = form(
        model,
        (p) => {
          apply(p.value, nonNegativeSchema);
        },
        { injector: TestBed.inject(Injector) },
      );

      expect(f.value().valid()).toBe(true);

      model.set({ value: 0 });
      expect(f.value().valid()).toBe(true);

      model.set({ value: 42.5 });
      expect(f.value().valid()).toBe(true);
    });

    it('rejects negative values', () => {
      const model = signal<{ value: number | null }>({ value: -0.001 });
      const f = form(
        model,
        (p) => {
          apply(p.value, nonNegativeSchema);
        },
        { injector: TestBed.inject(Injector) },
      );

      expect(f.value().valid()).toBe(false);
    });
  });

  describe('boundedNumberSchema', () => {
    it('accepts null and values within [minVal, maxVal]', () => {
      const model = signal<{ temp: number | null }>({ temp: null });
      const f = form(
        model,
        (p) => {
          apply(p.temp, boundedNumberSchema(-20, 60));
        },
        { injector: TestBed.inject(Injector) },
      );

      expect(f.temp().valid()).toBe(true);

      model.set({ temp: -20 });
      expect(f.temp().valid()).toBe(true);

      model.set({ temp: 25 });
      expect(f.temp().valid()).toBe(true);

      model.set({ temp: 60 });
      expect(f.temp().valid()).toBe(true);
    });

    it('rejects values outside [minVal, maxVal]', () => {
      const model = signal<{ temp: number | null }>({ temp: -20.1 });
      const f = form(
        model,
        (p) => {
          apply(p.temp, boundedNumberSchema(-20, 60));
        },
        { injector: TestBed.inject(Injector) },
      );

      expect(f.temp().valid()).toBe(false);

      model.set({ temp: 60.1 });
      expect(f.temp().valid()).toBe(false);
    });
  });
});

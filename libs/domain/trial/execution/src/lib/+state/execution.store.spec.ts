import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { beforeEach, describe, expect, it } from 'vitest';

import { ExecutionStore } from './execution.store';

/**
 * Smoke test de la composición de features (ADR-007).
 *
 * No cubre la lógica interna de cada feature (eso corresponde a specs por
 * feature en ./features): valida que la composición en una única store expone
 * los slices y métodos de cada grupo funcional sin colisiones.
 */
describe('ExecutionStore (composición de features)', () => {
  let store: InstanceType<typeof ExecutionStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTestingEnvironment(), provideHttpClient(), provideHttpClientTesting(), ExecutionStore],
    });
    store = TestBed.inject(ExecutionStore);
  });

  it('se instancia con todas las features compuestas', () => {
    expect(store).toBeTruthy();
  });

  it('expone el slice de general-data y su método de escritura', () => {
    store.setFireTrialId('trial-1');
    expect(store.fireTrialId()).toBe('trial-1');
  });

  it('expone el slice de readiness', () => {
    expect(store.techUnits().length).toBeGreaterThan(0);
    expect(store.jltStatus()).toBeDefined();
  });

  it('expone los computeds de equipment-selector en estado idle', () => {
    expect(store.isLoadingEquipmentSelector()).toBe(false);
  });

  it('expone los slices de widgets de orientación e introducción de datos', () => {
    expect(store.radarTrayectographyOrientation()).toBeDefined();
    expect(store.topographyIntroduction()).toBeDefined();
  });
});

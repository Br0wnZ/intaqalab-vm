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

  it('expone métodos y computeds de carga y guardado para las 5 features conectadas a la API', () => {
    // JLT MAO
    expect(store.jltMao).toBeDefined();
    expect(typeof store.loadShotJltMao).toBe('function');
    expect(typeof store.saveShotJltMao).toBe('function');
    expect(store.isLoadingJltMao()).toBe(false);

    // MAO Topography
    expect(store.maoTopography).toBeDefined();
    expect(typeof store.loadShotMaoTopography).toBe('function');
    expect(typeof store.saveShotMaoTopography).toBe('function');
    expect(store.isLoadingMaoTopography()).toBe(false);

    // Topography Introduction
    expect(store.topographyIntroduction).toBeDefined();
    expect(typeof store.loadShotTopography).toBe('function');
    expect(typeof store.saveShotTopography).toBe('function');
    expect(store.isLoadingTopography()).toBe(false);

    // Trajectography Introduction
    expect(store.trayectografiaIntroduction).toBeDefined();
    expect(typeof store.loadShotTrajectography).toBe('function');
    expect(typeof store.saveShotTrajectography).toBe('function');
    expect(store.isLoadingTrajectography()).toBe(false);

    // Acoustic Level Introduction
    expect(store.acousticLevelIntroduction).toBeDefined();
    expect(typeof store.loadShotAcousticLevel).toBe('function');
    expect(typeof store.saveShotAcousticLevel).toBe('function');
    expect(store.isLoadingAcousticLevel()).toBe(false);
  });
});

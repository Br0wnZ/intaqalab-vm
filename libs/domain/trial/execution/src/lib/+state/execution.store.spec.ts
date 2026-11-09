import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EquipmentSelectionService } from '../data-access';
import { EquipmentMagnitudeTagEnum, EquipmentTypeEnum } from '../execution/models';
import { WidgetId } from '../execution/models/widget-id.enum';
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

  it('determines if execution is started based on trial status and execution state', () => {
    expect(store.isExecutionStarted()).toBe(true);
  });

  it('does not load the security countdown when execution initializes', () => {
    store.setFireTrialId('trial-1');
    TestBed.tick();

    TestBed.inject(HttpTestingController).expectNone((request) =>
      request.url.includes('/execution/security-countdown'),
    );
  });

  it('does not request planning state when trial loads', () => {
    const http = TestBed.inject(HttpTestingController);
    store.setFireTrialId('trial-1');
    TestBed.tick();
    http.expectNone((request) => request.url.endsWith('/execution/planning/state'));

    http.expectOne((request) => request.url.endsWith('/fire-trials/trial-1')).flush({ id: 'trial-1' });
    TestBed.tick();
    http.expectNone((request) => request.url.endsWith('/execution/planning/state'));
  });

  it('expone el slice de readiness', () => {
    expect(store.techUnits().length).toBeGreaterThan(0);
    expect(store.jltStatus()).toBeDefined();
  });

  it('does not request planning state for a mismatched trial response', async () => {
    const http = TestBed.inject(HttpTestingController);
    store.setFireTrialId('trial-1');
    TestBed.tick();
    http.expectOne((request) => request.url.endsWith('/fire-trials/trial-1')).flush({ id: 'trial-2' });

    await vi.waitFor(() => {
      TestBed.tick();
      expect(store.fireTrial()).not.toBeNull();
    });

    http.expectNone((request) => request.url.endsWith('/execution/planning/state'));
  });

  it('expone los computeds de equipment-selector en estado idle', () => {
    expect(store.isLoadingEquipmentSelector()).toBe(false);
  });

  it('does not throw when the equipment selection request fails', () => {
    TestBed.inject(EquipmentSelectionService).getEquipmentSelector('trial-1');
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .expectOne((request) => request.url.includes('/equipment-selection'))
      .flush([], { status: 500, statusText: 'Server Error' });

    expect(() => store.equipmentSelectorRemote()).not.toThrow();
    expect(store.equipmentSelectorRemote()).toBeUndefined();
  });

  it('sends video equipment magnitude selections as measureId without magnitude', () => {
    const http = TestBed.inject(HttpTestingController);
    store.setFireTrialId('trial-1');
    TestBed.tick();

    http.expectOne((request) => request.method === 'GET' && request.url.includes('/equipment-selection')).flush([]);

    store.updateEquipmentSelections([
      {
        id: EquipmentMagnitudeTagEnum.VIDEO_AV,
        selections: [
          {
            itemId: 'camera-1',
            categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
            magnitude: 'planned-video-av-measure',
            channel: 1,
            series: ['series-1'],
            disparos: ['shot-1'],
          },
        ],
      },
      {
        id: EquipmentMagnitudeTagEnum.VIDEO_C,
        selections: [
          {
            itemId: 'camera-2',
            categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
            magnitude: 'planned-video-c-measure',
            channel: 2,
            series: ['series-1'],
            disparos: ['shot-2'],
          },
        ],
      },
    ]);
    TestBed.tick();

    const putRequest = http.expectOne(
      (request) => request.method === 'PUT' && request.url.includes('/equipment-selection'),
    );
    expect(putRequest.request.body).toEqual([
      {
        measurementGroup: EquipmentMagnitudeTagEnum.VIDEO_AV,
        selections: [
          {
            equipmentItemId: 1,
            equipmentDenominationId: 1,
            categoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
            measureId: 'planned-video-av-measure',
            channel: 1,
            seriesIds: ['series-1'],
            shotIds: ['shot-1'],
          },
        ],
      },
      {
        measurementGroup: EquipmentMagnitudeTagEnum.VIDEO_C,
        selections: [
          {
            equipmentItemId: 2,
            equipmentDenominationId: 2,
            categoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
            measureId: 'planned-video-c-measure',
            channel: 2,
            seriesIds: ['series-1'],
            shotIds: ['shot-2'],
          },
        ],
      },
    ]);
    putRequest.flush(null);
    TestBed.tick();
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

  it('registers and unregisters autonomous widgets excluded from updatedAt refreshes', () => {
    expect(store.isWidgetAutonomous(WidgetId.SEGUIMIENTO)).toBe(true);
    expect(store.isWidgetAutonomous(WidgetId.EXECUTION_PREP_JLT)).toBe(false);

    store.registerAutonomousWidget(WidgetId.EXECUTION_PREP_JLT);
    expect(store.isWidgetAutonomous(WidgetId.EXECUTION_PREP_JLT)).toBe(true);

    store.unregisterAutonomousWidget(WidgetId.EXECUTION_PREP_JLT);
    expect(store.isWidgetAutonomous(WidgetId.EXECUTION_PREP_JLT)).toBe(false);
  });
});

/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { CadenceUnitEnum, MeasureUnitEnum, SpeedUnitEnum } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService, type ShotVelocitiesResponse } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { VelocityIntroduction } from './velocity-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

const ACTIVE_SERIE_ID = 'funcionamiento-1';
const ACTIVE_SHOT_ID = 'shot-3';

describe('VelocityIntroduction', () => {
  const velocityState = signal({
    serie: null as string | null,
    disparo: null as string | null,
    estadoDisparo: 'EN_CURSO' as const,
    radarDoppler: null as string | null,
    antena: null as string | null,
    velocidad: null as number | null,
    velocidadUnit: SpeedUnitEnum.M_S,
    incertidumbreSoftware: null as number | null,
    incertidumbreSoftwareUnit: SpeedUnitEnum.M_S,
    perdida: null as number | null,
    perdidaUnit: SpeedUnitEnum.M_S,
    cadencia: null as number | null,
    cadenciaUnit: CadenceUnitEnum.SPM,
    observaciones: null as string | null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'shot-1', label: 'Disparo 1' },
      { value: 'shot-2', label: 'Disparo 2' },
      { value: 'shot-3', label: 'Disparo 3' },
    ],
    radarDopplerOptions: [
      { value: '1', label: 'W700I_SN8302' },
      { value: '2', label: 'W700I_SN9001' },
    ],
    antenaOptions: [
      { value: '4', label: 'SL520A_SN6124' },
      { value: '5', label: 'SL520A_SN7200' },
    ],
  });

  const activeSerieId = signal<string | null>(ACTIVE_SERIE_ID);
  const activeShotId = signal<string | null>(ACTIVE_SHOT_ID);
  const fireTrialId = signal<string | null>('trial-123');
  const isTrialReadOnly = signal(false);
  const planningSeries = signal([
    { id: 'funcionamiento-1', name: 'Funcionamiento I' },
    { id: 'funcionamiento-2', name: 'Funcionamiento II' },
  ]);
  const executionProgress = signal({
    series: [
      {
        seriesId: 'funcionamiento-1',
        shots: [
          { shotId: 'shot-1', status: 'FIRED' as const, updatedAt: '2026-03-03T10:15:30Z' },
          { shotId: 'shot-2', status: 'FIRED' as const, updatedAt: '2026-03-03T10:16:30Z' },
          { shotId: 'shot-3', status: 'ACTIVE' as const, updatedAt: '2026-03-03T10:17:30Z' },
          { shotId: 'shot-4', status: 'PENDING' as const, updatedAt: '2026-03-03T10:18:30Z' },
        ],
      },
      {
        seriesId: 'funcionamiento-2',
        shots: [{ shotId: 'shot-5', status: 'PENDING' as const, updatedAt: '2026-03-03T10:19:30Z' }],
      },
    ],
  });

  const mockStore = {
    velocityIntroduction: velocityState,
    taradoVelocidadChart: signal({ regression: { pendiente: 0.12 } }),
    planningSeries,
    executionProgress,
    activeSerieId,
    activeShotId,
    fireTrialId,
    isTrialReadOnly,
    updateVelocityIntroduction: (updates: Record<string, unknown>) => {
      velocityState.update((state) => ({ ...state, ...updates }));
    },
  };

  const defaultRemoteResponse: ShotVelocitiesResponse = {
    velocities: [
      {
        radarDopplerId: 1,
        antennaId: 4,
        initialVelocity: 850.5,
        initialVelocityUnit: SpeedUnitEnum.M_S,
        softwareUncertainty: 0.5,
        softwareUncertaintyUnit: SpeedUnitEnum.M_S,
        cadence: 600,
        cadenceUnit: MeasureUnitEnum.SPM,
        velocityLoss: 2.1,
        velocityLossUnit: SpeedUnitEnum.M_S,
        observations: 'Velocidad dentro del rango esperado',
      },
    ],
  };

  const mockExecutionService = {
    fetchShotVelocities: vi.fn((trialId: string, serieId: string, shotId: string) => {
      return Promise.resolve(defaultRemoteResponse);
    }),
    setShotVelocity: vi.fn(),
    loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    velocityState.set({
      serie: null,
      disparo: null,
      estadoDisparo: 'EN_CURSO',
      radarDoppler: null,
      antena: null,
      velocidad: null,
      velocidadUnit: SpeedUnitEnum.M_S,
      incertidumbreSoftware: null,
      incertidumbreSoftwareUnit: SpeedUnitEnum.M_S,
      perdida: null,
      perdidaUnit: SpeedUnitEnum.M_S,
      cadencia: null,
      cadenciaUnit: CadenceUnitEnum.SPM,
      observaciones: null,
      serieOptions: [
        { value: 'funcionamiento-1', label: 'Funcionamiento I' },
        { value: 'funcionamiento-2', label: 'Funcionamiento II' },
      ],
      disparoOptions: [
        { value: 'shot-1', label: 'Disparo 1' },
        { value: 'shot-2', label: 'Disparo 2' },
        { value: 'shot-3', label: 'Disparo 3' },
      ],
      radarDopplerOptions: [
        { value: '1', label: 'W700I_SN8302' },
        { value: '2', label: 'W700I_SN9001' },
      ],
      antenaOptions: [
        { value: '4', label: 'SL520A_SN6124' },
        { value: '5', label: 'SL520A_SN7200' },
      ],
    });

    activeSerieId.set(ACTIVE_SERIE_ID);
    activeShotId.set(ACTIVE_SHOT_ID);
    fireTrialId.set('trial-123');
    isTrialReadOnly.set(false);
  });

  const renderWidget = (widgetId = 'velocity-widget-1') =>
    render(VelocityIntroduction, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        { provide: ExecutionStore, useValue: mockStore },
        { provide: ExecutionService, useValue: mockExecutionService },
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors and initializes widgetId', async () => {
    const { fixture } = await renderWidget('velocity-widget-1');
    expect(fixture.componentInstance.formState().widgetId).toBe('velocity-widget-1');
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('automatically sets selection from store active serie and active shot on init', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    expect(fixture.componentInstance['selectorFormModel']()).toEqual({
      serie: ACTIVE_SERIE_ID,
      disparo: ACTIVE_SHOT_ID,
    });
    expect(mockExecutionService.fetchShotVelocities).toHaveBeenCalledWith(
      'trial-123',
      ACTIVE_SERIE_ID,
      ACTIVE_SHOT_ID,
    );
  });

  it('hydrates form fields from remote shot velocities response', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    expect(fixture.componentInstance['dataFormModel']().radarAntena).toBe('1|4');
    expect(fixture.componentInstance['velocidadField']()).toEqual({
      value: '850.5',
      unit: MeasureUnitEnum.M_S,
    });
    expect(fixture.componentInstance['perdidaField']()).toEqual({
      value: '2.1',
      unit: MeasureUnitEnum.M_S,
    });
    expect(fixture.componentInstance['cadenciaField']()).toEqual({
      value: '600',
      unit: MeasureUnitEnum.SPM,
    });
    expect(fixture.componentInstance['incertidumbreSoftwareDisplay']()).toBe('0.5');
    expect(fixture.componentInstance['observacionesField']()).toBe(
      'Velocidad dentro del rango esperado',
    );
  });

  it('saveForm sends payload to executionService.setShotVelocity and updates snapshot', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    fixture.componentInstance['velocidadField'].set({ value: '860.0', unit: MeasureUnitEnum.M_S });
    fixture.componentInstance['observacionesField'].set('Actualizado con éxito');

    await fixture.componentInstance.saveForm();

    expect(mockExecutionService.setShotVelocity).toHaveBeenCalledWith(
      'trial-123',
      ACTIVE_SERIE_ID,
      ACTIVE_SHOT_ID,
      [
        expect.objectContaining({
          radarDopplerId: 1,
          antennaId: 4,
          initialVelocity: 860,
          initialVelocityUnit: MeasureUnitEnum.M_S,
          observations: 'Actualizado con éxito',
        }),
      ],
    );
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('resetForm restores values from store', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    fixture.componentInstance['observacionesField'].set('Texto modificado');
    expect(fixture.componentInstance.formState().dirty).toBe(true);

    fixture.componentInstance.resetForm();

    expect(fixture.componentInstance['observacionesField']()).toBe(
      'Velocidad dentro del rango esperado',
    );
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('enables historical editing for fired shots', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    // Select fired shot-1
    fixture.componentInstance.onDisparoSelected('shot-1');
    await fixture.whenStable();

    expect(fixture.componentInstance['isHistoricalFiredShot']()).toBe(true);
    expect(fixture.componentInstance['readOnly']()).toBe(true);
    expect(fixture.componentInstance['canEnableHistoricalEdit']()).toBe(true);

    fixture.componentInstance.enableHistoricalEdit();
    expect(fixture.componentInstance['readOnly']()).toBe(false);
  });

  it('setCurrentShot resets selection to active shot', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    fixture.componentInstance.onDisparoSelected('shot-1');
    expect(fixture.componentInstance['selectorFormModel']().disparo).toBe('shot-1');

    fixture.componentInstance.setCurrentShot();
    expect(fixture.componentInstance['selectorFormModel']().disparo).toBe(ACTIVE_SHOT_ID);
  });
});

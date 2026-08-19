/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { JltShotData } from './jlt-shot-data';

const ACTIVE_SERIE_ID = 'funcionamiento-1';
const ACTIVE_SHOT_ID = 'shot-3';
const LAST_SHOT_ID = 'shot-4';

const currentShotResponse = {
  jet: 'JET-CURRENT',
  pieceOperator: 'OP-CURRENT',
  attackDistance: 25,
  attackDistanceUnit: 'MM',
  recoilDistance: 14,
  recoilDistanceUnit: 'MM',
  observations: 'Current shot',
};

const previousFiredShotResponse = {
  jltData: {
    jet: 'JET-FIRED',
    pieceOperator: 'OP-FIRED',
    attackDistance: 18,
    attackDistanceUnit: 'MM',
    recoilDistance: 11,
    recoilDistanceUnit: 'MM',
    observations: 'Historical fired shot',
  },
};

const lastShotResponse = {
  jltData: {
    jet: 'JET-LAST',
    pieceOperator: 'OP-LAST',
    attackDistance: 30,
    attackDistanceUnit: 'MM',
    recoilDistance: 15,
    recoilDistanceUnit: 'MM',
    observations: 'Last shot',
  },
};

const shotResponses: Record<string, typeof currentShotResponse | typeof lastShotResponse> = {
  [`${ACTIVE_SERIE_ID}|shot-1`]: previousFiredShotResponse,
  [`${ACTIVE_SERIE_ID}|shot-3`]: currentShotResponse,
  [`${ACTIVE_SERIE_ID}|shot-4`]: lastShotResponse,
};

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  registerWidgetInstance: () => {},
  unregisterWidgetInstance: () => {},
  placedWidgets: () => [],
};

describe('JltShotData', () => {
  const jltShotDataState = signal({
    serie: null as string | null,
    disparo: null as string | null,
    estadoDisparo: 'EN_CURSO' as 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null,
    jet: null as string | null,
    operadorPieza: null as string | null,
    equipoAtacado: null as string | null,
    atacado: null as number | null,
    equipoRetroceso: null as string | null,
    retroceso: null as number | null,
    observaciones: null as string | null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'shot-1', label: 'Disparo 1' },
      { value: 'shot-2', label: 'Disparo 2' },
      { value: 'shot-3', label: 'Disparo 3' },
      { value: 'shot-4', label: 'Disparo 4' },
    ],
    equipoAtacadoOptions: [
      { value: 'eq-atac-01', label: 'Equipo Atacado 01' },
      { value: 'eq-atac-02', label: 'Equipo Atacado 02' },
    ],
    equipoRetrocesoOptions: [
      { value: 'eq-retro-01', label: 'Equipo Retroceso 01', family: 'dimensional' },
      { value: 'eq-retro-02', label: 'Equipo Retroceso 02', family: 'length' },
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
    jltShotData: jltShotDataState,
    planningSeries,
    executionProgress,
    activeSerieId,
    activeShotId,
    fireTrialId,
    isTrialReadOnly,
    updateJltShotData: (updates: Record<string, unknown>) => {
      jltShotDataState.update((state) => ({ ...state, ...updates }));
    },
  };

  const mockExecutionService = {
    fetchJltShotData: vi.fn((trialId: string, serieId: string, shotId: string) => {
      if (trialId !== 'trial-123') {
        throw new Error(`Unexpected trial id: ${trialId}`);
      }

      return Promise.resolve(shotResponses[`${serieId}|${shotId}`] ?? currentShotResponse);
    }),
    setJltShotData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    jltShotDataState.set({
      serie: null,
      disparo: null,
      estadoDisparo: 'EN_CURSO',
      jet: null,
      operadorPieza: null,
      equipoAtacado: null,
      atacado: null,
      equipoRetroceso: null,
      retroceso: null,
      observaciones: null,
      serieOptions: [
        { value: 'funcionamiento-1', label: 'Funcionamiento I' },
        { value: 'funcionamiento-2', label: 'Funcionamiento II' },
      ],
      disparoOptions: [
        { value: 'shot-1', label: 'Disparo 1' },
        { value: 'shot-2', label: 'Disparo 2' },
        { value: 'shot-3', label: 'Disparo 3' },
        { value: 'shot-4', label: 'Disparo 4' },
      ],
      equipoAtacadoOptions: [
        { value: 'eq-atac-01', label: 'Equipo Atacado 01' },
        { value: 'eq-atac-02', label: 'Equipo Atacado 02' },
      ],
      equipoRetrocesoOptions: [
        { value: 'eq-retro-01', label: 'Equipo Retroceso 01', family: 'dimensional' },
        { value: 'eq-retro-02', label: 'Equipo Retroceso 02', family: 'length' },
      ],
    });
    activeSerieId.set(ACTIVE_SERIE_ID);
    activeShotId.set(ACTIVE_SHOT_ID);
    fireTrialId.set('trial-123');
    isTrialReadOnly.set(false);
  });

  const renderWidget = (widgetId = 'test-widget') =>
    render(JltShotData, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        { provide: ExecutionStore, useValue: mockStore },
        { provide: ExecutionService, useValue: mockExecutionService },
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('starts clean and loads current shot plus last shot defaults', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    expect(mockExecutionService.fetchJltShotData).toHaveBeenNthCalledWith(
      1,
      'trial-123',
      ACTIVE_SERIE_ID,
      ACTIVE_SHOT_ID,
    );
    expect(mockExecutionService.fetchJltShotData).toHaveBeenNthCalledWith(
      2,
      'trial-123',
      ACTIVE_SERIE_ID,
      LAST_SHOT_ID,
    );
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('loads current shot when execution state arrives after widget mounts', async () => {
    activeSerieId.set(null);
    activeShotId.set(null);

    const { fixture } = await renderWidget();
    await fixture.whenStable();
    expect(mockExecutionService.fetchJltShotData).not.toHaveBeenCalled();

    activeSerieId.set(ACTIVE_SERIE_ID);
    activeShotId.set(ACTIVE_SHOT_ID);
    await fixture.whenStable();

    expect(mockExecutionService.fetchJltShotData).toHaveBeenNthCalledWith(
      1,
      'trial-123',
      ACTIVE_SERIE_ID,
      ACTIVE_SHOT_ID,
    );
  });

  it('reloads JLT data when execution state changes active shot', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    activeShotId.set('shot-1');
    await fixture.whenStable();

    expect(mockExecutionService.fetchJltShotData).toHaveBeenCalledWith('trial-123', ACTIVE_SERIE_ID, 'shot-1');
  });

  it('uses last shot jet and piece operator as defaults over current shot values', async () => {
    mockExecutionService.fetchJltShotData.mockImplementation((_t: string, _s: string, shotId: string) => {
      if (shotId === ACTIVE_SHOT_ID) {
        return Promise.resolve({
          ...currentShotResponse,
          jet: null,
          pieceOperator: null,
        } as unknown as typeof currentShotResponse);
      }
      return Promise.resolve(lastShotResponse);
    });

    const { fixture } = await renderWidget();
    await fixture.whenStable();

    expect(fixture.componentInstance['jetDisplayValue']()).toBe('JET-LAST');
    expect(fixture.componentInstance['operadorPiezaDisplayValue']()).toBe('OP-LAST');
  });

  it('hydrates fields from flat JLT API response', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    expect(fixture.componentInstance['jetField']()).toBe('JET-CURRENT');
    expect(fixture.componentInstance['observacionesField']()).toBe('Current shot');
    expect(fixture.componentInstance['atacadoField']()).toEqual({ value: '25', unit: 'MM' });
    expect(fixture.componentInstance['retrocesoField']()).toEqual({ value: '14', unit: 'MM' });
  });

  it('saveForm persists current selection to store only', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    await fixture.componentInstance.saveForm();

    expect(mockExecutionService.setJltShotData).not.toHaveBeenCalled();
    expect(TestBed.inject(ExecutionStore).jltShotData().disparo).toBe(ACTIVE_SHOT_ID);
  });

  it('resetForm restores values from store', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    TestBed.inject(ExecutionStore).updateJltShotData({
      serie: 'funcionamiento-2',
      disparo: 'shot-5',
      equipoAtacado: 'eq-atac-02',
      equipoRetroceso: 'eq-retro-02',
      jet: 'JET-STORE',
      operadorPieza: 'OP-STORE',
      observaciones: 'Store value',
      atacado: 50,
      retroceso: 12,
    });

    fixture.componentInstance.resetForm();

    expect(fixture.componentInstance['formModel']().serie).toBe('funcionamiento-2');
    expect(fixture.componentInstance['formModel']().equipoAtacado).toBe('eq-atac-02');
    expect(fixture.componentInstance['jetField']()).toBe('JET-STORE');
  });

  it('setCurrentShot updates serie and disparo from active store values', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    activeSerieId.set('funcionamiento-2');
    activeShotId.set('shot-5');
    fixture.componentInstance.setCurrentShot();
    await fixture.whenStable();

    const formValue = fixture.componentInstance['formModel']();
    expect(formValue.serie).toBe('funcionamiento-2');
    expect(formValue.disparo).toBe('shot-5');
  });

  it('keeps future shots read only', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    fixture.componentInstance.onDisparoSelected('shot-4');
    await fixture.whenStable();

    expect(fixture.componentInstance['isFutureShot']()).toBe(true);
    expect(fixture.componentInstance['readOnly']()).toBe(true);
  });

  it('shows historical edit action for fired non current shots and unlocks after click', async () => {
    const { fixture } = await renderWidget();
    await fixture.whenStable();

    fixture.componentInstance.onDisparoSelected('shot-1');
    await fixture.whenStable();

    expect(fixture.componentInstance['isHistoricalFiredShot']()).toBe(true);
    expect(fixture.componentInstance['canEnableHistoricalEdit']()).toBe(true);
    expect(fixture.componentInstance['readOnly']()).toBe(true);

    fixture.componentInstance.enableHistoricalEdit();

    expect(fixture.componentInstance['readOnly']()).toBe(false);
  });

  it('renders filter selectors and current shot action', async () => {
    await renderWidget();
    expect(screen.getByRole('heading', { name: /JLT_SHOT_DATA\.TITLE/ })).toBeInTheDocument();
    expect(document.querySelectorAll('button[mat-flat-button]').length).toBeGreaterThanOrEqual(1);
  });
});

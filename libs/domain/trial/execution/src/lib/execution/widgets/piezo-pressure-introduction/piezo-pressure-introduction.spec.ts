import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { EquipmentMeasurementGroupEnum, EquipmentTypeEnum } from '../../models';
import { WidgetStateService } from '../../services/widget-state.service';
import { injectInitialPiezoPressureEquipments } from './inject-initial-piezo-pressure-equipments';
import { PiezoPressureIntroduction } from './piezo-pressure-introduction';
import {
  buildPiezoEquipmentCombinedValue,
  equipmentStringToId,
  matchesEquipmentId,
  splitPiezoEquipmentCombinedValue,
} from './piezo-pressure-introduction.mapper';

const mockWidgetStateService = {
  updateWidgetFormState: vi.fn(),
  addWidget: vi.fn(),
  placedWidgets: () => [],
};

describe('PiezoPressureIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget', extraProviders: Provider[] = []) =>
    render(PiezoPressureIntroduction, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
        ...extraProviders,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors and contains tab buttons and ui-input-select components', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
    // 6 tabs in header
    const tabButtons = document.querySelectorAll('button[type="button"]');
    expect(tabButtons.length).toBeGreaterThanOrEqual(6);
    expect(document.querySelectorAll('ui-input-select').length).toBeGreaterThanOrEqual(1);
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.piezoPressureIntroduction()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).piezoPressureIntroduction();
    expect(fixture.componentInstance['piezoPressures']()).toEqual(stored.piezoPressures);
  });

  it('widgetId is set correctly', async () => {
    const { fixture } = await renderWidget('my-piezo-widget');
    expect(fixture.componentInstance.formState().widgetId).toBe('my-piezo-widget');
  });

  it('changing serie or disparo does NOT mark form as dirty', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.onSerieSelected('funcionamiento-2');
    fixture.componentInstance.onDisparoSelected('disparo-2');
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().touched).toBe(false);
  });

  it('patches form with API response containing data', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['applyRemoteShotData']?.({
      timesData: {
        actionTime: 4.5,
        actionTimeUnit: 'MS',
        delayTime: 1.2,
        delayTimeUnit: 'MS',
        observations: 'Tiempos registrados manualmente.',
      },
      piezoPressures: [
        {
          position: 'CLOSING',
          piezoelectricSensorId: 12,
          amplifierId: 15,
          dataAcquisitionSystemId: 20,
          maxPressure: 3200.5,
          maxPressureUnit: 'BAR',
          observations: 'Sin incidencias.',
        },
        {
          position: 'HALF',
          piezoelectricSensorId: 13,
          amplifierId: 16,
          dataAcquisitionSystemId: 21,
          maxPressure: 2800,
          maxPressureUnit: 'BAR',
        },
        {
          position: 'SHELL',
          piezoelectricSensorId: 14,
          amplifierId: 17,
          dataAcquisitionSystemId: 22,
          maxPressure: 2500.75,
          maxPressureUnit: 'BAR',
        },
        {
          position: 'OTHER',
          piezoelectricSensorId: 18,
          amplifierId: 19,
          dataAcquisitionSystemId: 23,
          maxPressure: 2400.4,
          maxPressureUnit: 'BAR',
        },
      ],
      differentialPressureData: {
        positiveDifferentialPressure: 120.5,
        positiveDifferentialPressureUnit: 'BAR',
        negativeDifferentialPressure: -35.2,
        negativeDifferentialPressureUnit: 'BAR',
      },
    });

    const cierre = fixture.componentInstance['cierreItem']();
    expect(cierre.piezoelectricSensorId).toBe(12);
    expect(cierre.amplifierId).toBe(15);
    expect(cierre.dataAcquisitionSystemId).toBe(20);
    expect(cierre.maxPressure).toBe(3200.5);
    expect(cierre.maxPressureUnit).toBe('BAR');

    const differential = fixture.componentInstance['differentialPressureData']();
    expect(differential.positiveDifferentialPressure).toBe(120.5);
    expect(differential.negativeDifferentialPressure).toBe(-35.2);

    const times = fixture.componentInstance['timesData']();
    expect(times.actionTime).toBe(4.5);
    expect(times.delayTime).toBe(1.2);

    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('switches tabs properly and updates local models', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['activeTab']()).toBe('cierre');

    fixture.componentInstance['activeTab'].set('diferencial');
    expect(fixture.componentInstance['activeTab']()).toBe('diferencial');

    fixture.componentInstance['activeTab'].set('tiempos');
    expect(fixture.componentInstance['activeTab']()).toBe('tiempos');

    fixture.componentInstance.onTimesModelChange({
      actionTime: 10,
      actionTimeUnit: 'MS',
      delayTime: 5,
      delayTimeUnit: 'MS',
      observations: 'Updated times',
    });

    expect(fixture.componentInstance['timesData']().actionTime).toBe(10);
    expect(fixture.componentInstance.formState().dirty).toBe(true);
  });

  it('refreshes data by fetching shot pressures when changing serie', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);

    store.setFireTrialId('trial-123');

    const mockResponse = {
      timesData: { actionTime: 7.8, actionTimeUnit: 'MS', delayTime: 2.1, delayTimeUnit: 'MS', observations: null },
      piezoPressures: [
        {
          position: 'CLOSING',
          piezoelectricSensorId: 99,
          amplifierId: 88,
          dataAcquisitionSystemId: 77,
          maxPressure: 1500,
          maxPressureUnit: 'BAR',
          observations: null,
        },
      ],
      differentialPressureData: {
        positiveDifferentialPressure: 50,
        positiveDifferentialPressureUnit: 'BAR',
        negativeDifferentialPressure: -20,
        negativeDifferentialPressureUnit: 'BAR',
        observations: null,
      },
    };

    const fetchSpy = vi.spyOn(execService, 'fetchShotPressures').mockResolvedValue(mockResponse as never);

    fixture.componentInstance.onSerieSelected('funcionamiento-2');

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('trial-123', 'funcionamiento-2', 'disparo-1');
    });

    await vi.waitFor(() => {
      expect(fixture.componentInstance['cierreItem']().piezoelectricSensorId).toBe(99);
      expect(fixture.componentInstance['timesData']().actionTime).toBe(7.8);
    });
  });

  it('builds combined equipment options for active serie and shot from equipment selector resource', async () => {
    vi.spyOn(ExecutionService.prototype, 'loadEquipmentItemsByCategories').mockResolvedValue({
      [EquipmentTypeEnum.PIEZOELECTRIC_SENSOR]: [{ id: '1', label: 'Sensor Kistler 6215' }],
      [EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM]: [{ id: '2', label: 'Registrador Yokogawa DL850' }],
      [EquipmentTypeEnum.AMPLIFIER]: [{ id: '3', label: 'Amplificador Kistler 5018' }],
    });

    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    Object.defineProperty(execService, 'equipmentSelectorResource', {
      value: {
        hasValue: () => true,
        value: () => [
          {
            measurementGroup: EquipmentMeasurementGroupEnum.PIEZOELECTRIC_PRESSURE,
            selections: [
              {
                equipmentItemId: 1,
                categoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
                seriesIds: ['funcionamiento-1'],
                shotIds: ['disparo-1'],
              },
              {
                equipmentItemId: 2,
                categoryId: EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM,
                seriesIds: ['funcionamiento-1'],
                shotIds: ['disparo-1'],
              },
              {
                equipmentItemId: 3,
                categoryId: EquipmentTypeEnum.AMPLIFIER,
                seriesIds: ['funcionamiento-1'],
                shotIds: ['disparo-1'],
              },
            ],
          },
        ],
      },
      configurable: true,
      writable: true,
    });

    await fixture.whenStable();
    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-1');
    await fixture.whenStable();

    const options = fixture.componentInstance['piezoEquipmentOptions']();
    expect(options).toEqual([
      {
        value: '1|2|3',
        label: 'Sensor Kistler 6215 / Registrador Yokogawa DL850 / Amplificador Kistler 5018',
      },
    ]);
  });

  it('returns empty piezoEquipmentOptions when equipmentSelector has no selections for PIEZOELECTRIC_PRESSURE', async () => {
    const { fixture } = await renderWidget('piezo-empty-equipments');
    const executionService = TestBed.inject(ExecutionService);

    Object.defineProperty(executionService, 'equipmentSelectorResource', {
      value: {
        hasValue: () => true,
        value: () => [],
      },
      configurable: true,
      writable: true,
    });

    await fixture.whenStable();
    fixture.componentInstance.onSerieSelected('funcionamiento-1');
    fixture.componentInstance.onDisparoSelected('disparo-1');
    await fixture.whenStable();

    const options = fixture.componentInstance['piezoEquipmentOptions']();
    expect(options).toEqual([]);
  });

  it('injectInitialPiezoPressureEquipments extracts selections from resource', () => {
    const mockExecutionService = {
      equipmentSelectorResource: {
        hasValue: () => true,
        value: () => [
          {
            measurementGroup: EquipmentMeasurementGroupEnum.PIEZOELECTRIC_PRESSURE,
            selections: [
              {
                equipmentItemId: 42,
                categoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
              },
            ],
          },
        ],
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ExecutionService, useValue: mockExecutionService }],
    });

    const selections = TestBed.runInInjectionContext(() => injectInitialPiezoPressureEquipments());
    expect(selections()).toEqual([
      {
        equipmentItemId: 42,
        categoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
      },
    ]);
  });

  it('builds and splits combined piezo equipment values properly', () => {
    expect(buildPiezoEquipmentCombinedValue(10, 20, 30)).toBe('10|20|30');
    expect(splitPiezoEquipmentCombinedValue('10|20|30')).toEqual({
      captadorId: '10',
      registradorId: '20',
      amplificadorId: '30',
    });
    expect(buildPiezoEquipmentCombinedValue(null, 20, 30)).toBeNull();
    expect(buildPiezoEquipmentCombinedValue(10, undefined, 30)).toBeNull();
    expect(buildPiezoEquipmentCombinedValue(10, 20, '')).toBeNull();
    expect(splitPiezoEquipmentCombinedValue(null)).toEqual({
      captadorId: null,
      registradorId: null,
      amplificadorId: null,
    });
    expect(splitPiezoEquipmentCombinedValue('invalid-val')).toEqual({
      captadorId: null,
      registradorId: null,
      amplificadorId: null,
    });
  });

  it('updates sensor tab model when combo selection changes', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.onSensorModelChange('CLOSING', {
      position: 'CLOSING',
      piezoelectricSensorId: 10,
      dataAcquisitionSystemId: 20,
      amplifierId: 30,
      maxPressure: 1200,
      maxPressureUnit: 'BAR',
      observations: null,
    });

    const cierre = fixture.componentInstance['cierreItem']();
    expect(cierre.piezoelectricSensorId).toBe(10);
    expect(cierre.dataAcquisitionSystemId).toBe(20);
    expect(cierre.amplifierId).toBe(30);
  });

  it('matches equipment IDs directly or by numeric suffix', () => {
    const idSet = new Set(['1', '2']);
    expect(matchesEquipmentId(idSet, '1')).toBe(true);
    expect(matchesEquipmentId(idSet, 'meas-pe-001')).toBe(true);
    expect(matchesEquipmentId(idSet, 'meas-pe-002')).toBe(true);
    expect(matchesEquipmentId(idSet, 'meas-pe-003')).toBe(false);
    expect(matchesEquipmentId(idSet, 'other')).toBe(false);
  });

  it('parses direct numbers and equipment item strings to numeric ID', () => {
    expect(equipmentStringToId('1')).toBe(1);
    expect(equipmentStringToId('meas-pe-001')).toBe(1);
    expect(equipmentStringToId('meas-daq-002')).toBe(2);
    expect(equipmentStringToId(null)).toBeNull();
    expect(equipmentStringToId('')).toBeNull();
    expect(equipmentStringToId('no-digits')).toBeNull();
  });
});

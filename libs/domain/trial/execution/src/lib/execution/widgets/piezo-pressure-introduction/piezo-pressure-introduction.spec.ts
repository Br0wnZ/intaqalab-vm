/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { PiezoPressureIntroduction } from './piezo-pressure-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('PiezoPressureIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(PiezoPressureIntroduction, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
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
});

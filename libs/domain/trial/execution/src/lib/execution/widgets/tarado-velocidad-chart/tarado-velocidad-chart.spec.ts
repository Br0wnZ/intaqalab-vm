/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, waitFor } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { TaradoVelocidadChartWidget } from './tarado-velocidad-chart';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('TaradoVelocidadChartWidget', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(TaradoVelocidadChartWidget, {
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

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('loads configurations on startup and waits for nominal speed before calculation', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const httpMock = TestBed.inject(HttpTestingController);

    store.setFireTrialId('trial-widget');
    store.setOptimisticActiveShot('series-widget', 'shot-widget');
    fixture.detectChanges();
    TestBed.tick();

    const conditionsRequest = httpMock.expectOne((request) => request.url.endsWith('/planning/conditions'));
    conditionsRequest.flush({
      units: { nominalSpeed: 'M_S' },
      series: [
        {
          seriesId: 'series-widget',
          shots: [
            { shotId: 'shot-widget', nominalSpeed: 850 },
            { shotId: 'other-shot', nominalSpeed: 780 },
            { shotId: 'duplicate-shot', nominalSpeed: 850 },
            { shotId: 'zero-shot', nominalSpeed: 0 },
          ],
        },
      ],
    });

    const planningRequest = httpMock.expectOne((request) => request.url.endsWith('/planning/series'));
    planningRequest.flush([
      {
        id: 'series-widget',
        name: 'Series A',
        shots: [
          { id: 'shot-widget', globalNumber: 7 },
          { id: 'other-shot', globalNumber: 8 },
        ],
      },
    ]);
    await waitFor(() => {
      fixture.detectChanges();
      TestBed.tick();
      expect(store.planningSeries()).toHaveLength(1);
    });

    const configurationsRequest = httpMock.expectOne((request) =>
      request.url.endsWith('/propellant-charge-adjustment/configurations'),
    );
    const adjustmentRequest = httpMock.expectOne(
      (request) =>
        request.url.endsWith('/propellant-charge-adjustment') &&
        request.params.getAll('shotIds')?.join(',') === 'shot-widget',
    );
    expect(configurationsRequest.request.method).toBe('GET');
    expect(adjustmentRequest.request.method).toBe('GET');
    expect(adjustmentRequest.request.params.get('nominalSpeed')).toBe('850');
    expect(store.taradoVelocidadChart().selectedSerie).toEqual(['series-widget']);
    expect(store.taradoVelocidadChart().selectedDisparo).toEqual(['shot-widget']);
    expect(store.taradoVelocidadChart().selectedVelocidadNominal).toBe('');
    expect(store.taradoVelocidadChartView().velocidadNominalOptions).toEqual([
      { value: '0', label: '0 m/s' },
      { value: '780', label: '780 m/s' },
      { value: '850', label: '850 m/s' },
    ]);
    configurationsRequest.flush([]);
    adjustmentRequest.flush({ points: [] });
    expect(store.taradoVelocidadChartView().dataPoints).toEqual([]);
    expect(store.taradoVelocidadChartView().regression).toBeNull();

    fixture.componentInstance['formModel'].update((current) => ({
      ...current,
      selectedDisparo: ['other-shot'],
    }));
    fixture.detectChanges();
    TestBed.tick();
    const shotChangeRequest = httpMock.expectOne((request) => request.url.endsWith('/propellant-charge-adjustment'));
    expect(shotChangeRequest.request.params.getAll('shotIds')).toEqual(['other-shot']);
    expect(shotChangeRequest.request.params.get('nominalSpeed')).toBe('780');
    shotChangeRequest.flush({ points: [] });

    fixture.componentInstance['formModel'].update((current) => ({
      ...current,
      selectedVelocidadNominal: '850',
    }));
    fixture.detectChanges();
    TestBed.tick();
    const speedChangeRequest = httpMock.expectOne((request) => request.url.endsWith('/propellant-charge-adjustment'));
    expect(speedChangeRequest.request.params.getAll('shotIds')).toEqual(['other-shot']);
    expect(speedChangeRequest.request.params.get('nominalSpeed')).toBe('850');
    speedChangeRequest.flush({ points: [] });
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('saveForm persists selections to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.taradoVelocidadChart()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    // Modify form and then reset
    fixture.componentInstance['formModel'].set({
      selectedSerie: 'Alta Z1',
      selectedDisparo: '6',
      selectedVelocidadNominal: '',
      selectedConfiguracion: null,
    });
    fixture.componentInstance.resetForm();
    const stored = store.taradoVelocidadChart();
    expect(fixture.componentInstance['formModel']().selectedSerie).toBe(stored.selectedSerie);
  });
});

/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { SpeedUnitEnum, WeightUnitEnum } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { InformacionTaradoWidget } from './informacion-tarado';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

// jsdom no implementa Element.scrollTo; stub para el carrusel de tarjetas
Element.prototype.scrollTo = Element.prototype.scrollTo ?? (() => {});

describe('InformacionTaradoWidget', () => {
  const renderWidget = (widgetId = 'test-informacion-tarado') =>
    render(InformacionTaradoWidget, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionService,
        ExecutionStore,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-informacion-tarado');
  });

  it('saveForm persists velocidadUnit to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.informacionTarado()).toBeDefined();
    expect(store.informacionTarado().velocidadUnit).toBeDefined();
  });

  it('resetForm restores velocidadUnit from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance['formModel'].set({ velocidadUnit: 'fps' });
    fixture.componentInstance.resetForm();
    expect(fixture.componentInstance['formModel']().velocidadUnit).toBe(store.informacionTarado().velocidadUnit);
  });

  it('seriesData returns series from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const series = fixture.componentInstance['seriesData']();
    expect(series).toEqual(store.informacionTarado().series);
    expect(series.length).toBeGreaterThan(0);
  });

  it('scrollToCard updates currentDotIndex', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['currentDotIndex']()).toBe(0);
    fixture.componentInstance['scrollToCard'](2);
    expect(fixture.componentInstance['currentDotIndex']()).toBe(2);
  });

  it('loads and maps propelling charge parameters and updates the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const executionService = TestBed.inject(ExecutionService);

    const mockResponse = {
      series: [
        {
          seriesId: 's-tarado-1',
          seriesNumber: 1,
          seriesName: 'Tarado Serie 1 Test',
          loadingZone: 'Z1',
          nominalSpeed: 800,
          nominalSpeedUnit: SpeedUnitEnum.M_S,
          maximumSpeedDeviation: 10,
          maximumSpeedDeviationUnit: SpeedUnitEnum.M_S,
          powderWeight: 3.5,
          powderWeightUnit: WeightUnitEnum.KG,
          observations: 'Test observation',
        },
      ],
    };

    vi.spyOn(executionService, 'fetchPropellingChargeParameters').mockResolvedValue(mockResponse);

    await fixture.componentInstance.loadPropellingChargeParameters('test-trial-123');

    const series = store.informacionTarado().series;
    expect(series).toHaveLength(1);
    expect(series[0].numero).toBe('S1');
    expect(series[0].nombre).toBe('Tarado Serie 1 Test');
    expect(series[0].zona).toBe('Z1');
    expect(series[0].velocidadNominal).toBe(800);
    expect(series[0].desviacionVelocidadMax).toBe(10);
    expect(series[0].pesoPolvora).toBe(3500);
  });

  it('keeps existing series when fetchPropellingChargeParameters fails', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const executionService = TestBed.inject(ExecutionService);

    const initialSeries = [...store.informacionTarado().series];

    vi.spyOn(executionService, 'fetchPropellingChargeParameters').mockRejectedValue(new Error('Network error'));

    await fixture.componentInstance.loadPropellingChargeParameters('test-trial-123');

    expect(store.informacionTarado().series).toEqual(initialSeries);
  });
});

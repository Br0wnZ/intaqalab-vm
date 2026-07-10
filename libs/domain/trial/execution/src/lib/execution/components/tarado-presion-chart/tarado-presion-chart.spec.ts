/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { TaradoPresionChartWidget } from './tarado-presion-chart';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('TaradoPresionChartWidget', () => {
  const renderWidget = (widgetId = 'test-tarado-presion') =>
    render(TaradoPresionChartWidget, {
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

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-tarado-presion');
  });

  it('saveForm persists selections to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.taradoPresionChart()).toBeDefined();
    expect(store.taradoPresionChart().selectedSerie).toBeNull();
    expect(store.taradoPresionChart().selectedDisparo).toBeNull();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance['formModel'].set({ selectedSerie: ['Baja Z1'], selectedDisparo: ['3'] });
    fixture.componentInstance.resetForm();
    const stored = store.taradoPresionChart();
    expect(fixture.componentInstance['formModel']().selectedSerie).toEqual(stored.selectedSerie);
    expect(fixture.componentInstance['formModel']().selectedDisparo).toEqual(stored.selectedDisparo);
  });

  it('chartConfig returns a valid scatter configuration', async () => {
    const { fixture } = await renderWidget();
    const config = fixture.componentInstance['chartConfig']();
    expect(config.type).toBe('scatter');
    expect(config.data.datasets.length).toBe(3);
  });

  it('regression data is available from the store', async () => {
    const { fixture } = await renderWidget();
    const reg = fixture.componentInstance['regression']();
    expect(reg).not.toBeNull();
    expect(reg!.pendiente).toBeGreaterThan(0);
  });

  it('r2 is computed from correlacion', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const correlacion = store.taradoPresionChart().regression?.correlacion ?? 0;
    expect(fixture.componentInstance['r2']()).toBeCloseTo(correlacion * correlacion, 4);
  });
});

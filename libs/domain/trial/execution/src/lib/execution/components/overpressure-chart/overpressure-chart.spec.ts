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
import { OverpressureChartWidget } from './overpressure-chart';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('OverpressureChartWidget', () => {
  const renderWidget = (widgetId = 'test-overpressure-chart') =>
    render(OverpressureChartWidget, {
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
    expect(fixture.componentInstance.formState().widgetId).toBe('test-overpressure-chart');
  });

  it('saveForm persists selectedSerie to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.overpressureChart()).toBeDefined();
    expect(store.overpressureChart().selectedSerie).toBeNull();
  });

  it('resetForm restores selectedSerie from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance['formModel'].set({ selectedSerie: ['Serie A'] });
    fixture.componentInstance.resetForm();
    const stored = store.overpressureChart();
    expect(fixture.componentInstance['formModel']().selectedSerie).toEqual(stored.selectedSerie);
  });

  it('chartConfig returns a valid scatter configuration', async () => {
    const { fixture } = await renderWidget();
    const config = fixture.componentInstance['chartConfig']();
    expect(config.type).toBe('scatter');
    expect(config.data.datasets.length).toBeGreaterThan(0);
  });

  it('chartConfig contains constant lines for presionSeguridad and presionMaxima', async () => {
    const { fixture } = await renderWidget();
    const config = fixture.componentInstance['chartConfig']();
    const labels = config.data.datasets.map((d) => d.label);
    expect(labels).toContain('Pres. Seguridad');
    expect(labels).toContain('Presión máxima');
    expect(labels).toContain('Presión mínima');
    expect(labels).toContain('Recta presión');
  });

  it('serieOptions are loaded from the store', async () => {
    const { fixture } = await renderWidget();
    const options = fixture.componentInstance['serieOptions']();
    expect(options.length).toBeGreaterThan(0);
  });
});

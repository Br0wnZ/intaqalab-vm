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
import { UniformidadChartWidget } from './uniformidad-chart';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('UniformidadChartWidget', () => {
  const renderWidget = (widgetId = 'test-uniformidad') =>
    render(UniformidadChartWidget, {
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
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-uniformidad');
  });

  it('saveForm persists selections to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.uniformidadChart()).toBeDefined();
    expect(store.uniformidadChart().selectedConfig).toBeNull();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance['formModel'].set({
      selectedConfig: null,
      selectedSerie: null,
      selectedDisparo: ['3', '4'],
    });
    fixture.componentInstance.resetForm();
    const stored = store.uniformidadChart();
    expect(fixture.componentInstance['formModel']().selectedConfig).toBe(stored.selectedConfig);
    expect(fixture.componentInstance['formModel']().selectedSerie).toBe(stored.selectedSerie);
  });

  it('does not show calculated statistics before API response arrives', async () => {
    const { fixture } = await renderWidget();
    const media = fixture.componentInstance['velocidadMedia']();
    expect(media).toBeNull();
    expect(fixture.componentInstance['desviacion']()).toBeNull();
  });

  it('chartConfig returns a valid mixed scatter/line configuration', async () => {
    const { fixture } = await renderWidget();
    const config = fixture.componentInstance['chartConfig']();
    expect(config.type).toBe('scatter');
    expect(config.data.datasets.length).toBe(4);
  });

  it('selectedConfigData stays empty until saved configurations arrive', async () => {
    const { fixture } = await renderWidget();
    const cfg = fixture.componentInstance['selectedConfigData']();
    expect(cfg).toBeNull();
  });
});

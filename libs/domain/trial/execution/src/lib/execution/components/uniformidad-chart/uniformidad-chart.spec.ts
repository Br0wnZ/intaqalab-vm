import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideTestingEnvironment } from '@intaqalab/config';
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
    expect(store.uniformidadChart().selectedConfig).toBe('tarado-z1');
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

  it('velocidadMedia computes mean from filtered points', async () => {
    const { fixture } = await renderWidget();
    const media = fixture.componentInstance['velocidadMedia']();
    expect(media).not.toBeNull();
    expect(media!).toBeGreaterThan(0);
  });

  it('desviacion computes std dev from filtered points', async () => {
    const { fixture } = await renderWidget();
    const desv = fixture.componentInstance['desviacion']();
    expect(desv).not.toBeNull();
    expect(desv!).toBeGreaterThanOrEqual(0);
  });

  it('chartConfig returns a valid mixed scatter/line configuration', async () => {
    const { fixture } = await renderWidget();
    const config = fixture.componentInstance['chartConfig']();
    expect(config.type).toBe('scatter');
    expect(config.data.datasets.length).toBe(4);
  });

  it('selectedConfigData returns the matching config', async () => {
    const { fixture } = await renderWidget();
    const cfg = fixture.componentInstance['selectedConfigData']();
    expect(cfg).not.toBeNull();
    expect(cfg!.id).toBe('tarado-z1');
    expect(cfg!.velocidadNominal).toBe(260);
  });
});

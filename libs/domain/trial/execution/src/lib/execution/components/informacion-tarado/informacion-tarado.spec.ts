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
import { InformacionTaradoWidget } from './informacion-tarado';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

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
});

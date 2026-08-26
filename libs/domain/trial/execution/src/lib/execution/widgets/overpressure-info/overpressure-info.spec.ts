/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { OverpressureInfoWidget } from './overpressure-info';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('OverpressureInfoWidget', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(OverpressureInfoWidget, {
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
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('formState becomes dirty when presionMaxima changes', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((m) => ({ ...m, presionMaxima: '999' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.formState().dirty).toBe(true);
  });

  it('saveForm persists changes to the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((m) => ({ ...m, presionMaxima: '300', presionMinima: '250' }));
    await fixture.componentInstance.saveForm();
    const store = TestBed.inject(ExecutionStore);
    expect(store.overpressureInfo().presionMaxima).toBe(300);
    expect(store.overpressureInfo().presionMinima).toBe(250);
  });

  it('saveForm updates overpressurePresionBuscada computed', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((m) => ({ ...m, presionMaxima: '300', presionMinima: '200' }));
    await fixture.componentInstance.saveForm();
    const store = TestBed.inject(ExecutionStore);
    expect(store.overpressurePresionBuscada()).toBe(250);
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].update((m) => ({ ...m, presionMaxima: '999' }));
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).overpressureInfo();
    const formMax = fixture.componentInstance['formModel']().presionMaxima;
    expect(formMax).toBe(stored.presionMaxima !== null ? String(stored.presionMaxima) : null);
  });

  it('formState is valid', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().valid).toBe(true);
  });

  it('unit change syncs to formModel', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['onUnitChange']('bar');
    expect(fixture.componentInstance['formModel']().unidadPresion).toBe('bar');
  });
});

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
import { TargetDataWidget } from './target-data';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('TargetDataWidget', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(TargetDataWidget, {
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

  it('saveForm persists data to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.targetData()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).targetData();
    expect(fixture.componentInstance['formModel']().blanco).toBe(stored.blanco);
    expect(fixture.componentInstance['formModel']().material).toBe(stored.material);
    expect(fixture.componentInstance['serieModel']()).toBe(stored.serie);
  });

  it('serie selector is disabled when sameDataAcrossSeries is true', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateTargetData({ sameDataAcrossSeries: true });
    fixture.detectChanges();
    expect(fixture.componentInstance['serieDisabled']()).toBe(true);
  });

  it('disparo selector is disabled when sameDataAcrossDisparos is true', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateTargetData({ sameDataAcrossDisparos: true });
    fixture.detectChanges();
    expect(fixture.componentInstance['disparoDisabled']()).toBe(true);
  });
});

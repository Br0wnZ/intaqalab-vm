/* eslint-disable @typescript-eslint/no-empty-function */
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
import { SeguimientoWidget } from './seguimiento';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('SeguimientoWidget', () => {
  const renderWidget = (widgetId = 'test-seguimiento') =>
    render(SeguimientoWidget, {
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
    expect(fixture.componentInstance.formState().widgetId).toBe('test-seguimiento');
  });

  it('saveForm persists unit preferences to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.seguimiento()).toBeDefined();
    expect(store.seguimiento().presionVelocidadUnit).toBe('MPa');
    expect(store.seguimiento().pesosUnit).toBe('g');
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['formModel'].set({ presionVelocidadUnit: 'bar', pesosUnit: 'kg' });
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).seguimiento();
    expect(fixture.componentInstance['formModel']().presionVelocidadUnit).toBe(stored.presionVelocidadUnit);
    expect(fixture.componentInstance['formModel']().pesosUnit).toBe(stored.pesosUnit);
  });

  it('setActiveTab updates the active tab signal', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setActiveTab']('p-manom');
    expect(fixture.componentInstance['activeTab']()).toBe('p-manom');
  });

  it('columns computed returns correct columns for velocidades tab', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setActiveTab']('velocidades');
    const cols = fixture.componentInstance['columns']();
    expect(cols.some((c) => c.label === 'V01')).toBe(true);
    expect(cols.some((c) => c.label === 'V0c')).toBe(true);
    expect(cols.some((c) => c.label === 'Wc/g')).toBe(true);
  });

  it('columns computed returns pressure columns for p-manom tab', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setActiveTab']('p-manom');
    const cols = fixture.componentInstance['columns']();
    expect(cols.some((c) => c.label === 'P1')).toBe(true);
    expect(cols.some((c) => c.label === 'P̄')).toBe(true);
  });

  it('tableData computed returns series with precomputed rows', async () => {
    const { fixture } = await renderWidget();
    const tableData = fixture.componentInstance['tableData']();
    expect(tableData.length).toBeGreaterThan(0);
    expect(tableData[0].computedRows.length).toBeGreaterThan(0);
    expect(tableData[0].computedRows[0].cells.length).toBeGreaterThan(0);
  });

  it('tabLabelKey returns correct i18n key for each tab', async () => {
    const { fixture } = await renderWidget();
    const key = fixture.componentInstance['tabLabelKey']('p-pz-cie');
    expect(key).toBe('TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_PZ_CIE');
  });
});

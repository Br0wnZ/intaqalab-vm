/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { VigilanciaWidget } from './vigilancia';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('VigilanciaWidget', () => {
  const renderWidget = (widgetId = 'test-vigilancia') =>
    render(VigilanciaWidget, {
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

  it('formState is always clean (read-only widget)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().hasChanges).toBe(false);
    expect(fixture.componentInstance.formState().valid).toBe(true);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-vigilancia');
  });

  it('tableRows returns 8 rows from the store', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['tableRows']()).toHaveLength(8);
  });

  it('lastChecked is null initially', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['lastChecked']()).toBeNull();
  });

  it('onActualizar sets lastChecked in the store', async () => {
    vi.useFakeTimers();
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const promise = fixture.componentInstance.onActualizar();
    vi.advanceTimersByTime(1000);
    await promise;
    expect(store.vigilancia().lastChecked).not.toBeNull();
    vi.useRealTimers();
  });

  it('refreshing signal is false when idle', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['refreshing']()).toBe(false);
  });

  it('onSerieChange updates store serie', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance.onSerieChange('funcionamiento-1');
    expect(store.vigilancia().serie).toBe('funcionamiento-1');
  });

  it('onVelocidadUnitChange updates store velocidadUnit', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance.onVelocidadUnitChange('ft/s');
    expect(store.vigilancia().velocidadUnit).toBe('ft/s');
  });

  it('onPresionUnitChange updates store presionUnit', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance.onPresionUnitChange('MPa');
    expect(store.vigilancia().presionUnit).toBe('MPa');
  });

  it('saveForm calls onActualizar (no errors)', async () => {
    vi.useFakeTimers();
    const { fixture } = await renderWidget();
    const promise = fixture.componentInstance.saveForm();
    vi.advanceTimersByTime(1000);
    await promise;
    vi.useRealTimers();
  });

  it('resetForm is a no-op (no side effects)', async () => {
    const { fixture } = await renderWidget();
    expect(() => fixture.componentInstance.resetForm()).not.toThrow();
  });

  it('vigilancia state is defined in the store', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    expect(store.vigilancia()).toBeDefined();
    expect(store.vigilancia().serieOptions.length).toBeGreaterThan(0);
  });
});

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
import { StanagCriteriosWidget } from './stanag-criterios';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('StanagCriteriosWidget', () => {
  const renderWidget = (widgetId = 'test-stanag') =>
    render(StanagCriteriosWidget, {
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

  it('formState is always clean (no editable fields)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().hasChanges).toBe(false);
    expect(fixture.componentInstance.formState().valid).toBe(true);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-stanag');
  });

  it('criterios are loaded from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const storeCriterios = store.stanagCriterios().criterios;
    expect(fixture.componentInstance['criterios']()).toHaveLength(storeCriterios.length);
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
    expect(store.stanagCriterios().lastChecked).not.toBeNull();
    vi.useRealTimers();
  });

  it('checking signal is false when not running', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['checking']()).toBe(false);
  });

  it('resetForm is a no-op (no side effects)', async () => {
    const { fixture } = await renderWidget();
    expect(() => fixture.componentInstance.resetForm()).not.toThrow();
  });
});

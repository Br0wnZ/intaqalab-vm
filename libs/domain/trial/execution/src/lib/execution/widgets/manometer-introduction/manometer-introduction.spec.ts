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
import { ManometerIntroduction } from './manometer-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('ManometerIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(ManometerIntroduction, {
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
    expect(store.manometerIntroduction()).toBeDefined();
  });

  it('resetForm restores h1 from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).manometerIntroduction();
    const expected = stored.h1 !== null ? { value: stored.h1.toString(), unit: stored.h1Unit } : null;
    expect(fixture.componentInstance['h1Field']()).toEqual(expected);
  });

  it('widgetId is set correctly', async () => {
    const { fixture } = await renderWidget('my-manometer-widget');
    expect(fixture.componentInstance.formState().widgetId).toBe('my-manometer-widget');
  });

  it('alturaMedia is null when no H values set', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['alturaMedia']()).toBeNull();
  });
});

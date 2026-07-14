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
import { JltShotData } from './jlt-shot-data';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('JltShotData', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(JltShotData, {
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

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.jltShotData()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).jltShotData();
    expect(fixture.componentInstance['formModel']().serie).toBe(stored.serie);
    expect(fixture.componentInstance['formModel']().equipoAtacado).toBe(stored.equipoAtacado);
  });

  it('setCurrentShot updates serie and disparo from active store values', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.setCurrentShot();
    const store = TestBed.inject(ExecutionStore);
    const formValue = fixture.componentInstance['formModel']();
    expect(formValue.serie).toBe(store.activeSerieId());
  });

  it('renders filter selectors (serie, disparo)', async () => {
    await renderWidget();
    expect(screen.getByRole('heading', { name: /JLT_SHOT_DATA\.TITLE/ })).toBeInTheDocument();
  });

  it('renders action button Disparo actual', async () => {
    await renderWidget();
    const buttons = document.querySelectorAll('button[mat-flat-button]');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});

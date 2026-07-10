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
import { DatosBlancoBola } from './datos-blanco-bola';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('DatosBlancoBola', () => {
  const renderWidget = (widgetId = 'test-datos-blanco-bola') =>
    render(DatosBlancoBola, {
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

  it('formState widgetId matches input', async () => {
    const { fixture } = await renderWidget('my-widget-id');
    expect(fixture.componentInstance.formState().widgetId).toBe('my-widget-id');
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().hasChanges).toBe(false);
  });

  it('setting a field marks widget as dirty', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['blancoBolax'].set({ value: '123.4', unit: 'm' });
    expect(fixture.componentInstance.formState().dirty).toBe(true);
  });

  it('saveForm persists field values to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance['blancoBolax'].set({ value: '100.5', unit: 'm' });
    await fixture.componentInstance.saveForm();
    expect(store.datosBlancoBola().blancoBolax).toEqual({ value: '100.5', unit: 'm' });
  });

  it('saveForm marks widget as clean', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['blancoBolay'].set({ value: '50.0', unit: 'm' });
    await fixture.componentInstance.saveForm();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance['bocaPiezaX'].set({ value: '999.9', unit: 'm' });
    fixture.componentInstance.resetForm();
    expect(fixture.componentInstance['bocaPiezaX']()).toEqual(store.datosBlancoBola().bocaPiezaX);
  });

  it('resetForm marks widget as clean', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['diametroBola'].set({ value: '0.155', unit: 'm' });
    fixture.componentInstance.resetForm();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('setCurrentShot updates serie and disparo from active store state', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance.setCurrentShot();
    const { serie, disparo } = fixture.componentInstance['selectorFormModel']();
    expect(serie).toBe(store.activeSerieId() ?? store.datosBlancoBola().serie);
    expect(disparo).toBe(store.activeShotId() ?? store.datosBlancoBola().disparo);
  });

  it('datosBlancoBola state is defined in the store', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    expect(store.datosBlancoBola()).toBeDefined();
    expect(store.datosBlancoBola().serieOptions.length).toBeGreaterThan(0);
    expect(store.datosBlancoBola().disparoOptions.length).toBeGreaterThan(0);
  });

  it('estadoLabel returns "En curso" for EN_CURSO state', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['estadoLabel']()).toBe('En curso');
  });
});

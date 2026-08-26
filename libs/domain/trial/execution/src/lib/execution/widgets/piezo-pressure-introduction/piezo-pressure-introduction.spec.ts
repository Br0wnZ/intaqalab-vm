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
import { PiezoPressureIntroduction } from './piezo-pressure-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('PiezoPressureIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(PiezoPressureIntroduction, {
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

  it('renders without errors and contains ui-input-select components', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
    expect(document.querySelectorAll('ui-input-select').length).toBe(3);
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
    expect(store.piezoPressureIntroduction()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).piezoPressureIntroduction();
    expect(fixture.componentInstance['cierrePresionField']()?.value).toBe(
      stored.cierre.presionMaxima?.toString() ?? undefined,
    );
  });

  it('widgetId is set correctly', async () => {
    const { fixture } = await renderWidget('my-piezo-widget');
    expect(fixture.componentInstance.formState().widgetId).toBe('my-piezo-widget');
  });

  it('changing serie or disparo does NOT mark form as dirty', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.onSerieSelected('funcionamiento-2');
    fixture.componentInstance.onDisparoSelected('disparo-2');
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().touched).toBe(false);
  });

  it('patches form with API response containing data', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['applyRemoteShotData']?.({
      pressuresData: {
        piezoelectricSensorId: 12,
        amplifierId: 15,
        dataAcquisitionSystemId: 20,
        closingMaxPressure: 3200.5,
        closingMaxPressureUnit: 'BAR',
        halfMaxPressure: 2800,
        halfMaxPressureUnit: 'BAR',
        shellMaxPressure: 2500.75,
        shellMaxPressureUnit: 'BAR',
        observations: null,
      },
    });

    expect(fixture.componentInstance['equiposFormModel']().captador).toBe('12');
    expect(fixture.componentInstance['equiposFormModel']().amplificador).toBe('15');
    expect(fixture.componentInstance['equiposFormModel']().registrador).toBe('20');
    expect(fixture.componentInstance['cierrePresionField']()?.value).toBe('3200.5');
    expect(fixture.componentInstance['cierrePresionField']()?.unit).toBe('BAR');
    expect(fixture.componentInstance['intermedioPresionField']()?.value).toBe('2800');
    expect(fixture.componentInstance['culotePresionField']()?.value).toBe('2500.75');
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('patches form with API response containing null values', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['applyRemoteShotData']?.({
      pressuresData: {
        piezoelectricSensorId: null,
        amplifierId: null,
        dataAcquisitionSystemId: null,
        closingMaxPressure: null,
        closingMaxPressureUnit: 'BAR',
        halfMaxPressure: null,
        halfMaxPressureUnit: 'BAR',
        shellMaxPressure: null,
        shellMaxPressureUnit: 'BAR',
        observations: null,
      },
    });

    expect(fixture.componentInstance['equiposFormModel']().captador).toBeNull();
    expect(fixture.componentInstance['equiposFormModel']().amplificador).toBeNull();
    expect(fixture.componentInstance['equiposFormModel']().registrador).toBeNull();
    expect(fixture.componentInstance['cierrePresionField']()).toBeNull();
    expect(fixture.componentInstance['intermedioPresionField']()).toBeNull();
    expect(fixture.componentInstance['culotePresionField']()).toBeNull();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });
});

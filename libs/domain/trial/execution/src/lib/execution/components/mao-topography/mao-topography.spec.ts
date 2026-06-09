import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { describe, expect, it } from 'vitest';

import { provideTestingEnvironment } from '@intaqalab/config';
import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { MaoTopography } from './mao-topography';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('MaoTopography', () => {
  const renderWidget = (widgetId = 'test-mao-topo') =>
    render(MaoTopography, {
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
    const state = fixture.componentInstance.formState();
    expect(state.dirty).toBe(false);
    expect(state.touched).toBe(false);
    expect(state.hasChanges).toBe(false);
  });

  it('formState reports the correct widgetId', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().widgetId).toBe('test-mao-topo');
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    const stored = store.maoTopography();
    expect(stored).toBeDefined();
    expect(stored.serie).toBeNull();
    expect(stored.disparo).toBeNull();
    expect(stored.observador).toBeNull();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateMaoTopography({ observador: 'obs-01' });

    fixture.componentInstance.resetForm();

    const formValues = (fixture.componentInstance as unknown as {
      formModel: () => { observador: string | null };
    }).formModel();
    expect(formValues.observador).toBe('obs-01');
  });

  it('numeric fields default to null when store has no data', async () => {
    const { fixture } = await renderWidget();
    const component = fixture.componentInstance as unknown as {
      oltField: () => { value: string; unit: string } | null;
      xPiezaField: () => { value: string; unit: string } | null;
    };
    expect(component.oltField()).toBeNull();
    expect(component.xPiezaField()).toBeNull();
  });

  it('saveForm propagates pieza coords and OLT to radar store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);

    // Inject numeric values via signals
    const component = fixture.componentInstance as unknown as {
      xPiezaField: ReturnType<typeof import('@angular/core').signal>;
      yPiezaField: ReturnType<typeof import('@angular/core').signal>;
      zPiezaField: ReturnType<typeof import('@angular/core').signal>;
      oltField: ReturnType<typeof import('@angular/core').signal>;
    };
    component.xPiezaField.set({ value: '100.0', unit: 'm' });
    component.yPiezaField.set({ value: '200.0', unit: 'm' });
    component.zPiezaField.set({ value: '10.0', unit: 'm' });
    component.oltField.set({ value: '15.000', unit: 'oo' });

    await fixture.componentInstance.saveForm();

    const radarState = store.radarTrayectographyOrientation();
    expect(radarState.xPieza).toBe(100.0);
    expect(radarState.yPieza).toBe(200.0);
    expect(radarState.zPieza).toBe(10.0);
    expect(radarState.difAngularTopografia).toBe(15.0);
  });

  it('isDirty becomes true when a numeric field changes', async () => {
    const { fixture } = await renderWidget();
    const component = fixture.componentInstance as unknown as {
      xPiezaField: ReturnType<typeof import('@angular/core').signal>;
      isDirty: () => boolean;
    };

    expect(component.isDirty()).toBe(false);
    component.xPiezaField.set({ value: '42.5', unit: 'm' });
    fixture.detectChanges();
    expect(component.isDirty()).toBe(true);
  });

  it('maoTopographyDistanciaBocaBlanco is null without full coords', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    expect(store.maoTopographyDistanciaBocaBlanco()).toBeNull();
  });

  it('maoTopographyDistanciaBocaBlanco computes distance when all coords are set', async () => {
    await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    store.updateMaoTopography({
      xPieza: 0, yPieza: 0, zPieza: 0,
      xBlanco: 3, yBlanco: 4, zBlanco: 0,
    });
    // sqrt(3² + 4² + 0²) = 5
    expect(store.maoTopographyDistanciaBocaBlanco()).toBe(5);
  });
});

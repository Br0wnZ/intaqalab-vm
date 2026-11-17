/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { type TrialCreateModifyForm, TrialStatus } from '@intaqalab/models';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { SeguridadWidget } from './seguridad';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
  saveSuccessCount: signal(0),
};

const inProgressTrialForm: TrialCreateModifyForm = {
  code: 'TRIAL-1',
  hasAssociatedTrial: false,
  hasLinkedTrial: false,
  associatedTrial: '',
  associatedTrialView: '',
  linkedTrial: '',
  linkedTrialView: '',
  description: '',
  type: '',
  client: '',
  clientReference: '',
  requestedDate: '',
  observations: '',
  status: TrialStatus.IN_PROGRESS,
};

describe('SeguridadWidget', () => {
  const renderWidget = async (widgetId = 'test-widget') => {
    const view = await render(SeguridadWidget, {
      inputs: { widgetId },
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
        provideTranslateService(),
      ],
    });
    patchState(unprotected(TestBed.inject(ExecutionStore)), { fireTrial: inProgressTrialForm });
    return view;
  };

  it('renders without errors', async () => {
    await renderWidget();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('activeTab defaults to convencional', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['activeTab']()).toBe('convencional');
  });

  it('setTab switches between convencional and alta-velocidad', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['setTab']('alta-velocidad');
    expect(fixture.componentInstance['activeTab']()).toBe('alta-velocidad');
    fixture.componentInstance['setTab']('convencional');
    expect(fixture.componentInstance['activeTab']()).toBe('convencional');
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.seguridad()).toBeDefined();
    expect(store.seguridad().prueba).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    fixture.componentInstance['pruebaTexto'].set('texto modificado');
    fixture.componentInstance.resetForm();
    const stored = store.seguridad();
    expect(fixture.componentInstance['pruebaTexto']()).toBe(stored.prueba.texto);
  });

  it('isDirty becomes true when text is modified', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance['blancoTexto'].set('nuevo texto blanco');
    fixture.detectChanges();
    expect(fixture.componentInstance['isDirty']()).toBe(true);
  });

  it('isDirty becomes false after saveForm', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.onSerieSelected('series-1');
    fixture.componentInstance.onDisparoSelected('shot-1');
    fixture.componentInstance['blancoTexto'].set('nuevo texto');
    fixture.detectChanges();
    await fixture.componentInstance.saveForm();
    fixture.detectChanges();
    expect(fixture.componentInstance['isDirty']()).toBe(false);
  });

  it('setCurrentShot does not throw', async () => {
    const { fixture } = await renderWidget();
    expect(() => fixture.componentInstance['setCurrentShot']()).not.toThrow();
  });

  it('handles shotLock unlock and lock cycle', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.onSerieSelected('series-1');
    fixture.componentInstance.onDisparoSelected('shot-1');
    const lock = fixture.componentInstance['shotLock'];
    expect(lock).toBeDefined();
    lock.enableHistoricalEdit();
    expect(lock.historicalEditEnabled()).toBe(true);
    await fixture.componentInstance.saveForm();
    expect(lock.historicalEditEnabled()).toBe(false);
  });
});

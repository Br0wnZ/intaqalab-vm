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
import { SeguridadWidget } from './seguridad';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('SeguridadWidget', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(SeguridadWidget, {
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
});

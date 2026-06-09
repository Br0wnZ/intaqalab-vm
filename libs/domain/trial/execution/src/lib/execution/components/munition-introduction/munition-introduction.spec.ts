import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { provideTestingEnvironment } from '@intaqalab/config';
import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { MunitionIntroduction } from './munition-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => { /* noop */ },
  addWidget: () => { /* noop */ },
  placedWidgets: () => [],
};

describe('MunitionIntroduction', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(MunitionIntroduction, {
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
    expect(store.munitionIntroduction()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).munitionIntroduction();
    expect(fixture.componentInstance['selectorFormModel']().serie).toBe(stored.serie);
  });

  it('formState has widgetId equal to provided input', async () => {
    const { fixture } = await renderWidget('munition-widget-1');
    expect(fixture.componentInstance.formState().widgetId).toBe('munition-widget-1');
  });

  it('activeTab starts on identificacion', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance['activeTab']()).toBe('identificacion');
  });

  it('saveForm delegates to child tabs', async () => {
    const { fixture } = await renderWidget();
    const identSpy = vi.spyOn(fixture.componentInstance.identTab()!, 'save');
    const pesosSpy = vi.spyOn(fixture.componentInstance.pesosTab()!, 'save');
    const acondSpy = vi.spyOn(fixture.componentInstance.acondTab()!, 'save');

    await fixture.componentInstance.saveForm();

    expect(identSpy).toHaveBeenCalled();
    expect(pesosSpy).toHaveBeenCalled();
    expect(acondSpy).toHaveBeenCalled();
  });

  it('resetForm delegates to child tabs', async () => {
    const { fixture } = await renderWidget();
    const identSpy = vi.spyOn(fixture.componentInstance.identTab()!, 'reset');
    const pesosSpy = vi.spyOn(fixture.componentInstance.pesosTab()!, 'reset');
    const acondSpy = vi.spyOn(fixture.componentInstance.acondTab()!, 'reset');

    fixture.componentInstance.resetForm();

    expect(identSpy).toHaveBeenCalled();
    expect(pesosSpy).toHaveBeenCalled();
    expect(acondSpy).toHaveBeenCalled();
  });
});

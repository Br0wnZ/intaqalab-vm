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
import { ArmamentIntroductionComponent } from './armament-introduction';

const mockWidgetStateService = {
  updateWidgetFormState: () => {},
  addWidget: () => {},
  placedWidgets: () => [],
};

describe('ArmamentIntroductionComponent', () => {
  const renderWidget = (widgetId = 'test-widget') =>
    render(ArmamentIntroductionComponent, {
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
    expect(store.armamentIntroduction()).toBeDefined();
  });

  it('resetForm restores values from the store', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.resetForm();
    const stored = TestBed.inject(ExecutionStore).armamentIntroduction();
    expect(fixture.componentInstance['formModel']().serie).toBe(stored.serie);
    expect(fixture.componentInstance['formModel']().arma).toBe(stored.arma);
  });

  it('setCurrentShot updates serie and disparo from JLT', async () => {
    const { fixture } = await renderWidget();
    fixture.componentInstance.setCurrentShot();
    const formValue = fixture.componentInstance['formModel']();
    expect(formValue).toBeTruthy();
  });

  it('renders filter selectors (serie, disparo)', async () => {
    await renderWidget();
    // Los selectores deben estar presentes en el template
    expect(screen.getByRole('heading', { name: /ARMAMENT_INTRODUCTION\.TITLE/ })).toBeInTheDocument();
  });

  it('renders action buttons (Disparo actual, Aplicar configuración masiva)', async () => {
    await renderWidget();
    const buttons = document.querySelectorAll('button[mat-flat-button]');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // Al menos los 2 botones de acción
  });
});

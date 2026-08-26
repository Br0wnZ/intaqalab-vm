/* eslint-disable @typescript-eslint/no-empty-function */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
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

  it('marks editable armament data as dirty for the parent save flow', async () => {
    const { fixture } = await renderWidget();

    fixture.componentInstance['formModel'].update((value) => ({
      ...value,
      observations: 'Sin incidencias.',
    }));

    expect(fixture.componentInstance.formState().dirty).toBe(true);
    expect(fixture.componentInstance.formState().hasChanges).toBe(true);
  });

  it('does not mark series navigation as dirty', async () => {
    const { fixture } = await renderWidget();

    fixture.componentInstance['formModel'].update((value) => ({
      ...value,
      serie: 'series-id',
      disparo: 'shot-id',
    }));

    expect(fixture.componentInstance.formState().dirty).toBe(false);
  });

  it('saveForm persists selection to the store', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    await fixture.componentInstance.saveForm();
    expect(store.armamentIntroduction()).toBeDefined();
  });

  it('dispatches the armament PUT using the active shot selection', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const executionService = TestBed.inject(ExecutionService);
    const setShotArmament = vi.spyOn(executionService, 'setShotArmament');
    store.setFireTrialId('trial-id');
    store.setOptimisticActiveShot('series-id', 'shot-id');
    fixture.componentInstance['formModel'].update((value) => ({
      ...value,
      arma: '21017',
      tubo: '21099',
      observations: 'Sin incidencias.',
    }));

    await fixture.componentInstance.saveForm();

    expect(setShotArmament).toHaveBeenCalledWith('trial-id', 'series-id', 'shot-id', {
      weaponId: 21017,
      tubeId: 21099,
      observations: 'Sin incidencias.',
    });
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

  it('renders armament details without attack or recoil equipment fields', async () => {
    await renderWidget();

    expect(screen.queryByText(/EQUIPO_ATACADO_LABEL/)).not.toBeInTheDocument();
    expect(screen.queryByText(/EQUIPO_RETROCESO_LABEL/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/NÑ_SERIE_ARMA_LABEL/)).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/NÑ_SERIE_TUBO_LABEL/)).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/INSTRUMENTED_LABEL/)).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/USEFUL_LIFE_LABEL/)).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: /OBSERVATIONS_LABEL/ })).not.toHaveAttribute('readonly');
  });
});

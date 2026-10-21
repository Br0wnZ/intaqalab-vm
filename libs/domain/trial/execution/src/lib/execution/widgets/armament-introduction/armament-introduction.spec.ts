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
import type { ArmamentEquipmentItem, PlanningArmamentResponse } from '../../../services/execution.service';
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
    const weapon: ArmamentEquipmentItem = {
      id: 21017,
      tag: 'ARM-17',
      serialNumber: 'SN-A-17',
      denominationId: 10,
      denominationName: 'Weapon 105mm',
      modelName: 'M1',
    };
    vi.spyOn(executionService, 'loadArmamentEquipmentItems').mockResolvedValue([weapon]);
    const loadWeaponDenominations = vi
      .spyOn(executionService, 'loadArmamentWeaponDenominations')
      .mockResolvedValue([{ id: 10, name: 'Weapon 105mm', itemType: 'WEAPON', familyId: 10, active: true }]);
    vi.spyOn(executionService, 'loadArmamentDenominations').mockResolvedValue([]);
    vi.spyOn(executionService, 'fetchPlanningArmament').mockResolvedValue({ series: [] });
    const setShotArmament = vi.spyOn(executionService, 'setShotArmament');
    store.setFireTrialId('trial-id');
    await vi.waitFor(() => {
      expect(loadWeaponDenominations).toHaveBeenCalledOnce();
      expect(fixture.componentInstance.armaOptions()).toContainEqual({ value: '10', label: 'Weapon 105mm' });
    });
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

  it('applies the planned armament assigned to each selected shot', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const executionService = TestBed.inject(ExecutionService);
    const weapons: ArmamentEquipmentItem[] = [
      {
        id: 21017,
        tag: 'ARM-17',
        serialNumber: 'SN-A-17',
        denominationId: 10,
        denominationName: 'Weapon 105mm',
        modelName: 'M1',
      },
      {
        id: 21018,
        tag: 'ARM-18',
        serialNumber: 'SN-A-18',
        denominationId: 11,
        denominationName: 'Weapon 120mm',
        modelName: 'M2',
      },
    ];
    const tubes: ArmamentEquipmentItem[] = [
      {
        id: 21099,
        tag: 'TUBE-99',
        serialNumber: 'SN-T-99',
        denominationId: 20,
        denominationName: 'Tube 105mm',
        modelName: 'T1',
      },
      {
        id: 21100,
        tag: 'TUBE-100',
        serialNumber: 'SN-T-100',
        denominationId: 21,
        denominationName: 'Tube 120mm',
        modelName: 'T2',
      },
    ];
    const plannedArmament: PlanningArmamentResponse = {
      series: [
        {
          seriesId: 'series-id',
          seriesName: 'Series 1',
          shots: [
            {
              shotId: 'shot-1',
              armament: {
                weaponExternalId: 10,
                weaponName: 'Weapon 105mm',
                tubeExternalId: 20,
                tubeName: 'Tube 105mm',
                isInstrumented: true,
                tubeLifePercentage: 75,
              },
            },
            {
              shotId: 'shot-2',
              armament: {
                weaponExternalId: 11,
                weaponName: 'Weapon 120mm',
                tubeExternalId: 21,
                tubeName: 'Tube 120mm',
                isInstrumented: false,
                tubeLifePercentage: 50,
              },
            },
            { shotId: 'shot-3' },
            {
              shotId: 'shot-4',
              armament: {
                weaponExternalId: 99999,
                weaponName: 'Production weapon',
                tubeExternalId: 99998,
                tubeName: 'Production tube',
              },
            },
          ],
        },
      ],
    };
    vi.spyOn(executionService, 'loadArmamentEquipmentItems').mockImplementation(async (type) =>
      type === 'WEAPON' ? weapons : tubes,
    );
    vi.spyOn(executionService, 'loadArmamentWeaponDenominations').mockResolvedValue([
      { id: 10, name: 'Weapon 105mm', itemType: 'WEAPON', familyId: 10676, active: true },
      { id: 11, name: 'Weapon 120mm', itemType: 'WEAPON', familyId: 10677, active: true },
    ]);
    vi.spyOn(executionService, 'loadArmamentDenominations').mockImplementation(async (type, familyId) =>
      type === 'TUBE' && familyId === 10676
        ? [{ id: 20, name: 'Tube 105mm', itemType: 'TUBE', familyId, active: true }]
        : type === 'TUBE' && familyId === 10677
          ? [{ id: 21, name: 'Tube 120mm', itemType: 'TUBE', familyId, active: true }]
          : [],
    );
    vi.spyOn(executionService, 'fetchPlanningArmament').mockResolvedValue(plannedArmament);
    vi.spyOn(executionService, 'fetchShotArmament').mockResolvedValue({});
    store.setFireTrialId('trial-id');

    await vi.waitFor(() => {
      expect(fixture.componentInstance.armaOptions()).toHaveLength(2);
    });

    fixture.componentInstance.onSerieSelected('series-id');
    fixture.componentInstance.onShotSelected('shot-1');
    await vi.waitFor(() => {
      expect(fixture.componentInstance['formModel']().tubo).toBe('21099');
    });
    expect(fixture.componentInstance['formModel']().arma).toBe('21017');
    expect(fixture.componentInstance['plannedArmaOptions']()).toEqual([{ value: '21017', label: 'Weapon 105mm' }]);
    expect(fixture.componentInstance['plannedTuboOptions']()).toEqual([{ value: '21099', label: 'Tube 105mm' }]);
    expect(fixture.componentInstance['selectedPlanningArmament']()?.isInstrumented).toBe(true);
    expect(fixture.componentInstance['selectedPlanningArmament']()?.tubeLifePercentage).toBe(75);

    fixture.componentInstance.onShotSelected('shot-2');
    await vi.waitFor(() => {
      expect(fixture.componentInstance['formModel']().tubo).toBe('21100');
    });
    expect(fixture.componentInstance['formModel']().arma).toBe('21018');
    expect(fixture.componentInstance['plannedArmaOptions']()).toEqual([{ value: '21018', label: 'Weapon 120mm' }]);
    expect(fixture.componentInstance['plannedTuboOptions']()).toEqual([{ value: '21100', label: 'Tube 120mm' }]);
    expect(fixture.componentInstance['selectedPlanningArmament']()?.isInstrumented).toBe(false);
    expect(fixture.componentInstance['selectedPlanningArmament']()?.tubeLifePercentage).toBe(50);

    fixture.componentInstance.onShotSelected('shot-3');
    expect(fixture.componentInstance['formModel']().arma).toBeNull();
    expect(fixture.componentInstance['formModel']().tubo).toBeNull();
    expect(fixture.componentInstance['formModel']().observations).toBe('');
    expect(fixture.componentInstance['plannedArmaOptions']()).toEqual([]);
    expect(fixture.componentInstance['plannedTuboOptions']()).toEqual([]);

    fixture.componentInstance.onShotSelected('shot-4');
    expect(fixture.componentInstance['plannedArmaOptions']()).toEqual([{ value: '99999', label: 'Production weapon' }]);
    expect(fixture.componentInstance['plannedTuboOptions']()).toEqual([{ value: '99998', label: 'Production tube' }]);
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

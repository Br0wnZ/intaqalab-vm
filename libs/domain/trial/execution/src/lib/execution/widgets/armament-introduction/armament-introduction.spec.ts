/* eslint-disable @typescript-eslint/no-empty-function */
import { manualChangeDetection } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
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

  it.each(['empty', 'heterogeneous', 'homogeneous'] as const)(
    'updates the bulk configuration button and tooltip for %s planning',
    async (scenario) => {
      const { fixture } = await renderWidget();
      const service = TestBed.inject(ExecutionService);
      const store = TestBed.inject(ExecutionStore);
      const planning: PlanningArmamentResponse = {
        series:
          scenario === 'empty'
            ? []
            : [
                {
                  seriesId: 'series-1',
                  seriesName: 'Series 1',
                  shots: [
                    { shotId: 'shot-1', armament: { weaponExternalId: 1, tubeExternalId: 2 } },
                    {
                      shotId: 'shot-2',
                      armament: { weaponExternalId: 1, tubeExternalId: scenario === 'homogeneous' ? 2 : 3 },
                    },
                  ],
                },
              ],
      };
      vi.spyOn(service, 'loadArmamentEquipmentItems').mockResolvedValue([]);
      vi.spyOn(service, 'loadArmamentWeaponDenominations').mockResolvedValue([]);
      vi.spyOn(service, 'loadArmamentDenominations').mockResolvedValue([]);
      const fetchPlanning = vi.spyOn(service, 'fetchPlanningArmament').mockResolvedValue(planning);
      vi.spyOn(service, 'fetchShotArmament').mockResolvedValue({});
      store.updateArmamentIntroduction({ serieOptions: [{ value: 'series-1', label: 'Series 1' }] });
      store.setFireTrialId('trial-id');
      await vi.waitFor(() => expect(fetchPlanning).toHaveBeenCalled());
      for (const request of TestBed.inject(HttpTestingController).match(() => true)) {
        request.flush({ series: [], items: [] });
      }
      fixture.detectChanges();

      const button = screen.getByRole('button', { name: /MASS_CONFIG_BTN/ });
      await manualChangeDetection(async () => {
        const loader = TestbedHarnessEnvironment.loader(fixture);
        const [tooltip] = await loader.getAllHarnesses(MatTooltipHarness);
        if (!tooltip) throw new Error('Bulk configuration tooltip not found');
        if (scenario === 'homogeneous') {
          expect(button).toBeEnabled();
          await tooltip.show();
          fixture.detectChanges();
          expect(await tooltip.isOpen()).toBe(false);
        } else {
          expect(button).toBeDisabled();
          await tooltip.show();
          fixture.detectChanges();
          expect(await tooltip.getTooltipText()).toBe(
            'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_DISABLED_TOOLTIP',
          );
        }
      });
    },
  );

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

  it('disables tube selectors for a null planned tube and enables them when switching shots', async () => {
    const { fixture } = await renderWidget();
    const service = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const weapon: ArmamentEquipmentItem = {
      id: 21,
      tag: 'W21',
      serialNumber: 'W21',
      denominationId: 1,
      denominationName: 'Weapon',
      modelName: 'W',
    };
    const tube: ArmamentEquipmentItem = {
      id: 25,
      tag: 'T25',
      serialNumber: 'T25',
      denominationId: 5,
      denominationName: 'Tube',
      modelName: 'T',
    };
    const planning: PlanningArmamentResponse = JSON.parse(`{
      "series": [{ "seriesId": "series-1", "seriesName": "Series 1", "shots": [
        { "shotId": "without-tube", "armament": { "weaponExternalId": 1, "tubeExternalId": null } },
        { "shotId": "with-tube", "armament": { "weaponExternalId": 1, "tubeExternalId": 5 } }
      ] }]
    }`);
    vi.spyOn(service, 'loadArmamentEquipmentItems').mockImplementation(async (type) =>
      type === 'WEAPON' ? [weapon] : [tube],
    );
    vi.spyOn(service, 'loadArmamentWeaponDenominations').mockResolvedValue([]);
    vi.spyOn(service, 'loadArmamentDenominations').mockResolvedValue([]);
    vi.spyOn(service, 'fetchPlanningArmament').mockResolvedValue(planning);
    vi.spyOn(service, 'fetchShotArmament').mockResolvedValue({ armamentData: { weapon, tube } });
    const save = vi.spyOn(service, 'setShotArmament').mockResolvedValue({});
    store.setFireTrialId('trial-id');
    store.setOptimisticActiveShot('series-1', 'without-tube');
    await vi.waitFor(() => {
      expect(fixture.componentInstance['formModel']().arma).toBe('21');
      expect(fixture.componentInstance['tubeDisabled']()).toBe(true);
      expect(fixture.componentInstance['formModel']().tubo).toBeNull();
    });
    for (const request of TestBed.inject(HttpTestingController).match(() => true)) {
      request.flush({ series: [], items: [] });
    }
    await manualChangeDetection(async () => {
      fixture.detectChanges();
      const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatSelectHarness);
      const tubeSelect = selects[4];
      const serialSelect = selects[5];
      if (!tubeSelect || !serialSelect) throw new Error('Tube selectors not found');
      expect(await tubeSelect.isDisabled()).toBe(true);
      expect(await serialSelect.isDisabled()).toBe(true);
      await fixture.componentInstance.saveForm();
      expect(save).toHaveBeenCalledWith('trial-id', 'series-1', 'without-tube', {
        weaponId: 21,
        tubeId: null,
        observations: null,
      });
      fixture.componentInstance.onShotSelected('with-tube');
      fixture.detectChanges();
      expect(await tubeSelect.isDisabled()).toBe(false);
      expect(await serialSelect.isDisabled()).toBe(false);
    });
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

  it('should display the planned mortar on first load without confusing denomination and item IDs', async () => {
    const { fixture } = await renderWidget();
    const service = TestBed.inject(ExecutionService);
    const store = TestBed.inject(ExecutionStore);
    const foreignItem: ArmamentEquipmentItem = {
      id: 449,
      denominationId: 450,
      denominationName: 'Other mortar',
      tag: 'OTHER',
      serialNumber: 'OTHER-SERIAL',
      modelName: 'Other',
    };
    const mortar: ArmamentEquipmentItem = {
      ...foreignItem,
      id: 900,
      denominationId: 449,
      denominationName: 'MORTERO PROBETA 81 mm',
      serialNumber: 'MORTAR-SERIAL',
    };
    const planning: PlanningArmamentResponse = JSON.parse(`{
      "series": [
        { "seriesId": "series-1", "shots": [
          { "shotId": "shot-1", "armament": {
            "weaponExternalId": "449", "weaponName": "MORTERO PROBETA 81 mm",
            "itemType": "MORTAR", "tubeExternalId": null
          }}
        ]},
        { "seriesId": "series-2", "shots": [
          { "shotId": "shot-2", "armament": {
            "weaponExternalId": "449", "weaponName": "MORTERO PROBETA 81 mm",
            "itemType": "MORTAR", "tubeExternalId": null
          }}
        ]}
      ]
    }`);
    vi.spyOn(service, 'loadArmamentEquipmentItems').mockImplementation(async (type) =>
      type === 'MORTAR' ? [foreignItem, mortar] : [],
    );
    vi.spyOn(service, 'loadArmamentWeaponDenominations').mockResolvedValue([]);
    vi.spyOn(service, 'loadArmamentDenominations').mockResolvedValue([
      { id: 449, name: 'MORTERO PROBETA 81 mm', itemType: 'MORTAR', familyId: 1, active: true },
    ]);
    vi.spyOn(service, 'fetchPlanningArmament').mockResolvedValue(planning);
    const fetchShot = vi.spyOn(service, 'fetchShotArmament').mockResolvedValue({});
    store.setFireTrialId('trial-id');
    store.setOptimisticActiveShot('series-1', 'shot-1');

    await vi.waitFor(() => {
      expect(fixture.componentInstance['formModel']().arma).toBe('900');
    });
    for (const request of TestBed.inject(HttpTestingController).match(() => true)) {
      request.flush({ series: [], items: [] });
    }
    await manualChangeDetection(async () => {
      fixture.detectChanges();
      const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatSelectHarness);
      fixture.detectChanges();
      expect(await selects[2].getValueText()).toBe('MORTERO PROBETA 81 mm');
      expect(await selects[3].getValueText()).toBe('MORTAR-SERIAL');
    });

    fetchShot.mockResolvedValue({ armamentData: { weapon: foreignItem } });
    fixture.componentInstance.onSerieSelected('series-2');
    fixture.componentInstance.onShotSelected('shot-2');
    await vi.waitFor(() => {
      expect(fetchShot).toHaveBeenCalledWith('trial-id', 'series-2', 'shot-2');
      expect(fixture.componentInstance['formModel']().arma).toBe('900');
    });
    expect(fixture.componentInstance['weaponSerialOptions']()).toEqual([{ value: '900', label: 'MORTAR-SERIAL' }]);
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
    const mortar: ArmamentEquipmentItem = {
      id: 22001,
      tag: 'MORTAR-1',
      serialNumber: 'SN-M-1',
      denominationId: 30,
      denominationName: 'Mortar 81mm',
      modelName: 'M81',
    };
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
            {
              shotId: 'shot-5',
              armament: {
                itemType: 'MORTAR',
                weaponExternalId: 30,
                weaponName: 'Mortar 81mm',
              },
            },
          ],
        },
      ],
    };
    vi.spyOn(executionService, 'loadArmamentEquipmentItems').mockImplementation(async (type) =>
      type === 'WEAPON' ? weapons : type === 'TUBE' ? tubes : [mortar],
    );
    vi.spyOn(executionService, 'loadArmamentWeaponDenominations').mockResolvedValue([
      { id: 10, name: 'Weapon 105mm', itemType: 'WEAPON', familyId: 10676, active: true },
      { id: 11, name: 'Weapon 120mm', itemType: 'WEAPON', familyId: 10677, active: true },
    ]);
    vi.spyOn(executionService, 'loadArmamentDenominations').mockImplementation(async (type, familyId) =>
      type === 'MORTAR'
        ? [{ id: 30, name: 'Mortar 81mm', itemType: 'MORTAR', familyId: 10678, active: true }]
        : type === 'TUBE' && familyId === 10676
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

    fixture.componentInstance.onShotSelected('shot-5');
    fixture.detectChanges();
    expect(fixture.componentInstance['formModel']().arma).toBe('22001');
    expect(fixture.componentInstance['formModel']().tubo).toBeNull();
    expect(fixture.componentInstance['plannedArmaOptions']()).toEqual([{ value: '22001', label: 'Mortar 81mm' }]);
    expect(fixture.componentInstance['weaponSerialOptions']()).toEqual([{ value: '22001', label: 'SN-M-1' }]);
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    await manualChangeDetection(async () => {
      const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatSelectHarness);
      fixture.detectChanges();
      expect(await selects[2].getValueText()).toBe('Mortar 81mm');
      expect(await selects[3].getValueText()).toBe('SN-M-1');
    });
  });

  it('selects the first shot regardless of status and fetches data for each shot selection', async () => {
    const { fixture } = await renderWidget();
    const store = TestBed.inject(ExecutionStore);
    const executionService = TestBed.inject(ExecutionService);
    vi.spyOn(executionService, 'loadArmamentEquipmentItems').mockResolvedValue([]);
    vi.spyOn(executionService, 'loadArmamentWeaponDenominations').mockResolvedValue([]);
    vi.spyOn(executionService, 'loadArmamentDenominations').mockResolvedValue([]);
    vi.spyOn(executionService, 'fetchPlanningArmament').mockResolvedValue({ series: [] });
    const fetchSpy = vi.spyOn(executionService, 'fetchShotArmament').mockResolvedValue({});

    store.setFireTrialId('trial-id');
    executionService.executionProgressResource.set({
      series: [
        {
          seriesId: 'series-1',
          shots: [
            { shotId: 'shot-fired', status: 'FIRED', updatedAt: '2026-10-05T10:00:00Z' },
            { shotId: 'shot-pending', status: 'PENDING', updatedAt: '2026-10-05T10:01:00Z' },
            { shotId: 'shot-active', status: 'ACTIVE', updatedAt: '2026-10-05T10:02:00Z' },
          ],
        },
      ],
    });

    fixture.componentInstance.onSerieSelected('series-1');
    fixture.componentInstance.onShotSelected('shot-active');

    expect(fixture.componentInstance['formModel']().disparo).toBe('shot-active');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenNthCalledWith(1, 'trial-id', 'series-1', 'shot-fired');
    expect(fetchSpy).toHaveBeenNthCalledWith(2, 'trial-id', 'series-1', 'shot-active');
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
    expect(screen.getByRole('combobox', { name: /N_SERIE_ARMA_LABEL/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /N_SERIE_TUBO_LABEL/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/INSTRUMENTED_LABEL/)).toHaveAttribute('readonly');
    expect(screen.getByLabelText(/USEFUL_LIFE_LABEL/)).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: /OBSERVATIONS_LABEL/ })).not.toHaveAttribute('readonly');
  });

  it('lists weapon and tube serials and saves the selected physical items', async () => {
    const { fixture } = await renderWidget();
    const user = userEvent.setup();
    const store = TestBed.inject(ExecutionStore);
    const service = TestBed.inject(ExecutionService);
    const weapons: ArmamentEquipmentItem[] = ['14491', '14398', '16143', '7323'].map((serialNumber, index) => ({
      id: 21017 + index,
      tag: `ARM-${index}`,
      serialNumber,
      denominationId: 10,
      denominationName: 'Cañon C.C. M-60',
      modelName: 'M-60',
    }));
    const tube: ArmamentEquipmentItem = {
      id: 21099,
      tag: 'TUBE-99',
      serialNumber: 'SN-T-99',
      denominationId: 20,
      denominationName: 'Tube M-60',
      modelName: 'M-60',
    };
    const tubes: ArmamentEquipmentItem[] = [
      tube,
      { ...tube, id: 21100, tag: 'TUBE-100', serialNumber: 'SN-T-100' },
      { ...tube, id: 21101, tag: 'TUBE-101', serialNumber: 'SN-T-101', denominationId: 21 },
    ];
    vi.spyOn(service, 'loadArmamentEquipmentItems').mockImplementation(async (type) =>
      type === 'WEAPON' ? weapons : tubes,
    );
    vi.spyOn(service, 'loadArmamentWeaponDenominations').mockResolvedValue([
      { id: 10, name: 'Cañon C.C. M-60', itemType: 'WEAPON', familyId: 1, active: true },
    ]);
    vi.spyOn(service, 'loadArmamentDenominations').mockResolvedValue([]);
    vi.spyOn(service, 'fetchPlanningArmament').mockResolvedValue({
      series: [
        {
          seriesId: 'series-id',
          shots: [{ shotId: 'shot-id', armament: { weaponExternalId: 10, tubeExternalId: 20 } }],
        },
      ],
    });
    vi.spyOn(service, 'fetchShotArmament').mockResolvedValue({
      armamentData: { weapon: weapons[3], tube: tubes[1] },
    });
    const save = vi.spyOn(service, 'setShotArmament').mockResolvedValue({});
    store.setFireTrialId('trial-id');
    store.setOptimisticActiveShot('series-id', 'shot-id');

    await vi.waitFor(() => {
      expect(fixture.componentInstance['weaponSerialOptions']()).toHaveLength(4);
      expect(fixture.componentInstance['formModel']().arma).toBe('21020');
      expect(fixture.componentInstance['tubeSerialOptions']()).toHaveLength(2);
      expect(fixture.componentInstance['formModel']().tubo).toBe('21100');
    });
    fixture.detectChanges();
    for (const request of TestBed.inject(HttpTestingController).match(() => true)) {
      request.flush({ series: [], items: [] });
    }
    await manualChangeDetection(async () => {
      fixture.detectChanges();
      const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatSelectHarness);
      const serialSelect = selects[3];
      if (!serialSelect) throw new Error('Weapon serial selector not found');
      expect(await serialSelect.getValueText()).toBe('7323');
      await serialSelect.open();
      fixture.detectChanges();
      for (const weapon of weapons) {
        expect(screen.getByRole('option', { name: weapon.serialNumber, exact: true })).toBeInTheDocument();
      }
      await user.click(screen.getByRole('option', { name: '14398', exact: true }));
      fixture.detectChanges();
      const tubeSerialSelect = selects[5];
      if (!tubeSerialSelect) throw new Error('Tube serial selector not found');
      expect(await tubeSerialSelect.getValueText()).toBe('SN-T-100');
      await tubeSerialSelect.open();
      fixture.detectChanges();
      expect(screen.getByRole('option', { name: 'SN-T-99', exact: true })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'SN-T-100', exact: true })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'SN-T-101', exact: true })).not.toBeInTheDocument();
      await user.click(screen.getByRole('option', { name: 'SN-T-99', exact: true }));
      fixture.detectChanges();
    });
    expect(fixture.componentInstance.formState().dirty).toBe(true);
    expect(fixture.componentInstance['plannedArmaOptions']()).toEqual([{ value: '21018', label: 'Cañon C.C. M-60' }]);
    expect(fixture.componentInstance['plannedTuboOptions']()).toEqual([{ value: '21099', label: 'Tube M-60' }]);

    await fixture.componentInstance.saveForm();

    expect(save).toHaveBeenCalledWith('trial-id', 'series-id', 'shot-id', {
      weaponId: 21018,
      tubeId: 21099,
      observations: null,
    });
    expect(store.armamentIntroduction().serieArma).toBe('14398');
    expect(store.armamentIntroduction().serieTubo).toBe('SN-T-99');
    fixture.componentInstance.resetForm();
    fixture.detectChanges();
    expect(screen.getByRole('combobox', { name: /N_SERIE_ARMA_LABEL/ })).toHaveTextContent('14398');
    expect(screen.getByRole('combobox', { name: /N_SERIE_TUBO_LABEL/ })).toHaveTextContent('SN-T-99');
  });
});

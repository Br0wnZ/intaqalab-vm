import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import type { PlanningModification } from '../../../../data-access/planning-modifications';
import type { PlanningChangeRow, PlanningDetectedChange } from '../../../models/planning-changes.models';
import { PlanningModificationsTab } from './planning-modifications-tab';

const draftMod: PlanningModification = {
  id: 'mod-1',
  key: 'shooting-conditions::elevation::D2',
  parameter: 'Elevación',
  action: 'Modificación',
  previousValue: 10,
  newValue: 20,
  affectedShots: ['D2'],
  status: 'BORRADOR',
  classification: 'none',
};

const pendingMod: PlanningModification = {
  id: 'mod-2',
  key: 'shooting-conditions::orientation::D2',
  parameter: 'Orientación',
  action: 'Modificación',
  previousValue: 45,
  newValue: 90,
  affectedShots: ['D2'],
  status: 'PENDIENTE',
  classification: 'acepta',
};

const remoteDraft: PlanningChangeRow = {
  id: 'remote-draft-1',
  resourceType: 'PLANNING_INFO',
  resourceId: 'trial-1',
  seriesId: null,
  shotId: null,
  field: 'goal',
  operation: 'UPDATE',
  oldValue: 'Old',
  newValue: 'New',
  status: 'DRAFT',
  requiresApproval: false,
  requestClient: false,
  createdBy: 'user-1',
  createdAt: '2026-11-25T10:00:00Z',
  decidedBy: null,
  decidedAt: null,
  section: 'general-data',
  selectedForApply: false,
};

describe('PlanningModificationsTab', () => {
  const setup = async (inputs: Record<string, unknown> = {}) => {
    const classificationChange = vi.fn();
    const includeChange = vi.fn();
    const saveChanges = vi.fn();

    const view = await render(PlanningModificationsTab, {
      inputs: {
        modifications: [],
        validationErrors: [],
        hasPendingModifications: false,
        isSaving: false,
        isLoading: false,
        canSave: false,
        errorMessage: null,
        ...inputs,
      },
      on: {
        classificationChange,
        includeChange,
        saveChanges,
      },
      providers: [provideTranslateService(), provideTestingEnvironment()],
    });

    const loader: HarnessLoader = TestbedHarnessEnvironment.loader(view.fixture);
    return { view, loader, classificationChange, includeChange, saveChanges };
  };

  it('displays the empty state when there are no modifications', async () => {
    await setup({ modifications: [] });

    expect(screen.getByText('TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.EMPTY_STATE')).toBeInTheDocument();
  });

  it('renders modification rows with parameter, values, affected shots, and status', async () => {
    const { view } = await setup({ modifications: [draftMod], shots: [{ id: 'D2', globalNumber: 42 }] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      TRIAL_EXECUTION: { PLANNING_MODIFICATION: { SHOT_LABEL: 'Disparo: {{globalNumber}}' } },
    });
    await firstValueFrom(translate.use('es'));
    view.fixture.detectChanges();

    expect(screen.getByText('Elevación')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Disparo: 42')).toBeInTheDocument();
    expect(screen.queryByText('D2')).not.toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.BORRADOR')).toBeInTheDocument();
  });

  it.each([
    [
      'percentageTechnicalUnits',
      'TRIAL_PLANNING.GENERAL_DATA_SECTION.UNITS_PERCENTAGE_LABEL',
      'Porcentaje para unidades técnicas',
    ],
    ['targetMaterialId', 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_MATERIAL', 'Material blanco'],
    [
      'reconditioning.temperature',
      'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TEMPERATURE_LABEL',
      'Temperatura acondicionamiento (ºC)',
    ],
    ['denominationId', 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.DENOMINATION_LABEL', 'Denominación'],
    ['weaponExternalId', 'TRIAL_PLANNING.ARMAMENT.TABLE.WEAPON', 'Denominación arma'],
    ['minLimit', 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.MIN_LIMIT', 'Límite mínimo'],
    ['globalNumber', 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SHOTS_TABLE.SHOT_NUMBER', 'Nº del disparo'],
  ])('translates the parameter %s instead of displaying the property name', async (field, key, label) => {
    const { view, loader } = await setup({ modifications: [{ ...remoteDraft, field }] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { [key]: label });
    await firstValueFrom(translate.use('es'));
    view.fixture.detectChanges();

    expect(screen.getByRole('cell', { name: label, exact: true })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: field, exact: true })).not.toBeInTheDocument();
    const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
    expect(await (await checkboxes[0].host()).getAttribute('aria-label')).toContain(label);
  });

  it('translates nested rating criteria with their property and limit', async () => {
    const { view } = await setup({ modifications: [{ ...remoteDraft, field: 'ratingCriteria.fuse.uselessMax' }] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.USELESS_MAX': 'Inútil: límite máximo',
      'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.FUSE': 'Espoleta',
    });
    await firstValueFrom(translate.use('es'));
    view.fixture.detectChanges();

    expect(screen.getByRole('cell', { name: 'Inútil: límite máximo · Espoleta' })).toBeInTheDocument();
  });

  it('shows entity names in previous and new values while keeping remote IDs unchanged', async () => {
    const modification: PlanningChangeRow = {
      ...remoteDraft,
      resourceType: 'ARMAMENT',
      field: 'weaponExternalId',
      oldValue: '12',
      newValue: '19',
    };
    await setup({
      modifications: [modification],
      valueReferences: {
        weaponExternalId: [
          { id: 12, name: 'Arma anterior' },
          { id: 19, name: 'Arma nueva' },
        ],
      },
    });

    expect(screen.getByRole('cell', { name: 'Arma anterior', exact: true })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Arma nueva', exact: true })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: '12', exact: true })).not.toBeInTheDocument();
    expect(modification.oldValue).toBe('12');
    expect(modification.newValue).toBe('19');
  });

  it('updates localized entity names when the language or available references change', async () => {
    const { view } = await setup({
      modifications: [{ ...remoteDraft, field: 'denominationId', oldValue: 'old-id', newValue: 'new-id' }],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {});
    translate.setTranslation('en', {});
    await firstValueFrom(translate.use('es'));
    view.fixture.componentRef.setInput('valueReferences', {
      denominationId: [
        { id: 'old-id', name: { es: 'Denominación anterior', en: 'Old denomination' } },
        { id: 'new-id', name: { es: 'Denominación nueva', en: 'New denomination' } },
      ],
    });
    view.fixture.detectChanges();

    expect(screen.getByRole('cell', { name: 'Denominación anterior' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Denominación nueva' })).toBeInTheDocument();

    await firstValueFrom(translate.use('en'));
    view.fixture.detectChanges();

    expect(screen.getByRole('cell', { name: 'Old denomination' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'New denomination' })).toBeInTheDocument();
  });

  it('resolves affected shot IDs to global numbers and updates labels when the language changes', async () => {
    const modification: PlanningDetectedChange = {
      ...draftMod,
      section: 'shooting-conditions',
      resourceType: 'SHOT_CONDITIONS',
      resourceId: 'shot-uuid-1',
      field: 'targetMaterialId',
      operation: 'UPDATE',
      affectedShots: ['shot-uuid-1', 'shot-uuid-2'],
      persistable: true,
      status: 'READY',
      classification: 'none',
      requiresApproval: false,
      requestClient: false,
    };
    const { view } = await setup({
      modifications: [modification],
      shots: [
        { id: 'shot-uuid-2', globalNumber: 17 },
        { id: 'shot-uuid-1', globalNumber: 8 },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_MATERIAL': 'Material blanco',
      'TRIAL_EXECUTION.PLANNING_MODIFICATION.SHOT_LABEL': 'Disparo: {{globalNumber}}',
    });
    translate.setTranslation('en', {
      'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_MATERIAL': 'Target material',
      'TRIAL_EXECUTION.PLANNING_MODIFICATION.SHOT_LABEL': 'Shot: {{globalNumber}}',
    });
    await firstValueFrom(translate.use('es'));
    view.fixture.detectChanges();

    expect(screen.getByRole('cell', { name: 'Disparo: 8, Disparo: 17' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Material blanco' })).toBeInTheDocument();

    await firstValueFrom(translate.use('en'));
    view.fixture.detectChanges();

    expect(screen.getByRole('cell', { name: 'Shot: 8, Shot: 17' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Target material' })).toBeInTheDocument();
    expect(modification.affectedShots).toEqual(['shot-uuid-1', 'shot-uuid-2']);
  });

  it('resolves remote shot IDs after the shot catalog arrives without exposing UUIDs', async () => {
    const { view } = await setup({
      modifications: [{ ...remoteDraft, resourceType: 'SHOT_CONDITIONS', shotId: 'shot-uuid-7' }],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { 'TRIAL_EXECUTION.PLANNING_MODIFICATION.SHOT_LABEL': 'Disparo: {{globalNumber}}' });
    await firstValueFrom(translate.use('es'));
    view.fixture.detectChanges();

    expect(screen.queryByText('shot-uuid-7')).not.toBeInTheDocument();
    expect(screen.queryByText('Disparo: 1')).not.toBeInTheDocument();

    view.fixture.componentRef.setInput('shots', [{ id: 'shot-uuid-7', globalNumber: 23 }]);
    view.fixture.detectChanges();

    expect(screen.getByRole('cell', { name: 'Disparo: 23' })).toBeInTheDocument();
  });

  it('emits mutually exclusive classification changes for Acepta, Solicita, and unselecting to none', async () => {
    const { loader, classificationChange, view } = await setup({
      modifications: [draftMod],
      canSave: true,
    });

    const toggles = await loader.getAllHarnesses(MatSlideToggleHarness);
    expect(toggles).toHaveLength(2);

    await toggles[0].check();
    expect(classificationChange).toHaveBeenLastCalledWith({
      modId: 'mod-1',
      classification: 'acepta',
    });

    view.fixture.componentRef.setInput('modifications', [{ ...draftMod, classification: 'acepta' }]);
    view.fixture.detectChanges();

    const updatedToggles = await loader.getAllHarnesses(MatSlideToggleHarness);
    await updatedToggles[1].check();
    expect(classificationChange).toHaveBeenLastCalledWith({
      modId: 'mod-1',
      classification: 'solicita',
    });

    view.fixture.componentRef.setInput('modifications', [{ ...draftMod, classification: 'solicita' }]);
    view.fixture.detectChanges();

    const selectedSolicita = await loader.getAllHarnesses(MatSlideToggleHarness);
    await selectedSolicita[1].uncheck();
    expect(classificationChange).toHaveBeenLastCalledWith({
      modId: 'mod-1',
      classification: 'none',
    });
  });

  it('disables classification checkboxes for non-BORRADOR modifications', async () => {
    const { loader } = await setup({
      modifications: [pendingMod],
      hasPendingModifications: false,
    });

    const toggles = await loader.getAllHarnesses(MatSlideToggleHarness);
    expect(await toggles[0].isDisabled()).toBe(true);
    expect(await toggles[1].isDisabled()).toBe(true);
  });

  it('should require explicit selection before applying an existing remote draft', async () => {
    const { loader, includeChange } = await setup({ modifications: [remoteDraft] });
    const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
    expect(checkboxes).toHaveLength(1);
    expect(await checkboxes[0].isChecked()).toBe(false);

    await checkboxes[0].check();
    expect(includeChange).toHaveBeenLastCalledWith({ changeId: 'remote-draft-1', selected: true });
  });

  it('shows validation warning banner and disables save button when validation errors exist', async () => {
    const { loader } = await setup({
      modifications: [draftMod],
      validationErrors: ['Missing propelling charge', 'Invalid temperature range'],
      canSave: false,
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Missing propelling charge')).toBeInTheDocument();
    expect(screen.getByText('Invalid temperature range')).toBeInTheDocument();

    const saveBtn = await loader.getHarness(MatButtonHarness);
    expect(await saveBtn.isDisabled()).toBe(true);
  });

  it('shows locked banner and disables controls when pending modifications exist', async () => {
    const { loader } = await setup({
      modifications: [draftMod, pendingMod],
      hasPendingModifications: true,
      canSave: true,
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.PLANNING_MODIFICATION.BLOCKED_MODAL.TITLE')).toBeInTheDocument();

    const toggles = await loader.getAllHarnesses(MatSlideToggleHarness);
    expect(await toggles[0].isDisabled()).toBe(true);

    const saveBtn = await loader.getHarness(MatButtonHarness);
    expect(await saveBtn.isDisabled()).toBe(true);
  });

  it('emits saveChanges when the save button is clicked while canSave is true', async () => {
    const { loader, saveChanges } = await setup({
      modifications: [draftMod],
      canSave: true,
    });

    const saveBtn = await loader.getHarness(MatButtonHarness);
    expect(await saveBtn.isDisabled()).toBe(false);

    await saveBtn.click();
    expect(saveChanges).toHaveBeenCalledTimes(1);
  });
});

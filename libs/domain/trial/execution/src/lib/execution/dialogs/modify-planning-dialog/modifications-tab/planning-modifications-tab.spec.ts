import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import type { PlanningModification } from '../../../../data-access/planning-modifications';
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

describe('PlanningModificationsTab', () => {
  const setup = async (inputs: Record<string, unknown> = {}) => {
    const classificationChange = vi.fn();
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
        saveChanges,
      },
      providers: [provideTranslateService()],
    });

    const loader: HarnessLoader = TestbedHarnessEnvironment.loader(view.fixture);
    return { view, loader, classificationChange, saveChanges };
  };

  it('displays the empty state when there are no modifications', async () => {
    await setup({ modifications: [] });

    expect(
      screen.getByText('TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.EMPTY_STATE'),
    ).toBeInTheDocument();
  });

  it('renders modification rows with parameter, values, affected shots, and status', async () => {
    await setup({ modifications: [draftMod] });

    expect(screen.getByText('Elevación')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('D2')).toBeInTheDocument();
    expect(screen.getByText('Borrador')).toBeInTheDocument();
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
    expect(
      screen.getByText('TRIAL_EXECUTION.PLANNING_MODIFICATION.BLOCKED_MODAL.TITLE'),
    ).toBeInTheDocument();

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

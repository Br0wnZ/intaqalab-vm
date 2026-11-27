import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Role } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import type { ExecutionHeaderData, ExecutionShotInfo } from '../../../models/execution-page.models';
import { ExecutionHeader } from './execution-header';

const DEFAULT_EXECUTION_DATA: ExecutionHeaderData = {
  code: '034A/25',
  client: 'Cliente: TEST',
  project: 'Test trial',
  status: 'Interrumpida',
  statusValue: TrialStatus.IN_PROGRESS,
};

const DEFAULT_SHOT_INFO: ExecutionShotInfo = {
  actual: {
    serie: 'Serie 1',
    shot: 'Disparo 1',
    percentage: '50',
  },
  all: [],
};

describe('ExecutionHeader', () => {
  const setup = async ({
    statusValue = TrialStatus.IN_PROGRESS,
    canModifyPlanning = false,
    canViewModifications = false,
    userRoles = [Role.INTAQALAB_ADMIN],
  }: {
    statusValue?: TrialStatus;
    canModifyPlanning?: boolean;
    canViewModifications?: boolean;
    userRoles?: readonly Role[];
  } = {}) => {
    const modifyPlanningSpy = vi.fn();
    const viewModificationsSpy = vi.fn();

    const view = await render(ExecutionHeader, {
      providers: [provideTranslateService()],
      inputs: {
        executionData: { ...DEFAULT_EXECUTION_DATA, statusValue },
        shotInfo: DEFAULT_SHOT_INFO,
        hasUnsavedChanges: false,
        isSaving: false,
        editMode: false,
        canSelectEquipment: true,
        canModifyPlanning,
        canViewModifications,
        userRoles,
      },
      on: {
        modifyPlanning: modifyPlanningSpy,
        viewModifications: viewModificationsSpy,
      },
    });

    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    return { view, loader, modifyPlanningSpy, viewModificationsSpy };
  };

  it('hides modify planning and view modifications actions by default', async () => {
    const { loader } = await setup();

    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();

    const modifyItems = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_MODIFY_PLANNING/i });
    const viewItems = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_VIEW_MODIFICATIONS/i });

    expect(modifyItems).toHaveLength(0);
    expect(viewItems).toHaveLength(0);
  });

  it('shows actions available while execution is in progress', async () => {
    const { loader } = await setup();

    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();

    const items = await menu.getItems();
    expect(await Promise.all(items.map((item) => item.getText()))).toEqual([
      'TRIAL_EXECUTION.ACTION_PAUSE',
      'TRIAL_EXECUTION.ACTION_STOP',
      'TRIAL_EXECUTION.ACTION_CANCEL',
      'TRIAL_EXECUTION.ACTION_FINISH',
    ]);
  });

  it('renders resume as a standalone button when execution is interrupted', async () => {
    await setup({ statusValue: TrialStatus.INTERRUPTED });

    expect(screen.getByRole('button', { name: /TRIAL_EXECUTION\.ACTION_RESUME/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /TRIAL_EXECUTION\.ACTIONS/i })).not.toBeInTheDocument();
  });

  it.each([
    { role: Role.INTAQALAB_ADMIN, actions: ['PAUSE', 'STOP', 'CANCEL', 'FINISH'] },
    { role: Role.INTAQALAB_SHOOTING_LINE_HEAD, actions: ['PAUSE', 'STOP', 'CANCEL', 'FINISH'] },
    { role: Role.INTAQALAB_TRIAL_ENGINEER, actions: ['STOP', 'CANCEL'] },
    { role: Role.INTAQALAB_TRIAL_ADMINISTRATIVE, actions: ['STOP'] },
    { role: Role.INTAQALAB_PLANNING_ANALYSIS_HEAD, actions: ['STOP'] },
    { role: Role.INTAQALAB_TRIAL_CONSULTANT, actions: ['STOP'] },
    { role: Role.INTAQALAB_ARMAMENT_UNIT_HEAD, actions: ['STOP'] },
    { role: Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN, actions: ['STOP'] },
    { role: Role.INTAQALAB_MUNITIONS_UNIT_HEAD, actions: ['STOP'] },
    { role: Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN, actions: ['STOP'] },
    { role: Role.INTAQALAB_BALLISTICS_UNIT_HEAD, actions: ['STOP'] },
    { role: Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN, actions: ['STOP'] },
    { role: Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD, actions: ['STOP'] },
    { role: Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN, actions: ['STOP'] },
    { role: Role.INTAQALAB_VIEWER, actions: [] },
  ])('shows permitted in-progress actions for $role', async ({ role, actions }) => {
    const { loader } = await setup({ userRoles: [role] });
    const labels = actions.map((action) => `TRIAL_EXECUTION.ACTION_${action}`);
    let visibleActions: string[];

    if (labels.length > 1) {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
      await menu.open();
      const items = await menu.getItems();
      visibleActions = await Promise.all(items.map((item) => item.getText()));
    } else {
      visibleActions = screen
        .queryAllByRole('button', { name: /TRIAL_EXECUTION\.ACTION_/ })
        .map((button) => button.textContent?.trim() ?? '');
    }

    expect(visibleActions).toEqual(labels);
  });

  it.each([TrialStatus.PLANNED, TrialStatus.STARTED, TrialStatus.INTERRUPTED])(
    'hides unauthorized state actions for viewers in %s',
    async (statusValue) => {
      await setup({ statusValue, userRoles: [Role.INTAQALAB_VIEWER] });

      expect(
        screen.queryByRole('button', { name: /TRIAL_EXECUTION\.ACTION(?:S|_START|_RESUME|_CANCEL)$/ }),
      ).not.toBeInTheDocument();
    },
  );

  it('uses the union of permissions for users with multiple roles', async () => {
    const { loader } = await setup({ userRoles: [Role.INTAQALAB_VIEWER, Role.INTAQALAB_TRIAL_ENGINEER] });
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();
    const items = await menu.getItems();

    expect(await Promise.all(items.map((item) => item.getText()))).toEqual([
      'TRIAL_EXECUTION.ACTION_STOP',
      'TRIAL_EXECUTION.ACTION_CANCEL',
    ]);
  });

  it('allows engineers to cancel started trials but not resume them', async () => {
    await setup({ statusValue: TrialStatus.STARTED, userRoles: [Role.INTAQALAB_TRIAL_ENGINEER] });

    expect(screen.getByRole('button', { name: 'TRIAL_EXECUTION.ACTION_CANCEL' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'TRIAL_EXECUTION.ACTION_RESUME' })).not.toBeInTheDocument();
  });

  it.each([TrialStatus.PLANNED, TrialStatus.INTERRUPTED])(
    'allows shooting line heads to control trials in %s',
    async (statusValue) => {
      await setup({ statusValue, userRoles: [Role.INTAQALAB_SHOOTING_LINE_HEAD] });
      const label = statusValue === TrialStatus.PLANNED ? 'ACTION_START' : 'ACTION_RESUME';

      expect(screen.getByRole('button', { name: `TRIAL_EXECUTION.${label}` })).toBeVisible();
    },
  );

  it('hides state actions when no roles are assigned', async () => {
    await setup({ userRoles: [] });

    expect(screen.queryByRole('button', { name: /TRIAL_EXECUTION\.ACTION/ })).not.toBeInTheDocument();
  });
  it.each([
    Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
    Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
    Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
    Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD,
  ])('shows validation without an action for %s on executed trials', async (role) => {
    await setup({ statusValue: TrialStatus.EXECUTED, userRoles: [role] });

    expect(screen.getByRole('button', { name: 'TRIAL_EXECUTION.ACTION_VALIDATE' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'TRIAL_EXECUTION.ACTION_CANCEL' })).not.toBeInTheDocument();
  });

  it.each([Role.INTAQALAB_ADMIN, Role.INTAQALAB_SHOOTING_LINE_HEAD, Role.INTAQALAB_TRIAL_ENGINEER])(
    'shows only cancel for %s on executed trials',
    async (role) => {
      await setup({ statusValue: TrialStatus.EXECUTED, userRoles: [role] });

      expect(screen.getByRole('button', { name: 'TRIAL_EXECUTION.ACTION_CANCEL' })).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'TRIAL_EXECUTION.ACTION_VALIDATE' })).not.toBeInTheDocument();
    },
  );

  it('shows validation and cancel for combined roles on executed trials', async () => {
    const { loader } = await setup({
      statusValue: TrialStatus.EXECUTED,
      userRoles: [Role.INTAQALAB_ARMAMENT_UNIT_HEAD, Role.INTAQALAB_TRIAL_ENGINEER],
    });
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();
    const items = await menu.getItems();

    expect(await Promise.all(items.map((item) => item.getText()))).toEqual([
      'TRIAL_EXECUTION.ACTION_VALIDATE',
      'TRIAL_EXECUTION.ACTION_CANCEL',
    ]);
    expect(await Promise.all(items.map((item) => item.isDisabled()))).toEqual([false, false]);
  });

  it.each([Role.INTAQALAB_ADMIN, Role.INTAQALAB_PLANNING_ANALYSIS_HEAD, Role.INTAQALAB_SHOOTING_LINE_HEAD])(
    'allows %s to reactivate canceled trials',
    async (role) => {
      await setup({ statusValue: TrialStatus.CANCELLED, userRoles: [role] });

      expect(screen.getByRole('button', { name: 'TRIAL_EXECUTION.ACTION_REACTIVATE' })).toBeVisible();
    },
  );

  it.each([
    Role.INTAQALAB_TRIAL_ENGINEER,
    Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
    Role.INTAQALAB_TRIAL_CONSULTANT,
    Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
    Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
    Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
    Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
    Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
    Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
    Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD,
    Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN,
    Role.INTAQALAB_VIEWER,
  ])('hides reactivate for unauthorized role %s', async (role) => {
    await setup({ statusValue: TrialStatus.CANCELLED, userRoles: [role] });

    expect(screen.queryByRole('button', { name: 'TRIAL_EXECUTION.ACTION_REACTIVATE' })).not.toBeInTheDocument();
  });

  it('shows modify planning action and emits modifyPlanning when clicked', async () => {
    const { loader, modifyPlanningSpy } = await setup({ canModifyPlanning: true });

    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();

    const modifyItems = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_MODIFY_PLANNING/i });
    expect(modifyItems).toHaveLength(1);

    await modifyItems[0].click();
    expect(modifyPlanningSpy).toHaveBeenCalledOnce();
  });

  it('shows view modifications action and emits viewModifications when clicked', async () => {
    const { loader, viewModificationsSpy } = await setup({ canViewModifications: true });

    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();

    const viewItems = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_VIEW_MODIFICATIONS/i });
    expect(viewItems).toHaveLength(1);

    await viewItems[0].click();
    expect(viewModificationsSpy).toHaveBeenCalledOnce();
  });
});

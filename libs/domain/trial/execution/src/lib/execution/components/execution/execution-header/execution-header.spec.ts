import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';

import type { ExecutionHeaderData, ExecutionShotInfo } from '../../../models/execution-page.models';
import { ExecutionHeader } from './execution-header';

const DEFAULT_EXECUTION_DATA: ExecutionHeaderData = {
  code: '034A/25',
  client: 'Cliente: TEST',
  project: 'Test trial',
  status: 'Interrumpida',
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
    canModifyPlanning = false,
    canViewModifications = false,
  }: {
    canModifyPlanning?: boolean;
    canViewModifications?: boolean;
  } = {}) => {
    const modifyPlanningSpy = vi.fn();
    const viewModificationsSpy = vi.fn();

    const view = await render(ExecutionHeader, {
      providers: [provideTranslateService()],
      inputs: {
        executionData: DEFAULT_EXECUTION_DATA,
        shotInfo: DEFAULT_SHOT_INFO,
        hasUnsavedChanges: false,
        isSaving: false,
        editMode: false,
        canSelectEquipment: true,
        canModifyPlanning,
        canViewModifications,
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

import { Role } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import type { ButtonTrialActionsConfiguration } from './button-trial-actions.model';
import { filterTrialActions } from './button-trial-actions.utils';

// vi.mock hoisted by Vitest
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('filterTrialActions', () => {
  it('should filter out actions based on status', () => {
    const actions: ButtonTrialActionsConfiguration = [
      {
        label: 'Always visible',
        option: 'ALWAYS',
        status: [TrialStatus.ANALYZING],
      },
      {
        label: 'Visible for Status A',
        option: 'STATUS_A',
        status: [TrialStatus.EXECUTED],
      },
      {
        label: 'Visible for Role Admin',
        option: 'ROLE_ADMIN',
        status: [TrialStatus.EXECUTED],
      },
      {
        label: 'Visible for Status A AND Role Admin',
        option: 'STATUS_A_AND_ROLE_ADMIN',
        status: [TrialStatus.EXECUTED],
      },
    ];
    const result = filterTrialActions(actions, TrialStatus.EXECUTED, []);
    expect(result).toHaveLength(3);
  });

  it('should filter out actions based on role', () => {
    const actions: ButtonTrialActionsConfiguration = [
      {
        label: 'Always visible',
        option: '',
        roles: [Role.INTAQALAB_ADMIN],
      },
      {
        label: 'Visible for Status A',
        option: '',
        roles: [Role.INTAQALAB_ARMAMENT_UNIT_HEAD],
      },
      {
        label: 'Visible for Role Admin',
        option: '',
        roles: [Role.INTAQALAB_ARMAMENT_UNIT_HEAD],
      },
      {
        label: 'Visible for Status A AND Role Admin',
        option: '',
        status: [TrialStatus.ANALYZING],
        roles: [Role.INTAQALAB_ARMAMENT_UNIT_HEAD],
      },
    ];
    const result = filterTrialActions(actions, TrialStatus.ANALYZING, [Role.INTAQALAB_ADMIN]);
    expect(result).toHaveLength(1);
  });

  it('should satisfy both status and role requirements', () => {
    const actions: ButtonTrialActionsConfiguration = [
      {
        label: 'Always visible',
        option: '',
        status: [TrialStatus.ANALYZING],
        roles: [Role.INTAQALAB_ADMIN],
      },
      {
        label: 'Visible for Status A',
        option: '',
        status: [TrialStatus.ANALYZING],
        roles: [Role.INTAQALAB_ARMAMENT_UNIT_HEAD],
      },
      {
        label: 'Visible for Role Admin',
        option: '',
        status: [TrialStatus.ANALYZING],
        roles: [Role.INTAQALAB_ARMAMENT_UNIT_HEAD],
      },
      {
        label: 'Visible for Status A AND Role Admin',
        option: '',
        status: [TrialStatus.ANALYZING],
        roles: [Role.INTAQALAB_ARMAMENT_UNIT_HEAD],
      },
    ];
    const result = filterTrialActions(actions, TrialStatus.ANALYZING, [Role.INTAQALAB_ADMIN]);
    expect(result).toHaveLength(1);
  });
});

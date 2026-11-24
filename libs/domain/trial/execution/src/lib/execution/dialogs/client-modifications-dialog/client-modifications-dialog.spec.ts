import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ToastrService } from 'ngx-toastr';
import { describe, expect, it, vi } from 'vitest';

import type { PlanningModification } from '../../../data-access';
import { PlanningModificationsService } from '../../../data-access';
import { ClientModificationsDialog } from './client-modifications-dialog';
import type {
  ClientModificationsDialogData,
  ClientModificationsDialogResult,
} from './client-modifications-dialog.models';

function createSampleModifications(): PlanningModification[] {
  return [
    {
      id: 'mod-pending-1',
      parameter: 'Elevación',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2', 'D3'],
      status: 'PENDIENTE',
      classification: 'acepta',
    },
    {
      id: 'mod-accepted-1',
      parameter: 'Temperatura',
      action: 'Alta',
      previousValue: null,
      newValue: '40 ºC',
      affectedShots: ['D4'],
      status: 'ACEPTADO',
      classification: 'none',
    },
    {
      id: 'mod-rejected-1',
      parameter: 'Orientación',
      action: 'Baja',
      previousValue: 45,
      newValue: null,
      affectedShots: null,
      status: 'RECHAZADO',
      classification: 'solicita',
    },
  ];
}

describe('ClientModificationsDialog', () => {
  const setup = async ({
    data = { fireTrialId: 'trial-1', centerId: 'center-1' },
    modifications = createSampleModifications(),
    loadError = null,
  }: {
    data?: ClientModificationsDialogData;
    modifications?: PlanningModification[];
    loadError?: Error | null;
  } = {}) => {
    const user = userEvent.setup();
    const closeSpy = vi.fn<(result?: ClientModificationsDialogResult) => void>();
    const toastr = {
      success: vi.fn(),
      error: vi.fn(),
    };
    const serviceMock = {
      fetchModifications: loadError
        ? vi.fn().mockRejectedValue(loadError)
        : vi.fn().mockResolvedValue(modifications),
      approveModification: vi.fn().mockImplementation(async (_trialId: string, modId: string) => {
        const target = modifications.find((m) => m.id === modId);
        if (!target) {
          throw new Error('Not found');
        }
        return { ...target, status: 'ACEPTADO' as const };
      }),
      rejectModification: vi.fn().mockImplementation(async (_trialId: string, modId: string) => {
        const target = modifications.find((m) => m.id === modId);
        if (!target) {
          throw new Error('Not found');
        }
        return { ...target, status: 'RECHAZADO' as const };
      }),
    };

    const view = await render(ClientModificationsDialog, {
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: PlanningModificationsService, useValue: serviceMock },
        { provide: ToastrService, useValue: toastr },
      ],
    });

    await waitFor(() => {
      expect(serviceMock.fetchModifications).toHaveBeenCalledWith(data.fireTrialId, data.centerId);
    });

    return { user, view, closeSpy, serviceMock, toastr };
  };

  it('loads and displays all modifications with formatted fields', async () => {
    await setup();

    expect(screen.getByText('Elevación')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('D2, D3')).toBeInTheDocument();
    expect(screen.getByText('Temperatura')).toBeInTheDocument();
    expect(screen.getByText('40 ºC')).toBeInTheDocument();
    expect(screen.getByText('Orientación')).toBeInTheDocument();
  });

  it('filters modifications by status tabs and displays empty state when no items match', async () => {
    const { user } = await setup({
      modifications: [createSampleModifications()[0]],
    });

    const pendingTab = screen.getByRole('tab', {
      name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.FILTER_PENDING/i,
    });
    await user.click(pendingTab);
    expect(screen.getByText('Elevación')).toBeInTheDocument();

    const acceptedTab = screen.getByRole('tab', {
      name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.FILTER_ACCEPTED/i,
    });
    await user.click(acceptedTab);
    expect(screen.queryByText('Elevación')).not.toBeInTheDocument();
    expect(screen.getByText('TRIAL_EXECUTION.PLANNING_MODIFICATION.CLIENT_REVIEW.EMPTY_STATE')).toBeInTheDocument();
  });

  it('shows accept and reject buttons only for pending rows when review is allowed', async () => {
    await setup();

    const acceptButtons = screen.getAllByRole('button', {
      name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.ACCEPT_BTN/i,
    });
    const rejectButtons = screen.getAllByRole('button', {
      name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.REJECT_BTN/i,
    });

    expect(acceptButtons).toHaveLength(1);
    expect(rejectButtons).toHaveLength(1);
  });

  it('hides accept and reject buttons when allowReview is false', async () => {
    await setup({
      data: { fireTrialId: 'trial-1', centerId: 'center-1', allowReview: false },
    });

    expect(
      screen.queryByRole('button', {
        name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.ACCEPT_BTN/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.REJECT_BTN/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('approves a pending modification, updates UI immediately, and reports accepted changes on close', async () => {
    const { user, serviceMock, closeSpy, toastr } = await setup();

    const acceptBtn = screen.getByRole('button', {
      name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.ACCEPT_BTN/i,
    });
    await user.click(acceptBtn);

    await waitFor(() => {
      expect(serviceMock.approveModification).toHaveBeenCalledWith('trial-1', 'mod-pending-1', undefined, 'center-1');
    });

    expect(
      screen.queryByRole('button', {
        name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.ACCEPT_BTN/i,
      }),
    ).not.toBeInTheDocument();
    expect(toastr.success).toHaveBeenCalledWith('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.APPROVE_SUCCESS');

    const closeButtons = screen.getAllByRole('button', {
      name: /^TRIAL_EXECUTION\.PLANNING_MODIFICATION\.DIALOG\.CLOSE_BTN$/i,
    });
    await user.click(closeButtons[closeButtons.length - 1]);

    expect(closeSpy).toHaveBeenCalledWith({
      hasAcceptedChanges: true,
      hasDecisions: true,
    });
  });

  it('rejects a pending modification, updates UI immediately, and reports decisions without accepted changes on close', async () => {
    const { user, serviceMock, closeSpy, toastr } = await setup();

    const rejectBtn = screen.getByRole('button', {
      name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.REJECT_BTN/i,
    });
    await user.click(rejectBtn);

    await waitFor(() => {
      expect(serviceMock.rejectModification).toHaveBeenCalledWith('trial-1', 'mod-pending-1', undefined, 'center-1');
    });

    expect(
      screen.queryByRole('button', {
        name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.CLIENT_REVIEW\.REJECT_BTN/i,
      }),
    ).not.toBeInTheDocument();
    expect(toastr.success).toHaveBeenCalledWith('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.REJECT_SUCCESS');

    const closeButtons = screen.getAllByRole('button', {
      name: /^TRIAL_EXECUTION\.PLANNING_MODIFICATION\.DIALOG\.CLOSE_BTN$/i,
    });
    await user.click(closeButtons[closeButtons.length - 1]);

    expect(closeSpy).toHaveBeenCalledWith({
      hasAcceptedChanges: false,
      hasDecisions: true,
    });
  });

  it('returns no decisions and no accepted changes when closed without reviewing', async () => {
    const { user, closeSpy } = await setup();

    const closeButtons = screen.getAllByRole('button', {
      name: /^TRIAL_EXECUTION\.PLANNING_MODIFICATION\.DIALOG\.CLOSE_BTN$/i,
    });
    await user.click(closeButtons[closeButtons.length - 1]);

    expect(closeSpy).toHaveBeenCalledWith({
      hasAcceptedChanges: false,
      hasDecisions: false,
    });
  });

  it('renders error state when loading modifications fails', async () => {
    await setup({ loadError: new Error('Network failure') });

    expect(await screen.findByText('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.LOAD_ERROR')).toBeInTheDocument();
    expect(screen.getByText('Network failure')).toBeInTheDocument();
  });
});

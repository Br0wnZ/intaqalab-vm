import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import type { FireTrial, TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import {
  FeaturePlanningGeneralDataShellComponent,
  type PlanningFieldChangeEvent,
  type PlanningShellMode,
} from '@intaqalab/planning';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { ToastrService } from 'ngx-toastr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type PlanningModification,
  PlanningModificationsService,
  type SubmitPlanningModificationsResponse,
} from '../../../data-access/planning-modifications';
import { ModifyPlanningDialog } from './modify-planning-dialog';
import type { ModifyPlanningDialogData } from './modify-planning-dialog.models';

@Component({
  selector: 'inta-feature-planning-general-data-shell',
  template: `
    <div data-testid="planning-shell-stub">{{ mode() }}</div>
  `,
})
class PlanningShellStub {
  readonly trial = input<TrialCreateModifyForm>();
  readonly trialId = input<FireTrial['id']>();
  readonly mode = input<PlanningShellMode>('planning');
  readonly executedShotIds = input<ReadonlyArray<string>>([]);
  readonly planningFieldChanged = output<PlanningFieldChangeEvent>();
}

const mockTrial: TrialCreateModifyForm = {
  code: 'PT-2026-001',
  hasAssociatedTrial: false,
  hasLinkedTrial: false,
  associatedTrial: '',
  associatedTrialView: '',
  linkedTrial: '',
  linkedTrialView: '',
  description: 'Initial description',
  type: 'type-1',
  client: 'client-1',
  clientReference: 'REF-01',
  requestedDate: '2026-11-19',
  observations: '',
  status: TrialStatus.INTERRUPTED,
};

const defaultDialogData: ModifyPlanningDialogData = {
  fireTrialId: 'trial-123',
  centerId: 'center-1',
  fireTrial: mockTrial,
  executedShotIds: ['shot-1'],
};

describe('ModifyPlanningDialog', () => {
  let closeMock: ReturnType<typeof vi.fn>;
  let fetchModificationsMock: ReturnType<typeof vi.fn>;
  let saveDraftMock: ReturnType<typeof vi.fn>;
  let submitModificationsMock: ReturnType<typeof vi.fn>;
  let toastrSuccessMock: ReturnType<typeof vi.fn>;
  let toastrErrorMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    closeMock = vi.fn();
    fetchModificationsMock = vi.fn<() => Promise<PlanningModification[]>>().mockResolvedValue([]);
    saveDraftMock = vi.fn<() => Promise<PlanningModification[]>>().mockResolvedValue([]);
    submitModificationsMock = vi.fn<() => Promise<SubmitPlanningModificationsResponse>>().mockResolvedValue({
      modifications: [],
      acceptedCount: 0,
      pendingCount: 0,
    });
    toastrSuccessMock = vi.fn();
    toastrErrorMock = vi.fn();
  });

  const setup = async (data: ModifyPlanningDialogData = defaultDialogData) => {
    TestBed.overrideComponent(ModifyPlanningDialog, {
      remove: { imports: [FeaturePlanningGeneralDataShellComponent] },
      add: { imports: [PlanningShellStub] },
    });

    const view = await render(ModifyPlanningDialog, {
      providers: [
        { provide: MatDialogRef, useValue: { close: closeMock } },
        { provide: MAT_DIALOG_DATA, useValue: data },
        {
          provide: PlanningModificationsService,
          useValue: {
            fetchModifications: fetchModificationsMock,
            saveDraft: saveDraftMock,
            submitModifications: submitModificationsMock,
            changesResource: { value: signal([]), reload: vi.fn() },
          },
        },
        {
          provide: ToastrService,
          useValue: {
            success: toastrSuccessMock,
            error: toastrErrorMock,
          },
        },
        provideTranslateService(),
      ],
    });

    const loader: HarnessLoader = TestbedHarnessEnvironment.loader(view.fixture);
    return { view, loader };
  };

  it('loads existing modifications on init and embeds the planning shell in execution-modification mode', async () => {
    await setup();

    expect(fetchModificationsMock).toHaveBeenCalledWith('trial-123', 'center-1');
    expect(screen.getByTestId('planning-shell-stub')).toHaveTextContent('execution-modification');
    expect(
      screen.getByRole('heading', {
        name: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.DIALOG\.TITLE_WITH_CODE/,
      }),
    ).toBeInTheDocument();
  });

  it('falls back to generic dialog title when fireTrial is null', async () => {
    await setup({ ...defaultDialogData, fireTrial: null });

    expect(
      screen.getByRole('heading', {
        name: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.TITLE',
      }),
    ).toBeInTheDocument();
  });

  it('registers a draft modification on field change and removes it when reverted to baseline', async () => {
    const { view } = await setup();
    const instance = view.fixture.componentInstance;

    instance.onPlanningFieldChanged({
      section: 'shooting-conditions',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
    });
    view.fixture.detectChanges();

    expect(screen.getByText('1')).toBeInTheDocument();

    instance.onPlanningFieldChanged({
      section: 'shooting-conditions',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 20,
      newValue: 10,
      affectedShots: ['D2'],
    });
    view.fixture.detectChanges();

    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('keeps dialog open after saving changes and returns updated result on close', async () => {
    const submittedMod: PlanningModification = {
      id: 'mod-saved-1',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
      status: 'ACEPTADO',
      classification: 'none',
    };
    saveDraftMock.mockResolvedValue([submittedMod]);
    submitModificationsMock.mockResolvedValue({
      modifications: [submittedMod],
      acceptedCount: 1,
      pendingCount: 0,
    });

    const { view, loader } = await setup();
    const instance = view.fixture.componentInstance;

    instance.onPlanningFieldChanged({
      section: 'shooting-conditions',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
    });

    await instance.onSaveChanges();

    expect(closeMock).not.toHaveBeenCalled();
    expect(toastrSuccessMock).toHaveBeenCalledTimes(1);

    const closeBtn = await loader.getHarness(
      MatButtonHarness.with({ text: /TRIAL_EXECUTION\.PLANNING_MODIFICATION\.DIALOG\.CLOSE_BTN/ }),
    );
    await closeBtn.click();

    expect(closeMock).toHaveBeenCalledWith({
      saved: true,
      hasAcceptedChanges: true,
      hasPendingChanges: false,
    });
  });

  it('reports pending changes in dialog result when submitted modifications require client approval', async () => {
    const pendingSubmittedMod: PlanningModification = {
      id: 'mod-pending-1',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
      status: 'PENDIENTE',
      classification: 'acepta',
    };
    saveDraftMock.mockResolvedValue([pendingSubmittedMod]);
    submitModificationsMock.mockResolvedValue({
      modifications: [pendingSubmittedMod],
      acceptedCount: 0,
      pendingCount: 1,
    });

    const { view } = await setup();
    const instance = view.fixture.componentInstance;

    instance.onPlanningFieldChanged({
      section: 'shooting-conditions',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
    });
    instance.onClassificationChange({
      modId: 'shooting-conditions::elevation::D2',
      classification: 'acepta',
    });

    await instance.onSaveChanges();
    instance.onClose();

    expect(closeMock).toHaveBeenCalledWith({
      saved: true,
      hasAcceptedChanges: false,
      hasPendingChanges: true,
    });
  });

  it('ignores planning field changes when pending modifications lock editing', async () => {
    fetchModificationsMock.mockResolvedValue([
      {
        id: 'existing-pending',
        parameter: 'orientation',
        action: 'Modificación',
        previousValue: 45,
        newValue: 90,
        affectedShots: ['D2'],
        status: 'PENDIENTE',
        classification: 'acepta',
      },
    ]);

    const { view } = await setup();
    await view.fixture.whenStable();
    view.fixture.detectChanges();

    const instance = view.fixture.componentInstance;
    instance.onPlanningFieldChanged({
      section: 'shooting-conditions',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
    });
    view.fixture.detectChanges();

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

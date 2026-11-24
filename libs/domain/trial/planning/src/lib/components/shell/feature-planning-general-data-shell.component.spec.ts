import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService, Role } from '@intaqalab/core';
import { type TrialCreateModifyForm, TrialStatus } from '@intaqalab/models';
import { createMockPlanningGeneralDataStore, createTrial } from '@intaqalab/utils';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import type { PlanningFieldChangeEvent, PlanningShellMode } from '../../models/planning-shell.model';
import { FeaturePlanningGeneralDataShellComponent } from './feature-planning-general-data-shell.component';

interface SetupOptions {
  storeOverrides?: Parameters<typeof createMockPlanningGeneralDataStore>[0];
  roles?: Role[];
  mode?: PlanningShellMode;
  trial?: TrialCreateModifyForm;
  trialId?: string;
  executedShotIds?: ReadonlyArray<string>;
  onPlanningFieldChanged?: (event: PlanningFieldChangeEvent) => void;
}

describe('FeaturePlanningGeneralDataShellComponent', () => {
  const planningInfoFixture = {
    goal: 'Goal',
    specimens: [{ specimenId: 'specimen-1', batch: '' }],
    planningUser: { id: 'user-1', fullname: 'User One' },
    observations: 'Observations',
    requirements: 'Requirements',
    additionalInfo: 'Additional info',
    dateControl: {
      maxEmissionDates: 10,
      percentageTechnicalUnits: 40,
      percentageEndTrial: 60,
      daysSignReport: 5,
    },
  };

  const runSetup = async (options: SetupOptions = {}) => {
    const mockStore = createMockPlanningGeneralDataStore({
      fireTrial: { ...createTrial(), status: TrialStatus.PLANNED },
      fireTrialId: 'trial-123',
      ...options.storeOverrides,
    });

    const roles = options.roles ?? [Role.INTAQALAB_ADMIN];

    const view = await render(FeaturePlanningGeneralDataShellComponent, {
      inputs: {
        ...(options.mode !== undefined ? { mode: options.mode } : {}),
        ...(options.trial !== undefined ? { trial: options.trial } : {}),
        ...(options.trialId !== undefined ? { trialId: options.trialId } : {}),
        ...(options.executedShotIds !== undefined ? { executedShotIds: options.executedShotIds } : {}),
      },
      on: options.onPlanningFieldChanged ? { planningFieldChanged: options.onPlanningFieldChanged } : undefined,
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: AuthService, useValue: { userRoles: signal(roles) } },
        provideTranslateService(),
      ],
      componentProviders: [{ provide: PlanningGeneralDataStore, useValue: mockStore }],
    });

    return { view, mockStore };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the component', async () => {
    const { view } = await runSetup();
    expect(view.fixture.componentInstance).toBeTruthy();
  }, 15000);

  it('should render the tabs navigation', async () => {
    await runSetup();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('should render the general data tab', async () => {
    await runSetup();
    expect(screen.getByRole('tab', { name: /TRIAL_PLANNING.GENERAL_DATA_SECTION.TAB_TITLE/i })).toBeInTheDocument();
  });

  it('should keep shooting conditions tab disabled when there are no series with shots', async () => {
    await runSetup({
      storeOverrides: {
        planningInfo: planningInfoFixture,
        series: [{ shotQuantity: 0, shots: [] }],
      },
    });

    expect(screen.getByRole('tab', { name: /TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE/i })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('should enable shooting conditions tab when there is at least one series with shots', async () => {
    await runSetup({
      storeOverrides: {
        planningInfo: planningInfoFixture,
        series: [{ shotQuantity: 1, shots: [{ id: 'shot-1' }] }],
      },
    });

    expect(screen.getByRole('tab', { name: /TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE/i })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  // The store (single source of truth) drives readonly, not the static `trial` input —
  // this is what keeps the form locked/unlocked in sync right after validate/unlock resolve.
  describe('Readonly derived from store status (not the static trial input)', () => {
    it('should be readonly when the store trial status is PLANNED, even with an edit-capable role', async () => {
      const { view } = await runSetup({
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.PLANNED } },
      });
      expect(view.fixture.componentInstance.isReadonly()).toBe(true);
    });

    it('should NOT be readonly when the store trial status is UNDER_REVIEW for an edit-capable role', async () => {
      const { view } = await runSetup({
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.UNDER_REVIEW } },
      });
      expect(view.fixture.componentInstance.isReadonly()).toBe(false);
    });
  });

  describe('Execution modification mode', () => {
    it('should allow planning access regardless of standard planning tab permissions', async () => {
      const { view } = await runSetup({
        mode: 'execution-modification',
        roles: [Role.INTAQALAB_VIEWER],
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.INTERRUPTED } },
      });

      expect(view.fixture.componentInstance.canAccessPlanning()).toBe(true);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should NOT be readonly for Trial Engineer when trial status is INTERRUPTED', async () => {
      const { view } = await runSetup({
        mode: 'execution-modification',
        roles: [Role.INTAQALAB_TRIAL_ENGINEER],
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.INTERRUPTED } },
      });

      expect(view.fixture.componentInstance.isReadonly()).toBe(false);
    });

    it('should be readonly for Trial Engineer when trial status is not INTERRUPTED', async () => {
      const { view } = await runSetup({
        mode: 'execution-modification',
        roles: [Role.INTAQALAB_TRIAL_ENGINEER],
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.IN_PROGRESS } },
      });

      expect(view.fixture.componentInstance.isReadonly()).toBe(true);
    });

    it('should be readonly for non-engineer roles even when trial status is INTERRUPTED', async () => {
      const { view } = await runSetup({
        mode: 'execution-modification',
        roles: [Role.INTAQALAB_PLANNING_ANALYSIS_HEAD],
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.INTERRUPTED } },
      });

      expect(view.fixture.componentInstance.isReadonly()).toBe(true);
    });

    it('should mark executed shots as readonly while keeping non-executed shots editable', async () => {
      const { view } = await runSetup({
        mode: 'execution-modification',
        roles: [Role.INTAQALAB_TRIAL_ENGINEER],
        executedShotIds: ['shot-1'],
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.INTERRUPTED } },
      });

      expect(view.fixture.componentInstance.isShotReadonly('shot-1')).toBe(true);
      expect(view.fixture.componentInstance.isShotReadonly('shot-2')).toBe(false);
    });

    it('should emit planningFieldChanged when notifyFieldChange is called in execution-modification mode', async () => {
      const onFieldChanged = vi.fn();
      const { view } = await runSetup({
        mode: 'execution-modification',
        roles: [Role.INTAQALAB_TRIAL_ENGINEER],
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.INTERRUPTED } },
        onPlanningFieldChanged: onFieldChanged,
      });

      const event: PlanningFieldChangeEvent = {
        section: 'shooting-conditions',
        parameter: 'elevation',
        action: 'Modificación',
        previousValue: 10,
        newValue: 20,
        affectedShots: ['shot-2'],
      };

      view.fixture.componentInstance.notifyFieldChange(event);

      expect(onFieldChanged).toHaveBeenCalledExactlyOnceWith(event);
    });

    it('should NOT emit planningFieldChanged when notifyFieldChange is called in planning mode', async () => {
      const onFieldChanged = vi.fn();
      const { view } = await runSetup({
        mode: 'planning',
        roles: [Role.INTAQALAB_ADMIN],
        storeOverrides: { fireTrial: { ...createTrial(), status: TrialStatus.UNDER_REVIEW } },
        onPlanningFieldChanged: onFieldChanged,
      });

      const event: PlanningFieldChangeEvent = {
        section: 'general-data',
        parameter: 'goal',
        action: 'Modificación',
        previousValue: 'Old',
        newValue: 'New',
        affectedShots: null,
      };

      view.fixture.componentInstance.notifyFieldChange(event);

      expect(onFieldChanged).not.toHaveBeenCalled();
    });
  });

  describe('Tab Changes', () => {
    it('should call reloadPlanningInfo when General tab is selected', async () => {
      const { view, mockStore } = await runSetup();
      const component = view.fixture.componentInstance;

      const reloadSpy = vi.spyOn(mockStore, 'reloadPlanningInfo');

      component.onIndexChange(0);

      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should NOT call reloadPlanningInfo when any other tab is selected', async () => {
      const { view, mockStore } = await runSetup();
      const component = view.fixture.componentInstance;

      const reloadSpy = vi.spyOn(mockStore, 'reloadPlanningInfo');
      reloadSpy.mockClear();

      component.onIndexChange(1);

      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });

  describe('Planning Revision Mode Synchronization', () => {
    it('should set revision to baseline before setting trial data in planning mode', async () => {
      const trial = createTrial() as unknown as TrialCreateModifyForm;
      const { mockStore } = await runSetup({
        mode: 'planning',
        trial,
        trialId: 'trial-xyz',
      });

      expect(mockStore.setRevision).toHaveBeenCalledWith('baseline');
      expect(mockStore.setFireTrialData).toHaveBeenCalledWith('trial-xyz', trial);
    });

    it('should set revision to execution before setting trial data in execution-modification mode', async () => {
      const trial = createTrial() as unknown as TrialCreateModifyForm;
      const { mockStore } = await runSetup({
        mode: 'execution-modification',
        trial,
        trialId: 'trial-xyz',
      });

      expect(mockStore.setRevision).toHaveBeenCalledWith('execution');
      expect(mockStore.setFireTrialData).toHaveBeenCalledWith('trial-xyz', trial);
    });
  });
});

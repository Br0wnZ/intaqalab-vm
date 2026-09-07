import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, forwardRef, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AuthService, Role, injectionTokenTabCommand, provideTestingEnvironment } from '@intaqalab/core';
import { TrialsDataService } from '@intaqalab/data-access';
import { TrialStatus } from '@intaqalab/models';
import { Badge, UiDialogService } from '@intaqalab/ui';
import {
  TrialStatusLabelPipe,
  createMockResource,
  createMockTrialGeneralDataStore,
  createMockTrialsDataService,
} from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialTransitionsService } from '../../services/trial-transitions.service';
import { TrialGeneralDataStore } from '../shared/+state/trial-general-data.store';
import { FeatureTrialCreateFormComponent } from '../shared/components/form/feature-trial-create-form.component';
import { FeatureTrialViewShellComponent, injectionTokenTrialViewComponent } from './feature-trial-view-shell.component';

// Stub components
@Component({
  selector: 'inta-feature-trial-create-form',
  template: `
    <div data-testid="mock-trial-form"></div>
  `,
  providers: [
    {
      provide: FeatureTrialCreateFormComponent,
      useExisting: forwardRef(() => MockTrialCreateFormComponent),
    },
  ],
})
class MockTrialCreateFormComponent {
  readonly editable = input.required<boolean>();
  readonly trialId = input<string | undefined>();
  readonly formData = input<Record<string, unknown> | null>();
  readonly viewDocument = output<string>();

  readonly _valid = signal(false);
  readonly _value = signal<Record<string, unknown>>({ type: 't1', client: 'c1' });
  readonly markAsTouchedSpy = vi.fn();

  readonly upsertTrialModel = signal<Record<string, unknown>>({ type: '', client: '' });
  readonly upsertTrialForm = signal({
    valid: () => this._valid(),
    value: () => this._value(),
    markAsTouched: () => this.markAsTouchedSpy(),
  });
}

@Component({
  selector: 'inta-feature-planning-general-data-shell',
  template: `
    <div data-testid="mock-planning-shell"></div>
  `,
})
class MockPlanningShellComponent {
  readonly trial = input<Record<string, unknown>>();
  readonly trialId = input<string>();
  readonly hasPlanniUsers = input<boolean>();
}

@Component({
  selector: 'inta-button-trial-actions-impl',
  template: `
    <button data-testid="trial-actions-btn" (click)="clicked.emit('MODIFY')">Actions</button>
  `,
})
class MockButtonTrialActionsImplComponent {
  readonly trial = input.required<Record<string, unknown>>();
  readonly clicked = output<string>();
}

// Helpers
const MOCK_TRIAL = {
  code: 'T-001',
  status: TrialStatus.EXECUTED,
  hasAssociatedTrial: false,
  hasLinkedTrial: false,
  associatedTrial: '',
  linkedTrial: '',
  description: 'desc',
  type: 't1',
  client: 'c1',
  clientReference: 'ref',
  requestedDate: '2025-01-01',
  observations: 'obs',
  statusReason: '',
  validated: false,
};

function createMockTransitionsService() {
  const actionResource = createMockResource<void>();
  const deleteResource = createMockResource<void>();
  return {
    actionResource,
    deleteResource,
    cancel: vi.fn(),
    void: vi.fn(),
    close: vi.fn(),
    reopen: vi.fn(),
    reactivate: vi.fn(),
    delete: vi.fn(),
    resetDelete: vi.fn(),
    _actionResource: actionResource,
    _deleteResource: deleteResource,
  };
}

describe('FeatureTrialViewShellComponent', () => {
  let mockTrialStore: ReturnType<typeof createMockTrialGeneralDataStore> & {
    hasPlanniUser: ReturnType<typeof vi.fn>;
  };
  let mockTrialsDataService: ReturnType<typeof createMockTrialsDataService> & {
    resetUpdateTrial: ReturnType<typeof vi.fn>;
  };
  let mockTransitionsService: ReturnType<typeof createMockTransitionsService>;
  let mockUiDialogs: { confirm: ReturnType<typeof vi.fn>; input: ReturnType<typeof vi.fn> };
  let mockTabCommand: ReturnType<typeof vi.fn>;

  const setup = async (options: { trialData?: typeof MOCK_TRIAL | null; roles?: Role[] } = {}) => {
    const trialData = options.trialData !== undefined ? options.trialData : MOCK_TRIAL;
    const roles = options.roles ?? [];
    mockTrialStore = {
      ...createMockTrialGeneralDataStore({ trial: trialData, trialId: 'someId' }),
      hasPlanniUser: vi.fn(() => false),
    };
    mockTrialsDataService = {
      ...createMockTrialsDataService(),
      resetUpdateTrial: vi.fn(),
    };
    mockTransitionsService = createMockTransitionsService();
    mockUiDialogs = { confirm: vi.fn().mockResolvedValue(true), input: vi.fn().mockResolvedValue('some reason') };
    mockTabCommand = vi.fn();
    const user = userEvent.setup();

    TestBed.overrideComponent(FeatureTrialViewShellComponent, {
      set: {
        imports: [
          MatTabsModule,
          MatButton,
          MatCardModule,
          MatIconModule,
          MatTooltipModule,
          TranslateModule,
          Badge,
          TrialStatusLabelPipe,
          MockTrialCreateFormComponent,
          MockPlanningShellComponent,
          MockButtonTrialActionsImplComponent,
        ],
        providers: [{ provide: TrialGeneralDataStore, useValue: mockTrialStore }],
      },
    });

    const { fixture } = await render(FeatureTrialViewShellComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: AuthService, useValue: { userRoles: signal(roles) } },
        { provide: TrialsDataService, useValue: mockTrialsDataService },
        { provide: TrialTransitionsService, useValue: mockTransitionsService },
        { provide: UiDialogService, useValue: mockUiDialogs },
        { provide: injectionTokenTrialViewComponent, useValue: { id: 'someId' } },
        { provide: injectionTokenTabCommand, useValue: mockTabCommand },
      ],
    });

    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { user, fixture, component };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the page heading', async () => {
      await setup();
      expect(screen.getByText('TRIAL_CREATE_MODIFY_FORM.HEADING_PAGE')).toBeInTheDocument();
    });

    it('should render the two tabs', async () => {
      await setup();
      expect(screen.getByText('TAPS_TOP.TRIAL_GENERAL_INFO')).toBeInTheDocument();
      expect(screen.getByText('TAPS_TOP.TRIAL_PLANIFICATION')).toBeInTheDocument();
    });

    it('should render the trial form component', async () => {
      await setup();
      expect(screen.getByTestId('mock-trial-form')).toBeInTheDocument();
    });

    it('should call setTrialId on store with the injected id on init', async () => {
      await setup();
      expect(mockTrialStore.setTrialId).toHaveBeenCalledWith('someId');
    });
  });

  describe('Trial status badge and reason', () => {
    it('should show the status badge when trial data is loaded', async () => {
      await setup();
      expect(screen.getByText(TrialStatus.EXECUTED)).toBeInTheDocument();
    });

    it('should not show the status badge when trial is null', async () => {
      await setup({ trialData: null });
      expect(screen.queryByText(TrialStatus.EXECUTED)).not.toBeInTheDocument();
    });

    it('should show info icon when trial is CANCELLED and has statusReason', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.CANCELLED, statusReason: 'Bad weather' },
      });
      expect(screen.getByText('info')).toBeInTheDocument();
    });

    it('should show info icon when trial is VOIDED and has statusReason', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.VOIDED, statusReason: 'Clerical error' },
      });
      expect(screen.getByText('info')).toBeInTheDocument();
    });

    it('should NOT show info icon when statusReason is empty for CANCELLED trial', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.CANCELLED, statusReason: '' },
      });
      expect(screen.queryByText('info')).not.toBeInTheDocument();
    });

    it('should NOT show info icon when trial status is EXECUTED', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.EXECUTED, statusReason: 'Some reason' },
      });
      expect(screen.queryByText('info')).not.toBeInTheDocument();
    });
  });

  describe('Edit mode (editable)', () => {
    it('should start in read-only mode (editable = false)', async () => {
      const { component } = await setup();
      expect(component.editable()).toBe(false);
    });

    it('should not show save/cancel buttons in read-only mode', async () => {
      await setup();
      expect(screen.queryByText('COMMONS.SAVE')).not.toBeInTheDocument();
      expect(screen.queryByText('COMMONS.CANCEL')).not.toBeInTheDocument();
    });

    it('should show save and cancel buttons when editable is true', async () => {
      const { component, fixture } = await setup();
      component.editable.set(true);
      fixture.detectChanges();

      expect(screen.getByText('COMMONS.SAVE')).toBeInTheDocument();
      expect(screen.getByText('COMMONS.CANCEL')).toBeInTheDocument();
    });

    it('should switch to editable when MODIFY action is triggered', async () => {
      const { component } = await setup();
      component.handleClickTrialAction('MODIFY');
      expect(component.editable()).toBe(true);
    });

    it('should return to read-only and reload trial when cancel() is called', async () => {
      const { component } = await setup();
      component.editable.set(true);
      component.cancel();

      expect(component.editable()).toBe(false);
      expect(mockTrialStore.setTrialId).toHaveBeenCalledTimes(2);
    });

    it('should trigger save when save button is clicked in template', async () => {
      const { user, component, fixture } = await setup();
      component.editable.set(true);
      fixture.detectChanges();

      const saveSpy = vi.spyOn(component, 'save');
      await user.click(screen.getByText('COMMONS.SAVE'));

      expect(saveSpy).toHaveBeenCalled();
    });

    it('should trigger cancel when cancel button is clicked in template', async () => {
      const { user, component, fixture } = await setup();
      component.editable.set(true);
      fixture.detectChanges();

      await user.click(screen.getByText('COMMONS.CANCEL'));

      expect(component.editable()).toBe(false);
      expect(mockTrialStore.setTrialId).toHaveBeenCalledTimes(2);
    });
  });

  describe('save()', () => {
    it('should call updateTrial with mapped DTO when form is valid', async () => {
      const { component, fixture } = await setup();

      component.editable.set(true);
      fixture.detectChanges();

      const mockForm = component.formComponent() as unknown as MockTrialCreateFormComponent;
      mockForm._valid.set(true);
      mockForm._value.set({ type: 't1', client: 'c1' });

      component.save();

      expect(mockTrialsDataService.updateTrial).toHaveBeenCalledWith('someId', expect.any(Object));
    });

    it('should mark form as touched and not call updateTrial when form is invalid', async () => {
      const { component, fixture } = await setup();

      component.editable.set(true);
      fixture.detectChanges();

      const mockForm = component.formComponent() as unknown as MockTrialCreateFormComponent;
      mockForm._valid.set(false);

      component.save();

      expect(mockForm.markAsTouchedSpy).toHaveBeenCalled();
      expect(mockTrialsDataService.updateTrial).not.toHaveBeenCalled();
    });
  });

  describe('handleViewDocument()', () => {
    it('should call onAction with TRIAL_VIEW_DOCUMENT command and documentId', async () => {
      const { component } = await setup();
      component.handleViewDocument('doc-123');
      expect(mockTabCommand).toHaveBeenCalledWith({ command: 'TRIAL_VIEW_DOCUMENT', argument: 'doc-123' });
    });
  });

  describe('handleClickTrialAction() with EXECUTION', () => {
    it('should call onAction with TRIAL_EXECUTION command and trialId', async () => {
      const { component } = await setup();
      component.handleClickTrialAction('EXECUTION');
      expect(mockTabCommand).toHaveBeenCalledWith({ command: 'EXECUTION', argument: 'someId' });
    });
  });

  describe('Trial actions — dialogs', () => {
    it('should call transitionsService.cancel with reason after CANCEL action', async () => {
      const { component } = await setup();
      mockUiDialogs.input.mockResolvedValue('no longer needed');

      component.handleClickTrialAction('CANCEL');

      await waitFor(() => {
        expect(mockUiDialogs.input).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'TRIAL_ACTIONS.CANCEL_TITLE' }),
        );
        expect(mockTransitionsService.cancel).toHaveBeenCalledWith('someId', 'no longer needed');
      });
    });

    it('should NOT call transitionsService.cancel when input dialog is dismissed', async () => {
      const { component } = await setup();
      mockUiDialogs.input.mockResolvedValue(false);

      component.handleClickTrialAction('CANCEL');

      await waitFor(() => expect(mockUiDialogs.input).toHaveBeenCalled());
      expect(mockTransitionsService.cancel).not.toHaveBeenCalled();
    });

    it('should call transitionsService.void with reason after ANNUL action', async () => {
      const { component } = await setup();
      mockUiDialogs.input.mockResolvedValue('annulment reason');

      component.handleClickTrialAction('ANNUL');

      await waitFor(() => expect(mockTransitionsService.void).toHaveBeenCalledWith('someId', 'annulment reason'));
    });

    it('should NOT call transitionsService.void when ANNUL dialog is dismissed', async () => {
      const { component } = await setup();
      mockUiDialogs.input.mockResolvedValue(false);

      component.handleClickTrialAction('ANNUL');

      await waitFor(() => expect(mockUiDialogs.input).toHaveBeenCalled());
      expect(mockTransitionsService.void).not.toHaveBeenCalled();
    });

    it('should call transitionsService.close after CLOSE action is confirmed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(true);

      component.handleClickTrialAction('CLOSE');

      await waitFor(() => {
        expect(mockUiDialogs.confirm).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'TRIAL_ACTIONS.CLOSE_TITLE' }),
        );
        expect(mockTransitionsService.close).toHaveBeenCalledWith('someId');
      });
    });

    it('should NOT call transitionsService.close when confirm dialog is dismissed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(false);

      component.handleClickTrialAction('CLOSE');

      await waitFor(() => expect(mockUiDialogs.confirm).toHaveBeenCalled());
      expect(mockTransitionsService.close).not.toHaveBeenCalled();
    });

    it('should call transitionsService.reopen after REOPEN action is confirmed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(true);

      component.handleClickTrialAction('REOPEN');

      await waitFor(() => expect(mockTransitionsService.reopen).toHaveBeenCalledWith('someId'));
    });

    it('should NOT call transitionsService.reopen when REOPEN dialog is dismissed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(false);

      component.handleClickTrialAction('REOPEN');

      await waitFor(() => expect(mockUiDialogs.confirm).toHaveBeenCalled());
      expect(mockTransitionsService.reopen).not.toHaveBeenCalled();
    });

    it('should call transitionsService.reactivate after REACTIVATE action is confirmed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(true);

      component.handleClickTrialAction('REACTIVATE');

      await waitFor(() => expect(mockTransitionsService.reactivate).toHaveBeenCalledWith('someId'));
    });

    it('should NOT call transitionsService.reactivate when REACTIVATE dialog is dismissed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(false);

      component.handleClickTrialAction('REACTIVATE');

      await waitFor(() => expect(mockUiDialogs.confirm).toHaveBeenCalled());
      expect(mockTransitionsService.reactivate).not.toHaveBeenCalled();
    });

    it('should call transitionsService.delete after REMOVE action is confirmed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(true);

      component.handleClickTrialAction('REMOVE');

      await waitFor(() => expect(mockTransitionsService.delete).toHaveBeenCalledWith('someId'));
    });

    it('should NOT call transitionsService.delete when REMOVE dialog is dismissed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(false);

      component.handleClickTrialAction('REMOVE');

      await waitFor(() => expect(mockUiDialogs.confirm).toHaveBeenCalled());
      expect(mockTransitionsService.delete).not.toHaveBeenCalled();
    });
  });

  describe('Planning tab access (disabled instead of showing ACCESS_DENIED)', () => {
    it('should disable planning tab when trial is null', async () => {
      await setup({ trialData: null });
      expect(screen.getByRole('tab', { name: 'TAPS_TOP.TRIAL_PLANIFICATION' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('should disable the planning tab for a role without access while UNDER_REVIEW', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.UNDER_REVIEW },
        roles: [Role.INTAQALAB_VIEWER],
      });

      expect(screen.getByRole('tab', { name: 'TAPS_TOP.TRIAL_PLANIFICATION' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('should enable the planning tab for an Admin while UNDER_REVIEW', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.UNDER_REVIEW },
        roles: [Role.INTAQALAB_ADMIN],
      });

      expect(screen.getByRole('tab', { name: 'TAPS_TOP.TRIAL_PLANIFICATION' })).toHaveAttribute(
        'aria-disabled',
        'false',
      );
    });

    it('should disable the planning tab for a viewer-only role once the trial is PLANNED', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.PLANNED },
        roles: [Role.INTAQALAB_VIEWER],
      });

      expect(screen.getByRole('tab', { name: 'TAPS_TOP.TRIAL_PLANIFICATION' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('should enable the planning tab for a non-viewer role once the trial is PLANNED', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.PLANNED },
        roles: [Role.INTAQALAB_TRIAL_ENGINEER],
      });

      expect(screen.getByRole('tab', { name: 'TAPS_TOP.TRIAL_PLANIFICATION' })).toHaveAttribute(
        'aria-disabled',
        'false',
      );
    });

    it('should disable planning tab for administrative role when trial is not validated', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.PLANNED, validated: false },
        roles: [Role.INTAQALAB_TRIAL_ADMINISTRATIVE],
      });

      expect(screen.getByRole('tab', { name: 'TAPS_TOP.TRIAL_PLANIFICATION' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('should enable planning tab for administrative role when trial is validated and PLANNED', async () => {
      await setup({
        trialData: { ...MOCK_TRIAL, status: TrialStatus.PLANNED, validated: true },
        roles: [Role.INTAQALAB_TRIAL_ADMINISTRATIVE],
      });

      expect(screen.getByRole('tab', { name: 'TAPS_TOP.TRIAL_PLANIFICATION' })).toHaveAttribute(
        'aria-disabled',
        'false',
      );
    });
  });

  describe('Effects', () => {
    it('should call setTrialId again when actionResource resolves', async () => {
      const { fixture } = await setup();

      mockTransitionsService._actionResource._setValue(null as unknown as void);
      fixture.detectChanges();

      expect(mockTrialStore.setTrialId).toHaveBeenCalledTimes(2);
      expect(mockTrialStore.setTrialId).toHaveBeenLastCalledWith('someId');
    });

    it('should call onAction with TRIAL_LIST when deleteResource status becomes resolved', async () => {
      const { fixture } = await setup();

      mockTransitionsService._deleteResource._setStatus('resolved');
      fixture.detectChanges();

      expect(mockTabCommand).toHaveBeenCalledWith({ command: 'TRIAL_LIST' });
    });

    it('should reset updateTrial, reload trial and exit editable mode when updateTrialResource resolves', async () => {
      const { component, fixture } = await setup();
      component.editable.set(true);
      fixture.detectChanges();

      mockTrialsDataService._updateTrialResource._setValue({} as unknown as Record<string, unknown>);
      fixture.detectChanges();

      expect(mockTrialsDataService.resetUpdateTrial).toHaveBeenCalled();
      expect(mockTrialStore.setTrialId).toHaveBeenCalledWith('someId');
      expect(component.editable()).toBe(false);
    });
  });

  describe('Tab selection', () => {
    it('should default selectedTab to 0', async () => {
      const { component } = await setup();
      expect(component.selectedTab()).toBe(0);
    });

    it('should update selectedTab when set', async () => {
      const { component } = await setup();
      component.selectedTab.set(1);
      expect(component.selectedTab()).toBe(1);
    });
  });
});

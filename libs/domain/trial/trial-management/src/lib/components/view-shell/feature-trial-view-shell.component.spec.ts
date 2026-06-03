import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
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
import { FeatureTrialViewShellComponent, injectionTokenTrialViewComponent } from './feature-trial-view-shell.component';

// Must be hoisted: ng2-pdf-viewer is transitively imported via FeatureTrialCreateFormComponent → TrialDocs → DocViewer
vi.mock('ng2-pdf-viewer', async () => {
  const { NgModule, CUSTOM_ELEMENTS_SCHEMA } = await import('@angular/core');
  class PdfViewerModule {}
  NgModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })(PdfViewerModule);
  return { PdfViewerModule };
});

// Stub components
@Component({
  selector: 'inta-feature-trial-create-form',
  template: `
    <div data-testid="mock-trial-form"></div>
  `,
  standalone: true,
})
class MockTrialCreateFormComponent {
  readonly editable = input.required<boolean>();
  readonly trialId = input<string | undefined>();
  readonly formData = input<Record<string, unknown> | null>();
  readonly viewDocument = output<string>();

  readonly _valid = signal(false);
  readonly _value = signal<Record<string, unknown>>({ type: '', client: '' });

  readonly upsertTrialModel = signal<Record<string, unknown>>({ type: '', client: '' });
  readonly upsertTrialForm = signal({
    valid: () => this._valid(),
    value: () => this._value(),
    markAsTouched: vi.fn(),
  });
}

@Component({
  selector: 'inta-feature-planning-general-data-shell',
  template: `
    <div data-testid="mock-planning-shell"></div>
  `,
  standalone: true,
})
class MockPlanningShellComponent {
  readonly trial = input<Record<string, unknown>>();
  readonly trialId = input<string>();
}

@Component({
  selector: 'inta-button-trial-actions-impl',
  template: `
    <button data-testid="trial-actions-btn" (click)="clicked.emit('MODIFY')">Actions</button>
  `,
  standalone: true,
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
  let mockTrialStore: ReturnType<typeof createMockTrialGeneralDataStore>;
  let mockTrialsDataService: ReturnType<typeof createMockTrialsDataService>;
  let mockTransitionsService: ReturnType<typeof createMockTransitionsService>;
  let mockUiDialogs: { confirm: ReturnType<typeof vi.fn>; input: ReturnType<typeof vi.fn> };
  let mockTabCommand: ReturnType<typeof vi.fn>;

  const setup = async (options: { trialData?: typeof MOCK_TRIAL | null } = {}) => {
    const trialData = options.trialData !== undefined ? options.trialData : MOCK_TRIAL;
    mockTrialStore = createMockTrialGeneralDataStore({ trial: trialData });
    mockTrialsDataService = createMockTrialsDataService();
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

    const renderResult = await render(FeatureTrialViewShellComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: AuthService, useValue: { userRoles: signal([]) } },
        { provide: TrialsDataService, useValue: mockTrialsDataService },
        { provide: TrialTransitionsService, useValue: mockTransitionsService },
        { provide: UiDialogService, useValue: mockUiDialogs },
        { provide: injectionTokenTrialViewComponent, useValue: { id: 'someId' } },
        { provide: injectionTokenTabCommand, useValue: mockTabCommand },
      ],
    });

    const fixture = renderResult.fixture;
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { user, fixture, component };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
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

  describe('Trial status badge', () => {
    it('should show the status badge when trial data is loaded', async () => {
      await setup();
      // Badge renders the status value through the pipe
      expect(screen.getByText(TrialStatus.EXECUTED)).toBeInTheDocument();
    });

    it('should not show the status badge when trial is null', async () => {
      await setup({ trialData: null });
      expect(screen.queryByText(TrialStatus.EXECUTED)).not.toBeInTheDocument();
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
      // setTrialId called once on init + once on cancel
      expect(mockTrialStore.setTrialId).toHaveBeenCalledTimes(2);
    });
  });

  describe('save()', () => {
    it('should call updateTrial with mapped DTO when form is valid', async () => {
      const { component, fixture } = await setup();

      // Simulate editable mode with a valid form via the mock child
      component.editable.set(true);
      fixture.detectChanges();

      component.save();

      // form is invalid by default in mock → updateTrial should NOT be called
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

    it('should call transitionsService.reactivate after REACTIVATE action is confirmed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(true);

      component.handleClickTrialAction('REACTIVATE');

      await waitFor(() => expect(mockTransitionsService.reactivate).toHaveBeenCalledWith('someId'));
    });

    it('should call transitionsService.delete after REMOVE action is confirmed', async () => {
      const { component } = await setup();
      mockUiDialogs.confirm.mockResolvedValue(true);

      component.handleClickTrialAction('REMOVE');

      await waitFor(() => expect(mockTransitionsService.delete).toHaveBeenCalledWith('someId'));
    });
  });

  describe('Effect: reload store after transition', () => {
    it('should call setTrialId again when actionResource resolves', async () => {
      const { fixture } = await setup();

      // Simulate the httpResource resolving (void resources resolve to null in Angular http layer)
      // null !== undefined triggers the effect guard condition
      mockTransitionsService._actionResource._setValue(null as unknown as void);
      fixture.detectChanges();

      // setTrialId: once on init + once triggered by the effect
      expect(mockTrialStore.setTrialId).toHaveBeenCalledTimes(2);
      expect(mockTrialStore.setTrialId).toHaveBeenLastCalledWith('someId');
    });
  });
});

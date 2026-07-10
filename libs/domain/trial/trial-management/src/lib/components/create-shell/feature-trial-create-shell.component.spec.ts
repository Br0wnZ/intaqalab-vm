import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/core';
import { ClientsDataService, TrialsDataService } from '@intaqalab/data-access';
import {
  createMockMatDialog,
  createMockResource,
  createMockTrialGeneralDataStore,
  createMockTrialsDataService,
} from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrialTypeService } from '../../services/trial-type.service';
import { TrialGeneralDataStore } from '../shared/+state/trial-general-data.store';
import {
  FeatureTrialCreateShellComponent,
  injectionTokenComponentCreateModifyShell,
} from './feature-trial-create-shell.component';

// Must be hoisted: shell → FeatureTrialCreateFormComponent → TrialDocs → DocViewer → ng2-pdf-viewer.
// Use synchronous factory to avoid Vitest async hoisting errors.
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

@Component({
  selector: 'inta-feature-trial-create-form',
  template: `
    <div data-testid="mock-form">Mock Form</div>
  `,
})
class MockFeatureTrialCreateFormComponent {
  readonly editable = input.required<boolean>();
  readonly trialId = input<string | undefined>();
  readonly formData = input<Record<string, unknown> | null>();

  readonly _valid = signal(false);
  readonly _value = signal<Record<string, unknown>>({
    code: '',
    type: '',
    client: '',
    hasAssociatedTrial: false,
    hasLinkedTrial: false,
    linkedTrial: '',
    description: '',
    clientReference: '',
    observations: '',
    requestedDate: '',
    associatedTrial: '',
  });

  readonly upsertTrialModel = signal<Record<string, unknown>>({
    code: '',
    type: '',
    client: '',
    hasAssociatedTrial: false,
    hasLinkedTrial: false,
    linkedTrial: '',
    description: '',
    clientReference: '',
    observations: '',
    requestedDate: '',
    associatedTrial: '',
  });

  readonly upsertTrialForm = signal({
    valid: () => this._valid(),
    value: () => this._value(),
    markAsTouched: vi.fn(),
  });
}

describe('FeatureTrialCreateShellComponent', () => {
  let fixture: ComponentFixture<FeatureTrialCreateShellComponent>;
  let component: FeatureTrialCreateShellComponent;
  let mockFormComponent: MockFeatureTrialCreateFormComponent;
  let mockTrialStore: ReturnType<typeof createMockTrialGeneralDataStore>;
  let mockTrialsDataService: ReturnType<typeof createMockTrialsDataService> & {
    resetCreateTrial: ReturnType<typeof vi.fn>;
  };
  let mockDialog: ReturnType<typeof createMockMatDialog>;

  const mockClientsResource = createMockResource([{ id: 'c1', name: 'Client 1' }]);
  const mockTrialTypesResource = createMockResource({
    items: [{ id: 't1', label: 'Type 1' }],
    page: 1,
    pageSize: 10,
    totalElements: 1,
  });
  const mockClientsService = { clients: mockClientsResource.value };
  const mockTrialTypeService = { fireTrialTypesResource: mockTrialTypesResource };

  const MOCK_FIRE_TRIAL = {
    id: '123',
    trialNumber: 'NEW-001',
    client: { id: 'c1', name: 'Client 1' },
    fireTrialType: { id: 't1', name: 'Type 1' },
    linkedTrial: { trialNumber: '' },
    associatedTrial: { trialNumber: '' },
    description: 'desc',
    clienteReference: 'ref',
    observations: 'obs',
    requestedDate: '2025-01-01',
    status: 'DRAFT',
  };

  const setup = async (params: { id: string | null } = { id: null }) => {
    mockTrialStore = createMockTrialGeneralDataStore();
    mockTrialsDataService = {
      ...createMockTrialsDataService(),
      resetCreateTrial: vi.fn(),
    };
    mockDialog = createMockMatDialog();
    const user = userEvent.setup();

    TestBed.overrideComponent(FeatureTrialCreateShellComponent, {
      set: {
        imports: [TranslateModule, MockFeatureTrialCreateFormComponent, MatCardModule, MatButtonModule],
        providers: [{ provide: TrialGeneralDataStore, useValue: mockTrialStore }],
      },
    });

    const renderResult = await render(FeatureTrialCreateShellComponent, {
      imports: [TranslateModule.forRoot(), MockFeatureTrialCreateFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: TrialsDataService, useValue: mockTrialsDataService },
        { provide: injectionTokenComponentCreateModifyShell, useValue: params },
        { provide: ClientsDataService, useValue: mockClientsService },
        { provide: TrialTypeService, useValue: mockTrialTypeService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });

    fixture = renderResult.fixture;
    component = fixture.componentInstance;

    const formDebugElement = fixture.debugElement.query(By.directive(MockFeatureTrialCreateFormComponent));
    mockFormComponent = formDebugElement.componentInstance;

    fixture.detectChanges();
    return { user };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render the shell action buttons', async () => {
      await setup();
      expect(screen.getByText('TRIAL_CREATE_MODIFY_FORM.SAVE_TRIAL')).toBeInTheDocument();
      expect(screen.getByText('TRIAL_CREATE_MODIFY_FORM.RESET_DATA')).toBeInTheDocument();
    });

    it('should render the mocked form component', async () => {
      await setup();
      expect(screen.getByTestId('mock-form')).toBeInTheDocument();
    });

    it('should be editable in create mode (no id)', async () => {
      await setup({ id: null });
      expect(component.editable()).toBe(true);
    });

    it('should not be editable until trial data loads in edit mode', async () => {
      await setup({ id: '123' });
      expect(component.editable()).toBe(false);
    });

    it('should show the modify button (not editable) when loaded in edit mode', async () => {
      await setup({ id: '123' });

      // In edit mode, the component is NOT editable by default — shows the Modify button
      expect(component.editable()).toBe(false);
      expect(screen.getByText('UTILS_TRIALS.TRIAL_ACTIONS.MODIFY')).toBeInTheDocument();
      expect(screen.queryByText('TRIAL_CREATE_MODIFY_FORM.SAVE_TRIAL')).not.toBeInTheDocument();
    });

    it('should become editable after clicking the modify button', async () => {
      const { user } = await setup({ id: '123' });

      const modifyButton = screen.getByText('UTILS_TRIALS.TRIAL_ACTIONS.MODIFY').closest('button')!;
      await user.click(modifyButton);

      expect(component.editable()).toBe(true);
      expect(screen.getByText('TRIAL_CREATE_MODIFY_FORM.SAVE_TRIAL')).toBeInTheDocument();
    });
  });

  describe('Store interaction', () => {
    it('should call setTrialId on the store when initialized with an id', async () => {
      await setup({ id: '123' });
      expect(mockTrialStore.setTrialId).toHaveBeenCalledWith('123');
    });

    it('should not call setTrialId when there is no id (create mode)', async () => {
      await setup({ id: null });
      expect(mockTrialStore.setTrialId).not.toHaveBeenCalled();
    });
  });

  describe('Save button state', () => {
    it('should disable save button when form is invalid', async () => {
      await setup();
      mockFormComponent._valid.set(false);
      fixture.detectChanges();

      const saveButton = screen.getByText('TRIAL_CREATE_MODIFY_FORM.SAVE_TRIAL').closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form is valid', async () => {
      await setup();
      mockFormComponent._valid.set(true);
      fixture.detectChanges();

      const saveButton = screen.getByText('TRIAL_CREATE_MODIFY_FORM.SAVE_TRIAL').closest('button');
      expect(saveButton).toBeEnabled();
    });
  });

  describe('register() — save action', () => {
    it('should call createTrial with mapped DTO when form is valid', async () => {
      const { user } = await setup();

      mockFormComponent._valid.set(true);
      mockFormComponent._value.set({ code: '123', type: 't1', client: 'c1' });
      fixture.detectChanges();

      const saveButton = screen.getByText('TRIAL_CREATE_MODIFY_FORM.SAVE_TRIAL').closest('button')!;
      await waitFor(() => expect(saveButton).toBeEnabled());
      await user.click(saveButton);

      expect(mockTrialsDataService.createTrial).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ code: '123', clientId: 'c1', fireTrialTypeId: 't1' }),
      );
    });

    it('should mark the form as touched when attempting to save with invalid form', async () => {
      await setup();
      mockFormComponent._valid.set(false);
      fixture.detectChanges();

      component.register();

      expect(mockFormComponent.upsertTrialForm().markAsTouched).toHaveBeenCalled();
    });

    it('should not call createTrial when form is invalid', async () => {
      await setup();
      mockFormComponent._valid.set(false);
      fixture.detectChanges();

      component.register();

      expect(mockTrialsDataService.createTrial).not.toHaveBeenCalled();
    });
  });

  describe('reset() — reset action', () => {
    it('should reset the form model to empty values when reset button is clicked', async () => {
      const { user } = await setup();

      // Simulate some dirty state
      mockFormComponent.upsertTrialModel.set({ ...mockFormComponent.upsertTrialModel(), description: 'dirty' });
      fixture.detectChanges();

      const resetButton = screen.getByText('TRIAL_CREATE_MODIFY_FORM.RESET_DATA');
      await user.click(resetButton);

      expect(mockFormComponent.upsertTrialModel()).toMatchObject({ description: '' });
    });
  });

  describe('Effects', () => {
    it('should navigate to detail page when createTrialResource resolves', async () => {
      await setup();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');

      mockTrialsDataService._createTrialResource._setValue(MOCK_FIRE_TRIAL);
      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith('/trial/view/123');
    });

    it('should not navigate before createTrialResource resolves', async () => {
      await setup();
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigateByUrl');

      // Resource not resolved yet
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});

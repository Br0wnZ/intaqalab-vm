import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, provideTestingEnvironment } from '@intaqalab/core';
import { ClientsDataService } from '@intaqalab/data-access';
import { TrialStatus } from '@intaqalab/models';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { TrialTypeService } from '../../../../services/trial-type.service';
import { FeatureTrialCreateFormComponent } from './feature-trial-create-form.component';
import type { TrialCreateModifyForm } from './trial-create.model';

vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('FeatureTrialCreateFormComponent', () => {
  const defaultFormData: TrialCreateModifyForm = {
    code: 'T-001',
    hasAssociatedTrial: false,
    hasLinkedTrial: false,
    associatedTrial: '',
    associatedTrialView: '',
    linkedTrial: '',
    linkedTrialView: '',
    description: '',
    type: '',
    client: '',
    clientReference: '',
    requestedDate: '',
    observations: '',
    status: TrialStatus.CANCELLED,
  };

  const defaultInputs = {
    editable: true,
    trialId: undefined as string | undefined,
    formData: defaultFormData as TrialCreateModifyForm | null,
  };

  interface SetupOptions {
    inputs?: Partial<{
      editable: boolean;
      trialId: string | undefined;
      formData: TrialCreateModifyForm | null;
    }>;
    dialogResult?: unknown;
    clientsLoading?: boolean;
    clientsError?: Error;
    trialTypesLoading?: boolean;
    trialTypesError?: Error;
    onViewDocument?: (docId: string) => void;
  }

  async function setup(options: SetupOptions = {}) {
    const defaultResult = options.dialogResult ?? null;
    const mockDialog = {
      open: vi.fn().mockImplementation(() => ({
        afterClosed: vi.fn().mockReturnValue(of(defaultResult)),
      })),
    };
    const user = userEvent.setup();

    const mockClientsResource = createMockResource({
      items: [{ id: 'c-001', name: 'Client 1' }],
      totalElements: 1,
    });
    if (options.clientsLoading) {
      mockClientsResource._setStatus('loading');
    } else if (options.clientsError) {
      mockClientsResource._setError(options.clientsError);
    } else {
      mockClientsResource._setStatus('resolved');
    }

    const mockClientsService = {
      clientResource: mockClientsResource,
      clients: signal([{ id: 'c-001', name: 'Client 1' }]),
      hasError: signal(!!options.clientsError),
    };

    const mockTrialTypesResource = createMockResource({
      items: [{ id: 't-type-001', label: 'Type 1' }],
      page: 1,
      pageSize: 10,
      totalElements: 1,
    });
    if (options.trialTypesLoading) {
      mockTrialTypesResource._setStatus('loading');
    } else if (options.trialTypesError) {
      mockTrialTypesResource._setError(options.trialTypesError);
    } else {
      mockTrialTypesResource._setStatus('resolved');
    }

    const mockTrialTypeService = {
      fireTrialTypesResource: mockTrialTypesResource,
    };

    const view = await render(FeatureTrialCreateFormComponent, {
      inputs: { ...defaultInputs, ...options.inputs },
      on: {
        viewDocument: options.onViewDocument ?? vi.fn(),
      },
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: AuthService, useValue: { userRoles: signal([]) } },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ClientsDataService, useValue: mockClientsService },
        { provide: TrialTypeService, useValue: mockTrialTypeService },
      ],
    });
    const loader = TestbedHarnessEnvironment.loader(view.fixture);
    return {
      user,
      view,
      mockDialog,
      loader,
      mockClientsResource,
      mockTrialTypesResource,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading and Error States', () => {
    it('should show skeletons when clients resource is loading', async () => {
      const { view } = await setup({ clientsLoading: true });
      const skeletons = view.fixture.nativeElement.querySelectorAll('ui-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(screen.queryByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.CODE')).not.toBeInTheDocument();
    });

    it('should show skeletons when trial types resource is loading', async () => {
      const { view } = await setup({ trialTypesLoading: true });
      const skeletons = view.fixture.nativeElement.querySelectorAll('ui-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
      expect(screen.queryByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.CODE')).not.toBeInTheDocument();
    });

    it('should show skeletons when editing trial (trialId provided) but formData is not yet loaded', async () => {
      const { view } = await setup({ inputs: { trialId: 'trial-123', formData: null } });
      const skeletons = view.fixture.nativeElement.querySelectorAll('ui-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show error state when clients resource fails with error', async () => {
      const { view } = await setup({ clientsError: new Error('Network error') });
      const errorState = view.fixture.nativeElement.querySelector('ui-error-state');
      expect(errorState).toBeInTheDocument();
    });

    it('should show error state when trial types resource fails with error', async () => {
      const { view } = await setup({ trialTypesError: new Error('Trial types failed') });
      const errorState = view.fixture.nativeElement.querySelector('ui-error-state');
      expect(errorState).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render the code field as always disabled (auto-generated)', async () => {
      await setup();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.CODE')).toBeDisabled();
    });

    it('should disable all editable fields when editable is false', async () => {
      await setup({ inputs: { editable: false } });
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.DESCRIPTION_PLACEHOLDER')).toBeDisabled();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.CLIENT_REFERENCE_PLACEHOLDER')).toBeDisabled();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.OBSERVATIONS_PLACEHOLDER')).toBeDisabled();
    });
  });

  describe('Form initialization from formData input', () => {
    it('should populate free text fields with values from formData', async () => {
      await setup({
        inputs: {
          formData: {
            ...defaultFormData,
            description: 'My description',
            clientReference: 'REF-XYZ',
            observations: 'Some notes',
          },
        },
      });
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.DESCRIPTION_PLACEHOLDER')).toHaveValue(
        'My description',
      );
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.CLIENT_REFERENCE_PLACEHOLDER')).toHaveValue(
        'REF-XYZ',
      );
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.OBSERVATIONS_PLACEHOLDER')).toHaveValue(
        'Some notes',
      );
    });

    it('should reset to empty model when formData is null and trialId is undefined', async () => {
      const { view } = await setup({ inputs: { formData: null } });
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.CODE')).toHaveValue('');
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.DESCRIPTION_PLACEHOLDER')).toHaveValue('');
      expect(view.fixture.componentInstance.upsertTrialModel().code).toBe('');
    });
  });

  describe('Free text fields', () => {
    it('should allow typing in description and observations', async () => {
      const { user } = await setup();
      const desc = screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.DESCRIPTION_PLACEHOLDER');
      const obs = screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.OBSERVATIONS_PLACEHOLDER');
      await user.type(desc, 'desc prueba');
      await user.type(obs, 'obs prueba');
      expect(desc).toHaveValue('desc prueba');
      expect(obs).toHaveValue('obs prueba');
    });

    it('should allow typing in the client reference field', async () => {
      const { user } = await setup();
      const ref = screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.CLIENT_REFERENCE_PLACEHOLDER');
      await user.type(ref, 'MY-REF-123');
      expect(ref).toHaveValue('MY-REF-123');
    });
  });

  describe('Conditional fields (associated/linked trial)', () => {
    it('should not show associated trial input by default', async () => {
      await setup();
      expect(screen.queryByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL')).not.toBeInTheDocument();
    });

    it('should not show linked trial input by default', async () => {
      await setup();
      expect(screen.queryByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL')).not.toBeInTheDocument();
    });

    it('should show associated trial input after checking its checkbox', async () => {
      const { loader } = await setup();
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL')).toBeInTheDocument();
    });

    it('should show linked trial input after checking its checkbox', async () => {
      const { loader } = await setup();
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL')).toBeInTheDocument();
    });

    it('should toggle associated and linked trial checkboxes independently', async () => {
      const { loader } = await setup();
      const assocCheckbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL' }),
      );
      const linkedCheckbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL' }),
      );

      expect(await assocCheckbox.isChecked()).toBe(false);
      expect(await linkedCheckbox.isChecked()).toBe(false);

      await assocCheckbox.toggle();
      expect(await assocCheckbox.isChecked()).toBe(true);
      expect(await linkedCheckbox.isChecked()).toBe(false);

      await linkedCheckbox.toggle();
      expect(await linkedCheckbox.isChecked()).toBe(true);
    });
  });

  describe('Dialog integration (openTrialDialog)', () => {
    it('should open dialog with correct title when clicking add for associated trial', async () => {
      const { user, mockDialog, loader } = await setup();
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();

      await user.click(screen.getByText('add'));
      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { title: 'ASSOCIATED_TRIAL_DIALOG.ASSOCIATED_TITLE' } }),
      );
    });

    it('should open dialog with correct title when clicking add for linked trial', async () => {
      const { user, mockDialog, loader } = await setup();
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();

      await user.click(screen.getByText('add'));
      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { title: 'ASSOCIATED_TRIAL_DIALOG.LINKED_TITLE' } }),
      );
    });

    it('should populate associatedTrial field with value returned from dialog', async () => {
      const { user, loader, view } = await setup({ dialogResult: { id: 'assoc-id-001', trialNumber: 'T-ASSOC-001' } });
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();

      await user.click(screen.getByText('add'));
      await view.fixture.whenStable();
      view.fixture.detectChanges();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL')).toHaveValue('T-ASSOC-001');
    });

    it('should populate linkedTrial field with value returned from dialog', async () => {
      const { user, loader, view } = await setup({
        dialogResult: { id: 'linked-id-001', trialNumber: 'T-LINKED-001' },
      });
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();

      await user.click(screen.getByText('add'));
      await view.fixture.whenStable();
      view.fixture.detectChanges();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL')).toHaveValue('T-LINKED-001');
    });

    it('should not update field when dialog is dismissed (returns null)', async () => {
      const { user, loader } = await setup({ dialogResult: null });
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();

      await user.click(screen.getByText('add'));
      TestBed.flushEffects();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL')).toHaveValue('');
    });

    it('should not open dialog when editable is false', async () => {
      const { view, mockDialog } = await setup({ inputs: { editable: false } });
      await view.fixture.componentInstance.openTrialDialog('TITLE', 'associatedTrial');
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('Outputs and child components', () => {
    it('should emit viewDocument output when triggered', async () => {
      const spy = vi.fn();
      const { view } = await setup({ onViewDocument: spy });
      view.fixture.componentInstance.viewDocument.emit('doc-123');
      expect(spy).toHaveBeenCalledWith('doc-123');
    });

    it('should compute trialStatus from formData input', async () => {
      const { view } = await setup({
        inputs: { formData: { ...defaultFormData, status: TrialStatus.EXECUTED } },
      });
      expect(view.fixture.componentInstance.trialStatus()).toBe(TrialStatus.EXECUTED);
    });
  });
});


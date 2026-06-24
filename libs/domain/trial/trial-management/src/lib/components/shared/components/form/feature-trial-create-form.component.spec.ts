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
import { createMockMatDialog } from '@intaqalab/utils';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { TrialTypeService } from '../../../../services/trial-type.service';
import { FeatureTrialCreateFormComponent } from './feature-trial-create-form.component';

// Debe hoistarse antes de que los módulos de TrialDocs → DocViewer importen ng2-pdf-viewer.
// Usar factory síncrona para evitar errores de transpilación/hoisting de Vitest.
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

describe('FeatureTrialCreateFormComponent', () => {
  const defaultFormData = {
    code: 'T-001',
    hasAssociatedTrial: false,
    hasLinkedTrial: false,
    associatedTrial: '',
    linkedTrial: '',
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
    trialId: undefined,
    formData: defaultFormData,
  };

  async function setup(options: { inputs?: Record<string, unknown>; dialogResult?: unknown } = {}) {
    const mockDialog = createMockMatDialog({ defaultResult: options.dialogResult ?? null });
    const user = userEvent.setup();

    const mockClientsResource = createMockResource([{ id: 'c-001', name: 'Client 1' }]);
    const mockClientsService = {
      clients: mockClientsResource.value,
      hasError: signal(false),
    };

    const mockTrialTypesResource = createMockResource({
      items: [{ id: 't-type-001', label: 'Type 1' }],
      page: 1,
      pageSize: 10,
      totalElements: 1,
    });
    mockTrialTypesResource._setStatus('resolved');

    const mockTrialTypeService = {
      fireTrialTypesResource: mockTrialTypesResource,
    };

    const view = await render(FeatureTrialCreateFormComponent, {
      inputs: { ...defaultInputs, ...options.inputs },
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
    return { user, view, mockDialog, loader };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

      // both linked and assoc use the same "add" icon text in our mock environment,
      // but there'll be multiple "add" buttons if both are checked. Since only linked is checked here, it's fine.
      await user.click(screen.getByText('add'));
      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { title: 'ASSOCIATED_TRIAL_DIALOG.LINKED_TITLE' } }),
      );
    });

    it('should populate associatedTrial field with value returned from dialog', async () => {
      const { user, loader } = await setup({ dialogResult: { id: 'assoc-id-001', trialNumber: 'T-ASSOC-001' } });
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();

      await user.click(screen.getByText('add'));
      TestBed.flushEffects();
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL')).toHaveValue('T-ASSOC-001');
    });

    it('should populate linkedTrial field with value returned from dialog', async () => {
      const { user, loader } = await setup({ dialogResult: { id: 'linked-id-001', trialNumber: 'T-LINKED-001' } });
      const checkbox = await loader.getHarness(
        MatCheckboxHarness.with({ label: 'TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL' }),
      );
      await checkbox.toggle();
      TestBed.flushEffects();

      await user.click(screen.getByText('add'));
      TestBed.flushEffects();
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
  });
});

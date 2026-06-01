import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, Role, provideTestingEnvironment } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';
import { createMockMatDialog } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { FeatureTrialCreateFormComponent } from './feature-trial-create-form.component';

// Debe hoistarse antes de que los módulos de TrialDocs → DocViewer importen ng2-pdf-viewer
vi.mock('ng2-pdf-viewer', async () => {
  const { NgModule, CUSTOM_ELEMENTS_SCHEMA } = await import('@angular/core');
  class PdfViewerModule {}
  NgModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })(PdfViewerModule);
  return { PdfViewerModule };
});

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
    const view = await render(FeatureTrialCreateFormComponent, {
      inputs: { ...defaultInputs, ...options.inputs },
      imports: [TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: AuthService, useValue: { userRoles: signal([]) } },
        { provide: MatDialog, useValue: mockDialog },
      ],
    });
    return { user, view, mockDialog };
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
      const { user } = await setup();
      await user.click(screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL'));
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL')).toBeInTheDocument();
    });

    it.skip('should show linked trial input after checking its checkbox', async () => {
      // Linked trial section is currently commented out in the template
      const { user } = await setup();
      await user.click(screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL'));
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL')).toBeInTheDocument();
    });

    it.skip('should toggle associated and linked trial checkboxes independently', async () => {
      const { user } = await setup();
      const assocCheckbox = screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL');
      const linkedCheckbox = screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL');
      expect(assocCheckbox).not.toBeChecked();
      expect(linkedCheckbox).not.toBeChecked();
      await user.click(assocCheckbox);
      expect(assocCheckbox).toBeChecked();
      expect(linkedCheckbox).not.toBeChecked();
      await user.click(linkedCheckbox);
      expect(linkedCheckbox).toBeChecked();
    });
  });

  describe('Dialog integration (openTrialDialog)', () => {
    it('should open dialog with correct title when clicking add for associated trial', async () => {
      const { user, mockDialog } = await setup();
      await user.click(screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL'));
      await user.click(screen.getByText('add'));
      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { title: 'ASSOCIATED_TRIAL_DIALOG.ASSOCIATED_TITLE' } }),
      );
    });

    it.skip('should open dialog with correct title when clicking add for linked trial', async () => {
      // Linked trial section is currently commented out in the template
      const { user, mockDialog } = await setup();
      await user.click(screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL'));
      await user.click(screen.getByText('add'));
      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { title: 'ASSOCIATED_TRIAL_DIALOG.LINKED_TITLE' } }),
      );
    });

    it('should populate associatedTrial field with value returned from dialog', async () => {
      const { user } = await setup({ dialogResult: { id: 'assoc-id-001', trialNumber: 'T-ASSOC-001' } });
      await user.click(screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL'));
      await user.click(screen.getByText('add'));
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL')).toHaveValue('T-ASSOC-001');
    });

    it.skip('should populate linkedTrial field with value returned from dialog', async () => {
      // Linked trial section is currently commented out in the template
      const { user } = await setup({ dialogResult: { id: 'linked-id-001', trialNumber: 'T-LINKED-001' } });
      await user.click(screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL'));
      await user.click(screen.getByText('add'));
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL')).toHaveValue('T-LINKED-001');
    });

    it('should not update field when dialog is dismissed (returns null)', async () => {
      const { user } = await setup({ dialogResult: null });
      await user.click(screen.getByLabelText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL'));
      await user.click(screen.getByText('add'));
      expect(screen.getByPlaceholderText('TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL')).toHaveValue('');
    });
  });
});

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { MasterDataDocumentType } from '../../../../models/master-data-document-type.model';
import { DocumentTypeUpsertDialogComponent } from './document-type-upsert-dialog.component';

const MOCK_DOCUMENT_TYPE: MasterDataDocumentType = {
  id: 'dt-1',
  name: { es: 'Autorización', en: 'Authorization' },
  label: 'Autorización',
  active: true,
  category: 'GENERAL',
};

describe('DocumentTypeUpsertDialogComponent', () => {
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = async (data: MasterDataDocumentType | null = null) => {
    mockDialogRef = { close: vi.fn() };
    const user = userEvent.setup();

    const view = await render(DocumentTypeUpsertDialogComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    return { user, view };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should create the component', async () => {
      const { view } = await setup();
      expect(view.fixture.componentInstance).toBeTruthy();
    });

    it('should show create title when data is null', async () => {
      await setup(null);
      expect(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE')).toBeInTheDocument();
    });

    it('should show edit title when data is provided', async () => {
      await setup(MOCK_DOCUMENT_TYPE);
      expect(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.EDIT_TITLE')).toBeInTheDocument();
    });

    it('should render name (ES) and name (EN) input fields', async () => {
      await setup();
      expect(screen.getByPlaceholderText('MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_ES.PLACEHOLDER')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_EN.PLACEHOLDER')).toBeInTheDocument();
    });

    it('should pre-populate fields with existing data in edit mode', async () => {
      const { view } = await setup(MOCK_DOCUMENT_TYPE);
      view.fixture.detectChanges();
      expect(screen.getByPlaceholderText('MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_ES.PLACEHOLDER')).toHaveValue(
        'Autorización',
      );
      expect(screen.getByPlaceholderText('MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_EN.PLACEHOLDER')).toHaveValue(
        'Authorization',
      );
    });
  });

  describe('Form Validation', () => {
    it('should have save button disabled when form is empty (create mode)', async () => {
      await setup(null);
      const saveBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE').closest('button');
      expect(saveBtn).toBeDisabled();
    });

    it('should have save button enabled when all required fields are filled', async () => {
      const { user, view } = await setup(null);

      await user.type(
        screen.getByPlaceholderText('MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_ES.PLACEHOLDER'),
        'Nombre ES',
      );
      await user.type(screen.getByPlaceholderText('MASTER_DATA.DIALOGS.UPSERT.INPUTS.NAME_EN.PLACEHOLDER'), 'Name EN');

      // Set category directly on the model (select component is complex to interact with in JSDOM)
      view.fixture.componentInstance.formModel.update((m) => ({ ...m, category: 'GENERAL' }));
      view.fixture.detectChanges();

      const saveBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE').closest('button');
      expect(saveBtn).not.toBeDisabled();
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog with false when cancel is clicked', async () => {
      const { user } = await setup(null);
      const cancelBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL').closest('button');
      await user.click(cancelBtn!);
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should close dialog when onConfirm is called with a valid form', async () => {
      const { view } = await setup(null);

      view.fixture.componentInstance.formModel.set({ nameEs: 'Nombre', nameEn: 'Name', category: 'GENERAL' });
      view.fixture.detectChanges();

      view.fixture.componentInstance.onConfirm();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should not close dialog when save button is disabled (invalid form)', async () => {
      await setup(null);
      const saveBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE').closest('button');
      expect(saveBtn).toBeDisabled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});

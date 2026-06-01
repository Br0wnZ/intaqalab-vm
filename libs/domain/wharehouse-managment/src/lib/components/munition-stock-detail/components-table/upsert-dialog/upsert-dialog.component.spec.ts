import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockMatDialog } from '@intaqalab/utils';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DenominationsService } from '../../../../services/denominations.service';
import { UpsertDialogComponent } from './upsert-dialog.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Factories
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockMunitionTypeList = [
  { id: '1', label: 'Component Type 1', name: 'Type 1', shortName: 'T1' },
  { id: '2', label: 'Component Type 2', name: 'Type 2', shortName: 'T2' },
];

function makeDenominationsService() {
  return {
    paginatedResponse: createMockResource({ items: [] }),
    searchItems: { set: vi.fn() },
    saveResource: createMockResource(),
    updateResource: createMockResource(),
    deleteResource: createMockResource(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    toogleEnabledItem: vi.fn(),
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Setup
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let mockDialog: ReturnType<typeof createMockMatDialog>;
let mockDialogRef: { close: ReturnType<typeof vi.fn> };
let denomService: ReturnType<typeof makeDenominationsService>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setup(data: Record<string, any> = { munitionTypeList: mockMunitionTypeList }) {
  const user = userEvent.setup();
  mockDialogRef = { close: vi.fn() };
  mockDialog = createMockMatDialog({ defaultResult: null });
  denomService = makeDenominationsService();

  const view = await render(UpsertDialogComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: DenominationsService, useValue: denomService },
    ],
    componentProviders: [{ provide: MatDialog, useValue: mockDialog }],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  return { user, view, fixture, component: fixture.componentInstance };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Tests
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('UpsertDialogComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Add mode (no item)', () => {
    it('should show the ADD title', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.ADD')).toBeInTheDocument();
    });

    it('should render the munitionType selector', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.MUNITION_TYPE_LABEL')).toBeInTheDocument();
    });

    it('should disable the save button when the form is invalid', async () => {
      await setup();
      const saveBtn = screen.getByText('MODIFY_DOC_DIALOG.SAVE').closest('button');
      expect(saveBtn).toBeDisabled();
    });

    it('should close the dialog with false when clicking cancel', async () => {
      const { user } = await setup();
      const cancelBtn = screen.getByText('MODIFY_DOC_DIALOG.CANCEL').closest('button') as HTMLButtonElement;
      await user.click(cancelBtn);
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should call DenominationsService.searchItems.set on initialization', async () => {
      await setup();
      expect(denomService.searchItems.set).toHaveBeenCalled();
    });
  });

  describe('Edit mode (item provided)', () => {
    const editData = {
      item: {
        id: 'comp-1',
        batch: 'Lote-123',
        munitionType: { id: '1', name: 'Type 1' },
        denomination: { id: 'd1', name: 'DenominaciÃ³n 1' },
        quantity: 5,
      },
      munitionTypeList: mockMunitionTypeList,
    };

    it('should show the EDIT title', async () => {
      await setup(editData);
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.EDIT')).toBeInTheDocument();
    });

    it('should NOT render the munitionType selector', async () => {
      await setup(editData);
      expect(
        screen.queryByText('WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.MUNITION_TYPE_LABEL'),
      ).not.toBeInTheDocument();
    });

    it('should pre-fill the batch input with the item batch value', async () => {
      await setup(editData);
      const batchInput = screen.getByPlaceholderText(
        'WHAREHOUSE_MANAGMENT.DIALOG_EDIT_COMPONENT.BATCH_PLACEHOLDER',
      ) as HTMLInputElement;
      expect(batchInput.value).toBe('Lote-123');
    });

    it('should enable the save button when form is pre-filled', async () => {
      await setup(editData);
      const saveBtn = screen.getByText('MODIFY_DOC_DIALOG.SAVE').closest('button');
      expect(saveBtn).not.toBeDisabled();
    });

    it('should close the dialog with the form data when clicking save', async () => {
      const { user, fixture } = await setup(editData);
      const saveBtn = screen.getByText('MODIFY_DOC_DIALOG.SAVE').closest('button') as HTMLButtonElement;
      await user.click(saveBtn);
      await fixture.whenStable();
      expect(mockDialogRef.close).toHaveBeenCalledWith(
        expect.objectContaining({
          batch: 'Lote-123',
          munitionTypeId: '1',
          denominationId: 'd1',
        }),
      );
    });

    it('should close the dialog with false when clicking cancel', async () => {
      const { user } = await setup(editData);
      const cancelBtn = screen.getByText('MODIFY_DOC_DIALOG.CANCEL').closest('button') as HTMLButtonElement;
      await user.click(cancelBtn);
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});

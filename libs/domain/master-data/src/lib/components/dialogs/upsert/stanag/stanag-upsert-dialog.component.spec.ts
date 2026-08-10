/* eslint-disable testing-library/no-node-access */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MasterDataStore } from '../../../../+state/master-data.store';
import type { MasterDataStanag } from '../../../../models/master-data-stanag.model';
import { MasterDataService } from '../../../../services/master-data.service';
import { StanagUpsertDialogComponent } from './stanag-upsert-dialog.component';

function createMockMasterDataService() {
  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse: createMockResource(),
    saveResource: createMockResource(),
    updateResource: createMockResource(),
    deleteById: createMockResource(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    resetUpsert: vi.fn(),
    resetSwitchStatus: vi.fn(),
    resetDelete: vi.fn(),
  };
}

const MOCK_STANAG: MasterDataStanag = {
  id: 'stanag-1',
  variable: '550e8400-e29b-41d4-a716-446655440011',
  name: { es: 'nameEs', en: 'nameEn' },
  numericThreshold: 5,
  unit: '550e8400-e29b-41d4-a716-446655440001',
  calculationType: '550e8400-e29b-41d4-a716-446655440001',
  involvedLayer: '550e8400-e29b-41d4-a716-446655440001',
  startLayer: 0,
  endLayer: 10,
  active: true,
};

describe('StanagUpsertDialogComponent', () => {
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = async (data: MasterDataStanag | null = null) => {
    mockDialogRef = { close: vi.fn() };
    const user = userEvent.setup();

    const view = await render(StanagUpsertDialogComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideTestingEnvironment(),
        { provide: MasterDataService, useValue: createMockMasterDataService() },
        MasterDataStore,
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
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/MASTER_DATA\.DIALOGS\.UPSERT\.CREATE_TITLE/);
    });

    it('should show edit title when data is provided', async () => {
      await setup(MOCK_STANAG);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/MASTER_DATA\.DIALOGS\.UPSERT\.EDIT_TITLE/);
    });

    it('should render the description textarea', async () => {
      await setup();
      expect(screen.getByPlaceholderText('MASTER_DATA.STANAG.DIALOGS.UPSERT.DESCRIPTION')).toBeInTheDocument();
    });

    it('should pre-populate formModel with existing data in edit mode', async () => {
      const { view } = await setup(MOCK_STANAG);
      view.fixture.detectChanges();
      const formValue = view.fixture.componentInstance.formModel();
      expect(formValue.variable).toBe('550e8400-e29b-41d4-a716-446655440011');
    });
  });

  describe('Form Validation', () => {
    it('should have save button disabled when form is empty', async () => {
      await setup(null);
      const saveBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE').closest('button');
      expect(saveBtn).toBeDisabled();
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog with false when cancel is clicked', async () => {
      const { user } = await setup(null);
      const cancelBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL').closest('button');
      await user.click(cancelBtn!);
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });
});

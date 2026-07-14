import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { MasterDataStanag } from '../../../../models/master-data-stanag.model';
import { StanagUpsertDialogComponent } from './stanag-upsert-dialog.component';

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

    it('should call close when sendData is invoked with valid form', async () => {
      const { user, view } = await setup(null);
      const instance = view.fixture.componentInstance;

      instance.formModel.set({
        variable: '550e8400-e29b-41d4-a716-446655440011',
        name: { es: 'nameEs', en: 'nameEn' },
        numericThreshold: 5,
        unit: '550e8400-e29b-41d4-a716-446655440001',
        calculationType: '550e8400-e29b-41d4-a716-446655440001',
        involvedLayer: '550e8400-e29b-41d4-a716-446655440001',
        startLayer: 0,
        endLayer: 10,
      });
      view.fixture.detectChanges();

      const saveBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE').closest('button')!;
      await user.click(saveBtn);

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});

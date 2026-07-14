import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import type { MasterDataLoadingZone } from '../../../../models/master-data-loading-zone.model';
import { LoadingZoneUpsertDialogComponent } from './loading-zone-upsert-dialog.component';

describe('LoadingZoneUpsertDialogComponent', () => {
  const mockDialogRef = { close: vi.fn() };

  const MOCK_LOADING_ZONE: MasterDataLoadingZone = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    denomination: { id: '550e8400-e29b-41d4-a716-446655440001', name: '105/51' },
    zone: '1M, 2M, 3M',
    caliber: '105',
    active: true,
  };

  const setup = async (data: MasterDataLoadingZone | null = null) => {
    const user = userEvent.setup();
    const view = await render(LoadingZoneUpsertDialogComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideHttpClientTesting(),
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
    it('should render create title when no data is provided', async () => {
      await setup(null);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/MASTER_DATA\.DIALOGS\.UPSERT\.CREATE_TITLE/);
    });

    it('should render edit title when data is provided', async () => {
      await setup(MOCK_LOADING_ZONE);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(/MASTER_DATA\.DIALOGS\.UPSERT\.EDIT_TITLE/);
    });

    it('should render zone and caliber input fields', async () => {
      await setup(null);
      expect(
        screen.getByPlaceholderText('MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.ZONE.PLACEHOLDER'),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.CALIBER.PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('should pre-populate zone and caliber fields in edit mode', async () => {
      const { view } = await setup(MOCK_LOADING_ZONE);
      view.fixture.detectChanges();
      expect(screen.getByPlaceholderText('MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.ZONE.PLACEHOLDER')).toHaveValue(
        '1M, 2M, 3M',
      );
      expect(screen.getByPlaceholderText('MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.CALIBER.PLACEHOLDER')).toHaveValue(
        '105',
      );
    });
  });

  describe('Form Validation', () => {
    it('should have save button disabled when form is empty (create mode)', async () => {
      await setup(null);
      const saveBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE').closest('button');
      expect(saveBtn).toBeDisabled();
    });

    it('should have save button enabled when required fields are filled', async () => {
      const { view } = await setup(null);
      view.fixture.componentInstance.formModel.update((m) => ({
        ...m,
        denominationId: '550e8400-e29b-41d4-a716-446655440031',
        zone: '1M',
      }));
      view.fixture.detectChanges();
      const saveBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE').closest('button');
      expect(saveBtn).toBeEnabled();
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog with false when cancel is clicked', async () => {
      const { user } = await setup(null);
      const cancelBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL').closest('button');
      await user.click(cancelBtn!);
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should close dialog with data when save is clicked on a touched and dirty form', async () => {
      const { user, view } = await setup(null);

      // Type in zone — marks form touched and dirty
      const zoneInput = screen.getByPlaceholderText('MASTER_DATA.LOADING_ZONE.DIALOGS.UPSERT.ZONE.PLACEHOLDER');
      await user.type(zoneInput, '1M');

      // Set denominationId directly (IntaSignalSelectComponent is complex in JSDOM)
      view.fixture.componentInstance.formModel.update((m) => ({
        ...m,
        denominationId: '550e8400-e29b-41d4-a716-446655440031',
      }));
      view.fixture.detectChanges();

      const saveBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE').closest('button');
      await user.click(saveBtn!);

      expect(mockDialogRef.close).toHaveBeenCalled();
      const callArg = mockDialogRef.close.mock.calls[0][0];
      expect(callArg).not.toBeNull();
    });

    it('should close dialog with null when form has not been interacted with', async () => {
      const { view } = await setup(null);

      // Set valid values via signal (no user interaction → not touched/dirty)
      view.fixture.componentInstance.formModel.set({
        denominationId: '550e8400-e29b-41d4-a716-446655440031',
        zone: '1M',
        caliber: '105',
      });
      view.fixture.detectChanges();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (view.fixture.componentInstance as any).sendData();

      expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });
  });
});

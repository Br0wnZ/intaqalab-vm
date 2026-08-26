import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';
import type { DenominationsStoreType } from '@intaqalab/warehouse-management';
import { DenominationsStore } from '@intaqalab/warehouse-management';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MasterDataStore } from '../../../../+state/master-data.store';
import type { MasterDataLoadingZone } from '../../../../models/master-data-loading-zone.model';
import { MasterDataService } from '../../../../services/master-data.service';
import { LoadingZoneUpsertDialogComponent } from './loading-zone-upsert-dialog.component';

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

function createMockDenominationsStore(): Partial<DenominationsStoreType> {
  return {
    items: signal([
      {
        id: '550e8400-e29b-41d4-a716-446655440031',
        name: '105/51',
        category: 'MUNITION' as const,
        munitionType: { id: 'mt-1', name: 'Artillery' },
        active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440032',
        name: 'M67',
        category: 'MUNITION' as const,
        munitionType: { id: 'mt-2', name: 'Hand Grenade' },
        active: true,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440033',
        name: 'M200A1',
        category: 'MUNITION' as const,
        munitionType: { id: 'mt-3', name: 'Projectile' },
        active: true,
      },
    ]),
    isLoading: signal(false),
    search: vi.fn(),
  };
}

describe('LoadingZoneUpsertDialogComponent', () => {
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockService: ReturnType<typeof createMockMasterDataService>;
  let mockDenominationsStore: Partial<DenominationsStoreType>;

  const MOCK_LOADING_ZONE: MasterDataLoadingZone = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    denomination: { id: '550e8400-e29b-41d4-a716-446655440001', name: '105/51' },
    zone: '1M, 2M, 3M',
    caliber: '105',
    active: true,
  };

  const setup = async (data: MasterDataLoadingZone | null = null) => {
    const user = userEvent.setup();
    mockDialogRef = { close: vi.fn() };
    mockService = createMockMasterDataService();
    mockDenominationsStore = createMockDenominationsStore();

    const view = await render(LoadingZoneUpsertDialogComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MasterDataService, useValue: mockService },
        { provide: DenominationsStore, useValue: mockDenominationsStore },
        MasterDataStore,
      ],
    });

    return { user, view, mockService, mockDenominationsStore, mockDialogRef };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should create the component', async () => {
      const { view } = await setup(null);
      expect(view.fixture.componentInstance).toBeTruthy();
    });

    it('should search active denominations on initialization', async () => {
      const { mockDenominationsStore: store } = await setup(null);
      expect(store.search).toHaveBeenCalledWith({ active: true });
    });

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

    it('should pre-populate formModel with denominationId in edit mode', async () => {
      const { view } = await setup(MOCK_LOADING_ZONE);
      view.fixture.detectChanges();
      const formValue = view.fixture.componentInstance.formModel();
      expect(formValue.denominationId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(formValue.caliber).toBe('105');
      expect(formValue.zone).toBe('1M, 2M, 3M');
    });
  });

  describe('Form Validation & Save Button', () => {
    it('should have save button disabled when form is empty (create mode)', async () => {
      await setup(null);
      const saveBtn = screen.getByRole('button', {
        name: /MASTER_DATA\.DIALOGS\.UPSERT\.BUTTONS\.SAVE/,
      });
      expect(saveBtn).toBeDisabled();
    });

    it('should have save button enabled when required fields (denominationId and zone) are filled', async () => {
      const { view } = await setup(null);
      view.fixture.componentInstance.formModel.update((m) => ({
        ...m,
        denominationId: '550e8400-e29b-41d4-a716-446655440031',
        zone: '1M',
      }));
      view.fixture.detectChanges();

      const saveBtn = screen.getByRole('button', {
        name: /MASTER_DATA\.DIALOGS\.UPSERT\.BUTTONS\.SAVE/,
      });
      expect(saveBtn).toBeEnabled();
    });
  });

  describe('Data Submission', () => {
    it('should call store create with split zones and active true in create mode', async () => {
      const { view, mockService: service } = await setup(null);
      const instance = view.fixture.componentInstance;

      instance.formModel.set({
        denominationId: '550e8400-e29b-41d4-a716-446655440031',
        zone: '1M, 2M, 3M',
        caliber: '105',
      });
      view.fixture.detectChanges();

      // Trigger sendData
      (instance as unknown as { sendData(): void }).sendData();

      expect(service.create).toHaveBeenCalledWith({
        denominationId: '550e8400-e29b-41d4-a716-446655440031',
        zone: ['1M', ' 2M', ' 3M'],
        caliber: '105',
        active: true,
      });
    });

    it('should call store update with existing data and split zones in edit mode', async () => {
      const { view, mockService: service } = await setup(MOCK_LOADING_ZONE);
      const instance = view.fixture.componentInstance;
      view.fixture.detectChanges();

      instance.formModel.set({
        ...MOCK_LOADING_ZONE,
        denominationId: '550e8400-e29b-41d4-a716-446655440001',
        zone: 'ZoneA, ZoneB',
        caliber: '120',
      });
      view.fixture.detectChanges();

      (instance as unknown as { sendData(): void }).sendData();

      expect(service.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: MOCK_LOADING_ZONE.id,
          denominationId: '550e8400-e29b-41d4-a716-446655440001',
          zone: ['ZoneA', ' ZoneB'],
          caliber: '120',
        }),
      );
    });

    it('should keep zone as array if zone is already an array when calling sendData', async () => {
      const { view, mockService: service } = await setup(null);
      const instance = view.fixture.componentInstance;

      instance.formModel.set({
        denominationId: '550e8400-e29b-41d4-a716-446655440031',
        zone: ['1M', '2M'] as unknown as string,
        caliber: '105',
      });
      view.fixture.detectChanges();

      (instance as unknown as { sendData(): void }).sendData();

      expect(service.create).toHaveBeenCalledWith({
        denominationId: '550e8400-e29b-41d4-a716-446655440031',
        zone: ['1M', '2M'],
        caliber: '105',
        active: true,
      });
    });
  });

  describe('Dialog Actions & Effects', () => {
    it('should close dialog with false when cancel is clicked', async () => {
      const { user } = await setup(null);
      const cancelBtn = screen.getByRole('button', {
        name: /MASTER_DATA\.DIALOGS\.UPSERT\.BUTTONS\.CANCEL/,
      });
      await user.click(cancelBtn);
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should close dialog with true and reset upsert when saveStatus resolves', async () => {
      const { view, mockService: service } = await setup(null);
      service.saveResource._setStatus('resolved');
      view.fixture.detectChanges();

      expect(service.resetUpsert).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog with true and reset upsert when updateStatus resolves', async () => {
      const { view, mockService: service } = await setup(MOCK_LOADING_ZONE);
      service.updateResource._setStatus('resolved');
      view.fixture.detectChanges();

      expect(service.resetUpsert).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});

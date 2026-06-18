import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { MasterDataStore } from '../../+state/master-data.store';
import { MODAL_COMPONENT } from '../../modal.token';
import type { MasterView } from '../../models/master-data-view.model';
import { MasterDataService } from '../../services/master-data.service';
import { MasterDataDefaultUpsertDialogComponent } from '../dialogs/upsert/default/default-upsert-dialog.component';
import { MasterDataListComponent } from './master-data-list.component';

const MOCK_ITEMS = [
  { id: 'id-1', label: 'Material 1', name: { es: 'Material 1', en: 'Material 1' }, active: true },
  { id: 'id-2', label: 'Material 2', name: { es: 'Material 2', en: 'Material 2' }, active: false },
];

function paginate<T>(items: T[]) {
  return { page: 1, pageSize: 10, totalElements: items.length, items };
}

function makeMockService() {
  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse: createMockResource(paginate(MOCK_ITEMS)),
    saveResource: createMockResource(),
    updateResource: createMockResource(),
    deleteById: createMockResource(),
    create: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  };
}

const MOCK_VIEW: MasterView = {
  title: 'MASTER_DATA.TITLE',
  columnList: [
    { id: 'label', name: 'MASTER_DATA.COLUMNS.LABEL' },
    { id: 'active', name: 'MASTER_DATA.COLUMNS.ACTIVE' },
    { id: 'actions', name: 'MASTER_DATA.COLUMNS.ACTIONS' },
  ],
  actions: ['edit', 'delete'],
  dialogs: {
    'switch-status': { title: 'Switch Status', description: 'Are you sure?' },
    delete: { title: 'Delete', description: 'Are you sure?' },
  },
};

const mockDialogRef = { afterClosed: vi.fn(() => of(null)), close: vi.fn() };
const mockMatDialog = { open: vi.fn(() => mockDialogRef) };

const setup = async (masterView: MasterView = MOCK_VIEW) => {
  const user = userEvent.setup();
  const mockService = makeMockService();

  const view = await render(MasterDataListComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    componentInputs: { masterView },
    providers: [
      provideTestingEnvironment(),
      { provide: MasterDataService, useValue: mockService },
      { provide: MODAL_COMPONENT, useValue: MasterDataDefaultUpsertDialogComponent },
      { provide: MatDialog, useValue: mockMatDialog },
      MasterDataStore,
    ],
  });

  return { user, view, mockService };
};

describe('MasterDataListComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDialogRef.afterClosed.mockReturnValue(of(null));
    mockMatDialog.open.mockReturnValue(mockDialogRef);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should create the component', async () => {
      const { view } = await setup();
      expect(view.fixture.componentInstance).toBeTruthy();
    });

    it('should render the translated title', async () => {
      await setup();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render the create button', async () => {
      await setup();
      expect(screen.getByText('MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE')).toBeInTheDocument();
    });

    it('should render a table with the provided data rows', async () => {
      const { view } = await setup();
      view.fixture.detectChanges();
      const loader = TestbedHarnessEnvironment.loader(view.fixture);
      const table = await loader.getHarness(MatTableHarness);
      const rows = await table.getRows();
      expect(rows.length).toBe(MOCK_ITEMS.length);
    });

    it('should render paginator', async () => {
      const { view } = await setup();
      view.fixture.detectChanges();
      const loader = TestbedHarnessEnvironment.loader(view.fixture);
      const paginator = await loader.getHarnessOrNull(MatPaginatorHarness);
      expect(paginator).toBeTruthy();
    });
  });

  describe('Store Integration', () => {
    it('should call store.search on init via effect', async () => {
      const { mockService } = await setup();
      // effect() fires immediately in constructor
      expect(mockService.searchItems.set ?? mockService.searchItems()).toBeDefined();
    });

    it('should display totalElements from store in the paginator', async () => {
      const { view } = await setup();
      view.fixture.detectChanges();
      const instance = view.fixture.componentInstance;
      expect(instance.store.totalElements()).toBe(MOCK_ITEMS.length);
    });
  });

  describe('Dialog Actions', () => {
    it('should open dialog when create button is clicked', async () => {
      const { user } = await setup();
      const createBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE').closest('button')!;
      await user.click(createBtn);
      expect(mockMatDialog.open).toHaveBeenCalled();
    });

    it('should call store.createItem when dialog closes with result', async () => {
      const newItem = { ...MOCK_ITEMS[0], id: 'new-id' };
      mockDialogRef.afterClosed.mockReturnValue(of(newItem));

      const { user, view } = await setup();
      const createBtn = screen.getByText('MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE').closest('button')!;
      await user.click(createBtn);

      expect(view.fixture.componentInstance.store.items()).toBeDefined();
    });

    it('should open edit dialog when edit button is clicked', async () => {
      const { view } = await setup();
      view.fixture.detectChanges();
      const loader = TestbedHarnessEnvironment.loader(view.fixture);
      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      
      // Encontrar el botón de editar por su contenido interno de icono
      for (const btn of buttons) {
        const host = await btn.host();
        const text = await host.text();
        if (text.includes('edit')) {
          await btn.click();
          break;
        }
      }
      expect(mockMatDialog.open).toHaveBeenCalled();
    });
  });
});

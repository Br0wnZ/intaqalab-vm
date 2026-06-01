import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { MovementsListStore } from '../../../+state/movements-list.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MovementListItem } from '../../../models/movements.model';
import { MovementsListComponent } from './movements-list.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const mockItem: MovementListItem = {
  date: '2026-01-15T10:30:00Z',
  movementType: 'TRANSFER',
  user: { id: 'u1', name: 'John Doe' },
  originMunitionDump: { id: 'od1', munitionDumpId: 'DUMP-A' },
  destinationMunitionDump: { id: 'dd1', munitionDumpId: 'DUMP-B' },
  quantity: 10,
  affectedNeq: 5.5,
  reason: '',
  associatedFireTrial: { id: 'ft1', name: 'Trial Alpha' },
  observations: '',
  createdBy: 'system',
  modifiedBy: 'system',
  createdAt: '2026-01-15T10:30:00Z',
  updatedAt: '2026-01-15T10:30:00Z',
};

function createMockMovementsStore(items: MovementListItem[] = []) {
  return {
    items: signal(items),
    totalElements: signal(items.length),
    isLoading: signal(false),
    hasError: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
  };
}

function createMockMunitionsDumpsStore() {
  return {
    items: signal([]),
    search: vi.fn(),
  };
}

describe('MovementsListComponent', () => {
  let mockStore: ReturnType<typeof createMockMovementsStore>;
  let mockMunitionsDumpsStore: ReturnType<typeof createMockMunitionsDumpsStore>;

  const setup = async (items: MovementListItem[] = []) => {
    const user = userEvent.setup();
    mockStore = createMockMovementsStore(items);
    mockMunitionsDumpsStore = createMockMunitionsDumpsStore();

    const view = await render(MovementsListComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideTestingEnvironment(),
        // Ambos stores se inyectan con { skipSelf: true } en los componentes
        { provide: MovementsListStore, useValue: mockStore },
        { provide: MunitionsDumpsStore, useValue: mockMunitionsDumpsStore },
      ],
    });
    view.fixture.detectChanges();
    return { user, view, fixture: view.fixture };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the table column headers', async () => {
      await setup();
      expect(screen.getByText(/WHAREHOUSE_MANAGMENT\.MOVEMENTS\.TABLE\.COL_USER/i)).toBeInTheDocument();
      expect(screen.getByText(/WHAREHOUSE_MANAGMENT\.MOVEMENTS\.TABLE\.COL_DATE/i)).toBeInTheDocument();
      expect(screen.getByText(/WHAREHOUSE_MANAGMENT\.MOVEMENTS\.TABLE\.COL_QUANTITY/i)).toBeInTheDocument();
    });

    it('should render items from the store in the table', async () => {
      await setup([mockItem]);
      expect(screen.getByText(mockItem.user.name)).toBeInTheDocument();
      expect(screen.getByText(mockItem.originMunitionDump.munitionDumpId)).toBeInTheDocument();
      expect(screen.getByText(mockItem.destinationMunitionDump.munitionDumpId)).toBeInTheDocument();
    });
  });

  describe('Initialization', () => {
    it('should call store.search with default pagination on init', async () => {
      await setup();
      expect(mockStore.search).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }));
    });
  });

  describe('Pagination', () => {
    it('should call store.search with updated page when paginator changes', async () => {
      const { fixture } = await setup();
      const component = fixture.componentInstance;

      component.onPage({ pageIndex: 2, pageSize: 25, length: 100 });
      fixture.detectChanges();

      expect(mockStore.search).toHaveBeenCalledWith(expect.objectContaining({ page: 3, pageSize: 25 }));
    });
  });

  describe('Sorting', () => {
    it('should call store.search with sort params when sort changes', async () => {
      const { fixture } = await setup();
      const component = fixture.componentInstance;

      component.onSort({ active: 'date', direction: 'asc' });
      fixture.detectChanges();

      expect(mockStore.search).toHaveBeenCalledWith(
        expect.objectContaining({ sortField: 'date', sortDirection: 'asc' }),
      );
    });

    it('should omit sortField when direction is empty', async () => {
      const { fixture } = await setup();
      const component = fixture.componentInstance;

      component.onSort({ active: 'date', direction: '' });
      fixture.detectChanges();

      expect(mockStore.search).toHaveBeenCalledWith(
        expect.objectContaining({ sortField: undefined, sortDirection: '' }),
      );
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { ClientsDataService } from '@intaqalab/data-access';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import { StockListStore } from '../../../+state/stock-list.store';
import type { MunitionStockListResponse } from '../../../models/munition-stock-list.model';
import { StockListComponent } from './stock-list.component';

// // Factories
//

function makeStockItem(overrides: Partial<MunitionStockListResponse> = {}): MunitionStockListResponse {
  return {
    id: 'item-1',
    category: 'MUNITION',
    munitionType: { id: 'MT-1', name: 'Granada mortero' },
    denomination: { id: 'D-1', name: 'DenominaciÃ³n 1' },
    client: { id: 'C-1', name: 'Cliente Alfa' },
    batch: 'LOT-001',
    munitionDump: { id: 'dump-1', munitionDumpId: 'PolvorÃ­n Norte' },
    cellName: 'A-01',
    status: 'AVAILABLE',
    plannedFireTrial: { id: 'T-1', name: 'Prueba 0001/25' },
    quantity: 50,
    totalNeq: 100,
    createdBy: 'user',
    modifiedBy: 'user',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    ...overrides,
  };
}

function makeStockListStore(items: MunitionStockListResponse[] = []) {
  return {
    items: signal(items),
    totalElements: signal(items.length),
    isLoading: signal(false),
    error: signal(null),
    isInitialized: signal(false),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeMunitionComponentStore() {
  return {
    items: signal<any[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeMunitionsDumpsStore() {
  return {
    items: signal<any[]>([]),
    totalElements: signal(0),
    isLoading: signal(false),
    error: signal(null),
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
  };
}

function makeClientsDataService() {
  return {
    clients: signal<any[]>([]),
    hasError: signal(false),
  };
}

// Returns real Observables so .pipe(delay(500)) works in transfer()
function makeDialog(dialogResult: any) {
  return {
    open: vi.fn().mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(dialogResult)),
    }),
  };
}

function makeRouter() {
  return { navigateByUrl: vi.fn().mockResolvedValue(true) };
}

// // Setup
//

interface SetupOptions {
  items?: MunitionStockListResponse[];
  dialogResult?: any;
}

async function setup(opts: SetupOptions = {}) {
  const stockListStore = makeStockListStore(opts.items ?? []);
  const munitionComponentStore = makeMunitionComponentStore();
  const munitionsDumpsStore = makeMunitionsDumpsStore();
  const clientsDataService = makeClientsDataService();
  const dialogResult = opts.dialogResult === undefined ? true : opts.dialogResult;
  const mockDialog = makeDialog(dialogResult);
  const mockRouter = makeRouter();

  const view = await render(StockListComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: StockListStore, useValue: stockListStore },
      { provide: MunitionComponentStore, useValue: munitionComponentStore },
      { provide: MunitionsDumpsStore, useValue: munitionsDumpsStore },
      { provide: ClientsDataService, useValue: clientsDataService },
      { provide: Router, useValue: mockRouter },
    ],
    componentProviders: [{ provide: MatDialog, useValue: mockDialog }],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const component = fixture.componentInstance;
  const container = fixture.nativeElement as HTMLElement;

  return { fixture, component, container, stockListStore, mockDialog, mockRouter, munitionsDumpsStore };
}

// Tests

describe('StockListComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Initialization
  describe('Initialization', () => {
    it('should render the transfer button', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.STOCK_LIST.TRANSFER')).toBeTruthy();
    });

    it('should render the column headers', async () => {
      await setup();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_TYPE')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_DENOMINATION')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_BATCH')).toBeTruthy();
      expect(screen.getByText('WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_STATUS')).toBeTruthy();
    });

    it('should have the transfer button disabled when no rows are selected', async () => {
      const { container } = await setup();
      const transferBtn = container.querySelector('[data-testid="transfer-btn"]') as HTMLButtonElement;
      expect(transferBtn.disabled).toBe(true);
    });

    it('should call MunitionsDumpsStore.search() on init', async () => {
      const { munitionsDumpsStore } = await setup();
      expect(munitionsDumpsStore.search).toHaveBeenCalledWith({ pageSize: 500, active: true });
    });

    it('should call store.search() on init via the effect', async () => {
      const { stockListStore } = await setup();
      expect(stockListStore.search).toHaveBeenCalledOnce();
      expect(stockListStore.search).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortDirection: '',
        sortField: undefined,
      });
    });

    it('should render table rows for each item in the store', async () => {
      await setup({ items: [makeStockItem({ batch: 'LOT-001' }), makeStockItem({ id: 'item-2', batch: 'LOT-002' })] });
      expect(screen.getAllByText('LOT-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('LOT-002').length).toBeGreaterThan(0);
    });
  });

  // transfer()
  describe('transfer()', () => {
    it('should open TransferDialogComponent when an item is selected', async () => {
      const item = makeStockItem();
      const { component, fixture, mockDialog } = await setup({ items: [item] });
      component.selection.toggle(item);
      fixture.detectChanges();
      component.transfer();
      expect(mockDialog.open).toHaveBeenCalledOnce();
    });

    it('should NOT call store.reload() when transfer dialog closes with truthy result', async () => {
      const item = makeStockItem();
      const { component, fixture, stockListStore } = await setup({ items: [item], dialogResult: true });
      component.selection.toggle(item);
      fixture.detectChanges();
      vi.useFakeTimers();
      try {
        component.transfer();
        await vi.advanceTimersByTimeAsync(600);
        expect(stockListStore.reload).not.toHaveBeenCalledOnce();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should NOT call store.reload() when transfer dialog is cancelled (falsy result)', async () => {
      const item = makeStockItem();
      const { component, fixture, stockListStore } = await setup({ items: [item], dialogResult: false });
      component.selection.toggle(item);
      fixture.detectChanges();
      component.transfer();
      await fixture.whenStable();
      expect(stockListStore.reload).not.toHaveBeenCalled();
    });

    it('should NOT open the dialog when no rows are selected', async () => {
      const { component, mockDialog } = await setup();
      component.transfer();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  // navigate()
  describe('navigate()', () => {
    it('should navigate to the MUNITION detail route for MUNITION category items', async () => {
      const item = makeStockItem({ id: 'item-1', category: 'MUNITION' });
      const { component, mockRouter } = await setup({ items: [item] });
      component.navigate(item);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/wharehouse-managment/stock/munitions/item-1');
    });

    it('should navigate to the MUNITION_COMPONENT detail route for non-MUNITION category items', async () => {
      const item = makeStockItem({ id: 'item-2', category: 'MUNITION_COMPONENT' });
      const { component, mockRouter } = await setup({ items: [item] });
      component.navigate(item);
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/wharehouse-managment/stock/munitions-components/item-2');
    });
  });

  // onPage()
  describe('onPage()', () => {
    it('should update pageIndex and pageSize signals', async () => {
      const { component } = await setup();
      component.onPage({ pageIndex: 2, pageSize: 25, length: 100 } as any);
      expect(component.pageIndex()).toBe(2);
      expect(component.pageSize()).toBe(25);
    });

    it('should trigger store.search() with updated page params', async () => {
      const { component, stockListStore, fixture } = await setup();
      vi.clearAllMocks();
      component.onPage({ pageIndex: 1, pageSize: 10, length: 100 } as any);
      fixture.detectChanges();
      expect(stockListStore.search).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        sortDirection: '',
        sortField: undefined,
      });
    });
  });

  // onSort()
  describe('onSort()', () => {
    it('should update sortField and sortDirection signals', async () => {
      const { component } = await setup();
      component.onSort({ active: 'quantity', direction: 'desc' });
      expect(component.sortField()).toBe('quantity');
      expect(component.sortDirection()).toBe('desc');
    });

    it('should trigger store.search() with sort params when direction is set', async () => {
      const { component, stockListStore, fixture } = await setup();
      vi.clearAllMocks();
      component.onSort({ active: 'quantity', direction: 'asc' });
      fixture.detectChanges();
      expect(stockListStore.search).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortDirection: 'asc',
        sortField: 'quantity',
      });
    });

    it('should pass sortField as undefined when direction is cleared after a previous sort', async () => {
      const { component, stockListStore, fixture } = await setup();
      // First apply a real sort so the effect tracks sortField
      component.onSort({ active: 'quantity', direction: 'asc' });
      fixture.detectChanges();
      vi.clearAllMocks();
      // Now clear the direction â€” sortField becomes undefined in the effect
      component.onSort({ active: 'quantity', direction: '' });
      fixture.detectChanges();
      expect(stockListStore.search).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortDirection: '',
        sortField: undefined,
      });
    });
  });

  // Row selection
  describe('Row selection', () => {
    it('should toggle a row into the selection model', async () => {
      const item = makeStockItem();
      const { component } = await setup({ items: [item] });
      expect(component.selection.selected).toHaveLength(0);
      component.selection.toggle(item);
      expect(component.selection.isSelected(item)).toBe(true);
    });

    it('should reflect selected items in the selection model after toggle', async () => {
      const item = makeStockItem();
      const { component } = await setup({ items: [item] });
      expect(component.selection.selected).toHaveLength(0);
      component.selection.toggle(item);
      expect(component.selection.selected).toHaveLength(1);
      component.selection.toggle(item);
      expect(component.selection.selected).toHaveLength(0);
    });
  });
});

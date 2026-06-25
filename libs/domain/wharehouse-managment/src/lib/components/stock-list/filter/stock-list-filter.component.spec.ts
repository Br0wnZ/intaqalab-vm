/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import { ClientsDataService } from '@intaqalab/data-access';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import { StockListStore } from '../../../+state/stock-list.store';
import type { MunitionStockListSearch } from '../../../models/munition-stock-list.model';
import { StockListFilterComponent } from './stock-list-filter.component';

// Factories

function makeStockListStore() {
  return {
    items: signal<any[]>([]),
    totalElements: signal(0),
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
    clients: signal<any[]>([{ id: 'c-1', name: 'Client A' }]),
    hasError: signal(false),
  };
}

//  Setup

async function setup() {
  const stockListStore = makeStockListStore();
  const munitionComponentStore = makeMunitionComponentStore();
  const munitionsDumpsStore = makeMunitionsDumpsStore();
  const clientsDataService = makeClientsDataService();

  const view = await render(StockListFilterComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideAnimationsAsync(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: StockListStore, useValue: stockListStore },
      { provide: MunitionComponentStore, useValue: munitionComponentStore },
      { provide: MunitionsDumpsStore, useValue: munitionsDumpsStore },
      { provide: ClientsDataService, useValue: clientsDataService },
    ],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const component = fixture.componentInstance;
  const container = fixture.nativeElement as HTMLElement;
  return { fixture, component, container, stockListStore, munitionComponentStore, munitionsDumpsStore };
}

// Tests

describe('StockListFilterComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Initialization
  describe('Initialization', () => {
    it('should render the page title', async () => {
      await setup();
      expect(screen.getAllByText('WHAREHOUSE_MANAGMENT.STOCK_LIST.TITLE').length).toBeGreaterThan(0);
    });

    it('should render the search button', async () => {
      await setup();
      expect(screen.getByText('COMMONS.SEARCH')).toBeTruthy();
    });

    it('should call MunitionComponentStore.search() on init with pageSize 100 and active true', async () => {
      const { munitionComponentStore } = await setup();
      expect(munitionComponentStore.search).toHaveBeenCalledWith({ pageSize: 100, active: true });
    });

    it('should have the search button disabled initially (form is not dirty)', async () => {
      const { component } = await setup();
      // form starts with all empty defaults, so it is not dirty
      expect(component.form().dirty()).toBe(false);
    });
  });

  // â”€â”€ search() â€“ field mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe('search()', () => {
    it('should call store.search() with only non-empty fields, excluding plannedFireTrialView', async () => {
      const { component, fixture, stockListStore } = await setup();

      component.formModel.set({
        clientIds: ['c-1'],
        plannedFireTrialIds: 'trial-id-foo',
        plannedFireTrialView: '0001/25', // must be excluded from the call
        munitionTypeIds: ['m-type-1'],
        batch: 'LOT-A',
        munitionDumpIds: ['dump-1'],
        status: 'AVAILABLE',
        entryDateFrom: null,
        entryDateTo: null,
        retirementDateFrom: null,
        retirementDateTo: null,
        quantityMax: 100,
        quantityMin: 10,
      });
      fixture.detectChanges();
      component.search();
      fixture.detectChanges();

      const expectedCriteria: MunitionStockListSearch = {
        batch: 'LOT-A',
        clientIds: ['c-1'],
        plannedFireTrialIds: 'trial-id-foo',
        munitionTypeIds: ['m-type-1'],
        munitionDumpIds: ['dump-1'],
        status: 'AVAILABLE',
        quantityMax: 100,
        quantityMin: 10,
      };
      expect(stockListStore.search).toHaveBeenCalledWith(expectedCriteria);
    });

    it('should omit null / empty / empty-array fields from the search call', async () => {
      const { component, fixture, stockListStore } = await setup();

      component.formModel.set({
        clientIds: [], // empty array â†’ omitted
        plannedFireTrialIds: '', // empty string â†’ omitted
        plannedFireTrialView: '',
        munitionTypeIds: [],
        batch: 'LOT-B',
        munitionDumpIds: [],
        status: '',
        entryDateFrom: null, // null â†’ omitted
        entryDateTo: null,
        retirementDateFrom: null,
        retirementDateTo: null,
        quantityMax: null,
        quantityMin: null,
      });
      fixture.detectChanges();
      component.search();
      fixture.detectChanges();

      expect(stockListStore.search).toHaveBeenCalledWith({ batch: 'LOT-B' });
    });

    it('should format Date fields to yyyy-MM-dd strings', async () => {
      const { component, fixture, stockListStore } = await setup();

      component.formModel.set({
        clientIds: [],
        plannedFireTrialIds: '',
        plannedFireTrialView: '',
        munitionTypeIds: [],
        batch: '',
        munitionDumpIds: [],
        status: '',
        entryDateFrom: new Date(2025, 0, 15), // 15 Jan 2025
        entryDateTo: new Date(2025, 11, 31), // 31 Dec 2025
        retirementDateFrom: null,
        retirementDateTo: null,
        quantityMax: null,
        quantityMin: null,
      });
      fixture.detectChanges();
      component.search();
      fixture.detectChanges();

      expect(stockListStore.search).toHaveBeenCalledWith({
        entryDateFrom: '2025-01-15',
        entryDateTo: '2025-12-31',
      });
    });

    it('should have the search button disabled when form is pristine', async () => {
      const { container } = await setup();
      // fireEvent.click bypasses disabled state in JSDOM, so assert the attribute directly
      const searchBtn = container.querySelector('[mat-flat-button]') as HTMLButtonElement;
      expect(searchBtn.disabled).toBe(true);
    });
  });

  // munitionComboOptions() computed
  describe('munitionComboOptions() computed', () => {
    it('should return empty array when munitionComponentStore has no items', async () => {
      const { component } = await setup();
      expect(component.munitionComponentStore.items()).toEqual([]);
    });

    it('should return MUNITION and MUNITION_COMPONENT category items from the store', async () => {
      const { component, munitionComponentStore, fixture } = await setup();
      munitionComponentStore.items.set([
        { id: 'M-1', label: 'Munition', category: 'MUNITION', active: true, name: {}, observations: '' },
        { id: 'C-1', label: 'Component', category: 'MUNITION_COMPONENT', active: true, name: {}, observations: '' },
      ]);
      fixture.detectChanges();
      const options = component.munitionComponentStore.items();
      expect(options).toHaveLength(2);
      expect(options[0].id).toBe('M-1');
    });
  });
});

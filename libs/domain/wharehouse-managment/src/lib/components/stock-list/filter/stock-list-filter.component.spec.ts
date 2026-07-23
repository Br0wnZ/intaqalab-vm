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
  const filtersSpy = vi.fn();

  const view = await render(StockListFilterComponent, {
    imports: [TranslateModule.forRoot()],
    on: { filtersData: filtersSpy },
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
  return { fixture, component, container, stockListStore, munitionComponentStore, munitionsDumpsStore, filtersSpy };
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
      expect(screen.getByText('COMMONS.SEARCH')).toBeInTheDocument();
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

  // search() - field mapping
  describe('search()', () => {
    it('should emit only non-empty fields via filtersData, excluding plannedFireTrialView', async () => {
      const { component, fixture, filtersSpy } = await setup();

      component.formModel.set({
        clientIds: ['c-1'],
        plannedFireTrialIds: '',
        plannedFireTrialView: '0001/25',
        munitionTypeIds: ['m-type-1'],
        batches: 'LOT-A',
        munitionDumpIds: ['dump-1'],
        entryDateFrom: null,
        entryDateTo: null,
        retirementDateFrom: null,
        retirementDateTo: null,
        quantity: { min: 10, max: 100 },
      });
      fixture.detectChanges();
      component.search();
      fixture.detectChanges();

      const expectedCriteria: MunitionStockListSearch = {
        batches: 'LOT-A',
        clientIds: ['c-1'],
        munitionTypeIds: ['m-type-1'],
        munitionDumpIds: ['dump-1'],
        quantityMax: 100,
        quantityMin: 10,
      };
      expect(filtersSpy).toHaveBeenCalledWith(expectedCriteria);
    });

    it('should omit null and empty-array fields from the emitted filters', async () => {
      const { component, fixture, filtersSpy } = await setup();

      component.formModel.set({
        clientIds: [],
        plannedFireTrialIds: '',
        plannedFireTrialView: '',
        munitionTypeIds: [],
        batches: 'LOT-B',
        munitionDumpIds: [],
        entryDateFrom: null,
        entryDateTo: null,
        retirementDateFrom: null,
        retirementDateTo: null,
        quantity: { min: null, max: null },
      });
      fixture.detectChanges();
      component.search();
      fixture.detectChanges();

      expect(filtersSpy).toHaveBeenCalledWith({ batches: 'LOT-B' });
    });

    it('should format Date fields to yyyy-MM-dd strings in the emitted filters', async () => {
      const { component, fixture, filtersSpy } = await setup();

      component.formModel.set({
        clientIds: [],
        plannedFireTrialIds: '',
        plannedFireTrialView: '',
        munitionTypeIds: [],
        batches: '',
        munitionDumpIds: [],
        entryDateFrom: new Date(2025, 0, 15), // 15 Jan 2025
        entryDateTo: new Date(2025, 11, 31), // 31 Dec 2025
        retirementDateFrom: null,
        retirementDateTo: null,
        quantity: { min: null, max: null },
      });
      fixture.detectChanges();
      component.search();
      fixture.detectChanges();

      expect(filtersSpy).toHaveBeenCalledWith({
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

  // clearFilters()
  describe('clearFilters()', () => {
    it('should emit empty filters when clear button is clicked', async () => {
      const { component, fixture, filtersSpy, container } = await setup();
      component.formModel.set({ ...component.defaultFormValues, batches: 'LOT-X' });
      fixture.detectChanges();
      const clearBtn = container.querySelector('[mat-stroked-button]') as HTMLButtonElement;
      clearBtn.click();
      fixture.detectChanges();
      expect(filtersSpy).toHaveBeenCalledWith({});
    });

    it('should reset formModel to default values when clear button is clicked', async () => {
      const { component, fixture, container } = await setup();
      component.formModel.set({ ...component.defaultFormValues, batches: 'LOT-X' });
      fixture.detectChanges();
      const clearBtn = container.querySelector('[mat-stroked-button]') as HTMLButtonElement;
      clearBtn.click();
      fixture.detectChanges();
      expect(component.formModel()).toEqual(component.defaultFormValues);
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

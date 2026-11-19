/* eslint-disable testing-library/no-node-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { ClientsDataService } from '@intaqalab/data-access';
import { provideTranslateService } from '@ngx-translate/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DenominationsStore } from '../../../+state/denominations.store';
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
  const denominationsStore = {
    items: signal([
      { id: 'den-1', name: 'Denomination A' },
      { id: 'den-2', name: 'Denomination B' },
    ]),
    search: vi.fn(),
  };
  const clientsDataService = makeClientsDataService();
  const filtersSpy = vi.fn();

  const view = await render(StockListFilterComponent, {
    on: { filtersData: filtersSpy },
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideTestingEnvironment(),
      { provide: StockListStore, useValue: stockListStore },
      { provide: MunitionComponentStore, useValue: munitionComponentStore },
      { provide: DenominationsStore, useValue: denominationsStore },
      { provide: MunitionsDumpsStore, useValue: munitionsDumpsStore },
      { provide: ClientsDataService, useValue: clientsDataService },
      provideTranslateService(),
    ],
  });

  const fixture = view.fixture;
  fixture.detectChanges();
  const component = fixture.componentInstance;
  const container = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    component,
    container,
    stockListStore,
    munitionComponentStore,
    munitionsDumpsStore,
    denominationsStore,
    filtersSpy,
  };
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

    it('loads denomination options on initialization', async () => {
      const { denominationsStore } = await setup();
      expect(denominationsStore.search).toHaveBeenCalledWith({ pageSize: 500 });
    });

    it('should have the search button disabled initially (form is not dirty)', async () => {
      const { component } = await setup();
      // form starts with all empty defaults, so it is not dirty
      expect(component.form().dirty()).toBe(false);
    });
  });

  // search() - field mapping
  describe('search()', () => {
    it('shows selected denomination names and updates the tooltip after selection changes', async () => {
      const { fixture } = await setup();
      const user = userEvent.setup();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const selects = await loader.getAllHarnesses(MatSelectHarness);
      const select = selects[2];
      const tooltips = await loader.getAllHarnesses(MatTooltipHarness);
      const tooltip = tooltips[0];
      if (!select || !tooltip) throw new Error('Expected denomination select and tooltip');

      await tooltip.show();
      expect(await tooltip.isOpen()).toBe(false);

      await select.open();
      await user.click(screen.getByRole('option', { name: 'Denomination A' }));
      await user.click(screen.getByRole('option', { name: 'Denomination B' }));
      await select.close();
      await tooltip.show();
      expect(await tooltip.getTooltipText()).toBe('Denomination A, Denomination B');
      await tooltip.hide();

      await select.open();
      await user.click(screen.getByRole('option', { name: 'Denomination A' }));
      await select.close();
      await tooltip.show();
      expect(await tooltip.getTooltipText()).toBe('Denomination B');
      await tooltip.hide();

      await user.click(screen.getByRole('button', { name: 'WHAREHOUSE_MANAGMENT.STOCK_LIST.CLEAN_FILTERS_BUTTON' }));
      await tooltip.show();
      expect(await tooltip.isOpen()).toBe(false);
    });

    it('should resolve a trial number and emit its id without writing during validation', async () => {
      const { component, fixture, filtersSpy } = await setup();
      const http = TestBed.inject(HttpTestingController);
      fireEvent.input(screen.getByLabelText('WHAREHOUSE_MANAGMENT.STOCK_LIST.TRIAL_PREVIEW'), {
        target: { value: '0001/25' },
      });
      fixture.detectChanges();

      expect(screen.getByText('COMMONS.SEARCH').closest('button')).toBeDisabled();
      http
        .expectOne((request) => request.params.get('trialNumber') === '0001/25')
        .flush({
          items: [{ id: 'trial-1', trialNumber: '0001/25' }],
        });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.form.plannedFireTrialView().errors()).toEqual([]);
      expect(component.formModel().plannedFireTrialIds).toBe('trial-1');
      component.search();
      expect(filtersSpy).toHaveBeenLastCalledWith({ plannedFireTrialIds: ['trial-1'] });

      fireEvent.input(screen.getByLabelText('WHAREHOUSE_MANAGMENT.STOCK_LIST.TRIAL_PREVIEW'), {
        target: { value: '0002/25' },
      });
      fixture.detectChanges();
      expect(component.formModel().plannedFireTrialIds).toBe('');
      http
        .expectOne((request) => request.params.get('trialNumber') === '0002/25')
        .flush({
          items: [{ id: 'trial-2', trialNumber: '0002/25' }],
        });
      await fixture.whenStable();
      fixture.detectChanges();
      component.search();
      expect(filtersSpy).toHaveBeenLastCalledWith({ plannedFireTrialIds: ['trial-2'] });
      http.verify();
    });

    it.each(['missing', 'network'])('should report a %s trial lookup and not retain an old id', async (failure) => {
      const { component, fixture } = await setup();
      const http = TestBed.inject(HttpTestingController);
      const input = screen.getByLabelText('WHAREHOUSE_MANAGMENT.STOCK_LIST.TRIAL_PREVIEW');
      fireEvent.input(input, { target: { value: '0001/25' } });
      fixture.detectChanges();
      http
        .expectOne((request) => request.params.get('trialNumber') === '0001/25')
        .flush({
          items: [{ id: 'trial-1', trialNumber: '0001/25' }],
        });
      await fixture.whenStable();

      fireEvent.input(input, { target: { value: '0002/25' } });
      fixture.detectChanges();
      const request = http.expectOne((req) => req.params.get('trialNumber') === '0002/25');
      if (failure === 'missing') {
        request.flush({ items: [] });
      } else {
        request.flush('Failed', { status: 500, statusText: 'Server Error' });
      }
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.formModel().plannedFireTrialIds).toBe('');
      expect(component.form.plannedFireTrialView().errors()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: failure === 'missing' ? 'trialNotFound' : 'networkError',
            message:
              failure === 'missing'
                ? 'WHAREHOUSE_MANAGMENT.TRIAL_NOT_FOUND'
                : 'WHAREHOUSE_MANAGMENT.TRIAL_NOT_FOUND_NETWORK',
          }),
        ]),
      );
      expect(screen.getByText('COMMONS.SEARCH').closest('button')).toBeDisabled();
      http.verify();
    });

    it('should ignore an obsolete lookup when the trial number is cleared', async () => {
      const { component, fixture } = await setup();
      const http = TestBed.inject(HttpTestingController);
      const input = screen.getByLabelText('WHAREHOUSE_MANAGMENT.STOCK_LIST.TRIAL_PREVIEW');
      fireEvent.input(input, { target: { value: '0001/25' } });
      fixture.detectChanges();
      const request = http.expectOne((req) => req.params.get('trialNumber') === '0001/25');

      fireEvent.input(input, { target: { value: '' } });
      fixture.detectChanges();

      request.flush({
        items: [{ id: 'trial-1', trialNumber: '0001/25' }],
      });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.formModel().plannedFireTrialIds).toBe('');
      expect(component.form.plannedFireTrialView().errors()).toEqual([]);
      http.verify();
    });

    it('should emit only non-empty fields via filtersData, excluding plannedFireTrialView', async () => {
      const { component, fixture, filtersSpy } = await setup();

      component.formModel.set({
        ...component.defaultFormValues,
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
        ...component.defaultFormValues,
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
        ...component.defaultFormValues,
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

    it('selects denomination and distinct cell names, emits filters, and clears them', async () => {
      const { fixture, component, munitionsDumpsStore, filtersSpy } = await setup();
      const user = userEvent.setup();
      munitionsDumpsStore.items.set([
        { id: 'dump-1', munitionDumpId: 'Dump A', cells: [{ name: 'A-01' }, { name: 'B-01' }] },
        { id: 'dump-2', munitionDumpId: 'Dump B', cells: [{ name: 'A-01' }] },
      ]);
      await fixture.whenStable();

      const selects = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatSelectHarness);
      const denominationSelect = selects[2];
      const cellSelect = selects[4];
      if (!denominationSelect || !cellSelect) throw new Error('Expected denomination and cell selects');

      await denominationSelect.open();
      await user.click(screen.getByRole('option', { name: 'Denomination A' }));
      await user.click(screen.getByRole('option', { name: 'Denomination B' }));
      await denominationSelect.close();
      await cellSelect.open();
      expect(screen.getAllByRole('option', { name: 'A-01' })).toHaveLength(1);
      await user.click(screen.getByRole('option', { name: 'A-01' }));
      await user.click(screen.getByRole('option', { name: 'B-01' }));
      await cellSelect.close();
      await user.click(screen.getByRole('button', { name: 'COMMONS.SEARCH' }));

      expect(filtersSpy).toHaveBeenLastCalledWith({ denominationIds: ['den-1', 'den-2'], cellNames: ['A-01', 'B-01'] });

      await user.click(screen.getByRole('button', { name: 'WHAREHOUSE_MANAGMENT.STOCK_LIST.CLEAN_FILTERS_BUTTON' }));
      expect(filtersSpy).toHaveBeenLastCalledWith({});
      expect(component.formModel().denominationIds).toEqual([]);
      expect(component.formModel().cellNames).toEqual([]);
      expect(await denominationSelect.getValueText()).toBe('WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_DENOMINATION');
      expect(await cellSelect.getValueText()).toBe('WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_CELL_NAME');
    });

    it('should have the search button disabled when form is pristine', async () => {
      const { container } = await setup();
      // fireEvent.click bypasses disabled state in JSDOM, so assert the attribute directly
      const searchBtn = container.querySelector('[mat-flat-button]') as HTMLButtonElement;
      expect(searchBtn.disabled).toBe(true);
    });

    it('should submit via FormRoot when Search button is clicked on dirty valid form', async () => {
      const { component, fixture, filtersSpy } = await setup();
      component.form.batches().controlValue.set('LOT-C');
      component.form().markAsDirty();
      fixture.detectChanges();

      const searchBtn = screen.getByRole('button', { name: 'COMMONS.SEARCH' });
      expect(searchBtn).toHaveAttribute('type', 'submit');
      searchBtn.click();
      await fixture.whenStable();

      expect(filtersSpy).toHaveBeenCalledWith({ batches: 'LOT-C' });
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

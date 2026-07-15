import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';

import { MovementsListStore } from '../../../+state/movements-list.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MovementListSearch } from '../../../models/movements.model';
import { MovementsFilterComponent } from './movements-filter.component';

function createMockMovementsStore() {
  return {
    search: vi.fn(),
  };
}

function createMockMunitionsDumpsStore() {
  return {
    items: signal([]),
    search: vi.fn(),
  };
}

describe('MovementsFilterComponent', () => {
  let mockMovementsStore: ReturnType<typeof createMockMovementsStore>;
  let mockMunitionsDumpsStore: ReturnType<typeof createMockMunitionsDumpsStore>;

  const setup = async () => {
    const user = userEvent.setup();
    mockMovementsStore = createMockMovementsStore();
    mockMunitionsDumpsStore = createMockMunitionsDumpsStore();

    const view = await render(MovementsFilterComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideTestingEnvironment(),
        // MovementsListStore se inyecta con { skipSelf: true }, debe estar en el mÃ³dulo padre
        { provide: MovementsListStore, useValue: mockMovementsStore },
        { provide: MunitionsDumpsStore, useValue: mockMunitionsDumpsStore },
      ],
      componentInputs: { stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d' },
    });
    view.fixture.detectChanges();
    return { user, view, component: view.fixture.componentInstance };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the filter title', async () => {
      await setup();
      expect(screen.getAllByText(/WHAREHOUSE_MANAGMENT\.MOVEMENTS\.TITLE/i)[0]).toBeInTheDocument();
    });

    it('should render the search button', async () => {
      await setup();
      expect(screen.getByText(/COMMONS\.SEARCH/i)).toBeInTheDocument();
    });

    it('should call munitionDumpsStore.search on init', async () => {
      await setup();
      expect(mockMunitionsDumpsStore.search).toHaveBeenCalledWith({});
    });
  });

  describe('search()', () => {
    it('should call store.search with mapped numeric and array criteria', async () => {
      const { component } = await setup();
      const formValues = {
        affectedNeq: 10,
        associatedFireTrialIds: ['x'],
        dateTimeFrom: null,
        timeFrom: null,
        dateTimeTo: null,
        timeTo: null,
        destinationMunitionDumpIds: ['y'],
        movementTypes: [],
        originMunitionDumpIds: ['z'],
        quantityMax: 20,
        quantityMin: 30,
        userId: '',
      };
      component.formModel.set(formValues);
      component.search();

      const expectedCriteria: MovementListSearch = {
        affectedNeq: formValues.affectedNeq,
        associatedFireTrialIds: formValues.associatedFireTrialIds,
        destinationMunitionDumpIds: formValues.destinationMunitionDumpIds,
        quantityMax: formValues.quantityMax,
        quantityMin: formValues.quantityMin,
        originMunitionDumpIds: formValues.originMunitionDumpIds,
        stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d',
      };
      expect(mockMovementsStore.search).toHaveBeenCalledWith(expectedCriteria);
    });

    it('should omit empty strings, nulls and empty arrays from criteria', async () => {
      const { component } = await setup();
      component.formModel.set({
        affectedNeq: 0,
        associatedFireTrialIds: [],
        dateTimeFrom: null,
        timeFrom: null,
        dateTimeTo: null,
        timeTo: null,
        destinationMunitionDumpIds: [],
        movementTypes: [],
        originMunitionDumpIds: [],
        quantityMax: null,
        quantityMin: null,
        userId: '',
      });
      component.search();
      expect(mockMovementsStore.search).toHaveBeenCalledWith({ stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d' });
    });

    it('should combine dateTimeFrom with timeFrom when both are provided', async () => {
      const { component } = await setup();
      const dateFrom = '2026-02-01T00:00:00Z';
      const hourFrom = '2025-01-05T12:05:00Z';
      component.form.dateTimeFrom().setControlValue(new Date(dateFrom));
      component.form.timeFrom().setControlValue(new Date(hourFrom));
      component.search();

      const expectedCriteria: MovementListSearch = {
        dateTimeFrom: '2026-02-01T12:05:00Z',
        stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d',
      };
      expect(mockMovementsStore.search).toHaveBeenCalledWith(expectedCriteria);
    });

    it('should combine dateTimeTo with timeTo when both are provided', async () => {
      const { component } = await setup();
      const dateTo = '2027-02-01T00:00:00Z';
      const hourTo = '2027-01-05T11:03:00Z';
      component.form.dateTimeTo().setControlValue(new Date(dateTo));
      component.form.timeTo().setControlValue(new Date(hourTo));
      component.search();

      const expectedCriteria: MovementListSearch = {
        dateTimeTo: '2027-02-01T11:03:00Z',
        stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d',
      };
      expect(mockMovementsStore.search).toHaveBeenCalledWith(expectedCriteria);
    });
  });

  describe('Effects - auto-fill time on date selection', () => {
    it('should set timeFrom to 00:00 in formModel when dateTimeFrom is selected', async () => {
      const { component, view } = await setup();

      component.form.dateTimeFrom().setControlValue(new Date('2026-06-15T10:00:00Z'));
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      const timeFrom = component.formModel().timeFrom as Date;
      expect(timeFrom).not.toBeNull();
      expect(timeFrom.getHours()).toBe(0);
      expect(timeFrom.getMinutes()).toBe(0);
    });

    it('should not update timeFrom in formModel when dateTimeFrom is cleared', async () => {
      const { component, view } = await setup();

      component.form.dateTimeFrom().setControlValue(null);
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      expect(component.formModel().timeFrom).toBeNull();
    });

    it('should update timeFrom when dateTimeFrom changes to a different date', async () => {
      const { component, view } = await setup();

      component.form.dateTimeFrom().setControlValue(new Date('2026-06-15T10:00:00Z'));
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      component.form.dateTimeFrom().setControlValue(new Date('2026-07-20T14:30:00Z'));
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      const timeFrom = component.formModel().timeFrom as Date;
      expect(timeFrom.getHours()).toBe(0);
      expect(timeFrom.getMinutes()).toBe(0);
    });

    it('should set timeTo to 23:30 in formModel when dateTimeTo is selected', async () => {
      const { component, view } = await setup();

      component.form.dateTimeTo().setControlValue(new Date('2026-06-15T10:00:00Z'));
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      const timeTo = component.formModel().timeTo as Date;
      expect(timeTo).not.toBeNull();
      expect(timeTo.getHours()).toBe(23);
      expect(timeTo.getMinutes()).toBe(30);
    });

    it('should not update timeTo in formModel when dateTimeTo is cleared', async () => {
      const { component, view } = await setup();

      component.form.dateTimeTo().setControlValue(null);
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      expect(component.formModel().timeTo).toBeNull();
    });

    it('should update timeTo when dateTimeTo changes to a different date', async () => {
      const { component, view } = await setup();

      component.form.dateTimeTo().setControlValue(new Date('2026-06-15T10:00:00Z'));
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      component.form.dateTimeTo().setControlValue(new Date('2026-08-01T08:00:00Z'));
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      const timeTo = component.formModel().timeTo as Date;
      expect(timeTo.getHours()).toBe(23);
      expect(timeTo.getMinutes()).toBe(30);
    });

    it('should set both timeFrom and timeTo independently when both dates are selected', async () => {
      const { component, view } = await setup();

      component.form.dateTimeFrom().setControlValue(new Date('2026-06-01T10:00:00Z'));
      component.form.dateTimeTo().setControlValue(new Date('2026-06-30T10:00:00Z'));
      view.fixture.detectChanges();
      await view.fixture.whenStable();

      const timeFrom = component.formModel().timeFrom as Date;
      const timeTo = component.formModel().timeTo as Date;
      expect(timeFrom.getHours()).toBe(0);
      expect(timeFrom.getMinutes()).toBe(0);
      expect(timeTo.getHours()).toBe(23);
      expect(timeTo.getMinutes()).toBe(30);
    });
  });

  describe('clearFilters()', () => {
    it('should reset formModel to defaultFormValues', async () => {
      const { component } = await setup();
      component.formModel.set({ ...component.defaultFormValues, userId: 'user-abc' });

      component.clearFilters();

      expect(component.formModel()).toBe(component.defaultFormValues);
    });

    it('should call movementsListStore.search with only stockId', async () => {
      const { component } = await setup();

      component.clearFilters();

      expect(mockMovementsStore.search).toHaveBeenCalledWith({
        stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d',
      });
    });

    it('should disable the clean-filters button after clearing', async () => {
      const { component, view } = await setup();
      component.formModel.set({ ...component.defaultFormValues, userId: 'user-abc' });
      view.fixture.detectChanges();

      component.clearFilters();
      view.fixture.detectChanges();

      const clearButton = screen
        .getByText(/WHAREHOUSE_MANAGMENT\.STOCK_LIST\.CLEAN_FILTERS_BUTTON/i)
        .closest('button') as HTMLButtonElement;
      expect(clearButton.disabled).toBe(true);
    });
  });

  describe('Button states', () => {
    it('should disable the clean-filters button when formModel matches defaultFormValues', async () => {
      await setup();

      const clearButton = screen
        .getByText(/WHAREHOUSE_MANAGMENT\.STOCK_LIST\.CLEAN_FILTERS_BUTTON/i)
        .closest('button') as HTMLButtonElement;
      expect(clearButton.disabled).toBe(true);
    });

    it('should enable the clean-filters button when formModel differs from defaultFormValues', async () => {
      const { component, view } = await setup();
      component.formModel.set({ ...component.defaultFormValues, userId: 'user-abc' });
      view.fixture.detectChanges();

      const clearButton = screen
        .getByText(/WHAREHOUSE_MANAGMENT\.STOCK_LIST\.CLEAN_FILTERS_BUTTON/i)
        .closest('button') as HTMLButtonElement;
      expect(clearButton.disabled).toBe(false);
    });

    it('should disable the search button when form is invalid', async () => {
      const { component, view } = await setup();
      // quantityMax < quantityMin makes form invalid
      component.form.quantityMin().setControlValue(100);
      component.form.quantityMax().setControlValue(50);
      view.fixture.detectChanges();

      const searchButton = screen.getByText(/COMMONS\.SEARCH/i).closest('button') as HTMLButtonElement;
      expect(component.form().invalid()).toBe(true);
      expect(searchButton.disabled).toBe(true);
    });

    it('should enable the search button when form is valid', async () => {
      const { component } = await setup();

      const searchButton = screen.getByText(/COMMONS\.SEARCH/i).closest('button') as HTMLButtonElement;
      expect(component.form().invalid()).toBe(false);
      expect(searchButton.disabled).toBe(false);
    });
  });

  describe('Form validation', () => {
    describe('timeFrom field', () => {
      it('should be disabled initially when dateTimeFrom is null', async () => {
        const { component } = await setup();

        expect(component.form.timeFrom().disabled()).toBe(true);
      });

      it('should become enabled after dateTimeFrom is set', async () => {
        const { component, view } = await setup();
        component.form.dateTimeFrom().setControlValue(new Date('2026-06-15T00:00:00Z'));
        view.fixture.detectChanges();
        await view.fixture.whenStable();

        expect(component.form.timeFrom().disabled()).toBe(false);
      });

      it('should keep form valid when dateTimeFrom is set (effect auto-fills timeFrom)', async () => {
        const { component, view } = await setup();
        component.form.dateTimeFrom().setControlValue(new Date('2026-06-15T00:00:00Z'));
        view.fixture.detectChanges();
        await view.fixture.whenStable();

        // Effect auto-fills timeFrom → required validator is satisfied
        expect(component.formModel().timeFrom).not.toBeNull();
        expect(component.form().invalid()).toBe(false);
      });
    });

    describe('timeTo field', () => {
      it('should be disabled initially when dateTimeTo is null', async () => {
        const { component } = await setup();

        expect(component.form.timeTo().disabled()).toBe(true);
      });

      it('should become enabled after dateTimeTo is set', async () => {
        const { component, view } = await setup();
        component.form.dateTimeTo().setControlValue(new Date('2026-06-15T00:00:00Z'));
        view.fixture.detectChanges();
        await view.fixture.whenStable();

        expect(component.form.timeTo().disabled()).toBe(false);
      });

      it('should keep form valid when dateTimeTo is set (effect auto-fills timeTo)', async () => {
        const { component, view } = await setup();
        component.form.dateTimeTo().setControlValue(new Date('2026-06-15T00:00:00Z'));
        view.fixture.detectChanges();
        await view.fixture.whenStable();

        // Effect auto-fills timeTo → required validator is satisfied
        expect(component.formModel().timeTo).not.toBeNull();
        expect(component.form().invalid()).toBe(false);
      });
    });

    describe('quantityMax validator', () => {
      it('should return an error when quantityMax is less than quantityMin', async () => {
        const { component, view } = await setup();
        component.form.quantityMin().setControlValue(100);
        component.form.quantityMax().setControlValue(50);
        view.fixture.detectChanges();

        const errors = component.form.quantityMax().errors();
        expect(errors).not.toBeNull();
        expect(errors?.some((e: { kind: string }) => e.kind === 'positive')).toBe(true);
      });

      it('should return no error when quantityMax is greater than quantityMin', async () => {
        const { component, view } = await setup();
        component.form.quantityMin().setControlValue(50);
        component.form.quantityMax().setControlValue(100);
        view.fixture.detectChanges();

        const errors = component.form.quantityMax().errors();
        const hasPositiveError = errors?.some((e: { kind: string }) => e.kind === 'positive') ?? false;
        expect(hasPositiveError).toBe(false);
      });

      it('should return no error when quantityMin is null', async () => {
        const { component, view } = await setup();
        component.form.quantityMax().setControlValue(50);
        view.fixture.detectChanges();

        const errors = component.form.quantityMax().errors();
        const hasPositiveError = errors?.some((e: { kind: string }) => e.kind === 'positive') ?? false;
        expect(hasPositiveError).toBe(false);
      });

      it('should return no error when quantityMax is null', async () => {
        const { component, view } = await setup();
        component.form.quantityMin().setControlValue(50);
        view.fixture.detectChanges();

        const errors = component.form.quantityMax().errors();
        const hasPositiveError = errors?.some((e: { kind: string }) => e.kind === 'positive') ?? false;
        expect(hasPositiveError).toBe(false);
      });
    });

    describe('date interval validator', () => {
      it('should return invalid_date_interval on dateTimeFrom when from > to', async () => {
        const { component, view } = await setup();
        component.form.dateTimeFrom().setControlValue(new Date('2026-06-20T00:00:00Z'));
        component.form.dateTimeTo().setControlValue(new Date('2026-06-10T00:00:00Z'));
        view.fixture.detectChanges();

        const errors = component.form.dateTimeFrom().errors();
        expect(errors).not.toBeNull();
        expect(errors?.some((e: { kind: string }) => e.kind === 'invalid_date_interval')).toBe(true);
      });

      it('should return invalid_date_interval on dateTimeTo when from > to', async () => {
        const { component, view } = await setup();
        component.form.dateTimeFrom().setControlValue(new Date('2026-06-20T00:00:00Z'));
        component.form.dateTimeTo().setControlValue(new Date('2026-06-10T00:00:00Z'));
        view.fixture.detectChanges();

        const errors = component.form.dateTimeTo().errors();
        expect(errors).not.toBeNull();
        expect(errors?.some((e: { kind: string }) => e.kind === 'invalid_date_interval')).toBe(true);
      });

      it('should return no date interval error when from <= to', async () => {
        const { component, view } = await setup();
        component.form.dateTimeFrom().setControlValue(new Date('2026-06-01T00:00:00Z'));
        component.form.dateTimeTo().setControlValue(new Date('2026-06-30T00:00:00Z'));
        view.fixture.detectChanges();

        const fromErrors = component.form.dateTimeFrom().errors();
        const toErrors = component.form.dateTimeTo().errors();
        const hasFromIntervalError =
          fromErrors?.some((e: { kind: string }) => e.kind === 'invalid_date_interval') ?? false;
        const hasToIntervalError = toErrors?.some((e: { kind: string }) => e.kind === 'invalid_date_interval') ?? false;
        expect(hasFromIntervalError).toBe(false);
        expect(hasToIntervalError).toBe(false);
      });

      it('should return no date interval error when only one date is provided', async () => {
        const { component, view } = await setup();
        component.form.dateTimeFrom().setControlValue(new Date('2026-06-15T00:00:00Z'));
        view.fixture.detectChanges();

        const errors = component.form.dateTimeFrom().errors();
        const hasIntervalError = errors?.some((e: { kind: string }) => e.kind === 'invalid_date_interval') ?? false;
        expect(hasIntervalError).toBe(false);
      });
    });
  });

  describe('movementTypesOptions', () => {
    it('should contain TRANSFER and RETIRE options', async () => {
      const { component } = await setup();
      const ids = component.movementTypesOptions.map((o) => o.id);

      expect(ids).toContain('TRANSFER');
      expect(ids).toContain('RETIRE');
    });

    it('should have exactly 2 options', async () => {
      const { component } = await setup();

      expect(component.movementTypesOptions).toHaveLength(2);
    });
  });

  describe('search() - additional cases', () => {
    it('should include movementTypes when not empty', async () => {
      const { component } = await setup();
      component.formModel.set({ ...component.defaultFormValues, movementTypes: ['TRANSFER'] });

      component.search();

      expect(mockMovementsStore.search).toHaveBeenCalledWith({
        stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d',
        movementTypes: ['TRANSFER'],
      });
    });

    it('should include userId when not empty', async () => {
      const { component } = await setup();
      component.formModel.set({ ...component.defaultFormValues, userId: 'user-xyz' });

      component.search();

      expect(mockMovementsStore.search).toHaveBeenCalledWith({
        stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d',
        userId: 'user-xyz',
      });
    });

    it('should include affectedNeq when non-zero', async () => {
      const { component } = await setup();
      component.formModel.set({ ...component.defaultFormValues, affectedNeq: 5 });

      component.search();

      expect(mockMovementsStore.search).toHaveBeenCalledWith({
        stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d',
        affectedNeq: 5,
      });
    });

    it('should omit affectedNeq when zero', async () => {
      const { component } = await setup();
      component.formModel.set({ ...component.defaultFormValues, affectedNeq: 0 });

      component.search();

      expect(mockMovementsStore.search).toHaveBeenCalledWith({
        stockId: '57e0ef82-5f18-48ab-b36b-115c4e137f3d',
      });
    });
  });
});

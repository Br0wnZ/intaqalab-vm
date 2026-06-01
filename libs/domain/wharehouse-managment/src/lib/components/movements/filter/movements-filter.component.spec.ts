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

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

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
        dateTimeFrom: '',
        timeFrom: '',
        dateTimeTo: '',
        timeTo: '',
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
      };
      expect(mockMovementsStore.search).toHaveBeenCalledWith(expectedCriteria);
    });

    it('should omit empty strings, nulls and empty arrays from criteria', async () => {
      const { component } = await setup();
      component.formModel.set({
        affectedNeq: 0,
        associatedFireTrialIds: [],
        dateTimeFrom: '',
        timeFrom: '',
        dateTimeTo: '',
        timeTo: '',
        destinationMunitionDumpIds: [],
        movementTypes: [],
        originMunitionDumpIds: [],
        quantityMax: null,
        quantityMin: null,
        userId: '',
      });
      component.search();
      expect(mockMovementsStore.search).toHaveBeenCalledWith({});
    });

    it('should combine dateTimeFrom with timeFrom when both are provided', async () => {
      const { component } = await setup();
      const dateFrom = '2026-02-01T00:00:00Z';
      const hourFrom = '2025-01-05T12:05:00Z';
      component.filterForm.dateTimeFrom().setControlValue(new Date(dateFrom));
      component.filterForm.timeFrom().setControlValue(new Date(hourFrom));
      component.search();

      const expectedCriteria: MovementListSearch = {
        dateTimeFrom: '2026-02-01T12:05:00Z',
      };
      expect(mockMovementsStore.search).toHaveBeenCalledWith(expectedCriteria);
    });

    it('should combine dateTimeTo with timeTo when both are provided', async () => {
      const { component } = await setup();
      const dateTo = '2027-02-01T00:00:00Z';
      const hourTo = '2027-01-05T11:03:00Z';
      component.filterForm.dateTimeTo().setControlValue(new Date(dateTo));
      component.filterForm.timeTo().setControlValue(new Date(hourTo));
      component.search();

      const expectedCriteria: MovementListSearch = {
        dateTimeTo: '2027-02-01T11:03:00Z',
      };
      expect(mockMovementsStore.search).toHaveBeenCalledWith(expectedCriteria);
    });
  });
});

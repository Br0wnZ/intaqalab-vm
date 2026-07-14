import { signal } from '@angular/core';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { DocumentTypesService } from '../../../services/documents/document-types/document-types.service';
import { DocumentsService } from '../../../services/documents/documents.service';
import { UserDataService } from '../../../services/user-data.service';
import type { EventLogDocumentType, EventLogDocumentsSearch } from '../../../utils-models/documents.model';
import type { EventLogUser } from '../../../utils-models/user.model';
import { EventLogDocumentsFilterComponent } from './documents-filter.component';

const MOCK_USERS: EventLogUser[] = [
  { id: 'u1', label: 'Alice' },
  { id: 'u2', label: 'Bob' },
];

const MOCK_DOC_TYPES: EventLogDocumentType[] = [
  { id: 'dt1', name: 'Informe' },
  { id: 'dt2', name: 'Acta' },
];

function makeMockUserDataService() {
  return {
    getUsersResponse: createMockResource<EventLogUser[]>(MOCK_USERS),
  };
}

function makeMockDocumentTypesService() {
  return {
    getDocumentTypesResponse: createMockResource<EventLogDocumentType[]>(MOCK_DOC_TYPES),
  };
}

function makeMockDocumentsService() {
  return {
    filtersItems: signal<Partial<EventLogDocumentsSearch>>({}),
    paginatedResponse: createMockResource(),
    searchItems: signal([]),
  };
}

async function setup() {
  const mockUserDataService = makeMockUserDataService();
  const mockDocumentTypesService = makeMockDocumentTypesService();
  const mockDocumentsService = makeMockDocumentsService();
  const events = userEvent.setup();

  const view = await render(EventLogDocumentsFilterComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideTestingEnvironment(),
      { provide: UserDataService, useValue: mockUserDataService },
      { provide: DocumentTypesService, useValue: mockDocumentTypesService },
      { provide: DocumentsService, useValue: mockDocumentsService },
    ],
  });

  view.fixture.detectChanges();
  const component = view.fixture.componentInstance;
  const container = view.fixture.nativeElement as HTMLElement;

  return { view, component, container, events, mockDocumentsService };
}

describe('EventLogDocumentsFilterComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have the form in invalid state initially', async () => {
      const { component } = await setup();
      expect(component.form().invalid()).toBe(true);
    });

    it('should hide the filter panel by default', async () => {
      await setup();
      expect(screen.queryByText('EVENT_LOG.FILTERS.SEARCH_BUTTON')).not.toBeInTheDocument();
    });

    it('should render the export PDF button', async () => {
      await setup();
      expect(screen.getByText('EVENT_LOG.FILTERS.EXPORT_PDF_BUTTON')).toBeInTheDocument();
    });

    it('should render the export Excel button', async () => {
      await setup();
      expect(screen.getByText('EVENT_LOG.FILTERS.EXPORT_EXCEL_BUTTON')).toBeInTheDocument();
    });
  });

  describe('filter panel toggle', () => {
    it('should show the filter panel after clicking the toggle button', async () => {
      const { events } = await setup();

      const toggleBtn = screen.getByText('EVENT_LOG.FILTERS.TOGGLE_FILTERS_PANEL_BUTTON');
      await events.click(toggleBtn);

      expect(screen.getByText('EVENT_LOG.FILTERS.SEARCH_BUTTON')).toBeInTheDocument();
    });

    it('should hide the filter panel again after clicking toggle twice', async () => {
      const { events } = await setup();

      const toggleBtn = screen.getByText('EVENT_LOG.FILTERS.TOGGLE_FILTERS_PANEL_BUTTON');
      await events.click(toggleBtn);
      await events.click(toggleBtn);

      expect(screen.queryByText('EVENT_LOG.FILTERS.SEARCH_BUTTON')).not.toBeInTheDocument();
    });
  });

  describe('search button state', () => {
    it('should keep the form invalid when no filters are provided', async () => {
      const { component, view } = await setup();

      component.showFilters.set(true);
      view.fixture.detectChanges();

      expect(component.form().invalid()).toBe(true);
    });

    it('should enable the search button when hardwareId is filled', async () => {
      const { component, view, container } = await setup();

      component.showFilters.set(true);
      view.fixture.detectChanges();

      const hardwareIdInput = container.querySelector('#event-filter-hardware') as HTMLInputElement;
      hardwareIdInput.value = '192.168.1.1';
      hardwareIdInput.dispatchEvent(new Event('input', { bubbles: true }));
      view.fixture.detectChanges();

      expect(component.form().invalid()).toBe(false);
    });
  });

  describe('search() action', () => {
    it('should call documentsService.filtersItems.set with mapped filters on search click', async () => {
      const { component, view, container, mockDocumentsService } = await setup();

      component.showFilters.set(true);
      view.fixture.detectChanges();

      const hardwareIdInput = container.querySelector('#event-filter-hardware') as HTMLInputElement;
      hardwareIdInput.value = '10.0.0.1';
      hardwareIdInput.dispatchEvent(new Event('input', { bubbles: true }));
      view.fixture.detectChanges();

      const setSpy = vi.spyOn(mockDocumentsService.filtersItems, 'set');
      const searchButton = screen.getByText('EVENT_LOG.FILTERS.SEARCH_BUTTON');
      searchButton.click();
      view.fixture.detectChanges();

      expect(setSpy).toHaveBeenCalledOnce();
      expect(setSpy.mock.calls[0][0]).toMatchObject({ hardwareId: '10.0.0.1' });
    });
  });

  describe('clear filters', () => {
    it('should reset the form model to default values when clear is clicked', async () => {
      const { component, view, container } = await setup();

      component.showFilters.set(true);
      view.fixture.detectChanges();

      const hardwareIdInput = container.querySelector('#event-filter-hardware') as HTMLInputElement;
      hardwareIdInput.value = '10.0.0.1';
      hardwareIdInput.dispatchEvent(new Event('input', { bubbles: true }));
      view.fixture.detectChanges();

      const clearButton = screen.getByText('EVENT_LOG.FILTERS.CLEAN_BUTTON');
      clearButton.click();
      view.fixture.detectChanges();

      expect(component.formModel().hardwareId).toBe('');
    });
  });
});

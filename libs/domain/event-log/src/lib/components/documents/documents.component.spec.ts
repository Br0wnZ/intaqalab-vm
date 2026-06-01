import { signal } from '@angular/core';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { PaginatedSortedViewRequest } from '@intaqalab/models';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { DocumentTypesService } from '../../services/documents/document-types/document-types.service';
import { DocumentsService } from '../../services/documents/documents.service';
import { UserDataService } from '../../services/user-data.service';
import type {
  EventLogDocumentType,
  EventLogDocumentsResponse,
  EventLogDocumentsSearch,
} from '../../utils-models/documents.model';
import type { EventLogUser } from '../../utils-models/user.model';
import { EventLogDocumentsComponent } from './documents.component';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const MOCK_USERS: EventLogUser[] = [
  { id: 'u1', label: 'Usuario 1' },
  { id: 'u2', label: 'Usuario 2' },
];

const MOCK_DOC_TYPES: EventLogDocumentType[] = [
  { id: 'b1e1e7e0-1a2b-4c3d-8e9f-1a2b3c4d5e6f', name: 'Autorización' },
  { id: 'c2f2f8f1-2b3c-5d4e-9f0a-2b3c4d5e6f7a', name: 'Certificado de conformidad' },
];

const MOCKED_RESPONSE: EventLogDocumentsResponse[] = [
  {
    title: 'Documento 1',
    type: { id: 'b1e1e7e0-1a2b-4c3d-8e9f-1a2b3c4d5e6f', name: 'Autorización' },
    date: '2026/02/15',
    action: 'view',
    user: { id: 'u1', label: 'Usuario 1' },
    hardwareId: '192.168.1.1',
    accessCount: 1,
  },
  {
    title: 'Documento 2',
    type: { id: 'c2f2f8f1-2b3c-5d4e-9f0a-2b3c4d5e6f7a', name: 'Certificado de conformidad' },
    date: '2026/02/20',
    action: 'modify',
    user: { id: 'u2', label: 'Usuario 2' },
    hardwareId: '192.168.1.2',
    accessCount: 2,
  },
];

function makeMockDocumentsService(items: EventLogDocumentsResponse[] = MOCKED_RESPONSE) {
  const paginatedMockedDocuments = {
    page: 1,
    pageSize: 10,
    totalElements: items.length,
    items,
  };

  return {
    searchItems: signal<Partial<PaginatedSortedViewRequest>>({}),
    filtersItems: signal<Partial<EventLogDocumentsSearch>>({}),
    paginatedResponse: createMockResource(paginatedMockedDocuments),
  };
}

function makeMockUserDataService() {
  return { getUsersResponse: createMockResource<EventLogUser[]>(MOCK_USERS) };
}

function makeMockDocumentTypesService() {
  return { getDocumentTypesResponse: createMockResource<EventLogDocumentType[]>(MOCK_DOC_TYPES) };
}

async function setup(items: EventLogDocumentsResponse[] = MOCKED_RESPONSE) {
  const mockDocumentsService = makeMockDocumentsService(items);
  const mockUserDataService = makeMockUserDataService();
  const mockDocumentTypesService = makeMockDocumentTypesService();

  const view = await render(EventLogDocumentsComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideTestingEnvironment(),
      { provide: DocumentsService, useValue: mockDocumentsService },
      { provide: UserDataService, useValue: mockUserDataService },
      { provide: DocumentTypesService, useValue: mockDocumentTypesService },
    ],
  });

  view.fixture.detectChanges();
  const container = view.fixture.nativeElement as HTMLElement;
  return { view, container, mockDocumentsService };
}

describe('EventLogDocumentsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial rendering', () => {
    it('should render the filter component', async () => {
      const { container } = await setup();
      expect(container.querySelector('inta-event-log-documents-filter')).not.toBeNull();
    });

    it('should render the table when data is available', async () => {
      const { container } = await setup();
      expect(container.querySelector('table')).not.toBeNull();
    });

    it('should render all column headers', async () => {
      await setup();
      expect(screen.getByText('EVENT_LOG.DOCUMENTS.LABELS.TITLE')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.DOCUMENTS.LABELS.TYPE')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.DATE')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.USER')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.HARDWARE_ID')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.DOCUMENTS.LABELS.ACCESS_COUNT')).toBeTruthy();
    });

    it('should render a row for each document', async () => {
      await setup();
      expect(screen.getByText('Documento 1')).toBeTruthy();
      expect(screen.getByText('Documento 2')).toBeTruthy();
    });

    it('should render user labels in rows', async () => {
      await setup();
      expect(screen.getByText('Usuario 1')).toBeTruthy();
      expect(screen.getByText('Usuario 2')).toBeTruthy();
    });

    it('should render hardware IDs in rows', async () => {
      await setup();
      expect(screen.getByText('192.168.1.1')).toBeTruthy();
      expect(screen.getByText('192.168.1.2')).toBeTruthy();
    });

    it('should render the paginator', async () => {
      const { container } = await setup();
      expect(container.querySelector('mat-paginator')).not.toBeNull();
    });
  });

  describe('empty state', () => {
    it('should render the table with no data rows when items is empty', async () => {
      const { container } = await setup([]);
      // Table still renders ([] is truthy), but no data rows
      expect(container.querySelector('table')).not.toBeNull();
      expect(container.querySelectorAll('tr[mat-row]').length).toBe(0);
    });
  });

  describe('searchItems signal', () => {
    it('should call searchItems.set when the effect triggers on init', async () => {
      const { mockDocumentsService } = await setup();
      // The effect calls store.search() → service.searchItems.set()
      // After render, searchItems should have been populated with page/pageSize
      const currentSearch = mockDocumentsService.searchItems();
      expect(currentSearch).toMatchObject({ page: 1, pageSize: 10 });
    });
  });
});

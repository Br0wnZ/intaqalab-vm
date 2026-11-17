import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { PaginatedSortedViewRequest } from '@intaqalab/models';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { GeneralDataService } from '../../services/general-data/general-data.service';
import { UserDataService } from '../../services/user-data.service';
import type { EventLogGeneralDataResponse, EventLogGeneralDataSearch } from '../../utils-models/general-data.model';
import type { EventLogUser } from '../../utils-models/user.model';
import { EventLogGeneralDataComponent } from './general-data.component';

const MOCK_USERS: EventLogUser[] = [
  { id: 'u1', label: 'Usuario 1' },
  { id: 'u2', label: 'Usuario 2' },
];

const MOCKED_RESPONSE: EventLogGeneralDataResponse[] = [
  {
    date: '2026/02/15',
    action: 'create',
    user: { id: '550e8400-e29b-41d4-a716-User1', label: 'Usuario 1' },
    hardwareId: '192.168.1.1',
    value: 'Valor 1',
  },
  {
    date: '2026/02/20',
    action: 'edit',
    user: { id: '550e8400-e29b-41d4-a716-User2', label: 'Usuario 2' },
    hardwareId: '192.168.1.2',
    value: 'Valor 2',
  },
];

function makeMockGeneralDataService(items: EventLogGeneralDataResponse[] = MOCKED_RESPONSE) {
  return {
    searchItems: signal<Partial<PaginatedSortedViewRequest>>({}),
    filtersItems: signal<Partial<EventLogGeneralDataSearch>>({}),
    paginatedResponse: createMockResource({
      page: 1,
      pageSize: 10,
      totalElements: items.length,
      items,
    }),
  };
}

function makeMockUserDataService() {
  return { getUsersResponse: createMockResource<EventLogUser[]>(MOCK_USERS) };
}

async function setup(items: EventLogGeneralDataResponse[] = MOCKED_RESPONSE) {
  const mockGeneralDataService = makeMockGeneralDataService(items);
  const mockUserDataService = makeMockUserDataService();

  const view = await render(EventLogGeneralDataComponent, {
    providers: [
      provideTestingEnvironment(),
      { provide: GeneralDataService, useValue: mockGeneralDataService },
      { provide: UserDataService, useValue: mockUserDataService },
      provideTranslateService(),
    ],
  });

  view.fixture.detectChanges();
  const container = view.fixture.nativeElement as HTMLElement;
  return { view, container, mockGeneralDataService };
}

describe('EventLogGeneralDataComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial rendering', () => {
    it('should render the filter component', async () => {
      const { view } = await setup();
      expect(view.fixture.debugElement.query(By.css('inta-event-log-general-data-filter'))).not.toBeNull();
    });

    it('should render the table when data is available', async () => {
      await setup();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render all column headers', async () => {
      await setup();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.DATE')).toBeInTheDocument();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.ACTION')).toBeInTheDocument();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.USER')).toBeInTheDocument();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.HARDWARE_ID')).toBeInTheDocument();
      expect(screen.getByText('EVENT_LOG.GENERAL_DATA.LABELS.VALUE')).toBeInTheDocument();
    });

    it('should render a row for each data item', async () => {
      await setup();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    });

    it('should render user labels in rows', async () => {
      await setup();
      expect(screen.getByText('Usuario 1')).toBeInTheDocument();
      expect(screen.getByText('Usuario 2')).toBeInTheDocument();
    });

    it('should render value fields in rows', async () => {
      await setup();
      expect(screen.getByText('Valor 1')).toBeInTheDocument();
      expect(screen.getByText('Valor 2')).toBeInTheDocument();
    });

    it('should render the table with no data rows when data is empty', async () => {
      await setup([]);
      // Only the header row is rendered when data is empty
      expect(screen.getAllByRole('row')).toHaveLength(1);
    });
  });

  describe('searchItems signal', () => {
    it('should trigger a search with default pagination on initialization', async () => {
      const { mockGeneralDataService } = await setup();
      const search = mockGeneralDataService.searchItems();
      expect(search).toMatchObject({ page: 1, pageSize: 10 });
    });
  });
});

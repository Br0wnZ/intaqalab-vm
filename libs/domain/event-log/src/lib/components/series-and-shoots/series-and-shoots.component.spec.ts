import { signal } from '@angular/core';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { PaginatedSortedViewRequest } from '@intaqalab/models';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { SeriesAndShootsService } from '../../services/series-and-shoots/series-and-shoots.service';
import { UserDataService } from '../../services/user-data.service';
import type {
  EventLogSeriesAndShootsResponse,
  EventLogSeriesAndShootsSearch,
} from '../../utils-models/series-and-shoots.model';
import type { EventLogUser } from '../../utils-models/user.model';
import { EventLogSeriesAndShootsComponent } from './series-and-shoots.component';

const MOCK_USERS: EventLogUser[] = [
  { id: 'u1', label: 'Usuario 1' },
  { id: 'u2', label: 'Usuario 2' },
];

const MOCKED_RESPONSE: EventLogSeriesAndShootsResponse[] = [
  {
    date: '2026/02/15',
    action: 'create',
    user: { id: 'u1', label: 'Usuario 1' },
    hardwareId: '192.168.1.1',
    element: 'serie',
    visibleNumber: '3',
    internalId: 'SER-0001',
  },
  {
    date: '2026/02/20',
    action: 'edit',
    user: { id: 'u2', label: 'Usuario 2' },
    hardwareId: '192.168.1.2',
    element: 'shoot',
    visibleNumber: '7',
    internalId: 'DSPR-0001',
  },
];

function makeMockSeriesAndShootsService(items: EventLogSeriesAndShootsResponse[] = MOCKED_RESPONSE) {
  return {
    searchItems: signal<Partial<PaginatedSortedViewRequest>>({}),
    filtersItems: signal<Partial<EventLogSeriesAndShootsSearch>>({}),
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

async function setup(items: EventLogSeriesAndShootsResponse[] = MOCKED_RESPONSE) {
  const mockSeriesAndShootsService = makeMockSeriesAndShootsService(items);
  const mockUserDataService = makeMockUserDataService();

  const view = await render(EventLogSeriesAndShootsComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideTestingEnvironment(),
      { provide: SeriesAndShootsService, useValue: mockSeriesAndShootsService },
      { provide: UserDataService, useValue: mockUserDataService },
    ],
  });

  view.fixture.detectChanges();
  const container = view.fixture.nativeElement as HTMLElement;
  return { view, container, mockSeriesAndShootsService };
}

describe('EventLogSeriesAndShootsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial rendering', () => {
    it('should render the filter component', async () => {
      const { container } = await setup();
      expect(container.querySelector('inta-event-log-series-and-shoots-filter')).not.toBeNull();
    });

    it('should render the table when data is available', async () => {
      const { container } = await setup();
      expect(container.querySelector('table')).not.toBeNull();
    });

    it('should render all column headers', async () => {
      await setup();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.DATE')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.ACTION')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.USER')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.LIST_LABELS.HARDWARE_ID')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.SERIES_AND_SHOOTS.LABELS.ELEMENT')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.SERIES_AND_SHOOTS.LABELS.VISIBLE_NUMBER')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.SERIES_AND_SHOOTS.LABELS.INTERNAL_ID')).toBeTruthy();
    });

    it('should render hardware IDs in data rows', async () => {
      await setup();
      expect(screen.getByText('192.168.1.1')).toBeTruthy();
      expect(screen.getByText('192.168.1.2')).toBeTruthy();
    });

    it('should render user labels in data rows', async () => {
      await setup();
      expect(screen.getByText('Usuario 1')).toBeTruthy();
      expect(screen.getByText('Usuario 2')).toBeTruthy();
    });

    it('should render internalId values in data rows', async () => {
      await setup();
      expect(screen.getByText('SER-0001')).toBeTruthy();
      expect(screen.getByText('DSPR-0001')).toBeTruthy();
    });

    it('should render visibleNumber values in data rows', async () => {
      await setup();
      expect(screen.getByText('3')).toBeTruthy();
      expect(screen.getByText('7')).toBeTruthy();
    });

    it('should render no data rows when response is empty', async () => {
      const { container } = await setup([]);
      const rows = container.querySelectorAll('tr[mat-row]');
      expect(rows.length).toBe(0);
    });
  });

  describe('searchItems signal', () => {
    it('should trigger a search with default pagination on initialization', async () => {
      const { mockSeriesAndShootsService } = await setup();
      expect(mockSeriesAndShootsService.searchItems()).toMatchObject({ page: 1, pageSize: 10 });
    });
  });
});

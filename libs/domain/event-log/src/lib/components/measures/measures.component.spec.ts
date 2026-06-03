import { signal } from '@angular/core';
import { provideTestingEnvironment } from '@intaqalab/config';
import type { PaginatedSortedViewRequest } from '@intaqalab/models';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { MeasuresService } from '../../services/measures/measures.service';
import { UserDataService } from '../../services/user-data.service';
import type { EventLogMeasuresResponse, EventLogMeasuresSearch } from '../../utils-models/measures.model';
import type { EventLogUser } from '../../utils-models/user.model';
import { EventLogMeasuresComponent } from './measures.component';

const MOCK_USERS: EventLogUser[] = [
  { id: 'u1', label: 'Usuario 1' },
  { id: 'u2', label: 'Usuario 2' },
];

const MOCKED_RESPONSE: EventLogMeasuresResponse[] = [
  {
    date: '2026/02/15',
    action: 'create',
    user: { id: 'u1', label: 'Usuario 1' },
    hardwareId: '192.168.1.1',
    instrument: 'coor',
    value: '17620',
    measure: 'cX',
    shoot: '2',
    serie: 'Serie 1',
  },
  {
    date: '2026/02/20',
    action: 'edit',
    user: { id: 'u2', label: 'Usuario 2' },
    hardwareId: '192.168.1.2',
    instrument: 'crono',
    value: '2620',
    measure: 'tof',
    shoot: '4',
    serie: 'Serie 2',
  },
];

function makeMockMeasuresService(items: EventLogMeasuresResponse[] = MOCKED_RESPONSE) {
  return {
    searchItems: signal<Partial<PaginatedSortedViewRequest>>({}),
    filtersItems: signal<Partial<EventLogMeasuresSearch>>({}),
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

async function setup(items: EventLogMeasuresResponse[] = MOCKED_RESPONSE) {
  const mockMeasuresService = makeMockMeasuresService(items);
  const mockUserDataService = makeMockUserDataService();

  const view = await render(EventLogMeasuresComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [
      provideTestingEnvironment(),
      { provide: MeasuresService, useValue: mockMeasuresService },
      { provide: UserDataService, useValue: mockUserDataService },
    ],
  });

  view.fixture.detectChanges();
  const container = view.fixture.nativeElement as HTMLElement;
  return { view, container, mockMeasuresService };
}

describe('EventLogMeasuresComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial rendering', () => {
    it('should render the filter component', async () => {
      const { container } = await setup();
      expect(container.querySelector('inta-event-log-measures-filter')).not.toBeNull();
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
      expect(screen.getByText('EVENT_LOG.MEASURES.LABELS.INSTRUMENT')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.MEASURES.LABELS.VALUE')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.MEASURES.LABELS.MEASURE')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.MEASURES.LABELS.SHOOT')).toBeTruthy();
      expect(screen.getByText('EVENT_LOG.MEASURES.LABELS.SERIE')).toBeTruthy();
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

    it('should render serie values in data rows', async () => {
      await setup();
      expect(screen.getByText('Serie 1')).toBeTruthy();
      expect(screen.getByText('Serie 2')).toBeTruthy();
    });

    it('should render no data rows when response is empty', async () => {
      const { container } = await setup([]);
      const rows = container.querySelectorAll('tr[mat-row]');
      expect(rows.length).toBe(0);
    });
  });

  describe('searchItems signal', () => {
    it('should trigger a search with default pagination on initialization', async () => {
      const { mockMeasuresService } = await setup();
      expect(mockMeasuresService.searchItems()).toMatchObject({ page: 1, pageSize: 10 });
    });
  });
});

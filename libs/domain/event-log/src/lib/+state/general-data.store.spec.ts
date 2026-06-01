import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createMockResource } from '@intaqalab/utils/testing/core';

import { GeneralDataService } from '../services/general-data/general-data.service';
import { EventLogGeneralDataStore } from './general-data.store';

function createMockEventLogGeneralDataService() {
  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse: createMockResource({
      page: 1,
      pageSize: 10,
      totalElements: 2,
      items: [
        { id: '1', name: { es: 'Item 1', en: 'Item 1' }, label: 'Item 1' },
        { id: '2', name: { es: 'Item 2', en: 'Item 2' }, label: 'Item 2' },
      ],
    }),
    setSearchItemsData: vi.fn(),
    setFiltersData: vi.fn(),
  };
}

describe('EventLogGeneralDataStore', () => {
  let store: InstanceType<typeof EventLogGeneralDataStore>;
  let mockService: ReturnType<typeof createMockEventLogGeneralDataService>;

  beforeEach(() => {
    mockService = createMockEventLogGeneralDataService();

    TestBed.configureTestingModule({
      providers: [EventLogGeneralDataStore, { provide: GeneralDataService, useValue: mockService }],
    });

    store = TestBed.inject(EventLogGeneralDataStore);
  });

  it('should be created with initial state', () => {
    expect(store.isInitialized()).toBe(false);
  });

  it('should expose items from paginated response', () => {
    const items = store.items();
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(expect.objectContaining({ id: '1' }));
  });

  it('should expose totalElements from paginated response', () => {
    expect(store.totalElements()).toBe(2);
  });

  it('should mark as initialized after first search', () => {
    store.search({ page: 1, pageSize: 10 });
    expect(store.isInitialized()).toBe(true);
  });

  it('should delegate search params to the service', () => {
    const params = { page: 1, pageSize: 25, sortField: 'name', sortDirection: 'asc' as const };
    store.search(params);
    expect(mockService.searchItems()).toEqual(params);
  });

  it('should reset state on reset()', () => {
    store.search({ page: 1, pageSize: 10 });
    expect(store.isInitialized()).toBe(true);

    store.reset();
    expect(store.isInitialized()).toBe(false);
  });
});

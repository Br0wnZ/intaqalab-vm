import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';

import { MunitionsStockListService } from '../services/munitions-stock-list.service';
import { StockListStore } from './stock-list.store';

function createMunitionsStockListService() {
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
  };
}

describe('StockListStore', () => {
  let store: InstanceType<typeof StockListStore>;
  let mockService: ReturnType<typeof createMunitionsStockListService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = createMunitionsStockListService();

    TestBed.configureTestingModule({
      providers: [
        provideTestingEnvironment(),
        StockListStore,
        { provide: MunitionsStockListService, useValue: mockService },
      ],
    });

    store = TestBed.inject(StockListStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Estado inicial

  it('should start as not initialized', () => {
    expect(store.isInitialized()).toBe(false);
  });

  // Estado derivado

  it('should expose items from paginated response', () => {
    const items = store.items();
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(expect.objectContaining({ id: '1' }));
  });

  it('should expose totalElements from paginated response', () => {
    expect(store.totalElements()).toBe(2);
  });

  it('should expose isLoading from the service resource', () => {
    expect(store.isLoading()).toBe(false);
  });

  it('should expose error as null/undefined when there is no error', () => {
    expect(store.error()).toBeFalsy();
  });

  // search()

  it('should delegate search params to the service', () => {
    const params = { page: 1, pageSize: 25, sortField: 'name', sortDirection: 'asc' as const };
    store.search(params);
    expect(mockService.searchItems()).toEqual(params);
  });

  it('should mark as initialized after the first search', () => {
    store.search({ page: 1, pageSize: 10 });
    expect(store.isInitialized()).toBe(true);
  });

  it('should remain initialized on subsequent searches', () => {
    store.search({ page: 1, pageSize: 10 });
    store.search({ page: 2, pageSize: 10 });
    expect(store.isInitialized()).toBe(true);
  });

  // reload()

  it('should call reload on the service paginatedResponse', () => {
    store.reload();
    expect(mockService.paginatedResponse.reload).toHaveBeenCalledTimes(1);
  });

  // reset()

  it('should reset isInitialized to false on reset()', () => {
    store.search({ page: 1, pageSize: 10 });
    expect(store.isInitialized()).toBe(true);

    store.reset();
    expect(store.isInitialized()).toBe(false);
  });
});

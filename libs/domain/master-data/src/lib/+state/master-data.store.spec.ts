import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createMockResource } from '@intaqalab/utils/testing/core';

import { MasterDataService } from '../services/master-data.service';
import { MasterDataStore } from './master-data.store';

function createMockMasterDataService() {
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
    saveResource: createMockResource(),
    updateResource: createMockResource(),
    deleteById: createMockResource(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    resetUpsert: vi.fn(),
    resetSwitchStatus: vi.fn(),
    resetDelete: vi.fn(),
  };
}

describe('MasterDataStore', () => {
  let store: InstanceType<typeof MasterDataStore>;
  let mockService: ReturnType<typeof createMockMasterDataService>;

  beforeEach(() => {
    mockService = createMockMasterDataService();

    TestBed.configureTestingModule({
      providers: [MasterDataStore, { provide: MasterDataService, useValue: mockService }],
    });

    store = TestBed.inject(MasterDataStore);
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

  it('should delegate createItem to the service', () => {
    const record = { name: { es: 'Nuevo', en: 'New' }, active: true };
    store.create({ ...record, active: true });
    expect(mockService.create).toHaveBeenCalledWith(record);
  });

  it('should delegate updateItem to the service', () => {
    const record = { id: '1', name: { es: 'Editado', en: 'Edited' }, active: true };
    store.update({ ...record, active: true });
    expect(mockService.update).toHaveBeenCalledWith(record);
  });

  it('should delegate deleteItem to the service', () => {
    store.delete('1');
    expect(mockService.delete).toHaveBeenCalledWith('1');
  });

  it('should reset state on reset()', () => {
    store.search({ page: 1, pageSize: 10 });
    expect(store.isInitialized()).toBe(true);

    store.resetAll();
    expect(store.isInitialized()).toBe(false);
  });
});

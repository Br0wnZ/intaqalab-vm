import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockResource } from '@intaqalab/utils/testing/core';

import { MovementsListService } from '../services/movements-list.service';
import { MovementsListStore } from './movements-list.store';

describe('MovementsListStore', () => {
  let store: InstanceType<typeof MovementsListStore>;
  let mockService: ReturnType<typeof createMovementsListService>;

  beforeEach(() => {
    mockService = createMovementsListService();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTestingEnvironment(),
        MovementsListStore,
        { provide: MovementsListService, useValue: mockService },
      ],
    });

    store = TestBed.inject(MovementsListStore);
  });

  it('should expose items from paginated response', () => {
    const items = store.items();
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(expect.objectContaining({ id: '1' }));
  });

  it('should expose totalElements from paginated response', () => {
    expect(store.totalElements()).toBe(2);
  });
});

function createMovementsListService() {
  return {
    searchItems: signal<unknown>('foo'),
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

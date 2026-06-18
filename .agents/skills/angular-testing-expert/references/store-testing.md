# Store Testing

Guía para testear SignalStores (NgRx Signal Store o stores custom) que gestionan estado con signals.

## Patrón Estándar

Los stores se testean con `TestBed.inject` directamente (no ATL `render`), mockeando los servicios de datos subyacentes con `createMockResource`.

```typescript
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createMockResource } from '@intaqalab/utils/testing/core';

import { MyDataService } from '../services/my-data.service';
import { MyStore } from './my.store';

function createMockMyDataService() {
  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse: createMockResource({
      page: 1,
      pageSize: 10,
      totalElements: 2,
      items: [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ],
    }),
    setSearchItemsData: vi.fn(),
    setFiltersData: vi.fn(),
  };
}

describe('MyStore', () => {
  let store: InstanceType<typeof MyStore>;
  let mockService: ReturnType<typeof createMockMyDataService>;

  beforeEach(() => {
    mockService = createMockMyDataService();

    TestBed.configureTestingModule({
      providers: [
        MyStore,
        { provide: MyDataService, useValue: mockService },
      ],
    });

    store = TestBed.inject(MyStore);
  });

  it('should be created with initial state', () => {
    expect(store.isInitialized()).toBe(false);
  });
});
```

## Testing de Estado Derivado

Los stores suelen exponer signals computados de sus recursos internos:

```typescript
it('should expose items from paginated response', () => {
  const items = store.items();
  expect(items).toHaveLength(2);
  expect(items[0]).toEqual(expect.objectContaining({ id: '1' }));
});

it('should expose totalElements from paginated response', () => {
  expect(store.totalElements()).toBe(2);
});
```

## Testing de Métodos

### Search / Load

```typescript
it('should mark as initialized after first search', () => {
  store.search({ page: 1, pageSize: 10 });
  expect(store.isInitialized()).toBe(true);
});

it('should delegate search params to the service', () => {
  const params = {
    page: 1,
    pageSize: 25,
    sortField: 'name',
    sortDirection: 'asc' as const,
  };
  store.search(params);
  expect(mockService.searchItems()).toEqual(params);
});
```

### Reset

```typescript
it('should reset state on reset()', () => {
  store.search({ page: 1, pageSize: 10 });
  expect(store.isInitialized()).toBe(true);

  store.reset();
  expect(store.isInitialized()).toBe(false);
});
```

## Mock Factory Pattern

Crea funciones factory para los mocks del servicio. Esto permite reutilizar el patrón y mantenerlo tipado:

```typescript
function createMockMyDataService() {
  const paginatedMockedData = {
    page: 1,
    pageSize: 10,
    totalElements: 2,
    items: [
      { id: '1', name: { es: 'Item 1', en: 'Item 1' }, label: 'Item 1' },
      { id: '2', name: { es: 'Item 2', en: 'Item 2' }, label: 'Item 2' },
    ],
  };

  const paginatedResponse = createMockResource(paginatedMockedData);

  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse,
    setSearchItemsData: vi.fn(),
    setFiltersData: vi.fn(),
  };
}
```

## Tipado del Store

Usa `InstanceType<typeof MyStore>` para tipar la variable del store:

```typescript
let store: InstanceType<typeof MyStore>;
```

## Tipado del Mock

Usa `ReturnType<typeof createMockFn>` para tipar el mock automáticamente:

```typescript
let mockService: ReturnType<typeof createMockMyDataService>;
```

## Simulación de Ciclo de Vida de Resource

Usa `simulateResourceLifecycle` para testear comportamiento durante loading/error:

```typescript
import { simulateResourceLifecycle } from '@intaqalab/utils/testing/core';

it('should handle loading state', async () => {
  const resource = createMockResource<User[]>();
  resource._setLoading(true);
  expect(resource.isLoading()).toBe(true);
  expect(resource.status()).toBe('loading');
});

it('should handle error state', async () => {
  const resource = createMockResource<User[]>();
  resource._setError(new Error('Network error'));
  expect(resource.hasError()).toBe(true);
  expect(resource.status()).toBe('error');
});
```

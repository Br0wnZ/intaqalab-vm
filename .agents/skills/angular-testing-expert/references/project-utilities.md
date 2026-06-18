# Project Testing Utilities

Documentación de las utilidades de testing propias del proyecto disponibles en `@intaqalab/utils/testing` y `@intaqalab/config`.

## Imports

```typescript
// Core testing utilities
// Environment provider
import { provideTestingEnvironment } from '@intaqalab/config';
// Testing helpers (factories y mocks de dominio)
import {
  createMockDataPlanningService,
  createMockMatDialog,
  createMockMatDialogRef,
  createMockMunitionsService,
  createMockPlanningGeneralDataStore,
  createMockSeriesAndShotsService,
  createMockSeriesAndShotsStore,
  createMockShootingConditionsService,
  createMockTrialGeneralDataStore,
  createMockTrialsDataService,
  createMunitionsCatalogTestData,
  createMunitionsTestData,
  createSeries,
  createShootingConditions,
  createSpecimens,
  createTrial,
  createTrialPlanningInfo,
  createUsers,
  setupTestEnvironment,
  waitForElement,
} from '@intaqalab/utils';
import { createMockResource, simulateResourceLifecycle } from '@intaqalab/utils/testing/core';
import type { MockResource } from '@intaqalab/utils/testing/core';
import {
  trackSignalChanges,
  waitForSignal,
  waitForSignalChange,
  waitForSignalValue,
} from '@intaqalab/utils/testing/core';
import {
  createMockActivatedRoute,
  createMockHttpClient,
  createMockRouter,
  createMockTranslateService,
} from '@intaqalab/utils/testing/core';
```

## `createMockResource<T>(initialValue?)`

Crea un mock completo de un Angular `Resource`. Es la utilidad **más importante** del proyecto para testing.

### Interface `MockResource<T>`

```typescript
interface MockResource<T> {
  // Signals de solo lectura (API pública)
  readonly value: Signal<T | undefined>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<Error | undefined>;
  readonly status: Signal<ResourceStatus>; // 'idle' | 'loading' | 'resolved' | 'error'
  readonly hasValue: Signal<boolean>;
  readonly hasError: Signal<boolean>;
  readonly statusCode: Signal<number>;

  // Método de recarga
  reload: ReturnType<typeof vi.fn>;

  // Helpers para testing (prefijados con _)
  _setValue: (value: T | undefined) => void;
  _setLoading: (loading: boolean) => void;
  _setError: (error: Error | undefined) => void;
  _setStatus: (status: ResourceStatus) => void;
  _reset: () => void;
}
```

### Uso

```typescript
// Crear con valor inicial
const userResource = createMockResource<User>({ id: '1', name: 'John' });
expect(userResource.value()).toEqual({ id: '1', name: 'John' });

// Crear sin valor (idle)
const emptyResource = createMockResource<User>();
expect(emptyResource.value()).toBeUndefined();

// Simular estados
userResource._setLoading(true);
expect(userResource.isLoading()).toBe(true);
expect(userResource.status()).toBe('loading');

userResource._setValue({ id: '2', name: 'Jane' });
expect(userResource.status()).toBe('resolved');

userResource._setError(new Error('Network fail'));
expect(userResource.hasError()).toBe(true);
expect(userResource.status()).toBe('error');

// Reset al valor inicial
userResource._reset();
expect(userResource.status()).toBe('idle');
```

### Uso en Mock de Servicios

```typescript
function createMockMyService() {
  return {
    searchItems: signal<unknown>(undefined),
    paginatedResponse: createMockResource({
      page: 1,
      pageSize: 10,
      totalElements: 2,
      items: [{ id: '1' }, { id: '2' }],
    }),
    updateResource: createMockResource({}),
    saveResource: createMockResource({}),
    deleteResource: createMockResource({}),
    setSearchItemsData: vi.fn(),
    updateItem: vi.fn(),
  };
}
```

## `simulateResourceLifecycle<T>(resource, finalValue, options?)`

Simula el ciclo completo de un resource: idle → loading → resolved/error.

```typescript
const resource = createMockResource<User>();

// Simula loading y luego resolved
await simulateResourceLifecycle(resource, { id: '1', name: 'John' });
expect(resource.status()).toBe('resolved');

// Simula loading y luego error
await simulateResourceLifecycle(resource, null, {
  shouldError: true,
  errorMessage: 'Server error',
  loadingDelay: 50,
});
expect(resource.status()).toBe('error');
```

## Signal Helpers

### `waitForSignal(signal, condition, options?)`

Espera a que un signal cumpla una condición:

```typescript
const count = signal(0);
count.set(5);
await waitForSignal(count, (val) => val === 5);
```

### `waitForSignalValue(signal, expectedValue, options?)`

Espera un valor específico:

```typescript
await waitForSignalValue(statusSignal, 'resolved');
```

### `waitForSignalChange(signal, options?)`

Espera a que un signal cambie de su valor actual:

```typescript
const count = signal(0);
const promise = waitForSignalChange(count);
count.set(1);
const newValue = await promise; // 1
```

### `trackSignalChanges(signal, interval?)`

Captura el historial de cambios:

```typescript
const tracker = trackSignalChanges(count);
count.set(1);
count.set(2);
count.set(3);
expect(tracker.history).toEqual([0, 1, 2, 3]);
tracker.stop(); // Limpieza obligatoria
```

## Mocks de Servicios Core

### `createMockTranslateService()`

```typescript
const translateService = createMockTranslateService();
// translateService.instant('KEY') → 'KEY'
// translateService.instant('KEY', { count: 5 }) → 'KEY_{"count":5}'
```

### `createMockRouter()`

```typescript
const router = createMockRouter();
// router.navigate(['/path']); → Resuelve con true
```

### `createMockActivatedRoute(params?)`

```typescript
const route = createMockActivatedRoute({ id: '123' });
// route.snapshot.params → { id: '123' }
```

### `createMockHttpClient()`

```typescript
const http = createMockHttpClient();
// http.get(), http.post(), etc. → Retornan of({})
```

## Mocks de Diálogos

### `createMockMatDialogRef()`

```typescript
const dialogRef = createMockMatDialogRef();
// dialogRef.close → vi.fn()
// dialogRef.afterClosed → vi.fn().mockReturnValue({ subscribe: vi.fn() })
```

### `createMockMatDialog(config?)`

```typescript
const dialog = createMockMatDialog({ defaultResult: { confirmed: true } });
// dialog.open() → { afterClosed: () => { subscribe: (cb) => cb({ confirmed: true }) } }
```

## `provideTestingEnvironment()`

Provider que inyecta la configuración de entorno de testing. **Incluir SIEMPRE** en los providers de los tests.

```typescript
import { provideTestingEnvironment } from '@intaqalab/config';

providers: [provideTestingEnvironment()];
```

Proporciona:

- `apiUrl: 'http://localhost:3000/api'`
- Todos los endpoints configurados (fireTrials, users, clients, etc.)
- Features habilitadas para testing

## Factories de Datos de Dominio

Funciones que generan datos de prueba consistentes:

| Factory                                            | Descripción                                     |
| -------------------------------------------------- | ----------------------------------------------- |
| `createSpecimens(count?)`                          | Especímenes con estructura paginada             |
| `createUsers(count?)`                              | Usuarios con nombre y id                        |
| `createSeries(count?, shotsPerSerie?)`             | Series con disparos                             |
| `createShootingConditions(count?, shotsPerSerie?)` | Condiciones de disparo                          |
| `createTrial(overrides?)`                          | Datos de un trial                               |
| `createTrialPlanningInfo(overrides?)`              | Info de planificación                           |
| `createMunitionsTestData(overrides?)`              | Datos de municiones                             |
| `createMunitionsCatalogTestData()`                 | Catálogos (componentTypes, denominations, etc.) |

## Mocks de Stores y Servicios de Dominio

| Mock Factory                                        | Servicio/Store que mockea   |
| --------------------------------------------------- | --------------------------- |
| `createMockDataPlanningService(initialData?)`       | `DataPlanningService`       |
| `createMockSeriesAndShotsService(initialData?)`     | `SeriesAndShotsService`     |
| `createMockShootingConditionsService(initialData?)` | `ShootingConditionsService` |
| `createMockSeriesAndShotsStore(initialData?)`       | `SeriesAndShotsStore`       |
| `createMockPlanningGeneralDataStore(initialData?)`  | `PlanningGeneralDataStore`  |
| `createMockTrialGeneralDataStore(initialData?)`     | `TrialGeneralDataStore`     |
| `createMockTrialsDataService()`                     | `TrialsDataService`         |
| `createMockMunitionsService(initialData?)`          | `MunitionsService`          |

Todos los mock factories exponen sus resources internos con prefijo `_` para manipulación en tests:

```typescript
const mockStore = createMockPlanningGeneralDataStore();

// Simular loading
mockStore._planningInfoResource._setLoading(true);
expect(mockStore.isLoadingPlanningInfo()).toBe(true);

// Simular datos
mockStore._specimensResource._setValue(createSpecimens(5));
```

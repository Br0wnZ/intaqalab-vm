# Service Testing

Guía para testear servicios Angular que usan `httpResource` con `HttpTestingController`.

## Patrón Estándar para Servicios HTTP

Los servicios en este proyecto usan `httpResource` y signals reactivos. Se testean con `TestBed` directamente (no ATL `render`).

```typescript
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment(), MyService],
    });
    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no hay requests pendientes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

## Testing de Búsqueda con Parámetros

```typescript
it('should search with proper query params', () => {
  service.searchItems.set({
    name: 'test',
    page: 0,
    pageSize: 10,
    sortField: 'name',
    sortDirection: 'asc',
  });
  TestBed.tick();

  const req = httpMock.expectOne((r) => r.url.includes('/my-endpoint'));
  const params = req.request.params;

  expect(params.get('name')).toBe('test');
  expect(params.get('page')).toBe('0');
  expect(params.get('pageSize')).toBe('10');
  expect(params.get('sort')).toBe('name;asc');

  req.flush({});
});
```

## Testing de CRUD

### UPDATE (PUT)

```typescript
it('should perform PUT and refresh the list', () => {
  const item = { id: 'id', name: 'updated' };
  service.updateItem(item);
  TestBed.tick();

  // Verificar PUT
  const req = httpMock.expectOne((r) => r.url.includes(`/my-endpoint/${item.id}`));
  expect(req.request.method).toBe('PUT');
  req.flush({});

  // Verificar refresh (GET posterior)
  const reqRefresh = httpMock.expectOne((r) => r.url.includes('/my-endpoint'));
  expect(reqRefresh.request.method).toBe('GET');
  reqRefresh.flush({});
});
```

### CREATE (POST)

```typescript
it('should perform POST and refresh the list', () => {
  const data = { name: 'new item', category: 'MUNITION' };
  service.createItem(data);
  TestBed.tick();

  const requests = httpMock.match((req) => req.url.includes('/my-endpoint'));
  expect(requests.length).toBe(2);
  expect(requests[0].request.method).toBe('POST');
  expect(requests[1].request.method).toBe('GET');

  requests[0].flush({});
  requests[1].flush({});
});
```

### DELETE

```typescript
it('should perform DELETE and refresh the list', () => {
  const item = { id: 'id', name: 'to-delete' };
  service.deleteItem(item);
  TestBed.tick();

  const req = httpMock.expectOne((r) => r.url.includes(`/my-endpoint/${item.id}`));
  expect(req.request.method).toBe('DELETE');
  req.flush({});

  const reqRefresh = httpMock.expectOne((r) => r.url.includes('/my-endpoint'));
  expect(reqRefresh.request.method).toBe('GET');
  reqRefresh.flush({});
});
```

## `TestBed.tick()`

Usa `TestBed.tick()` después de mutar un signal que dispara un `httpResource`. Esto fuerza la ejecución del efecto reactivo que lanza la petición HTTP.

```typescript
service.searchItems.set({ page: 0, pageSize: 10 });
TestBed.tick(); // Necesario para que httpResource dispare la petición
const req = httpMock.expectOne(/* ... */);
```

## Testing de Interceptores

Los interceptores funcionales se testean envolviendo la función en `TestBed.runInInjectionContext`:

```typescript
import type { HttpInterceptorFn } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { myInterceptor } from './my-interceptor';

describe('myInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) => TestBed.runInInjectionContext(() => myInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
```

# Service Testing

Guía para testear servicios Angular que usan `httpResource` con `HttpTestingController`.

## ⚠️ Comportamiento de `injectWarehouseResource` en Tests

Los servicios basados en `injectWarehouseResource` (y `injectMasterDataResource`) tienen **dos limitaciones importantes en tests**:

### 1. El reload automático post-mutación NO se puede verificar con `httpMock.expectOne`

`injectWarehouseResource` tiene un `effect()` que llama a `paginatedResponse.reload()` cuando el `statusCode` de save/update/delete cambia. En tests con `HttpTestingController`, **ese statusCode no se propaga** correctamente a través del scheduler de signals, por lo que el GET de refresco nunca llega al controller.

**❌ Esto NO funciona:**

```typescript
service.deleteItem(item);
TestBed.tick();
httpMock.expectOne((r) => r.url.includes(`/${item.id}`) && r.method === 'DELETE').flush({});
TestBed.tick();
httpMock.expectOne((r) => r.url.includes('/endpoint') && r.method === 'GET'); // ❌ found none
```

**✅ Usar spy sobre `paginatedResponse.reload()`:**

```typescript
it('should call paginatedResponse.reload() after DELETE', () => {
  initPagination(service, httpMock); // pre-initialize (ver abajo)
  const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');

  service.deleteItem(item);
  TestBed.tick();

  const req = httpMock.expectOne((r) => r.url.includes(`/${item.id}`) && r.method === 'DELETE');
  req.flush({});
  TestBed.tick();

  expect(reloadSpy).toHaveBeenCalled();
});
```

### 2. `paginatedResponse` solo se activa cuando `searchItems !== null`

`paginatedResponse` es un `httpResource` cuya función de petición devuelve `undefined` cuando `searchItems` es `null` (estado inicial). Si se llama a `reload()` sin haber inicializado `searchItems`, no hay petición HTTP que recargar.

**Patrón `initPagination()`** — llamar antes de cualquier test de mutación:

```typescript
const emptyPage = { items: [], page: 1, pageSize: 10, totalElements: 0 };

function initPagination(service: MyService, httpMock: HttpTestingController) {
  service.searchItems.set({ page: 1, pageSize: 10 });
  TestBed.tick();
  const req = httpMock.expectOne((r) => r.url.includes('/my-endpoint') && r.method === 'GET');
  req.flush(emptyPage);
}
```

### 3. `setParamsAsHttpParams` filtra valores falsy — `page: 0` desaparece

`setParamsAsHttpParams` usa `if (!value) return` al iterar los params. Esto significa que **`page: 0` se filtra** porque `0` es falsy en JavaScript.

**❌ Problema:**

```typescript
service.searchItems.set({ page: 0, pageSize: 10 }); // page=0 nunca llega al servidor
```

**✅ Usar `page: 1` en tests:**

```typescript
service.searchItems.set({ page: 1, pageSize: 10 }); // correcto
```

Los parámetros `sortField` y `sortDirection` se envían como **claves separadas** (no combinadas en `sort`):

```typescript
// ❌ Incorrecto
expect(params.get('sort')).toBe('name;asc');

// ✅ Correcto
expect(params.get('sortField')).toBe('name');
expect(params.get('sortDirection')).toBe('asc');
```

---

## Patrón Estándar para Servicios HTTP

Los servicios en este proyecto usan `httpResource` y signals reactivos. Se testean con `TestBed` directamente (no ATL `render`).

```typescript
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';

import { MyService } from './my.service';

const emptyPage = { items: [], page: 1, pageSize: 10, totalElements: 0 };

function initPagination(service: MyService, httpMock: HttpTestingController) {
  service.searchItems.set({ page: 1, pageSize: 10 });
  TestBed.tick();
  httpMock.expectOne((r) => r.url.includes('/my-endpoint') && r.method === 'GET').flush(emptyPage);
}

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
it('should fire a GET with the correct query params', () => {
  service.searchItems.set({
    name: 'test',
    page: 1, // ⚠️ page: 0 se filtra — usar siempre >= 1
    pageSize: 10,
    sortField: 'name',
    sortDirection: 'asc',
  });
  TestBed.tick();

  const req = httpMock.expectOne((r) => r.url.includes('/my-endpoint'));
  const params = req.request.params;

  expect(params.get('name')).toBe('test');
  expect(params.get('page')).toBe('1');
  expect(params.get('pageSize')).toBe('10');
  expect(params.get('sortField')).toBe('name'); // ⚠️ claves separadas
  expect(params.get('sortDirection')).toBe('asc'); // ⚠️ no combinadas en 'sort'

  req.flush(emptyPage);
});
```

## Testing de CRUD

### UPDATE (PUT)

```typescript
it('should perform PUT to /my-endpoint/:id', () => {
  initPagination(service, httpMock); // pre-initialize paginatedResponse
  const item = { id: 'id', name: 'updated' };
  service.updateItem(item);
  TestBed.tick();

  const req = httpMock.expectOne((r) => r.url.includes(`/my-endpoint/${item.id}`) && r.method === 'PUT');
  expect(req.request.method).toBe('PUT');
  req.flush({});
});

it('should call paginatedResponse.reload() after PUT', () => {
  initPagination(service, httpMock);
  const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');

  const item = { id: 'id', name: 'updated' };
  service.updateItem(item);
  TestBed.tick();

  httpMock.expectOne((r) => r.url.includes(`/my-endpoint/${item.id}`) && r.method === 'PUT').flush({});
  TestBed.tick();

  expect(reloadSpy).toHaveBeenCalled();
});
```

### CREATE (POST)

```typescript
it('should perform POST to /my-endpoint', () => {
  initPagination(service, httpMock);
  service.createItem({ name: 'new' });
  TestBed.tick();

  const req = httpMock.expectOne((r) => r.url.includes('/my-endpoint') && r.method === 'POST');
  expect(req.request.method).toBe('POST');
  req.flush({});
});

it('should call paginatedResponse.reload() after POST', () => {
  initPagination(service, httpMock);
  const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');

  service.createItem({ name: 'new' });
  TestBed.tick();

  httpMock.expectOne((r) => r.url.includes('/my-endpoint') && r.method === 'POST').flush({});
  TestBed.tick();

  expect(reloadSpy).toHaveBeenCalled();
});
```

### DELETE

```typescript
it('should perform DELETE to /my-endpoint/:id', () => {
  initPagination(service, httpMock);
  const item = { id: 'id', name: 'to-delete' };
  service.deleteItem(item);
  TestBed.tick();

  const req = httpMock.expectOne((r) => r.url.includes(`/my-endpoint/${item.id}`) && r.method === 'DELETE');
  expect(req.request.method).toBe('DELETE');
  req.flush({});
});

it('should call paginatedResponse.reload() after DELETE', () => {
  initPagination(service, httpMock);
  const reloadSpy = vi.spyOn(service.paginatedResponse, 'reload');

  const item = { id: 'id', name: 'to-delete' };
  service.deleteItem(item);
  TestBed.tick();

  httpMock.expectOne((r) => r.url.includes(`/my-endpoint/${item.id}`) && r.method === 'DELETE').flush({});
  TestBed.tick();

  expect(reloadSpy).toHaveBeenCalled();
});
```

## `TestBed.tick()`

Usa `TestBed.tick()` después de mutar un signal que dispara un `httpResource`. Esto fuerza la ejecución del efecto reactivo que lanza la petición HTTP.

```typescript
service.searchItems.set({ page: 1, pageSize: 10 });
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

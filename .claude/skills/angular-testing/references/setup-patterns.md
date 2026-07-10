# Setup Patterns

Este documento define los patrones estándar para configurar tests en el proyecto. Todos los tests deben seguir estas convenciones.

## Patrón de Setup para Componentes (ATL)

Usa **siempre** la función `render` de Angular Testing Library en lugar de `TestBed.configureTestingModule` manual para componentes.

### Estructura Base

```typescript
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MyComponent } from './my.component';

describe('MyComponent', () => {
  const runSetup = async () => {
    const user = userEvent.setup();

    const view = await render(MyComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideTestingEnvironment(),
        // ... otros providers
      ],
    });

    const container = view.fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, container, loader };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the component', async () => {
    await runSetup();
    // assertions...
  });
});
```

## Providers Obligatorios

### `provideTestingEnvironment()`

**Siempre** incluir en los providers. Proporciona la configuración de entorno (URLs de API, features, endpoints) necesaria para que los servicios funcionen.

```typescript
import { provideTestingEnvironment } from '@intaqalab/config';

providers: [provideTestingEnvironment()];
```

### `TranslateModule.forRoot()`

Incluir siempre que el componente use traducciones (`translate` pipe o `TranslateService`). Las claves de traducción se renderizan tal cual en los tests (no se traduce), lo que es ideal para buscarlas con `screen.getByText()`.

```typescript
imports: [TranslateModule.forRoot()];
```

### HTTP Testing

Cuando el componente o servicio hace llamadas HTTP reales (no mockeadas):

```typescript
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

providers: [provideHttpClient(), provideHttpClientTesting(), provideTestingEnvironment()];
```

### Animaciones

Si el componente usa animaciones de Angular Material:

```typescript
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

imports: [TranslateModule.forRoot(), NoopAnimationsModule];
```

## Setup con Parámetros Configurables

Cuando el setup necesita variaciones entre tests, acepta parámetros:

```typescript
const runSetup = async (isEmptyResponse = false) => {
  const items = isEmptyResponse ? [] : MOCKED_RESPONSE;
  const mockService = {
    paginatedResponse: createMockResource({ items, totalElements: items.length }),
    searchItems: signal<unknown>({}),
    setSearchItemsData: vi.fn(),
  };

  const view = await render(MyComponent, {
    imports: [TranslateModule.forRoot()],
    providers: [provideTestingEnvironment(), { provide: MyService, useValue: mockService }],
  });

  return { view, mockService };
};
```

## Setup con Inputs de Signal

Para componentes con signal inputs, usa `componentInputs`:

```typescript
const view = await render(MyComponent, {
  componentInputs: {
    title: 'Test Title',
    items: [{ id: '1', name: 'Item 1' }],
  },
  providers: [provideTestingEnvironment()],
});
```

## Setup con Outputs

Para capturar outputs, usa `on`:

```typescript
const saveSpy = vi.fn();

const view = await render(MyComponent, {
  componentInputs: { title: 'Test Form' },
  on: { save: saveSpy },
  providers: [provideTestingEnvironment()],
});
```

## Acceso al ComponentInstance

Cuando necesitas acceder a propiedades internas del componente (validación de forms, signals internos):

```typescript
const { view } = await runSetup();
const component = view.fixture.componentInstance as MyComponent;
expect(component.form().invalid()).toBe(true);
```

> ⚠️ **Nota:** Acceder a `componentInstance` debe ser la excepción, no la regla. Prefiere queries accesibles para verificar comportamiento visible.

## Convención de Naming

- **Función de setup:** `runSetup()` o `setup()` — ambas son aceptables.
- **Variable de render:** `view` (contiene `fixture`, `detectChanges`, etc.).
- **Container:** `container = view.fixture.nativeElement as HTMLElement`.
- **Loader:** `loader = TestbedHarnessEnvironment.loader(view.fixture)`.
- **User:** `user = userEvent.setup()`.

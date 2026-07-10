# Signal Forms Testing

Guía para testear componentes que usan **Signal Forms** (`@angular/experimental/signal-forms`).

## Acceso al Formulario

Los Signal Forms exponen el estado del formulario como un signal. Accede a él desde el `componentInstance`:

```typescript
const { view } = await runSetup();
const component = view.fixture.componentInstance as MyFormComponent;

// Acceder al signal del form
const form = component.form();
```

## Verificar Estado de Validación

```typescript
describe('Initial form state', () => {
  it('should have invalid state when empty', async () => {
    const { view } = await runSetup();
    const component = view.fixture.componentInstance as MyFormComponent;

    expect(component.form().invalid()).toBe(true);
  });
});
```

## Verificar Valores del Formulario

Después de rellenar campos mediante interacción del usuario:

```typescript
it('should populate form values in edit mode', async () => {
  const editData = {
    item: {
      name: 'Test Name',
      category: 'MUNITION',
      weight: 3,
    },
  };

  const { view } = await setup(editData);
  const component = view.fixture.componentInstance;
  const formValue = component.formModel();

  expect(formValue.name).toBe('Test Name');
  expect(formValue.category).toBe('MUNITION');
  expect(formValue.weight).toBe(3);
});
```

## Interacción con Campos de Signal Forms

### Texto

Usa `userEvent.type()` para escribir en campos de texto. El signal form se actualiza automáticamente:

```typescript
it('should enable search button with valid form', async () => {
  const { view, container } = await runSetup();
  const component = view.fixture.componentInstance as MyFormComponent;

  // Mostrar el panel de filtros si está oculto
  component.showFilters.set(true);
  view.detectChanges();

  // Interactuar con el campo
  const input = container.querySelector('#my-field') as HTMLInputElement;
  input.value = '192.168.1.1';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  view.fixture.detectChanges();

  // Verificar que el botón se habilitó
  const searchButton = screen.getByRole('button', { name: /SEARCH/i });
  expect(searchButton.disabled).toBe(false);
});
```

### Con userEvent (preferido)

```typescript
it('should update form value on user input', async () => {
  const { user } = await runSetup();

  const input = screen.getByRole('textbox', { name: /NAME/i });
  await user.type(input, 'Test Value');

  // El signal form se actualiza automáticamente
  const component = view.fixture.componentInstance as MyComponent;
  expect(component.formModel().name).toBe('Test Value');
});
```

## Toggle de Paneles de Filtros

Muchos componentes de filtro tienen un panel colapsable:

```typescript
describe('Filter panel toggle state', () => {
  it('should toggle filters panel when filter button clicked', async () => {
    const { view } = await runSetup();
    const component = view.fixture.componentInstance as MyFilterComponent;

    const toggleButton = screen.getByRole('button', {
      name: /TOGGLE_FILTERS_PANEL_BUTTON/i,
    }) as HTMLButtonElement;

    toggleButton.click();

    expect(component.showFilters()).toBe(true);
  });
});
```

## Pattern Completo: Filtro con Signal Form

```typescript
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

import { MyFilterComponent } from './my-filter.component';

describe('MyFilterComponent', () => {
  const runSetup = async () => {
    const view = await render(MyFilterComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [provideTestingEnvironment()],
    });

    const container = view.fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { view, container, loader };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial form state', () => {
    it('should have invalid state', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance as MyFilterComponent;
      expect(component.form().invalid()).toBe(true);
    });
  });

  describe('Filter panel toggle', () => {
    it('should toggle filters when button clicked', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance as MyFilterComponent;

      const toggleBtn = screen.getByRole('button', {
        name: /TOGGLE_FILTERS/i,
      });
      toggleBtn.click();

      expect(component.showFilters()).toBe(true);
    });
  });

  describe('Search button', () => {
    it('should enable search button with valid form', async () => {
      const { view, container } = await runSetup();
      const component = view.fixture.componentInstance as MyFilterComponent;

      component.showFilters.set(true);
      view.detectChanges();

      const input = container.querySelector('#my-filter-field') as HTMLInputElement;
      if (input) input.value = 'test-value';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      view.fixture.detectChanges();

      const searchButton = screen.getByRole('button', { name: /SEARCH/i });
      expect(searchButton.disabled).toBe(false);
    });
  });
});
```

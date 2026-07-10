# Component Testing

Guía para testear componentes Angular con Angular Testing Library (ATL). Centrado en comportamiento visible del usuario.

## Queries Accesibles (Prioridad)

Usa queries en este orden de preferencia:

| Prioridad | Query                  | Cuándo usar                                        |
| --------- | ---------------------- | -------------------------------------------------- |
| 1️⃣        | `getByRole`            | Botones, links, comboboxes, textboxes              |
| 2️⃣        | `getByLabelText`       | Inputs con label asociado                          |
| 3️⃣        | `getByText`            | Textos visibles, títulos, claves de traducción     |
| 4️⃣        | `getByPlaceholderText` | Inputs sin label (usar con moderación)             |
| 5️⃣        | `getByTestId`          | Último recurso cuando no hay alternativa semántica |

### Ejemplo: Queries Accesibles

```typescript
// ✅ CORRECTO: Búsqueda por role
const submitBtn = screen.getByRole('button', { name: /SAVE/i });
const combobox = screen.getByRole('combobox');
const textbox = screen.getByRole('textbox', { name: /username/i });

// ✅ CORRECTO: Búsqueda por texto (ideal para claves de traducción)
expect(screen.getByText('MY_COMPONENT.TITLE')).toBeInTheDocument();

// ⚠️ ACEPTABLE: Búsqueda por testid cuando no hay alternativa
const elements = screen.queryAllByTestId('munitionComponent');

// ❌ EVITAR: querySelector directo
// container.querySelector('.my-class');
// container.querySelector('#my-id');
```

## Interacciones con userEvent

**Siempre** usa `userEvent` (asíncrono) en lugar de `fireEvent` o `.click()` directo:

```typescript
const user = userEvent.setup();

// Click
await user.click(button);

// Escribir texto
await user.type(input, 'texto de prueba');

// Seleccionar opción de un combobox
await user.click(combobox);
await user.click(screen.getByText('Option A'));

// Limpiar y escribir
await user.clear(input);
await user.type(input, 'nuevo texto');
```

## Verificación de Rendering

### Componente renderiza correctamente

```typescript
it('should render the component title', async () => {
  await runSetup();
  expect(screen.getByText('MY_COMPONENT.TITLE')).toBeInTheDocument();
});
```

### Componente hijo presente

```typescript
it('should render the child filter component', async () => {
  const { container } = await runSetup();
  const filterPanel = container.querySelector('inta-my-filter');
  expect(filterPanel).toBeTruthy();
});
```

### Tabla con datos

```typescript
it('should render the data table when data is set', async () => {
  const { container } = await runSetup();
  const table = container.querySelector('table');
  expect(table).toBeTruthy();
});
```

### Verificar estado disabled

```typescript
it('should disable the submit button when form is invalid', async () => {
  await runSetup();
  const saveBtn = screen.getByRole('button', { name: /SAVE/i });
  expect(saveBtn).toBeDisabled();
});
```

## Verificación de Outputs

```typescript
it('should emit save event with form data', async () => {
  const { user, saveSpy } = await runSetup();

  const input = screen.getByRole('textbox', { name: /name/i });
  await user.type(input, 'Test Value');

  const submitBtn = screen.getByRole('button', { name: /SAVE/i });
  await user.click(submitBtn);

  expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Value' }));
});
```

## Verificación de Mock Calls

```typescript
it('should call the service method on button click', async () => {
  const { user, mockService } = await runSetup();

  const button = screen.getByRole('button', { name: /SEARCH/i });
  await user.click(button);

  expect(mockService.setSearchItemsData).toHaveBeenCalled();
});
```

## Testing de Contenido Condicional

```typescript
it('should show section when category is selected', async () => {
  const { user } = await runSetup();

  const categoryControl = screen.getByRole('combobox');
  await user.click(categoryControl);
  await user.click(screen.getByText('OPTION_MUNITION'));

  expect(screen.queryByTestId('identificationForm')).toBeInTheDocument();
});

it('should show empty state when no data', async () => {
  await runSetup(/* isEmptyResponse */ true);
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
```

## Testing de Listas Dinámicas

```typescript
it('should add a new item when add button is clicked', async () => {
  const { user } = await runSetup();

  let elements = screen.queryAllByTestId('item');
  expect(elements.length).toBe(1);

  const addButton = screen.getByRole('button', { name: /ADD_ITEM/i });
  await user.click(addButton);

  elements = screen.queryAllByTestId('item');
  expect(elements.length).toBe(2);
});
```

## Testing de Reset

```typescript
it('should reset all fields when reset button is clicked', async () => {
  const { user } = await runSetup();

  // Fill inputs
  const inputs = screen.getAllByPlaceholderText(/BATCH_LABEL/i);
  for (const input of inputs) {
    await user.type(input, 'abc');
  }

  // Click reset
  const resetBtn = screen.getByRole('button', { name: /RESET/i });
  await user.click(resetBtn);

  // Verify cleared
  const clearedInputs = screen.getAllByPlaceholderText(/BATCH_LABEL/i);
  for (const input of clearedInputs) {
    expect((input as HTMLInputElement).value).toBe('');
  }
});
```

## Estructura de Describe Blocks

Agrupa los tests por funcionalidad:

```typescript
describe('MyComponent', () => {
  // setup...

  describe('Initial rendering', () => {
    it('should render the title', async () => {
      /* ... */
    });
    it('should render the table', async () => {
      /* ... */
    });
  });

  describe('User interactions', () => {
    it('should enable button on valid form', async () => {
      /* ... */
    });
    it('should call service on submit', async () => {
      /* ... */
    });
  });

  describe('Edge cases', () => {
    it('should show empty state when no data', async () => {
      /* ... */
    });
  });
});
```

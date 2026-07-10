# Dialog Testing

Guía para testear componentes que se abren como diálogos de Angular Material (`MatDialog`).

## Anatomía de un Test de Diálogo

Los componentes de diálogo requieren:

1. **`MAT_DIALOG_DATA`** — Datos inyectados al diálogo.
2. **`MatDialogRef`** — Referencia para cerrar el diálogo (se mockea con `close: vi.fn()`).
3. Opcionalmente: **`MatDialog`** — Si el componente abre sub-diálogos.

## Patrón Estándar

```typescript
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockMatDialog } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { MyDialogComponent } from './my-dialog.component';

describe('MyDialogComponent', () => {
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const setup = async (data: any = { item: null }) => {
    const user = userEvent.setup();
    mockDialogRef = { close: vi.fn() };

    const view = await render(MyDialogComponent, {
      imports: [TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideTestingEnvironment(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    return { user, view };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render in create mode when item is null', async () => {
    await setup({ item: null });
    expect(screen.getByText('MY_DIALOG.TITLE_CREATE')).toBeInTheDocument();
  });

  it('should render in edit mode when item is provided', async () => {
    await setup({ item: { id: '1', name: 'Test' } });
    expect(screen.getByText('MY_DIALOG.TITLE_EDIT')).toBeInTheDocument();
  });

  it('should close with false when cancel is clicked', async () => {
    const { user } = await setup();
    const cancelBtn = screen.getByRole('button', { name: /CANCEL/i });
    await user.click(cancelBtn);
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
```

## Diálogo con Sub-diálogos

Cuando el componente abre otros diálogos internamente, mockea `MatDialog` con `createMockMatDialog`:

```typescript
import { createMockMatDialog } from '@intaqalab/utils';

const setup = async (data = {}) => {
  const user = userEvent.setup();
  mockDialogRef = { close: vi.fn() };
  const mockDialog = createMockMatDialog({ defaultResult: null });

  const view = await render(MyDialogComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
    ],
    componentProviders: [{ provide: MatDialog, useValue: mockDialog }],
  });

  return { user, view, mockDialog };
};

it('should open confirmation dialog when deleting', async () => {
  const { user, mockDialog } = await setup({ item: { id: '1' } });

  const deleteBtn = screen.getByRole('button', { name: /DELETE/i });
  await user.click(deleteBtn);

  expect(mockDialog.open).toHaveBeenCalled();
});
```

## Diálogo con Servicios que Usan Resources

```typescript
import { signal } from '@angular/core';
import { createMockResource } from '@intaqalab/utils/testing/core';

const setup = async (data = {}) => {
  const user = userEvent.setup();
  mockDialogRef = { close: vi.fn() };

  const mockService = {
    paginatedResponse: { value: signal({ items: [] }) },
    searchItems: { set: vi.fn() },
  };

  const view = await render(MyDialogComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [
      provideTestingEnvironment(),
      { provide: MatDialogRef, useValue: mockDialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MyService, useValue: mockService },
    ],
  });

  return { user, view, mockService };
};
```

## Verificación del Formulario del Diálogo

```typescript
it('should disable submit when form is invalid', async () => {
  await setup({ item: null });
  const saveBtn = screen.getByRole('button', { name: /SAVE/i });
  expect(saveBtn).toBeDisabled();
});

it('should populate form fields in edit mode', async () => {
  const editItem = {
    id: '1',
    name: 'Test Name',
    category: 'MUNITION',
    weight: 3,
  };

  const { view } = await setup({ item: editItem });
  const component = view.fixture.componentInstance;
  const formValue = component.formModel();

  expect(formValue.name).toBe(editItem.name);
  expect(formValue.category).toBe(editItem.category);
  expect(formValue.weight).toBe(editItem.weight);
});
```

## Diálogo con `componentProviders` vs `providers`

- **`providers`**: Para tokens inyectados a nivel del módulo de test (`MAT_DIALOG_DATA`, `MatDialogRef`, servicios).
- **`componentProviders`**: Para providers que el componente declara en su propio `providers: []` (como `MatDialog` cuando el componente lo inyecta directamente).

```typescript
const view = await render(MyDialogComponent, {
  providers: [
    // Providers globales del test
    { provide: MatDialogRef, useValue: mockDialogRef },
    { provide: MAT_DIALOG_DATA, useValue: data },
  ],
  componentProviders: [
    // Override del provider del componente
    { provide: MatDialog, useValue: mockDialog },
  ],
});
```

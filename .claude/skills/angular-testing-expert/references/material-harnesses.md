# Material Component Harnesses

Usa **Component Harnesses** de Angular Material para interactuar con componentes Material en tests. Los harnesses abstraen los detalles internos del DOM y proporcionan una API estable y asíncrona.

## Reglas Clave

- **Siempre usa harnesses** para componentes Material en lugar de `querySelector` o selectores CSS directos.
- **Crea el `HarnessLoader`** desde el fixture de ATL: `TestbedHarnessEnvironment.loader(view.fixture)`.
- **Todos los métodos de harness son `async`**.
- **Evita `.with({ selector: ... })` y `getOptions({ text: ... })`**: En el entorno Vite/Vitest, los predicados de CDK pueden fallar con `SyntaxError: '' is not a valid selector` (ver [known-issues.md #19](known-issues.md#19-syntaxerror--is-not-a-valid-selector-al-usar-harnesswith-o-matselectharnessgetoptions-en-vitest)).
- **Patrón Canónico de Localización:** Pasa la clase constructora a `loader.getAllHarnesses(HarnessClass)` y accede por índice (`inputs[0]`, `selects[1]`).
- **NO envolver llamadas a harnesses en `waitFor(async () => ...)`**: `waitFor` espera una función sincrónica. Llama a `view.fixture.detectChanges()` y luego haz `await loader.getHarness(...)` o `await loader.getAllHarnesses(...)` directamente.

## Imports Necesarios

```typescript
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
```

## Tabla de Harnesses Disponibles

| Componente                          | Harness                     | Import                                   |
| ----------------------------------- | --------------------------- | ---------------------------------------- |
| `mat-expansion-panel`               | `MatExpansionPanelHarness`  | `@angular/material/expansion/testing`    |
| `mat-select`                        | `MatSelectHarness`          | `@angular/material/select/testing`       |
| `matInput`                          | `MatInputHarness`           | `@angular/material/input/testing`        |
| `mat-checkbox`                      | `MatCheckboxHarness`        | `@angular/material/checkbox/testing`     |
| `mat-dialog`                        | `MatDialogHarness`          | `@angular/material/dialog/testing`       |
| `mat-button` / `button[mat-button]` | `MatButtonHarness`          | `@angular/material/button/testing`       |
| `mat-accordion`                     | `MatAccordionHarness`       | `@angular/material/expansion/testing`    |
| `mat-tab-group`                     | `MatTabGroupHarness`        | `@angular/material/tabs/testing`         |
| `mat-menu`                          | `MatMenuHarness`            | `@angular/material/menu/testing`         |
| `mat-slide-toggle`                  | `MatSlideToggleHarness`     | `@angular/material/slide-toggle/testing` |
| `mat-table`                         | `MatTableHarness`           | `@angular/material/table/testing`        |
| `mat-paginator`                     | `MatPaginatorHarness`       | `@angular/material/paginator/testing`    |
| `mat-sort-header`                   | `MatSortHeaderHarness`      | `@angular/material/sort/testing`         |
| `mat-datepicker`                    | `MatDatepickerInputHarness` | `@angular/material/datepicker/testing`   |

## Ejemplo: MatSelect con Harness y ATL (Patrón Recomendado)

Abre el select con el harness y selecciona opciones usando queries accesibles de ATL (`screen.getByText` o `screen.getByRole('option')`) + `userEvent`:

```typescript
import { MatSelectHarness } from '@angular/material/select/testing';

it('should open select and choose an option', async () => {
  const { loader, user, fixture } = await runSetup();

  const selects = await loader.getAllHarnesses(MatSelectHarness);
  const select = selects[0];
  await select.open();

  // Seleccionar la opción en el overlay usando ATL
  const option = screen.getByText('Option A');
  await user.click(option);
  fixture.detectChanges();

  expect(screen.getByText('Option A')).toBeInTheDocument();
});
```

### MatSelect Múltiple (Orden de valores en el modelo)

`MatSelect` en modo `multiple` **ordena las selecciones según el orden de las opciones en el DOM**, nunca por el orden cronológico de clic (ver [known-issues.md #20](known-issues.md#20-discrepancia-de-orden-en-arrays-con-matselect-múltiple-multiple)):

```typescript
// Si en el DOM las opciones están en orden: [VELOCITY, TRAJECTOGRAPHY, SOUND]
// Y el valor inicial era: ['VELOCITY', 'SOUND']
await user.click(screen.getByText('Trayectografía'));
fixture.detectChanges();

// ✅ El modelo tendrá las claves en orden de aparición en el DOM:
expect(component.formModel().measurements).toEqual(['VELOCITY', 'TRAJECTOGRAPHY', 'SOUND']);
```

## Ejemplo: Expansion Panel

```typescript
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';

describe('MyPanelComponent', () => {
  // Helper reutilizable para abrir un panel por índice
  const expandPanelByIndex = async (loader: HarnessLoader, index: number) => {
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    await panels[index].expand();
    return panels[index];
  };

  it('should expand a panel and show its content', async () => {
    const { loader } = await runSetup();
    const panel = await expandPanelByIndex(loader, 0);

    expect(await panel.isExpanded()).toBe(true);
    expect(await panel.getTextContent()).toContain('Expected content');
  });

  it('should collapse an expanded panel', async () => {
    const { loader } = await runSetup();
    const panel = await expandPanelByIndex(loader, 0);

    await panel.collapse();
    expect(await panel.isExpanded()).toBe(false);
  });
});
```

## Ejemplo: MatButton

```typescript
import { MatButtonHarness } from '@angular/material/button/testing';

it('should find submit button and verify it is not disabled', async () => {
  const { loader } = await runSetup();

  const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Submit' }));
  expect(await submitButton.isDisabled()).toBe(false);
  await submitButton.click();
});
```

## Ejemplo: MatSelect + Search Input (Overlay Global)

Cuando un componente proyecta contenido en un overlay (como un `mat-select` con campo de búsqueda), el contenido se renderiza fuera del componente:

```typescript
it('should filter options when typing in search input', async () => {
  const { fixture } = await runSetup();

  const loader = TestbedHarnessEnvironment.loader(fixture);
  const select = await loader.getHarness(MatSelectHarness);
  await select.open();

  // Buscar en el overlay global (fuera del componente)
  const searchInput = document.body.querySelector('input.search-input') as HTMLInputElement;
  expect(searchInput).toBeTruthy();

  await userEvent.type(searchInput, 'be');

  expect(screen.queryByText('Alpha')).toBeFalsy();
  expect(screen.getByText('Beta')).toBeTruthy();
});
```

## Combinando Harnesses con ATL

Los harnesses y las queries de ATL (`screen.getByRole`, etc.) pueden convivir en el mismo test. Usa harnesses para componentes Material y ATL para el resto:

```typescript
it('should show confirmation after selecting option', async () => {
  const { user, loader } = await runSetup();

  // Harness para Material
  const select = await loader.getHarness(MatSelectHarness);
  await select.open();
  const options = await select.getOptions();
  await options[0].click();

  // ATL para verificar texto resultante
  expect(screen.getByText('SELECTED_CONFIRMATION')).toBeInTheDocument();
});
```

# Known Issues & Soluciones en Tests Angular

Referencia de problemas recurrentes detectados en tests de este proyecto y sus soluciones verificadas.

---

## 1. `TypeError: this.store.<method> is not a function`

**Contexto:** Un componente llama a un método del store en `ngOnInit()` que no existe en la factory de mock.

**Causa:** Las factories como `createMockPlanningGeneralDataStore()` no cubren todos los métodos del store real. Por ejemplo, `loadSeries` existe en el store pero no en el mock factory.

**Solución:** Extender el mock con spread añadiendo los métodos faltantes como `vi.fn()`:

```typescript
mockStore = {
  ...createMockPlanningGeneralDataStore({ ... }),
  loadSeries: vi.fn(),         // ← método ausente en la factory
  series: vi.fn(() => mockSeries),
} as unknown as ReturnType<typeof createMockPlanningGeneralDataStore>;
```

**Diagnóstico rápido:** Si el error aparece en todos los tests del `describe`, es un problema de setup en `beforeEach`.

---

## 2. Template crash: `Cannot read property 'X' of null` en `store.fireTrial()!.X`

**Contexto:** El template usa el operador `!` para acceder a propiedades del resultado de un signal (`store.fireTrial()!.status`).

**Causa:** `createMockPlanningGeneralDataStore` devuelve `fireTrial: () => null` por defecto. El operador `!` no previene el crash en runtime.

**Solución:** Siempre pasar `fireTrial` con datos válidos cuando el template accede a propiedades con `!`:

```typescript
createMockPlanningGeneralDataStore({
  fireTrial: { ...createTrial(), status: 'PLANNED' },
});
```

---

## 3. `TypeError: this.formField(...) is not a function` (Angular Signal Forms + `applyEach`)

**Contexto:** Componente que usa `form()` + `applyEach()` sobre un array de objetos. La plantilla renderiza `[formField]="getShotField(serieIdx, i).someField"`.

**Causa:** Los objetos de datos del mock no tienen **todos** los campos que la configuración del formulario referencia mediante validators (`required`, `min`, etc.). Signal Forms intenta acceder al path del campo, pero al ser `undefined` en el modelo del signal, el proxy del form path devuelve un objeto inválido. Cuando Angular evalúa `this.formField()()` en la directiva `FormField`, el valor no es una función invocable.

**Campos habitualmente ausentes en `createShootingConditions()`:** `inclination`, `nominalVelocity`.

**Solución:** Crear un helper local que añada los campos faltantes antes de poblar el formulario:

```typescript
function createFullConditions(count = 2, shots = 2) {
  return createShootingConditions(count, shots).map((serie) => ({
    ...serie,
    shots: serie.shots.map((shot) => ({
      ...shot,
      inclination: 0, // ← campo ausente en la factory
      nominalVelocity: 0, // ← campo ausente en la factory
    })),
  }));
}
```

Usar `createFullConditions()` en todos los tests que llamen a `seriesSignal.set()` o que pasen datos de condiciones al store/service mock.

**Regla general:** Cuando el componente usa `form()` + `applyEach()` sobre arrays, los objetos del signal deben tener **todos** los campos que aparecen en la configuración del formulario (validators incluidos), aunque sean opcionales en el modelo TypeScript.

---

## 4. `SyntaxError: 'h2,,,font-medium .material-icons,mat-icon,[matButtonIcon]' is not a valid selector`

**Contexto:** Test que usa `getByRole('button', { name: 'LABEL' })` con botones de Angular Material (`mat-flat-button`, `mat-stroked-button`, `mat-icon-button`).

**Causa:** Testing Library calcula el nombre accesible ARIA del botón recorriendo sus elementos hijos. En JSDOM, Angular Material genera selectores CSS que contienen partes vacías (`h2,,,font-medium ...`) provenientes de clases de Tailwind u otros atributos, lo que produce un `SyntaxError`.

**Solución:** Evitar `getByRole('button', { name })` con Angular Material. Usar `getByText` con `closest`:

```typescript
// ❌ Falla en JSDOM con botones Angular Material
screen.getByRole('button', { name: 'LABEL_KEY' });

// ✅ Para verificar existencia
screen.getByText('LABEL_KEY');

// ✅ Para verificar estado (disabled, etc.)
screen.getByText('LABEL_KEY').closest('button');

// ✅ Alternativa si hay varios botones sin texto único
screen.getAllByRole('button')[0];
```

---

## 5. Signal/Effect no se dispara — componente no se inicializa correctamente

**Contexto:** Un componente tiene un `effect()` en el constructor que lee un signal del store (`store.series()`) para inicializar otro signal interno (`seriesSignal`). Los tests fallan porque el signal interno queda vacío.

**Causa:** El mock devuelve `series: vi.fn(() => [])` (array vacío). El `effect()` tiene un guard `if (!series?.length) return;` que aborta la inicialización.

**Solución:** Proporcionar datos reales que superen el guard. Asegurarse de que la forma del objeto coincide con el tipo esperado por el store:

```typescript
// Store: series devuelve Serie[] de series-and-shots.model.ts
// { id, name, shotQuantity, executionOrder, observations, shots: {id, globalNumber, observation}[] }
const mockSeries = mockConditions.map((s, i) => ({
  id: s.seriesId,
  name: s.seriesName,
  shotQuantity: s.shots.length,
  executionOrder: i + 1,
  observations: '',
  shots: s.shots.map((sh) => ({ id: sh.shotId, globalNumber: sh.globalNumber, observation: '' })),
}));

mockStore = {
  ...createMockPlanningGeneralDataStore({ ... }),
  series: vi.fn(() => mockSeries),
};
```

---

## 6. Providers necesarios para componentes con Angular Material + Signal Forms

Siempre incluir en los `providers` de `render()` cuando el componente usa Angular Material:

```typescript
providers: [
  provideAnimationsAsync(), // ← requerido por Angular Material en tests
  provideTestingEnvironment(), // ← requerido para tokens de config (endpoints)
  { provide: MyStore, useValue: mockStore },
  { provide: MyService, useValue: mockService },
];
```

> **Nota:** `provideAnimations()` puede causar el error de selector inválido (#4). Preferir `provideAnimationsAsync()`.

---

## 7. `NG0201: No provider found for 'SignalStore'` al testear componentes que inyectan un Store

**Contexto:** Un componente standalone inyecta una store creada con `signalStore()` (NgRx Signals). Al ejecutar el test aparece:

```
NG0201: No provider found for `SignalStore`. Source: Standalone[MyComponent]
```

**Causa:** `signalStore()` genera una clase con `providedIn: null`, lo que significa que Angular **nunca** la registra automáticamente en ningún injector. En tests, si el componente simplemente llama a `inject(MyStore)` sin declarar la store en su propio array `providers: [MyStore]`, Angular no sabe de dónde obtenerla.

**Solución:** Proporcionar la store como mock en los `providers` del `render()`. Distinguir dos casos:

### Caso A — La store está en el propio `providers: [MyStore]` del componente

```typescript
// component.ts
@Component({
  standalone: true,
  providers: [MyStore], // ← store declarada aquí
})
export class MyComponent {
  store = inject(MyStore);
}
```

➡️ Usar `componentProviders` en el `render()`:

```typescript
await render(MyComponent, {
  componentProviders: [{ provide: MyStore, useValue: makeMyStoreMock() }],
});
```

### Caso B — El componente solo llama `inject(MyStore)` sin declararla (más habitual)

```typescript
// component.ts
@Component({ standalone: true })
export class MyComponent {
  store = inject(MyStore);
} // sin providers[]
```

➡️ Usar `providers` (nivel raíz del test) en el `render()`:

```typescript
await render(MyComponent, {
  providers: [
    provideTestingEnvironment(),
    { provide: MyStore, useValue: makeMyStoreMock() },
    // Si la store depende de un servicio también hay que mockearlo:
    { provide: MyService, useValue: makeMyServiceMock() },
  ],
});
```

### Fábrica mínima de mock para una store

```typescript
function makeMyStoreMock() {
  return {
    // Signals de estado
    items: signal<MyModel[]>([]),
    isLoading: signal(false),
    error: signal(null),
    hasError: signal(false),
    isInitialized: signal(false),
    // Métodos de acción
    search: vi.fn(),
    reload: vi.fn(),
    reset: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  };
}
```

> **Regla general:** Si ves `NG0201` apuntando a un store, comprueba si la clase está en el array `providers[]` del componente. Si no está → usa `providers` a nivel de test. Si está → usa `componentProviders`.

---

## 9. `MatDialog` mock ignorado — el componente usa el `MatDialog` real aunque se provea en `providers`

**Contexto:** Un componente tiene `MatDialogModule` en su array `imports`. Se provee `{ provide: MatDialog, useValue: mockDialog }` en los `providers` raíz del test, pero la llamada a `transfer()` / `open()` falla con `TypeError: Cannot read properties of undefined (reading 'push')`.

**Causa:** Cuando `MatDialogModule` está en los `imports` de un componente standalone, Angular crea un **injector de componente** que registra su propio token de `MatDialog`. Este injector interno tiene prioridad sobre el injector raíz del test, por lo que el mock provisto en `providers` queda eclipsado por la instancia real (sin overlay container en JSDOM → crash).

**Solución:** Proveer el mock de `MatDialog` en `componentProviders`, no en `providers`:

```typescript
// ❌ No funciona — queda eclipsado por el injector del componente
await render(MyComponent, {
  providers: [
    { provide: MatDialog, useValue: mockDialog }, // ignorado
  ],
});

// ✅ Correcto — sobreescribe el provider del injector del componente
await render(MyComponent, {
  providers: [
    provideTestingEnvironment(),
    // resto de providers globales...
  ],
  componentProviders: [
    { provide: MatDialog, useValue: mockDialog }, // sí funciona
  ],
});
```

**Regla:** Si el componente tiene `MatDialogModule` (o cualquier módulo que registre providers propios) en sus `imports`, el mock del token afectado **debe ir en `componentProviders`**.

**También aplica a:** Observables en `afterClosed()` cuando hay un `.pipe(delay(N))`.
Usando `of(result)` como mock de `afterClosed()` y `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(N+100)` para avanzar el timer:

```typescript
function makeDialog(dialogResult: any) {
  return {
    open: vi.fn().mockReturnValue({
      afterClosed: vi.fn().mockReturnValue(of(dialogResult)),
    }),
  };
}

// En el test que verifica la acción post-diálogo:
vi.useFakeTimers();
try {
  component.transfer();
  await vi.advanceTimersByTimeAsync(600); // delay(500) + margen
  expect(store.reload).toHaveBeenCalledOnce();
} finally {
  vi.useRealTimers();
}
```

---

## 8. Tests estancados referenciando UI eliminada

**Causa:** El template del componente fue modificado (se eliminaron elementos, se comentaron secciones) pero el test sigue buscando esos elementos.

**Síntoma:** `TestingLibraryElementError: Unable to find an element with the text: ...` o `Unable to find an accessible element with the role "button" and name "..."`.

**Solución:**

1. Leer el template actual del componente antes de escribir/corregir tests.
2. Eliminar o actualizar los tests que referencian UI ya no presente.
3. Reemplazar selectores CSS (`container.querySelector('.clase')`) por queries accesibles (`getByText`, `getByRole`) más resistentes a cambios de estilo.

---

## 10. `fakeAsync` + `tick()` — debounce en `LoaderService.show()` no dispara

**Contexto:** Tests de `LoaderComponent`, `LoaderService` y `loaderInterceptor` usan `fakeAsync` + `tick()` y fallan con `expected true, received false` al verificar `isLoading()`.

**Causa:** `LoaderService.show()` tiene un debounce interno de **150ms** implementado con `setTimeout`. `tick()` sin argumento avanza 0ms — el timer nunca dispara y `isLoading` permanece `false`.

**Síntoma característico:**

```
expected: true
received: false
```

en la línea `expect(service.isLoading()).toBe(true)` justo después de `tick()`.

**Solución:** Usar `tick(150)` (o una constante `SHOW_DEBOUNCE_MS = 150`) siempre que se espere que `isLoading` sea `true` después de `show()`. Los métodos `hide()` y `reset()` son **síncronos** → `tick()` sin argumento es correcto tras ellos.

```typescript
const SHOW_DEBOUNCE_MS = 150; // al inicio del spec

// ❌ Falla — debounce no dispara
service.show();
tick();
expect(service.isLoading()).toBe(true); // false!

// ✅ Correcto
service.show();
tick(SHOW_DEBOUNCE_MS);
expect(service.isLoading()).toBe(true); // true ✓

// ✅ hide() y reset() son síncronos
service.hide();
tick(); // 0ms es suficiente
expect(service.isLoading()).toBe(false); // true ✓
```

**Regla general:** Antes de hacer `tick()`, revisar si el método llamado usa `setTimeout` internamente. Si lo usa, pasar el tiempo exacto del debounce.

---

## 11. Cascada "TestBed already instantiated" en specs con HttpTestingController

**Contexto:** El segundo y sucesivos tests de un `describe` fallan con `Cannot configure the test module when the test module has already been instantiated`.

**Causa raíz:** Un test anterior falla a mitad de ejecución y deja **peticiones HTTP abiertas**. El `httpTesting.verify()` en `afterEach` lanza un segundo error, corrompiendo el estado de TestBed para todos los tests siguientes.

**Causa frecuente del test que falla primero:** Issue #10 — `tick()` en lugar de `tick(SHOW_DEBOUNCE_MS)`.

**Solución:**

1. Corregir el test que falla primero (suele ser el Issue #10).
2. **No** intentar añadir `httpTesting.cancelPendingRequests()` — ese método **no existe** en `HttpTestingController` (ver Issue #12).

---

## 12. `Property 'cancelPendingRequests' does not exist on type 'HttpTestingController'`

**Causa:** `HttpTestingController` no expone ese método en Angular.

**Solución:** Eliminar la llamada. Corregir el test raíz que deja peticiones abiertas en lugar de intentar limpiarlas en `afterEach`.

---

## 14. `ng2-pdf-viewer` crash en JSDOM — `TypeError: Cannot add property verbosity, object is not extensible`

**Contexto:** Specs de componentes que importan (directa o transitivamente) `UiDialogService` de `@intaqalab/ui`. La cadena de importación: `EventsActionsService` → `UiDialogService` → `doc-viewer.ts` → `ng2-pdf-viewer`.

**Síntoma:**

```
TypeError: Cannot add property verbosity, object is not extensible
 → ng2-pdf-viewer/fesm2022/ng2-pdf-viewer.mjs:155
```

El spec no ejecuta ni un solo test (`0 tests`).

**Solución Preferida:** Agregar la importación del mock global en el archivo `test-setup.ts` de la librería en la que se está trabajando:

```typescript
import '@intaqalab/utils/testing/pdf-mock';
```

**Solución Alternativa (Inline):** Si se requiere mocking local específico o la solución preferida no está disponible, añadir `vi.mock('ng2-pdf-viewer', ...)` **antes** de cualquier import del spec. Usar factory **síncrona** (no `async`):

```typescript
// Imports dinámicos o de componente DESPUÉS del mock
import { MyComponent } from './my.component';

// ✅ Factory SÍNCRONA — funciona en todos los libs
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));
```

**Por qué no async:** En libs compiladas con `@analogjs/vite-plugin-angular` + `importHelpers: true`, el helper `__async` de `tslib` no está disponible en el contexto de `vi.mock`. La factory asíncrona lanza `TypeError: __async is not a function`.

**Aplica a:** Cualquier lib del proyecto que importe `EventsActionsService`, `UiDialogService`, o cualquier servicio de `@intaqalab/ui`.

---

## 15. `SetupInputs` debe incluir todos los inputs que los tests necesitan sobreescribir

**Contexto:** La función `setup()` recibe `inputs: SetupInputs` y los pasa al `render()`. Si un test necesita sobreescribir un input que no está declarado en `SetupInputs`, TypeScript fallará o el valor será ignorado.

**Solución:** Siempre declarar todos los inputs del componente en la interfaz `SetupInputs`, incluyendo `value?: Date` cuando el componente tenga un input `value` de tipo `Date`.

```typescript
interface SetupInputs {
  observations?: { id: string } | null;
  isDisabled?: boolean;
  linesOfShotData?: unknown;
  canSchedule?: boolean;
  value?: Date; // ← no olvidar si el componente lo expone
}
```

**Síntoma:** `TypeError: (0 , provideTestingEnvironment) is not a function` en cualquier spec de la lib `core`.

**Causa:** La función importa `angular-auth-oidc-client` transitivamente, que no se resuelve correctamente en el contexto de test de `core`.

**Solución:** **No usar** `provideTestingEnvironment()` en specs de la lib `core`. Los componentes `LoaderComponent`, `LoaderService` y `loaderInterceptor` no lo necesitan — no consumen ningún token de configuración de entorno.

---

## 16. `NG0950: Input is required but no value is available yet` y `NG0203: Injector token injection failed` en subcomponentes con Signal Forms

**Contexto:** Un subcomponente o componente presentacional tiene un input requerido de tipo `FieldTree` (`form = input.required<FieldTree<...>>()`) y su template accede a campos del formulario en el renderizado inicial. Al intentar renderizarlo directamente con `render(MyComponent)` o al inicializar `form(...)` fuera de un contexto de inyección en la suite de pruebas, la prueba lanza `NG0950` o `NG0203`.

**Causa:**

1. Angular 22 lanza `NG0950` si el input requerido no se ha proveído al momento de evaluar el template (primer ciclo de detección de cambios).
2. La función `form()` de `@angular/forms/signals` requiere ejecutarse en un contexto de inyección (injection context), por lo que no puede ser llamada libremente en la raíz de la función `setup()`.

**Solución Agnóstica (Wrapper Pattern):**
Crear un componente Wrapper de testing (`TestWrapperComponent`) local en el archivo `.spec.ts`. Este wrapper declara la señal del modelo del formulario, inicializa `form(this.formModel)` en su cuerpo de clase (que corre en un contexto de inyección válido) y pasa la referencia en el template al componente bajo prueba:

```typescript
@Component({
  standalone: true,
  imports: [MyComponent],
  template: `<inta-my-component [form]="componentForm" />`
})
class TestWrapperComponent {
  formModel = signal<MyFormModel>({
    // valores por defecto del modelo
  });
  componentForm = form(this.formModel);
}

// En el setup del test, renderizar el wrapper y recuperar la instancia si es necesario:
async function setup() {
  const view = await render(TestWrapperComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    providers: [ ... ]
  });

  const componentDebug = view.fixture.debugElement.query(By.directive(MyComponent));
  const component = componentDebug.componentInstance as MyComponent;

  return { fixture: view.fixture, component, wrapper: view.fixture.componentInstance };
}
```

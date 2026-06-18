# 🧪 Testing Estratégico (Vitest + ATL)

El proyecto adopta un enfoque de testing **centrado en el comportamiento del usuario** (behavior-driven) usando Angular Testing Library (ATL).

> [!IMPORTANT]
> **PROHIBIDO testear selectores DOM internos (`.mat-row`, `div.container`) para componentes de Angular Material.** El uso de **Component Harnesses** oficiales de Material es estrictamente obligatorio para aislar las pruebas de la implementación interna de los componentes Material.

## 1. Setup y Dependencias Mandatorias

- **Runner:** `Vitest`
- **Librería UI:** `@testing-library/angular`
- **Interacciones:** `@testing-library/user-event`
- **Entorno base (`setup()`):** Todo bloque `describe` debe tener un setup asíncrono para renderizar e inicializar los harnesses.

Es indispensable proveer en la inicialización:
- `provideTestingEnvironment()`
- `provideHttpClient()` + `provideHttpClientTesting()` (para los httpResource).
- `provideMockStore()`
- `provideNoopAnimations()`

## 2. Uso de Component Harnesses (`@angular/cdk/testing`)

Siempre inicializa el `TestbedHarnessEnvironment.loader` desde el `view.fixture` retornado por el render de ATL.

```typescript
const setup = async () => {
  const user = userEvent.setup();
  const view = await render(MyComponent, {
    providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
  });
  
  // 🔥 Loader Obligatorio
  const loader = TestbedHarnessEnvironment.loader(view.fixture);
  
  return { user, view, loader };
};

it('should interact with Material safely', async () => {
  const { loader } = await setup();
  
  // ✅ Correcto: Uso del harness
  const select = await loader.getHarness(MatSelectHarness);
  await select.open();
  
  // ❌ Incorrecto: Selector frágil prohibido
  // const selectDOM = view.fixture.nativeElement.querySelector('.mat-select');
});
```

## 3. Prioridad de Queries (Selectores)
A la hora de buscar elementos normales no relacionados con Angular Material:
1. **`getByRole`** — Botones, inputs, headings (Máxima Prioridad).
2. **`getByLabelText`** — Campos de formulario accesibles con `<label>`.
3. **`getByText`** — Texto estático.
4. **`getByTestId`** — Sólo cuando falla todo lo anterior.

## 4. Angular 21, Signals y Zoneless
El entorno de pruebas de INTAQALAB es **Zoneless** por defecto. Al mutar el estado (e.g. `store.update()`), utiliza `await` o depende del render event-loop de ATL para esperar a que los cambios propaguen en la interfaz.

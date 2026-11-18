# 🧪 Testing Estratégico (Vitest + ATL)

El proyecto adopta un enfoque de testing **centrado en el comportamiento del usuario** (behavior-driven) usando Angular Testing Library (ATL).

> [!IMPORTANT]
> **PROHIBIDO testear selectores DOM internos (`.mat-row`, `div.container`) para componentes de Angular Material.** El uso de **Component Harnesses** oficiales de Material es estrictamente obligatorio para aislar las pruebas de la implementación interna de los componentes Material.

## 1. Setup y Dependencias Mandatorias

### Suite completa y CI

```bash
npm run test:all
npm run test:ci
```

Ambos comandos ejecutan todos los targets `test` inferidos por Nx, sin mantener una lista manual de dominios. `test:ci` además desactiva la caché de resultados de Nx: los tests se vuelven a ejecutar. Cada proyecto tiene su propio proceso de Vitest; los proyectos se ejecutan secuencialmente, con un máximo de dos workers por proyecto. No se usa la UI interactiva en CI.

`nx.json` registra las mismas 20 configuraciones de test que `vitest.config.mts`, incluidos los mocks. Actualmente `demos`, `models` y `shared-theme` no contienen specs; solo sus configuraciones declaran `passWithNoTests: true`. Esto no silencia errores ni omite specs de los proyectos que sí tienen tests.

Para trabajar en un proyecto concreto:

```bash
npx nx test planning --run
npx nx test planning --ui --watch
```

`npm run vitest:ui` ejecuta la UI multiproyecto de Vitest con cobertura. En Vitest 5.1, la lectura de módulos cacheados puede fallar en `getCachedModule()` → `extractSourceMap()` → `RegExp.exec()` al recuperar el sourcemap inline de `@angular/compiler`. También se observaron imports de estilos virtuales JIT inválidos al reutilizar módulos cacheados. Los errores aparecen durante la carga del entorno, antes de las assertions.

Los scripts de UI global (`vitest:ui` y `test:coverage:ui`) limitan la concurrencia a dos workers para reducir la presión de memoria y los timeouts de renderizado en la suite completa con cobertura. No se amplían los límites de tiempo de los tests ni se añaden reintentos.

La raíz y **cada configuración de proyecto** declaran explícitamente:

```typescript
test: {
  fsModuleCache: false,
}
```

Las configuraciones de proyectos separadas no heredan esta opción de la raíz: declararla solo en `vitest.config.mts` no basta. Mantener la opción en las nuevas configuraciones hasta validar una versión de Vitest que repare esta ruta de caché. Esto desactiva únicamente la caché de módulos en disco de Vitest; no desactiva los sourcemaps, la cobertura, los tests ni la caché de resultados de Nx. No es necesario borrar `node_modules` ni modificar specs.

El cambio de extensión de la configuración raíz a `.mts` corrige únicamente el aviso ESM/CommonJS; es independiente de la configuración de caché anterior.

Con `manualChangeDetection()`, los harnesses no estabilizan automáticamente la vista. Las assertions de valores de `MatSelect` deben esperar a que su selección diferida llegue al DOM, no solo a que el modelo tenga el valor esperado. Mantener la assertion exacta y sincronizar la detección de cambios; no modificar valores esperados para aceptar placeholders transitorios.

- **Runner:** `Vitest`
- **Librería UI:** `@testing-library/angular`
- **Interacciones:** `@testing-library/user-event`
- **Entorno base (`setup()`):** Todo bloque `describe` debe tener un setup asíncrono para renderizar e inicializar los harnesses.

Es indispensable proveer en la inicialización:

- `provideTestingEnvironment()`
- `provideHttpClient()` + `provideHttpClientTesting()` (para los httpResource).
- `provideMockStore()`

Angular Material utiliza animaciones CSS nativas. No se deben añadir `provideNoopAnimations()` ni módulos de `@angular/animations` al entorno zoneless.

## 2. Uso de Component Harnesses (`@angular/cdk/testing`)

Siempre inicializa el `TestbedHarnessEnvironment.loader` desde el `view.fixture` retornado por el render de ATL.

```typescript
const setup = async () => {
  const user = userEvent.setup();
  const view = await render(MyComponent, {
    providers: [provideHttpClient(), provideHttpClientTesting()],
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

## 4. Angular 22, Signals y Zoneless

El entorno de pruebas de INTAQALAB es **Zoneless** por defecto. Al mutar el estado (e.g. `store.update()`), utiliza `await` o depende del render event-loop de ATL para esperar a que los cambios propaguen en la interfaz.

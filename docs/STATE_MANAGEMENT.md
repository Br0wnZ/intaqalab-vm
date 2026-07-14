# 🗃️ State Management & Data Fetching

**INTAQALAB** centraliza toda la gestión de estado y el consumo de APIs a través de un patrón específico llamado **Signal Trigger Pattern** utilizando `@ngrx/signals` y `httpResource()`.

> [!CAUTION]
> El estado **NO** vivirá fragmentado en observables, BehaviorSubjects ni encadenamientos de `@Input()`/`@Output()`. RxJS está **PROHIBIDO** para el manejo de estado local o suscripciones en la vista.

## 1. Única Fuente de la Verdad: NgRx SignalStore

Cada feature debe tener su propio Signal Store proveyéndolo a nivel del componente "Shell" o contenedor inteligente más alto.

- Los componentes visuales (hijos) NUNCA mantienen estado de negocio; inyectan la store (`inject(MiStore)`) y la consumen.
- Los Stores se construyen de manera puramente funcional:
  1. `withState(initialState)`: Solo para estado sincrónico UI y de precondiciones.
  2. `withComputed(...)`: Inyecta los servicios HTTP y expone los `resource.value()` de los servicios.
  3. `withMethods(...)`: Ejecuta lógicas de validación y muta los parámetros de los servicios.
  4. `withHooks(...)`: Limpia o recetea el store en el `onDestroy`.

Ejemplo:

```typescript
export const FeatureStore = signalStore(
  withState({ entityId: null }),

  withComputed((store, service = inject(FeatureHttpService)) => ({
    items: computed(() => service.fetchResource.value() ?? []),
    isLoading: computed(() => service.fetchResource.isLoading()),
  })),

  withMethods((store, service = inject(FeatureHttpService)) => ({
    loadData(id: string): void {
      patchState(store, { entityId: id });
      service.setFetchParams(id); // Dispara la petición HTTP
    },
  })),
);
```

## 2. Signal Trigger Pattern (`httpResource`)

Las llamadas HTTP no devuelven Observables ni usan `HttpClient.get().subscribe()`. Se delegan a la nueva API **`httpResource()`** de Angular 21 alojada de forma pura en los Servicios (`data-access`).

El ciclo (Signal Trigger Pattern) consta de 3 pasos:

1. **Signal Privado (El Gatillo):** El servicio declara un Signal privado inmutable (ej. `#getSeriesParams`). Su valor es `null` por defecto (actuando de guard).
2. **httpResource Reactivo:** El recurso evalúa el Signal privado. Si cambia (y no es `null`), automáticamente recomputa la URL/Body y lanza el Fetch HTTP real.
3. **Trigger Público:** El store o componente llama a un método del servicio (`getSeriesAndShots(id)`), que simplemente hace un `.set()` sobre el Signal privado del paso 1.

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureHttpService {
  // ① Signal trigger privado
  readonly #params = signal<{ id: string } | null>(null);

  // ② httpResource reactivo al signal
  readonly fetchResource = httpResource<FeatureEntity>(() => {
    const p = this.#params();
    if (!p) return undefined; // Guard
    return { url: \`\${this.apiUrl}/\${p.id}\`, method: 'GET' };
  });

  // ③ Método trigger público
  setFetchParams(id: string) {
    this.#params.set({ id });
  }
}
```

### 2.1 Feedback al Usuario

El éxito o el fracaso de una mutación API se monitorea desde el componente usando un `effect()` reactivo al `status` del recurso (`'resolved'` / `'rejected'`).

```typescript
effect(() => {
  const status = this.store.saveActionStatus();
  if (status === 'resolved') {
    this.toastService.success('Operación exitosa');
  }
});
```

## 3. Utilidades reactivas de apoyo

Para alimentar triggers y resources sin boilerplate, usa las utilidades propias de `@intaqalab/utils` (NO reimplementar a mano ni añadir librerías externas):

- `injectParams('id')` — id de ruta como signal → dispara `httpResource` al navegar.
- `debouncedSignal(term, 300)` — búsquedas sin refetch por tecla.
- `linkedQueryParam('q')` — filtros/paginación sincronizados con la URL.
- `explicitEffect([deps], fn)` — effects con dependencias explícitas (feedback de mutaciones sin dependencias accidentales).

Guía completa con las 13 utilidades y ejemplos: [UTILITIES.md](UTILITIES.md).

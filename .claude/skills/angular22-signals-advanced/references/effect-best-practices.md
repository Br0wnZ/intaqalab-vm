# Efectos Seguros — effect(), untracked(), afterRenderEffect

## Reglas de oro para effects en este proyecto

---

## 1. Leer señales ANTES del await en efectos async

El contexto reactivo se pierde después de cualquier `await`. Las señales leídas después
de un `await` NO se trackean como dependencias.

```typescript
// ❌ PELIGROSO — theme() no se trackea, el effect no se re-ejecuta cuando theme cambia
effect(async () => {
  const data = await fetchUserData(); // contexto reactivo perdido aquí
  console.log(`User: ${data.name}, Theme: ${this.theme()}`); // theme NO trackeado
});

// ✅ CORRECTO — leer señales antes del await
effect(async () => {
  const currentTheme = this.theme(); // ✅ Leído antes del await → trackeado
  const userId = this.userId(); // ✅ Leído antes del await → trackeado
  const data = await fetchUserData(userId);
  console.log(`User: ${data.name}, Theme: ${currentTheme}`);
});

// También funciona pasando como argumento:
effect(async () => {
  await this.renderContent(this.docContent()); // docContent() leído antes del await
});
```

**Este patrón existe en el proyecto — buscar con:**

```
grep -r "effect(async" libs/
```

---

## 2. `untracked()` — Leer sin crear dependencia

Úsalo cuando necesitas leer una señal en un `effect` o `computed` sin que sea una dependencia.

```typescript
import { untracked } from '@angular/core';

// Caso: Log que se actualiza cuando currentUser cambia,
// pero counter no debe causar el re-log
effect(() => {
  const user = this.currentUser(); // ✅ Trackeada — el effect re-corre cuando cambia
  const count = untracked(this.counter); // ✅ NO trackeada — solo leída
  console.log(`User: ${user.name}, Count at time of change: ${count}`);
});

// Caso: Invocar servicio sin trackear sus señales internas
effect(() => {
  const user = this.currentUser();
  untracked(() => {
    // Si loggingService lee señales internamente, no se trackean aquí
    this.loggingService.logUserChange(user);
  });
});

// En computed:
const summary = computed(() => {
  const total = this.items().length; // Trackeado
  const timestamp = untracked(this.lastUpdated); // NO trackeado — solo metadato
  return `${total} items (as of ${timestamp})`;
});
```

---

## 3. Cuándo NO usar `effect()`

Angular recomienda preferir `computed` o derivaciones directas.

```typescript
// ❌ MAL uso — no usar effect para derivar estado
readonly filteredItems = signal<Item[]>([]);

constructor() {
  effect(() => {
    // Antipatrón: effect para actualizar otra señal
    this.filteredItems.set(
      this.allItems().filter(item => item.active === this.showActive())
    );
  });
}

// ✅ CORRECTO — usar computed
readonly filteredItems = computed(() =>
  this.allItems().filter(item => item.active === this.showActive())
);
```

**Usar `effect()` solo para:**

- Llamadas a APIs externas no reactivas (analytics, third-party DOM)
- Logging y debugging
- Sincronización con storage externo (localStorage, IndexedDB)
- Integración con librerías de terceros (D3, Chart.js)

---

## 4. `afterRenderEffect()` — Para manipulación del DOM

Cuando necesitas interactuar con el DOM después del renderizado.

```typescript
import { afterRenderEffect, ElementRef } from '@angular/core';

@Component({ ... })
export class ChartComponent {
  readonly #el = inject(ElementRef);
  readonly chartData = input<DataPoint[]>([]);
  #chart: ChartLibrary | null = null;

  constructor() {
    // ✅ afterRenderEffect para DOM manipulation
    afterRenderEffect(() => {
      const data = this.chartData(); // Trackeado — re-corre cuando cambia
      if (!this.#chart) {
        this.#chart = new ChartLibrary(this.#el.nativeElement);
      }
      this.#chart.update(data);
    });
  }
}
```

---

## 5. Limpieza en effects — `onCleanup`

Para efectos que crean recursos (timers, subscriptions externas), usar el callback de limpieza.

```typescript
effect((onCleanup) => {
  const intervalId = setInterval(() => {
    this.counter.update((v) => v + 1);
  }, 1000);

  // Se ejecuta cuando el effect se re-corre o el componente se destruye
  onCleanup(() => {
    clearInterval(intervalId);
  });
});
```

---

## 6. `assertNotInReactiveContext()` — Proteger código imperativo

```typescript
import { assertNotInReactiveContext } from '@angular/core';

// En servicios o funciones que NO deben llamarse desde contextos reactivos:
subscribeToExternalEvents() {
  // Lanza error si se llama desde computed/effect
  assertNotInReactiveContext(subscribeToExternalEvents);

  // Lógica que solo tiene sentido fuera de contexto reactivo
  this.externalService.on('event', handler);
}
```

---

## Resumen — Cuándo usar qué

| Necesidad                                     | Herramienta                     |
| --------------------------------------------- | ------------------------------- |
| Estado derivado (solo lectura)                | `computed()`                    |
| Estado derivado writable                      | `linkedSignal()`                |
| Datos async reactivos                         | `httpResource()` / `resource()` |
| Side effect en API externa                    | `effect()`                      |
| Side effect tras renderizado                  | `afterRenderEffect()`           |
| Leer sin dependencia                          | `untracked()`                   |
| Código que no debe estar en contexto reactivo | `assertNotInReactiveContext()`  |

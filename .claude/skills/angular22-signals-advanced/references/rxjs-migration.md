# Migración RxJS → Signals

## Filosofía

En este proyecto, RxJS está permitido SOLO para:

1. Interop con librerías de terceros (Angular Material dialogs, OIDC, etc.)
2. Operadores complejos sin equivalente en signals (`debounceTime`, `switchMap`, etc.)
3. Envuelto siempre en `toSignal()` o consumido con `firstValueFrom()`

**PROHIBIDO**: `.subscribe()` en componentes sin gestión de ciclo de vida.

---

## Patrón 1: Dialogs — `.subscribe()` → `firstValueFrom()`

El caso más común en el proyecto: `dialogRef.afterClosed().subscribe(...)`.

```typescript
import { firstValueFrom } from 'rxjs';

// ❌ ANTI-PATRÓN actual (múltiples ocurrencias en el proyecto)
openDialog() {
  const dialogRef = this.dialog.open(MyDialogComponent, { data });
  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.store.save(result);
    }
  });
}

// ✅ CORRECTO: async/await con firstValueFrom
async openDialog(): Promise<void> {
  const dialogRef = this.dialog.open(MyDialogComponent, { data });
  const result = await firstValueFrom(dialogRef.afterClosed());
  if (result) {
    this.store.save(result);
  }
}
```

**Archivos afectados en el proyecto:**

- `munitions-dumps-list.component.ts` — L172
- `denominations-list.component.ts` — L248
- `trial-docs.ts` — L507
- Buscar con: `grep -r "afterClosed().subscribe" libs/`

---

## Patrón 2: Streams de terceros → `toSignal()`

Para streams que emiten múltiples valores (ej: OIDC, route params, state changes).

```typescript
import { toSignal } from '@angular/core/rxjs-interop';

// ❌ ANTI-PATRÓN
private destroy$ = new Subject<void>();
someObservable$.pipe(takeUntil(this.destroy$)).subscribe(value => {
  this.myState.set(value);
});
ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

// ✅ CORRECTO: toSignal se desuscribe automáticamente
readonly myState = toSignal(someObservable$, { initialValue: null });
```

**Casos en el proyecto:**

```typescript
// app.ts — ya usa toSignal correctamente:
readonly #authCheck = toSignal(this.#oidcSecurityService.checkAuth().pipe(...));

// trial-scheduler-modal-shell.component.ts — migrar takeUntil:
// ❌ calendar.stateChanges.pipe(takeUntil(this.#destroy$)).subscribe(...)
// ✅ readonly calendarState = toSignal(this.calendar.stateChanges, { initialValue: null });
```

---

## Patrón 3: One-shot requests → `firstValueFrom()` en vez de subscribe

Para operaciones únicas que devuelven un observable (no streams continuos).

```typescript
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// ❌ Para peticiones únicas NO usar httpResource si ya tienes HttpClient en un contexto imperativo
// ❌ EVITAR: this.http.post(...).subscribe(result => { ... })

// ✅ CORRECTO: await + firstValueFrom
async save(data: MyDto): Promise<void> {
  const result = await firstValueFrom(this.http.post<MyDto>('/api/items', data));
  // usar result...
}
```

---

## Patrón 4: `takeUntilDestroyed()` si el stream es inevitable

Si no puedes convertir a `toSignal` (ej: el observable empieza después de un evento), usa el helper de Angular:

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({ ... })
export class MyComponent {
  readonly #destroyRef = inject(DestroyRef);

  // Solo cuando no sea posible usar toSignal
  someMethod() {
    this.someService.getStream().pipe(
      takeUntilDestroyed(this.#destroyRef) // ✅ Se desuscribe solo al destruir el componente
    ).subscribe(value => {
      this.localSignal.set(value);
    });
  }
}
```

---

## Patrón 5: RxJS operators sin equivalente — mantener pero aislar

Para `debounceTime`, `switchMap`, `combineLatest` complejos: usar `rxMethod` de NgRx o
envolver en un servicio dedicado con `toSignal`.

```typescript
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

// En el store — solo para casos con lógica RxJS compleja
const loadByQuery = rxMethod<string>(
  pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((query) =>
      this.service.search(query).pipe(
        tapResponse({
          next: (results) => patchState(store, { results }),
          error: (err) => patchState(store, { error: err }),
        }),
      ),
    ),
  ),
);
```

---

## Checklist de migración

Para cada archivo que tenga `.subscribe()`:

1. ¿Es un one-shot observable (dialog, form submit, single request)? → `firstValueFrom()`
2. ¿Es un stream continuo de solo lectura? → `toSignal()`
3. ¿Necesita takeUntil manual? → `takeUntilDestroyed(destroyRef)`
4. ¿Es complejo (debounce, switchMap)? → `rxMethod` en el store
5. ¿Es de una librería de terceros que no se puede cambiar? → Envolver en servicio con `toSignal`

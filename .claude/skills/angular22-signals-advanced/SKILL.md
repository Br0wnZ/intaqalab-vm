---
name: angular22-signals-advanced
description: >-
  Skill de patrones avanzados Angular 22 Signals-first para este monorepo Nx. Audita y refactoriza código
  para aplicar: linkedSignal, stable Signal Forms (when, touch, casting, apply), resource y httpResource estables,
  el decorador @Service(), withEntities en SignalStore, eliminación de ReactiveFormsModule legacy, migración de
  .subscribe() a firstValueFrom/toSignal, efectos async seguros, asReadonly() en servicios, y custom SignalStore features.
  Invocar cuando el usuario dice "audita signals", "mejora patrones", "elimina rxjs", "refactoriza store", "signals avanzado",
  "aplica mejores prácticas angular22".
agent-compatibility: angular22-signals-auditor
user-invocable: true
---

# 🚀 Skill: Angular 22 Advanced Signals Patterns

Este skill centraliza los patrones avanzados de la plataforma Angular 22 Signals-first que se deben aplicar
en este monorepo Nx. Está calibrado contra el código real del proyecto.

## Estado del Proyecto (Auditoría Junio 2026)

### ✅ Patrones ya establecidos (no tocar sin razón)

- `signal()`, `computed()`, `effect()` — uso generalizado
- `httpResource()` y `injectAsync()` — APIs estables adoptadas para data fetching y lazy-loading
- `form()` API de `@angular/forms/signals` — adoptada y estable
- `signalStore` con `withState/withComputed/withMethods/withHooks` — 44+ stores
- `provideZonelessChangeDetection()` — habilitado globalmente
- `ChangeDetectionStrategy.OnPush` — Estrategia por defecto (no declarar explícitamente en nuevos componentes)

### ⚠️ Gaps identificados (APLICAR ESTOS PATRONES)

- `@Service()` de `@angular/core` — Reemplazar progresivamente `@Injectable({ providedIn: 'root' })` para singleton services
- `{ when: () => condición }` en Signal Forms — Es obligatorio usar el objeto de configuración para `disabled`, `readonly` y `hidden` (pasar función directa está deprecated)
- Componentes de formulario personalizados — Usar el nuevo contrato `input('touched')` y `output('touch')`
- linkedSignal — Reemplaza signal + computed para estado dependiente writable
- ReactiveFormsModule legacy — aún importado junto a `form()`. Eliminar
- dialog.afterClosed().subscribe() — Migrar a `firstValueFrom()` + async/await
- withEntities() — No usado en stores de listas. Evaluar adopción
- resourceFromSnapshots — Para composición avanzada de recursos HTTP
- asReadonly() — Servicios deben exponer señales readonly
- Efectos async — Leer señales antes del `await`

## Referencias por Tema

| Patrón                                                          | Referencia                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `linkedSignal` — Estado derivado writable                       | [linked-signal.md](references/linked-signal.md)                 |
| SignalStore avanzado (`withEntities`, custom features, privado) | [signal-store-advanced.md](references/signal-store-advanced.md) |
| Migración RxJS → Signals                                        | [rxjs-migration.md](references/rxjs-migration.md)               |
| Limpieza de formularios legacy                                  | [signal-forms-cleanup.md](references/signal-forms-cleanup.md)   |
| `resource` avanzado (`hasValue`, abort, snapshots)              | [resource-advanced.md](references/resource-advanced.md)         |
| Efectos seguros (`untracked`, async, afterRenderEffect)         | [effect-best-practices.md](references/effect-best-practices.md) |

## Flujo de Trabajo del Agente

Cuando el agente aplica este skill:

1. **Auditar** — Lee el fichero o directorio objetivo con las herramientas de búsqueda
2. **Clasificar** — Identifica qué gap/anti-patrón aplica usando las referencias
3. **Planificar** — Muestra al usuario los cambios antes de ejecutarlos
4. **Aplicar** — Edita los ficheros usando `multi_replace_string_in_file`
5. **Validar** — Ejecuta `get_errors` para confirmar que no hay errores de compilación

## Reglas de Aplicación

- **NO reescribir** lo que ya funciona correctamente
- **NO añadir** complejidad innecesaria (YAGNI)
- **NO migrar** RxJS de terceros (OIDC, Material dialogs) — solo envolver con `toSignal`/`firstValueFrom`
- **SÍ** actualizar los `.spec.ts` cuando se cambia la API pública de un componente/store
- **SÍ** mantener el factory pattern `injectWarehouseResource` — es correcto para este proyecto

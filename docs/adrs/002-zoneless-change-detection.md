# ADR-002: Zoneless Change Detection

**Estado:** Aceptado
**Fecha:** 2026-07-10 (retroactivo — decisión ya implementada)
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

Angular 21 soporta ejecución sin `zone.js` (`provideZonelessChangeDetection()`). La detección de cambios basada en Zone.js parchea APIs globales (timers, eventos DOM, promesas) para saber cuándo re-renderizar, lo que añade overhead de runtime y ruido en stack traces. Angular con Signals ya no necesita ese mecanismo: cada `signal()`/`computed()` sabe exactamente cuándo cambió.

## Decisión

La app usa `provideZonelessChangeDetection()` en `apps/intaqalab/src/app/app.config.ts`. `zone.js` se mantiene como `devDependency` únicamente porque `@analogjs/vitest-angular/setup-zone` (usado en los `test-setup.ts` de Vitest) lo requiere como peer dependency — no se carga en el bundle de producción.

**Alternativa rechazada:** Zone.js clásico (`provideZoneChangeDetection`) — descartado por overhead de runtime y porque el resto del stack (Signals, SignalStore, `httpResource`) ya asume reactividad basada en signals.

## Consecuencias

### Positivas

- Sin parcheo de APIs globales; stack traces más limpios.
- Fuerza disciplina reactiva: nada de `ChangeDetectorRef`/`NgZone` manual (ver `docs/adrs/` y reglas de `.claude/rules/angular-nx-architect.md`).
- Bundle de producción sin `zone.js`.

### Negativas

- Cualquier librería de terceros que dependa de Zone.js para notificar cambios (temporizadores, callbacks) puede requerir wrapping manual con signals.
- La infraestructura de test (Vitest + Angular Testing Library) sigue arrastrando `zone.js` como dependencia de desarrollo por `@analogjs/vitest-angular` — no es zoneless de extremo a extremo todavía.

### Pendiente

- Migrar `test-setup.ts` (15 ficheros) de `@analogjs/vitest-angular/setup-zone` a un setup zoneless cuando la librería lo soporte, para eliminar `zone.js` por completo del repo.

## Referencias

- `apps/intaqalab/src/app/app.config.ts`
- `apps/intaqalab/src/test-setup.ts` y equivalentes por librería

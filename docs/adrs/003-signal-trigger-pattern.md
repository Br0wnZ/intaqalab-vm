# ADR-003: Signal Trigger Pattern para Data Fetching

**Estado:** Aceptado
**Fecha:** 2026-07-10 (retroactivo — decisión ya implementada)
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

El fetching de datos remotos necesita un patrón único y predecible: sin `.subscribe()` manual, sin `ngOnInit` con lógica HTTP, y con la vista consumiendo siempre signals (nunca observables). Angular 21 provee `httpResource` como primitiva reactiva para HTTP basada en signals, con refetch automático cuando cambian sus parámetros derivados.

## Decisión

Todo data-access remoto sigue el **Signal Trigger Pattern** en 3 capas:

1. **Service (`data-access`)** — expone un `httpResource<T>()` cuya URL/params derivan de signals privadas (trigger signals).
2. **Store (`SignalStore`)** — controla cuándo se dispara la carga escribiendo en la trigger signal del service; expone `computed()` derivados del resource (`.value()`, `.isLoading()`, `.error()`).
3. **Componente** — solo lee `computed signals` del store; nunca inyecta el service HTTP directamente ni se suscribe a nada.

Implementación de referencia: `injectMasterDataResource` en `libs/domain/master-data/.../master-data-resource.factory.ts` (ver `libs/domain/master-data/README.md`, Golden Path del repo). Skill `signal-trigger-pattern` (`.claude/skills/` y `.agents/skills/`) documenta el patrón completo con código.

**Alternativa rechazada:** `HttpClient` + RxJS `switchMap`/`.subscribe()` en el store — descartado porque reintroduce gestión manual de suscripciones y rompe la garantía zoneless (ver ADR-002).

## Consecuencias

### Positivas

- Cero suscripciones manuales que limpiar; `httpResource` gestiona su propio ciclo de vida.
- Refetch automático y predecible ante cambio de parámetros — sin `ngOnChanges` ni efectos manuales para refrescar.
- Testeable: el store expone estado derivado puro, sin mockear observables.

### Negativas

- Curva de aprendizaje para quien viene de RxJS clásico — requiere pensar en "trigger signal" en vez de "stream de eventos".
- `httpResource` es más reciente que `HttpClient`+RxJS; menos ejemplos de la comunidad para casos avanzados (cancelación fina, retry con backoff).

## Referencias

- `libs/domain/master-data/README.md`
- `.claude/skills/signal-trigger-pattern/SKILL.md`
- `docs/STATE_MANAGEMENT.md`

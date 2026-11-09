# ADR-025: Descomposición de `ExecutionService` por familias de endpoint

**Estado:** Aceptado
**Fecha:** 2026-11-05
**Autores:** Equipo INTAQALAB

---

## Contexto

`libs/domain/trial/execution/src/lib/services/execution.service.ts` concentra 2.750 líneas, 71 `httpResource`, 69 señales de parámetros, 22 mutaciones y 65 consumidores que lo inyectan. Agrupa responsabilidades que no comparten razón de cambio:

1. Contratos y modelos de la API de ejecución.
2. Catálogo de almacén (`munition-types`, `denominations`, `stock`).
3. Agregación de opciones de munición a partir de planificación y almacén.
4. Lecturas de estado, progreso y medidas de disparo.
5. Transiciones de ejecución y comandos.
6. Readiness de perfiles técnicos y preparación JLT.
7. Preferencias de widgets, selector de equipos y analítica.

La consecuencia es un archivo imposible de navegar, una spec monolítica de 2.037 líneas con un solo `TestBed`, conflictos de merge constantes y riesgo alto en cada cambio de widget. Además, los tipos declarados dentro del servicio son importados por features de `ExecutionStore`, lo que impide extraer servicios sin crear ciclos.

Restricciones duras identificadas:

- Alrededor de 40 componentes y 20 features de store dependen de la **misma instancia** de `ExecutionStore` y de la **identidad estable** de los recursos que leen (`isLoading()`, `value()`, `status()`, `error()`, `reload()`).
- ADR-003 (Signal Trigger Pattern) y ADR-020 exigen `httpResource` para GET y `HttpClient` para mutaciones.
- ADR-017 y ADR-019 prohíben duplicar consultas de planificación fuera de `@intaqalab/data-access-planning`.
- ADR-007 y ADR-010 ya establecieron que la API pública de la store y el shell no deben cambiar.

## Decisión

Descomponer `ExecutionService` en servicios de acceso a datos cohesionados por familia de endpoint, bajo `libs/domain/trial/execution/src/lib/data-access/execution/`, mediante una migración _strangler_ en cinco fases:

1. **Modelos y helpers puros primero.** Mover los tipos a `execution/models/*` y re-exportarlos desde `execution.service.ts`. Extraer `execution-endpoints.ts` (constructores puros de URL), `resource-await.ts` (espera de recursos con semántica literal) y mappers/selectores puros para espoleta y opciones de munición. Esto rompe la dependencia tipos → servicio y permite extraer código sin ciclos.
2. **Servicios por familia de disparo.** Una clase por familia (`shot-velocity`, `shot-pressure`, `shot-munition`, `shot-armament`, `shot-topography`, `shot-jlt-mao`, etc.) con su resource reactivo, su resource de fetch imperativo y sus mutaciones. Se preservan los dos resources existentes: unificarlos es un cambio de comportamiento reservado a otra decisión.
3. **Servicios transversales.** `ExecutionStateService`, `ExecutionTransitionService`, `SecurityCountdownService`, `ExecutionPlanningService`, `ExecutionReadinessService`, `JltPreparationService`, `WidgetPreferencesService`, `EquipmentSelectionService`, `PropellantChargeService`, `VelocityUniformityService`, `WarehouseCatalogService`, `PlanningMunitionOptionsService` y `ArmamentCatalogService`.
4. **Fachada temporal.** `ExecutionService` se reduce a una clase de delegación con referencias directas a los recursos de los nuevos servicios. La identidad de los recursos se conserva, por lo que ningún consumidor cambia y las 43 pruebas existentes siguen siendo el oráculo de comportamiento.
5. **Migración por lotes y retirada.** Los consumidores se migran por grupos (widgets de disparo, orientación y análisis, features del store, diálogos y shell) y la fachada se elimina al terminar. `src/index.ts` exporta explícitamente los servicios y conserva los tipos públicos.

Los nuevos servicios son `providedIn: 'root'` para no alterar el contexto de inyección de las features del store, que los inyectan dentro de `withComputed` y `withHooks`. Permanecen dentro de la misma librería Nx: no se crea un proyecto nuevo porque no existe un segundo consumidor de dominio y sí habría que añadir alias, tags y restricciones de frontera sin beneficio inmediato.

### Alternativas rechazadas

- **Migración big-bang de los 65 consumidores en un solo cambio.** Riesgo inaceptable y sin red de seguridad intermedia.
- **Nueva librería `data-access-execution`.** Duplicaría configuración Nx y fronteras sin un segundo consumidor; se reevaluará si aparece otro dominio interesado.
- **Un servicio por widget.** Multiplicaría instancias y rompería la sincronización y el cacheo compartido de recursos que hoy garantiza la instancia única.
- **Unificar los resources de UI y de fetch imperativo durante el refactor.** Cambia la semántica de cancelación y de espera; se pospone a una decisión específica.
- **Corregir de paso los PUT vía `httpResource`.** ADR-020 exige `HttpClient`, pero el cambio es de comportamiento y debe hacerse con su propia migración y pruebas.

## Consecuencias

### Positivas

- Cada archivo tiene una única razón de cambio y un tamaño manejable (objetivo: menos de 300 líneas por servicio).
- Los tipos dejan de depender del servicio: desaparecen los ciclos y los imports de consumidores se mantienen.
- Las 43 pruebas existentes se convierten en contrato de paridad; se trasladan a los specs de cada servicio sin reescribir aserciones.
- Las URLs se centralizan en constructores puros, testeables sin `TestBed` ni `HttpTestingController`.
- Los mappers de espoleta y de opciones de munición pasan a ser funciones puras con pruebas rápidas.
- La fachada temporal permite migrar consumidor a consumidor con compilación y pruebas verdes en cada lote.
- La incorporación de una nueva familia de disparo deja de tocar un archivo de 2.750 líneas.

### Negativas / Riesgos

- Aumenta el número de archivos y de puntos de inyección; se mitiga con una nomenclatura uniforme y un mapa explícito método → servicio.
- Los recursos deben exponerse por referencia, no mediante getters que construyan objetos nuevos; se cubre con un test de identidad en la fachada.
- La extracción de `awaitResource` debe conservar literalmente su filtro inicial y su `take(1)`; cualquier "mejora" altera carreras existentes.
- Los `vi.spyOn` sobre métodos de la fachada pueden dejar de interceptar llamadas internas; se auditan antes de cada extracción.
- La fachada puede perpetuar el _god-service_ si no se retira; el plan fija la retirada en la fase 5 y prohíbe nuevas inyecciones de `ExecutionService` desde la fase 4.
- Persisten deudas separadas: PUT vía `httpResource` (ADR-020) y `GET /planning/equipment/*` fuera de `data-access-planning` (ADR-017). Se documentan como fase 6 y no se mezclan con este refactor.

### Verificación

- `npx nx test execution` con el mismo número de pruebas verdes en cada fase.
- `npx nx lint execution` y `npm run check:planning-urls`.
- `bash tools/verify/verify.sh` completo antes de cerrar.
- Revisión de que `@intaqalab/execution` exporta los mismos símbolos y que ningún consumidor cambió en las fases 1 a 3.

## Referencias

- `docs/plans/execution-service-refactor-plan.md`
- `libs/domain/trial/execution/src/lib/services/execution.service.ts`
- `libs/domain/trial/execution/src/lib/data-access/`
- ADR-003 (Signal Trigger Pattern)
- ADR-006 (Master Data Golden Path)
- ADR-007 (Descomposición de `ExecutionStore`)
- ADR-010 (Shell de ejecución con fachada)
- ADR-017 (Capa de acceso a datos de Planning)
- ADR-019 (Helpers de lectura por disparo)
- ADR-020 (HttpClient para mutaciones)

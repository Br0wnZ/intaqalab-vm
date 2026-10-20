# ADR-017: Capa de acceso a datos de Planning compartida con Execution

**Estado:** Aceptada
**Fecha:** 2026-10-19
**Autores:** Equipo INTAQALAB (con asistente Codebuff)

## Contexto

Los widgets de la pantalla de Ejecución consumen datos introducidos en la fase de planificación
(series y disparos, condiciones de disparo, medidas, municiones y componentes, armamento y tarado)
mediante los GET de `planning-api.json` v1.3.0. Hoy:

- `libs/domain/trial/planning` es una lib _feature_ que encapsula sus servicios (`MeasuresService`,
  `MunitionsService`, `ShootingConditionsService`, `SeriesAndShotsService`, `ArmamentService`) y stores
  (`+state`) y **no los publica**: `src/index.ts` solo exporta rutas y permisos.
- Por tanto, `ExecutionService` (~2.000 líneas) re-declara los GET de planning con URLs hardcodeadas y
  duplica modelos del swagger fuera de la fuente única (p. ej. `propelling-charge-parameters.models.ts`).
- Los widgets inyectan `ExecutionService` (god-service) para leer datos de planificación y duplican entre
  ellos el patrón "series con sus disparos a partir de `globalNumber`".
- La referencia arquitectónica (ADR-006, `libs/domain/master-data`) exige separar `data-access` de `feature`.

Referencias: docs/plans/planning-data-access-helpers-plan.md, ADR-006, ADR-010 (facade execution shell).

## Decisión

Crear una nueva lib de acceso a datos **`libs/domain/trial/data-access-planning`** (alias
`@intaqalab/domain-trial-data-access-planning`) que se convierte en la única fuente de lectura de datos de
planificación para los dominios de planning y execution:

1. **Modelos únicos** extraídos de `apis/planning-api.json`: `SeriesResponse`, `Shot`,
   `TrialConditionsResponse`, `TrialMeasuresResponse`, `TrialMunitionsResponse`, `TrialArmamentResponse`,
   `PropellantChargeParametersResponse` y catálogos asociados. Quedan prohibidos los duplicados ad-hoc.
2. **Contexto de juicio compartido** `TrialContextService`: señal `{ centerId, fireTrialId }` alimentada una
   única vez por el shell/route de ejecución; todas las `httpResource` se disparan de ese contexto.
3. **Servicios query por familia de endpoint** (SRP/ISP): `PlanningSeriesService`,
   `PlanningConditionsService`, `PlanningMeasuresService`, `PlanningMunitionsService`,
   `PlanningArmamentService` y `PropellingChargeParametersService`, siguiendo el patrón vigente en planning
   (`httpResource` param-signal, `providedIn: 'root'`, imports de `@intaqalab/config`).
4. **Helpers puros e inyectables**: `injectTrialShots()` (series/disparos por `globalNumber`, única
   implementación del patrón duplicado en widgets), `planning-selectors.ts` (`getSeriesById`, `getShotById`,
   `getMeasuresForFamily`, `getMeasureByMagnitudeCode`, `getMunitionConfigByShotId`) y mappers con
   normalización de unidades (`DEFAULT_*`).
5. **Migración dirigida**: `ExecutionService` pierde sus GET de planning (delegación en la nueva capa; solo se
   conservan APIs y mutaciones de ejecución); los stores de execution se alimentan desde los servicios query
   y los widgets pasan a leer signals expuestas. Las mutaciones (PUT) permanecen en los stores/services de
   feature de planning.

## Consecuencias

**Positivas**

- Una sola fuente de verdad para los datos planificados y sus tipos (swagger).
- Reducción drástica de `ExecutionService` y desaparición de URLs de planning fuera de data-access
  (verificable con grep en revisión/CI).
- Widgets desacoplados del HTTP, testables con signals; reutilización directa en futuros dominios.
- Eliminación de la duplicación del feature-aspecto "series+disparos por `globalNumber`" vía `injectTrialShots()`.

**Negativas / Riesgos**

- Nueva dependencia de grafo (planning → data-access-planning ← execution); se vigila con reglas de
  module boundaries de Nx.
- Migración de ~23 widgets por lotes: Validators y testing específicos e incrementales por widget.
- Los endpoints derivados del backend (p. ej. `propelling-charge-parameters`) deben seguir la misma
  persistencia de contratos; cualquier cambio de API pasa primero por models/ de la nueva lib.

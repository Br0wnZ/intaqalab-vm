# Plan: Helpers reutilizables de acceso a datos de Planning para widgets de Execution

**Estado:** Fases 1–2 y 4 completadas (helper `formatShotLabel`, regla `check:planning-urls`, docs). Fase 3: execution migrado (GET de measures/series/conditions/munitions/armament/propelling delegan en data-access; etiquetas de disparo unificadas; código muerto eliminado). **Pendiente (PR aparte):** migrar los GET de la lib `planning` (feature) a data-access y adopción opcional de `injectTrialShots()` en widgets con lógica de fallback propia.
**Fecha:** 2026-10-19
**Ámbito:** `libs/domain/trial/execution` ← datos de `libs/domain/trial/planning` + `apis/planning-api.json` v1.3.0
**ADR asociado:** `docs/adrs/017-planning-trial-data-access-layer.md`

---

## 1. Problema

Los widgets de ejecución (`libs/domain/trial/execution/src/lib/execution/widgets/`) consumen datos introducidos
durante la planificación (series/disparos, condiciones de disparo, medidas, municiones y sus componentes)
provenientes de los GET de `planning-api.json`. Situación actual:

1. `libs/domain/trial/planning/src/index.ts` **no exporta** servicios ni stores: `MeasuresService`,
   `MunitionsService`, `ShootingConditionsService`, `SeriesAndShotsService`, `ArmamentService` y sus stores
   (`+state`) quedan privados; execution no puede reutilizarlos.
2. Consecuencia: `ExecutionService` (≈2.000 líneas) **duplica los GET de planning** con URLs hardcodeadas:
   - `GET /fire-trials/{id}/planning/series` (L1090)
   - `GET /fire-trials/{id}/planning/conditions` (L1105)
   - `GET /fire-trials/{id}/planning/munitions` (L680)
   - `GET /fire-trials/{id}/planning/armament` (L1938)
   - `GET /fire-trials/{id}/planning/measures` (vía `EquipmentPlanningService`)
   - `GET /fire-trials/{id}/planning/propelling-charge-parameters` (L1176/L1191)
3. Modelos duplicados fuera de la fuente única del swagger (p. ej.
   `execution/models/propelling-charge-parameters.models.ts` copiado de `planning-api.json`).
4. Los ~23 widgets inyectan `ExecutionService` (god-service) para leer datos de planificación → acoplamiento
   invertido: execution reimplementa planning en vez de consumir una capa común de acceso a datos.
5. El código del patrón "series con sus disparos por `globalNumber`" está duplicado en muchos widgets
   (selectores de disparo).

## 2. Requisitos funcionales (fuente: funcional + API)

- Widgets de _Introducción de datos_: magnitudes/registros definidos en planificación (`GET /planning/measures`),
  agrupadas por familia funcional (Topografía, Balística, Municiones, Armamento) y filtradas por perfil.
- Selector de serie y disparo para todos los widgets de introducción (base: `globalNumber` del `GET
/planning/series`, o `GET /planning/conditions` que ya trae los disparos agrupados por serie).
- Estado del disparo (ejecutado / en curso / pendiente).
- Información Tarado / Gráficas de tarado: `GET /planning/propelling-charge-parameters` + `maximumSpeedDeviation`
  de la medida `BAL_INITIAL_VELOCITY` planificada (`GET /planning/measures`).
- Seguimiento / Armamento / Municiones: `GET /planning/armament` y `GET /planning/munitions`
  (configuraciones, componentes y datos de component-detail-form).
- Criterios STANAG: `GET /planning/stanag-criteria` (service ya existente en planning).

## 3. Arquitectura propuesta

> Principio: los **GET/readonly** viven en una capa de acceso a datos compartida; los **PUT** (mutaciones de
> formulario) se quedan con los componentes feature de planning; execution consume **selectores derivados
> (signals)** vía stores, nunca HTTP.

```
libs/domain/trial/data-access-planning/        (nueva lib Nx, alias @intaqalab/domain-trial-data-access-planning)
└── src/
    ├── index.ts                               (exports públicos)
    └── lib/
        ├── models/                            (tipos ÚNICOS desde apis/planning-api.json)
        ├── context/trial-context.service.ts   (signal {centerId, fireTrialId} inyectada 1 vez por shell/route)
        ├── queries/                           (1 servicio query por familia de endpoint — httpResource + signals)
        │   ├── planning-series.service.ts     (series + disparos)
        │   ├── planning-conditions.service.ts (condiciones físicas por disparo)
        │   ├── planning-measures.service.ts   (medidas por serie y familia)
        │   ├── planning-munitions.service.ts  (configuraciones + componentes)
        │   ├── planning-armament.service.ts
        │   └── propelling-charge-parameters.service.ts (derivado, widget 9)
        ├── helpers/
        │   ├── inject-trial-shots.ts          (⭐ series+disparos por globalNumber — 1 sola fuente)
        │   └── planning-selectors.ts          (getSeriesById, getShotById, getMeasureByMagnitudeCode, ...)
        └── mappers/                           (transformación backend→widgets, defaults de unidades DEFAULT_*)
```

## 4. Fases

### Fase 0 — Inventario

Tabla widget ↔ endpoint ↔ campos. Ya borrador disponible; se confirma widget a widget al migrar.

### Fase 1 — Lib data-access

- Scaffold `libs/domain/trial/data-access-planning` con el generador Nx (igual que libs existentes).
- Modelos extraídos del swagger como fuente única.
- `TrialContextService`: `signal<{centerId; fireTrialId} | null>`; la alimenta el shell de ejecución
  (`toSignal` de parámetros de ruta o resolver). Todas las queries se disparan de ese contexto compartido:
  sin parámetros por widget.
- Servicios query con patrón ya existente en planning (`httpResource` param-signal, `providedIn: 'root'`).

### Fase 2 — Helpers y `injectTrialShots`

- `injectTrialShots()` (helper de inyección):
  - Devuelve `signal<Series shots>` a partir de `PlanningSeriesService` (GET `/planning/series`) o
    `PlanningConditionsService` (GET `/planning/conditions`) — quien ya esté cargado en la vista.
  - API: `injectTrialShots()` → `TrialShotsHandle` con `series` (todas con sus disparos),
    `allShots` (plano, `globalNumber` asc), `findShot(shotId)`, `currentShot()`.
- `planning-selectors.ts`: funciones puras (`getSeriesById`, `getShotById`, `getMeasuresForFamily`,
  `getMeasureByMagnitudeCode`, `getMunitionConfigByShotId`), defaults de unidades (`DEFAULT_*`).
- Tests Vitest + ATL con fixtures de los ejemplos del swagger. Cero `any`, cero `!`.

### Fase 3 — Migración

1. Planning: feature components migran a la capa data-access (GET); stores/PUT se quedan en planning.
2. `ExecutionService`: eliminar GETs duplicados; delega en data-access; solo quedan writes de ejecución.
3. Widgets: migración por lotes (tarado → datos introducidos → armamento/munición → orientación/radar);
   los widgets puros leen signals; los inject-*-equipments usan `PlanningMeasuresService`.
4. Selectores de disparo de widgets reemplazados por `injectTrialShots()`.

### Fase 4 — Residualidad

- Regla de tráfico `/planning/`: cero URLs fuera de data-access (grep CI).
- `WIDGET_SYSTEM.md` + `docs/ARCHITECTURE.md` actualizados.
- Verificación: `npx nx test <proyecto>` y lint; cero `any`/`!`.

## 5. Mapeo SOLID

| Principio | Aplicación                                                                 |
| --------- | -------------------------------------------------------------------------- |
| SRP       | 1 servicio query por familia de endpoint; models/mappers/helpers separados |
| OCP       | Nuevo endpoint de planning = nuevo recurso + selector; widgets sin cambios |
| LSP / ISP | Interfaces mínimas por dominio (condiciones ≠ medidas ≠ munición)          |
| DIP       | Widgets y stores dependen de signals expuestas, no de HTTP                 |

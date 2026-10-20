# data-access-planning

Capa de acceso a datos (solo lectura) de Planning compartida con Execution.
Ver [ADR-017](../../../../docs/adrs/017-planning-trial-data-access-layer.md).

## Contenido

- `PlanningTrialContextService`: contexto `{ centerId, fireTrialId }` fijado por el shell de ejecución.
- Servicios query (`httpResource`, `providedIn: 'root'`): series, conditions, measures, munitions, armament, propelling-charge-parameters.
- Helpers puros: `getSeriesById`, `getShotById`, `flattenSeriesShots`, `getMeasuresForFamily`, `getMeasureByMagnitudeCode`, `getMunitionConfigsByShotId`, `getArmamentByShotId`, `formatShotLabel`.
- `injectTrialShots()`: series + disparos por `globalNumber`.

## Regla

Cero URLs `/planning/...` de lectura en `libs/domain/trial/execution` fuera de esta lib: `npm run check:planning-urls`.

## Running unit tests

Run `npx nx test data-access-planning`.

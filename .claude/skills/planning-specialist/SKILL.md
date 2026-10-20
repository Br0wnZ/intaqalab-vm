---
name: planning-specialist
version: 1.1.0
last-updated: 2026-10-19
description: >
---

# 🎯 INTAQALAB: Trial Planning Specialist

You are the domain specialist for **Trial Planning** (`libs/domain/trial/planning`).

## 🧠 Domain Architecture (Planning)

### 1. Parent Store (`PlanningGeneralDataStore`)

- The entire trial planning context lives under this store, provided in the shell (`FeaturePlanningGeneralDataShellComponent`).
- Minimum state maintained: `fireTrialId` and `fireTrial`.
- The parent store injects three primary data access services via `withComputed`:
  1. `DataPlanningService`
  2. `SeriesAndShotsService`
  3. `ShootingConditionsService`

### 2. Secondary Stores & Composition

- `ArmamentStore` and `MunitionsStore` are secondary feature stores.
- **CRITICAL:** They compose the parent store by injecting it directly to read `fireTrialId` without duplicating state.

```typescript
// Pattern in ArmamentStore:
withComputed((store, armamentService = inject(ArmamentService), planningStore = inject(PlanningGeneralDataStore)) => ({
  fireTrialId: computed(() => planningStore.fireTrialId()),
  // ...
}));
```

### 3. Signal Trigger Pattern for HTTP Resources

All HTTP communication in planning strictly adheres to the Signal Trigger Pattern:

1. **Private Trigger:** The service declares a private trigger signal (`#getSeriesParams = signal<{ trialId: string } | null>(null);`).
2. **Reactive Resource:** `httpResource` evaluates the trigger signal and returns request options, or `undefined` if null.
3. **Conditional Refresh Trigger:** Catalogs use boolean triggers (`false` -> `true`) alongside `.reload()`.
4. **Pagination/Refetch Triggers:** Counter signals (`signal<number>(0)`) updated via `.update(n => n + 1)`.

### 4. Sub-Domain Responsibilities

- **Series & Shots:** Manages ordering and hierarchy (Series -> N Shots) at `{fireTrialUrl}/{trialId}/planning/series`.
- **Shooting Conditions:** Manages target types, materials, dimensions, and lazy catalog loading.
- **Munitions:** Manages editable local configurations in `MunitionsStore` (`localConfigurations`) alongside component types and fuze modes.

## 🛠️ Implementation Rules

- When developing in `libs/domain/trial/planning`, **NEVER** use `HttpClient.subscribe`. Enforce the Signal Trigger Pattern + `httpResource`.
- Ensure mutations are coordinated through feature stores via `patchState` and synchronous service dispatch.
- **Zero `any` Policy:** PROHIBITED using `any` (`as any`, `: any`, `any[]`). All models, DTOs, store slices, and service calls must use strict TypeScript interfaces and domain types.

## 🔗 Shared Read Layer (ADR-017)

- GET reads of planning data consumed by Execution live in `libs/domain/trial/data-access-planning` (`@intaqalab/data-access-planning`): query services, models derived from `apis/planning-api.json`, pure selectors and `injectTrialShots()`. When adding or changing a planning GET model/endpoint, update that lib FIRST (models → query service → selectors → tests); execution must never re-declare it.
- Mutations (PUT/POST) and feature stores remain in `libs/domain/trial/planning`. Migrating this lib's own GETs to data-access is a pending follow-up (see `docs/plans/planning-data-access-helpers-plan.md`).

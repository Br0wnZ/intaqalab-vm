---
name: execution-domain-expert
version: 1.0.5
last-updated: 2026-10-15
description: Expert in the INTAQALAB execution domain, widgets, shot selectors, stores, API integration, and lifecycle.
---

# 🎯 Execution Domain Expert

> **Mandatory Golden Path:** ALWAYS read `libs/domain/master-data/README.md` before writing code.
> Every implementation must follow the approved patterns documented there.

---

## 📐 Domain Architecture

## 📏 Measurement Unit & Strict Typing Rules (Mandatory)

- All measurement units in the Execution domain must use `MeasureUnitEnum` from `@intaqalab/models`.
- Hardcoded unit strings (`'g'`, `'kg'`, `'MPa'`, `'bar'`, etc.) are prohibited in components, stores, and services.
- For unit labels and selectors, use `MEASURE_UNIT_LABELS` and specific subtypes (`WeightUnitEnum`, `PressureUnitEnum`, `DistanceUnitEnum`, `TimeUnitEnum`, etc.) from the shared models package.
- **Strict Typing (Zero `any`):** 🚫 **PROHIBITED:** using `any` (e.g. `as any`, `: any`, `any[]`). All payload types, response types, store slices, mappers, and unit transformations MUST use explicit TypeScript types and enums from `@intaqalab/models` or local models.
- **Forbidden Non-Null Assertions (Zero `!`):** 🚫 **PROHIBITED:** using non-null assertions (`!`, `@typescript-eslint/no-non-null-assertion`). All methods in `ExecutionService` MUST use `#awaitResourceValue(resource)` instead of `resource.value()!`. In data mapping or store features, use `flatMap()` or explicit type guards.

### Root Directory Structure

```
libs/domain/trial/execution/src/lib/
├── +state/
│   └── execution.store.ts        ← Central store
├── execution/
│   └── models/                   ← Local domain types
├── services/
│   └── execution.service.ts      ← HTTP data-access service
├── stores/                       ← Feature stores per widget
└── execution.routes.ts
```

### API Base URL Pattern

```
/centers/{centerId}/fire-trials/{fireTrialId}/execution/...
```

`centerId` and `fireTrialId` are required UUID path parameters for all execution endpoints.
Use `injectExecutionEndpoint()` from `@intaqalab/config` to construct the base URL.

---

## 🗂️ API Endpoints Summary (`apis/execution-api.json`)

### Tag: Execution State

| operationId               | Method | Path                          | Body | Successful Response             |
| ------------------------- | ------ | ----------------------------- | ---- | ------------------------------- |
| getExecutionState         | GET    | /execution/state              | —    | ExecutionStateResponse (200)    |
| getExecutionProgress      | GET    | /execution/progress           | —    | ExecutionProgressResponse (200) |
| getSecurityCountdownState | GET    | /execution/security-countdown | —    | SecurityCountdownResponse (200) |

### Tag: Execution Transitions

| operationId             | Method | Path                          | Body                        | Successful Response             |
| ----------------------- | ------ | ----------------------------- | --------------------------- | ------------------------------- |
| startExecution          | POST   | /execution/start              | —                           | 204                             |
| pauseExecution          | POST   | /execution/pause              | —                           | 204                             |
| interruptExecution      | POST   | /execution/interrupt          | TransitionWithReasonRequest | 204                             |
| resumeExecution         | POST   | /execution/resume             | —                           | 204                             |
| cancelExecution         | POST   | /execution/cancel             | TransitionWithReasonRequest | 204                             |
| finishExecution         | POST   | /execution/finish             | —                           | ExecutionFinishResponse (200)   |
| updateSecurityCountdown | PUT    | /execution/security-countdown | SecurityCountdownRequest    | SecurityCountdownResponse (200) |

### Tag: Execution Readiness

| operationId               | Method | Path                                                      | Description                                                                                   |
| ------------------------- | ------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| getProfilesReadiness      | GET    | /execution/readiness                                      | Role-filtered readiness. Returns ProfilesReadinessResponse                                    |
| setSeriesProfileReadiness | PUT    | /execution/readiness/profiles/{profile}/series/{seriesId} | Individual series profile readiness update (called once per series; no batch/legacy endpoint) |

Profiles enum: `VELOCITIES`, `PRESSURES`, `VIDEO`, `TRAJECTOGRAPHY`, `MUNITIONS`, `ARMAMENT`.

---

## 🔄 Trial State Machine

```
PLANNED ──startExecution──► IN_PROGRESS ──pauseExecution──► PAUSED
                                │                                │
                                ├──interruptExecution──► INTERRUPTED ──resumeExecution──► IN_PROGRESS
                                │
                                ├──cancelExecution──► CANCELED
                                │
                                └──finishExecution──► FINISHED
```

**KEY RULE:** Transition endpoints return 204 without body (except `finishExecution` which returns `ExecutionFinishResponse`). Following any transition, the store MUST reload `getExecutionState` and `getExecutionProgress`.

---

## 📌 Widget Lifecycle & Save Architecture

All Execution Grid widgets extend `BaseFormWidgetComponent`:

- **Automatic Registration:** `BaseFormWidgetComponent` registers with `WidgetStateService` on init and unregisters on destroy.
- **Initial Fetch:** On initialization, the widget auto-selects active series/shots and executes the GET request to populate initial data.
- **Value-Based Dirty Tracking:** Never rely on sticky `form().dirty()`. Use `createDirtyTracker` + `deepEqual` from `@intaqalab/utils` comparing editable form fields against the baseline snapshot.
- **Form Touch Directive (`FormTouchDirective`):** Use `intaFormTouch` on host containers to capture real user `focusout` events rather than programmatic patches.
- **Selection Race Condition Guard (`createSelectionGuard`):** Discard stale responses when rapidly switching series/shots during in-flight GET requests.
- **Save Execution (`saveForm`):** Parent header triggers `WidgetStateService.saveAllDirtyForms()`, running `saveForm()` across all dirty widgets concurrently (`Promise.all`). Each widget awaits the HTTP mutation, syncs its baseline snapshot on success, and rethrows on error.
- **Autonomous Widgets (`autonomousWidgets` / `updatedAt` Opt-Out):**
  - `withGeneralData` in `ExecutionStore` tracks a `Set<WidgetId>` (`autonomousWidgets`, initialized with `DEFAULT_AUTONOMOUS_WIDGETS = [WidgetId.SEGUIMIENTO]`) and exposes `registerAutonomousWidget(widgetId)`, `unregisterAutonomousWidget(widgetId)`, and `isWidgetAutonomous(widgetId)`.
  - Widgets that must NOT auto-refresh or reset their local state when `GET /execution/state` returns a new `updatedAt` declare `protected override readonly autonomousWidgetType = WidgetId.<ID>;` in their `BaseFormWidgetComponent` subclass (e.g., `SeguimientoWidget` with `WidgetId.SEGUIMIENTO`).
  - `BaseFormWidgetComponent` automatically registers/unregisters `autonomousWidgetType` in `ExecutionStore` during its lifecycle, and `withGeneralData` / widget effects check `store.isWidgetAutonomous(widgetId)` before triggering `updatedAt`-driven refreshes.

## 📝 Observation Textareas (Mandatory)

- Every multiline observations field in an Execution widget MUST use `!resize-none` on its `<textarea>` so the browser resize handle stays hidden, whether the field uses `mat-form-field` or a custom wrapper.
- Preserve other classes when adding `!resize-none`. Apply this across every widget and tab; plain `resize-none` does not satisfy the rule.

## 🔢 Shot Selector Numbering

- Every execution widget with a shot selector MUST build its options with `buildDisparoOptions` from `libs/domain/trial/execution/src/lib/execution/widgets/utils/selection-options.ts` inside a `computed`.
- Pass the current `selectorFormModel().serie` as `selectedSerie`, plus the store's `executionProgress()`, `planningSeries()`, and that widget's stored `disparoOptions` as `storedOptions`.
- The utility scopes progress and planning shots to `selectedSerie`, prefers progress shot IDs while resolving labels from planning `globalNumber` by matching shot ID, falls back to that selected series' planning shots, then to stored options. Do not duplicate this branching or use a whole-trial flat list to build per-series selector options.
- `index + 1` is only a fallback for legacy or incomplete shot data with no `globalNumber`.
- Do not default a missing active shot to `disparoOptions()[0]` in an effect. Since options react to selected series, that fallback can keep resetting selection to the first shot. Initialize from real `activeSerieId` and `activeShotId` only; add any product default explicitly in a separate initialization path.

## 🏷️ Selected Shot Status

- Any execution widget that displays shot status MUST derive it from `executionProgress` using the currently selected series ID and shot ID. Recompute status whenever either selection changes; never display a feature-local `estadoDisparo` as if it belonged to every shot.
- If selected series and shot match `activeSerieId` and `activeShotId`, display `EN_CURSO`. Otherwise map progress status `ACTIVE` → `EN_CURSO`, `PENDING` → `PENDIENTE`, and `FIRED` → `EJECUTADA`.
- Use feature-local `estadoDisparo` only as a fallback when selected shot has no matching progress entry.

## ⚙️ Equipment Assignment & Widget Consumption (Functional 4.3)

- **Two-Layer Architecture:**
  - **Ephemeral Dialog State (`EquipmentSelectorStore`):** Local store inside `EquipmentSelectorDialog`. Resolves planned measures (`EquipmentPlanningService`) and displays only tags matching both:
    1. Authorized by user's technical unit role (`resolveVisibleEquipmentTags`).
    2. Planned in the trial (`enabledTagIds`).
    - **Zero Disabled Chips Rule:** Unplanned or unauthorized tags MUST NOT be rendered in the UI (do not render disabled chips).
  - **Global Trial State (`ExecutionStore.withEquipmentSelector`):** Stores persisted assignments (`equipments` and `selections`).
- **Header Button Guard:**
  - If user roles have 0 visible tags (`canSelectEquipment() === false`), the "Selector equipos" button in `ExecutionHeader` is disabled (`[disabled]="!canSelectEquipment()"`), and `openEquipmentSelector()` guards execution.
- **Persistence & Synchronization Flow:**
  - On dialog save, `ExecutionPageFacadeService` calls `store.updateEquipmentSelections(equipments)`.
  - `updateEquipmentSelections` executes `PUT /equipment-selection` and immediately patches local state.
  - An `effect` in `withEquipmentSelector` watches for `updateEquipmentSelectorResource.status() === 'resolved'` and automatically re-fetches `GET /equipment-selection`, updating `equipmentSelectorRemote()`.
- **Widget Consumption:**
  - Widgets inject `ExecutionStore` privately (`readonly #store = inject(ExecutionStore)`).
  - Available signals:
    - `store.equipmentSelector().equipments`: Grouped by tag (`EquipmentMagnitudeSelectionGroup[]`).
    - `store.equipmentSelector().selections`: Flattened array (`EquipmentItemSelection[]` with `itemId`, `categoryId`, `series`, `disparos`, `magnitude`, `channel`).
    - `store.equipmentSelectorRemote()`: Raw HTTP resource.
  - Filter by active series/shot:
    ```typescript
    readonly activeEquipments = computed(() => {
      const serieId = this.#store.activeSerieId();
      const shotId = this.#store.activeShotId();
      return this.#store.equipmentSelector().selections.filter(
        (sel) => sel.series.includes(serieId) && sel.disparos.includes(shotId)
      );
    });
    ```

---

## 🧪 Testing Guidelines (Vitest + ATL)

1. Prohibit `querySelector('.mat-*')`; use Component Harnesses.
2. Use accessible queries (`screen.getByRole`) and `userEvent` from `@testing-library/angular`.
3. Use `provideMockStore()` to isolate stores in component tests.
4. Verify `httpMock.verify()` in `afterEach()` in all service tests.
5. All test descriptions (`it()`) MUST be written in English.

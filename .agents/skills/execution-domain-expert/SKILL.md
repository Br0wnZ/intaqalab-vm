---
name: execution-domain-expert
description: >
  Agente experto en el dominio de Ejecución de Ensayos de Fuego (libs/domain/trial/execution).
  Conoce la arquitectura completa: API Swagger (execution-api.json), máquina de estados,
  patrones httpResource + Signal Trigger, ExecutionStore, mock-server Express y tests Vitest+ATL.
  Actívalo cuando el desarrollo involucre servicios, stores, mocks o tests de
  libs/domain/trial/execution o apps/mock-server relacionados con la ejecución.

  Palabras clave de activación: ejecución, execution, disparo, readiness,
  cuenta de seguridad, transición de estado, execution store, ExecutionService,
  ExecutionStore, mock execution, test execution, widget ejecución.
---

# 🎯 Execution Domain Expert

> **Golden Path Mandatorio:** Lee SIEMPRE `libs/domain/master-data/README.md` antes de escribir código.
> Toda implementación debe seguir los 4 patrones aprobados documentados allí.

---

## 📐 Contexto del Dominio

## 📏 Regla de Unidades (Obligatoria)

- Todas las unidades de medida del dominio Execution deben usar `MeasureUnitEnum` de `@intaqalab/models`.
- Prohibido introducir strings de unidad hardcodeados (`'g'`, `'kg'`, `'MPa'`, `'bar'`, etc.) en componentes, stores o servicios.
- Para selectores/labels de unidad usa `MEASURE_UNIT_LABELS` y subtipos (`WeightUnitEnum`, `PressureUnitEnum`, etc.) del paquete de modelos compartidos.

### Ruta raíz

```
libs/domain/trial/execution/src/lib/
├── +state/
│   └── execution.store.ts        ← Store central (3100+ líneas de estado)
├── execution/
│   └── models/                   ← Tipos locales del dominio
├── services/
│   └── execution.service.ts      ← Servicio HTTP (parcialmente implementado)
├── stores/                       ← Sub-stores por widget
└── execution.routes.ts
```

### API Base URL Pattern

```
/centers/{centerId}/fire-trials/{fireTrialId}/execution/...
```

`centerId` y `fireTrialId` son UUID path params requeridos en TODOS los endpoints.
Usa `injectExecutionEndpoint()` de `@intaqalab/config` para construir la URL base.

---

## 🗂️ Endpoints de la API (execution-api.json completo)

### Tag: Execution State

| operationId               | Método | Path                          | Body | Respuesta exitosa               |
| ------------------------- | ------ | ----------------------------- | ---- | ------------------------------- |
| getExecutionState         | GET    | /execution/state              | —    | ExecutionStateResponse (200)    |
| getExecutionProgress      | GET    | /execution/progress           | —    | ExecutionProgressResponse (200) |
| getSecurityCountdownState | GET    | /execution/security-countdown | —    | SecurityCountdownResponse (200) |

### Tag: Execution Transitions

| operationId             | Método | Path                          | Body                        | Respuesta exitosa               |
| ----------------------- | ------ | ----------------------------- | --------------------------- | ------------------------------- |
| startExecution          | POST   | /execution/start              | —                           | 204                             |
| pauseExecution          | POST   | /execution/pause              | —                           | 204                             |
| interruptExecution      | POST   | /execution/interrupt          | TransitionWithReasonRequest | 204                             |
| resumeExecution         | POST   | /execution/resume             | —                           | 204                             |
| cancelExecution         | POST   | /execution/cancel             | TransitionWithReasonRequest | 204                             |
| finishExecution         | POST   | /execution/finish             | —                           | ExecutionFinishResponse (200)   |
| updateSecurityCountdown | PUT    | /execution/security-countdown | SecurityCountdownRequest    | SecurityCountdownResponse (200) |

### Tag: Execution Planning (x-mvp: false — no priorizar en MVP)

| operationId               | Método | Path                        |
| ------------------------- | ------ | --------------------------- |
| getExecutionPlanning      | GET    | /execution/planning         |
| updateExecutionPlanning   | PUT    | /execution/planning         |
| getExecutionPlanningState | GET    | /execution/planning/state   |
| approveExecutionPlanning  | POST   | /execution/planning/approve |

### Tag: Execution Readiness

| operationId          | Método | Path                                    | Descripción                                          |
| -------------------- | ------ | --------------------------------------- | ---------------------------------------------------- |
| getProfilesReadiness | GET    | /execution/readiness                    | Filtra según rol. Responde ProfilesReadinessResponse |
| setProfileReadiness  | PUT    | /execution/readiness/profiles/{profile} | Solo series en estado PENDING                        |

Profiles enum: VELOCITIES, PRESSURES, VIDEO, TRAJECTOGRAPHY, MUNITIONS, ARMAMENT

### Tag: Execution Preferences

| operationId                          | Método | Path                                    |
| ------------------------------------ | ------ | --------------------------------------- |
| getExecutionPreferencesByRole        | GET    | /execution/preferences/roles/{roleName} |
| updateExecutionPreferencesByRole     | PUT    | /execution/preferences/roles/{roleName} |
| getExecutionPreferencesByUsername    | GET    | /execution/preferences/users/{username} |
| updateExecutionPreferencesByUsername | PUT    | /execution/preferences/users/{username} |

Roles enum: HEAD_ARMAMENT_UNIT, TECH_ARMAMENT_UNIT, HEAD_BALLISTICS_UNIT, TEACH_BALLISTICS_UNIT,
HEAD_PLANNING_ANALYSIS_UNIT, TECH_ANALYSIS_UNIT, HEAD_SHOOTING_LINE

### Tag: Equipment Selection

| operationId              | Método | Path                           | Descripción                         |
| ------------------------ | ------ | ------------------------------ | ----------------------------------- |
| getEquipmentSelection    | GET    | /execution/equipment-selection | Devuelve EquipmentSelectionResponse |
| updateEquipmentSelection | PUT    | /execution/equipment-selection | Reemplaza selección completa        |

EquipmentTypeEnum: DOPPLER_RADAR, TRAJECTOGRAPHY_RADAR, ANTENNA, PIEZOELECTRIC_SENSOR,
AMPLIFIER, SOUND_LEVEL_METER, CONVENTIONAL_CAMERA, HIGH_SPEED_CAMERA, TRACE_RULER,
CHRONOMETER, BALANCE, CLIMATIC_CHAMBER, PRESSURE_GAUGE, CRUSHER, PROBE

---

## 🔄 Máquina de Estados del Ensayo

```
PLANNED ──startExecution──► IN_PROGRESS ──pauseExecution──► PAUSED
                                │                                │
                                ├──interruptExecution──► INTERRUPTED ──resumeExecution──► IN_PROGRESS
                                │
                                ├──cancelExecution──► CANCELED
                                │
                                └──finishExecution──► FINISHED
```

REGLA CLAVE: Los endpoints de transición devuelven 204 sin body (excepto finishExecution
que devuelve ExecutionFinishResponse). Tras cualquier transición, el store DEBE
refrescar getExecutionState y getExecutionProgress.

---

## 🏗️ Patrones de Implementación (Golden Path)

### 1. Signal Trigger Pattern para httpResource (READ)

```typescript
// ✅ CORRECTO — Signal Trigger Pattern
import { httpResource } from '@angular/common/http';
import { signal } from '@angular/core';

export function injectExecutionStateResource(baseUrl: string) {
  const _trigger = signal(0); // trigger de recarga

  const stateResource = httpResource<ExecutionStateResponse>(() => {
    _trigger(); // subscripción reactiva al trigger
    return {
      url: `${baseUrl}/state`,
      method: 'GET',
    };
  });

  return {
    stateResource,
    reload: () => _trigger.update((v) => v + 1),
  };
}
```

### 2. Signal Trigger Pattern para mutaciones (POST/PUT sin body esperado)

```typescript
// ✅ CORRECTO — Transiciones de estado con httpResource
const _startTrigger = signal<true | null>(null);

const startResource = httpResource<void>(() => {
  if (!_startTrigger()) return undefined;
  return { url: `${baseUrl}/start`, method: 'POST' };
});

// Exponer como método
const startExecution = () => _startTrigger.set(true);
```

### 3. Sincronización Store tras mutación

En el withHooks del store, usar effect() para detectar éxito del resource mutante
y disparar reload de los resources de lectura:

```typescript
withHooks({
  onInit(store) {
    // Sincronización automática: estado API → store signals
    effect(() => {
      const state = store.executionStateResource.value();
      if (state) {
        patchState(store, {
          activeSerieId: state.activeSeriesId,
          activeShotId: state.activeShotId,
        });
      }
    });

    // Reload tras transición exitosa
    effect(() => {
      const code = store.startResource.statusCode();
      if (code === 204) {
        store.executionStateResource.reload();
        store.progressResource.reload();
      }
    });
  },
});
```

### 4. Utilidades `@intaqalab/utils` para el dominio de ejecución

Utilidades propias ya implementadas (guía completa: `docs/UTILITIES.md`) — úsalas, no las reimplementes:

```typescript
import {
  computedPrevious,
  createCountdown,
  explicitEffect,
  injectNetworkStatus,
  injectPageVisibility,
} from '@intaqalab/utils';

// Cuenta de seguridad (updateSecurityCountdown) — pausable, sin drift:
readonly safetyCount = createCountdown(30_000);
// safetyCount.start() / pause() / resume() / reset()
// template: safetyCount.remainingMs(), safetyCount.finished()

// Detectar transiciones de la máquina de estados:
readonly previousStatus = computedPrevious(this.store.executionStatus);
readonly resumedFromPause = computed(
  () => this.previousStatus() === 'PAUSED' && this.store.executionStatus() === 'IN_PROGRESS',
);

// Pausar polling de state/progress con la pestaña en background:
readonly pageVisible = injectPageVisibility();
explicitEffect([this.pageVisible], ([visible]) =>
  visible ? this.store.startPolling() : this.store.stopPolling(),
);

// Deshabilitar transiciones sin conectividad:
readonly online = injectNetworkStatus();
```

`explicitEffect` es la forma preferida para los effects de sincronización del punto 3: dependencias explícitas + cuerpo `untracked` = imposible crear dependencias accidentales.

---

## 🔑 Tabla de Sincronización Store ↔ API (CRÍTICO)

| Evento API                   | Acción en Store                             | Reload requerido    |
| ---------------------------- | ------------------------------------------- | ------------------- |
| getExecutionState OK         | patchState({ activeSerieId, activeShotId }) | Polling o manual    |
| getExecutionProgress OK      | Actualizar árbol series+disparos            | Polling o manual    |
| startExecution 204           | —                                           | state + progress    |
| pauseExecution 204           | —                                           | state               |
| interruptExecution 204       | —                                           | state               |
| resumeExecution 204          | —                                           | state + progress    |
| cancelExecution 204          | —                                           | state               |
| finishExecution 200          | Patch finishedAt                            | state               |
| updateSecurityCountdown 200  | Patch countdown                             | Sí                  |
| setProfileReadiness 200      | Patch techUnits[]                           | readiness           |
| updateEquipmentSelection 200 | —                                           | equipment selection |

### Anti-patrones prohibidos

```typescript
// ❌ PROHIBIDO — subscribe en store
this.http.post(url, body).subscribe(r => patchState(store, r));

// ❌ PROHIBIDO — HttpClient directo en componentes
inject(HttpClient).get(url).subscribe(...);

// ❌ PROHIBIDO — effect con await dentro sin leer señales primero
effect(async () => {
  await somePromise(); // señales deben leerse ANTES del primer await
});
```

---

## 🧪 Reglas de Testing (Vitest + ATL)

### Estructura de archivos de test

Ubicar specs junto al archivo testeado (convención del proyecto):

- `execution.service.spec.ts` junto a `execution.service.ts`
- `execution.store.spec.ts` junto a `execution.store.ts`

### Plantilla test de servicio HTTP

```typescript
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ExecutionService } from './execution.service';

describe('ExecutionService', () => {
  let service: ExecutionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExecutionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExecutionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debería cargar el estado de ejecución', () => {
    const mockState = {
      status: 'IN_PROGRESS',
      activeSeriesId: 'serie-1',
      activeShotId: 'shot-1',
      updatedAt: '2026-03-03T10:15:30Z',
    };

    // Trigger del resource (acceso para provocar la request)
    expect(service.stateResource.value()).toBeUndefined();

    const req = httpMock.expectOne((r) => r.url.includes('/execution/state'));
    expect(req.request.method).toBe('GET');
    req.flush(mockState);

    expect(service.stateResource.value()).toEqual(mockState);
  });
});
```

### Plantilla test del store

```typescript
import { TestBed } from '@angular/core/testing';

import { ExecutionStore } from './execution.store';

describe('ExecutionStore', () => {
  let store: InstanceType<typeof ExecutionStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExecutionStore],
    });
    store = TestBed.inject(ExecutionStore);
  });

  it('debería inicializarse con fireTrialId null', () => {
    expect(store.fireTrialId()).toBeNull();
  });

  it('debería actualizar activeSerieId al recibir estado de la API', () => {
    // Simular patchState desde el servicio
    // (usar patchState en tests de integración o mock del service)
  });
});
```

### Reglas de testing del módulo execution

1. PROHIBIDO querySelector('.mat-\*') — usar Component Harnesses.
2. Usa screen.getByRole, userEvent de @testing-library/angular para interacciones.
3. Usa provideMockStore para aislar el store en tests de componente.
4. Verifica httpMock.verify() en afterEach en TODOS los tests de servicio.
5. Tests de transiciones de estado: verificar que statusCode() del resource trigger
   provoca el reload de los resources dependientes.

---

## 🖥️ Mock Server Express — Estructura y Fixtures

### Ubicaciones

```
apps/mock-server/src/
├── routes/execution/
│   ├── execution-state.routes.ts      ← GET state, GET progress, GET+PUT security-countdown
│   ├── execution-transitions.routes.ts ← POST start/pause/interrupt/resume/cancel/finish
│   ├── execution-readiness.routes.ts  ← GET+PUT readiness
│   ├── execution-preferences.routes.ts ← GET+PUT roles y users
│   └── execution-equipment.routes.ts  ← GET+PUT equipment-selection
└── fixtures/execution/
    ├── execution-state.fixture.json
    ├── execution-progress.fixture.json
    ├── security-countdown.fixture.json
    ├── profiles-readiness.fixture.json
    ├── widget-preferences.fixture.json
    └── equipment-selection.fixture.json
```

### Plantilla de router Express

```typescript
import { Router } from 'express';

export const executionStateRouter = Router({ mergeParams: true });

// GET /centers/:centerId/fire-trials/:fireTrialId/execution/state
executionStateRouter.get('/state', (_req, res) => {
  setTimeout(
    () =>
      res.json({
        status: 'IN_PROGRESS',
        activeSeriesId: '550e8400-e29b-41d4-a716-446655440100',
        activeShotId: '550e8400-e29b-41d4-a716-446655440200',
        updatedAt: new Date().toISOString(),
      }),
    300,
  );
});

// POST /centers/:centerId/fire-trials/:fireTrialId/execution/start
executionStateRouter.post('/start', (_req, res) => {
  setTimeout(() => res.status(204).send(), 300);
});
```

### Fixtures JSON de referencia

execution-state.fixture.json:

```json
{
  "status": "IN_PROGRESS",
  "activeSeriesId": "550e8400-e29b-41d4-a716-446655440100",
  "activeShotId": "550e8400-e29b-41d4-a716-446655440200",
  "updatedAt": "2026-03-03T10:15:30Z"
}
```

execution-progress.fixture.json:

```json
{
  "series": [
    {
      "seriesId": "550e8400-e29b-41d4-a716-446655440100",
      "sequenceNumber": 1,
      "shots": [
        {
          "shotId": "550e8400-e29b-41d4-a716-446655440200",
          "sequenceNumber": 1,
          "status": "ACTIVE",
          "updatedAt": "2026-03-03T10:15:30Z"
        },
        {
          "shotId": "550e8400-e29b-41d4-a716-446655440201",
          "sequenceNumber": 2,
          "status": "PENDING",
          "updatedAt": "2026-03-03T10:15:30Z"
        }
      ]
    },
    {
      "seriesId": "550e8400-e29b-41d4-a716-446655440101",
      "sequenceNumber": 2,
      "shots": [
        {
          "shotId": "550e8400-e29b-41d4-a716-446655440202",
          "sequenceNumber": 1,
          "status": "PENDING",
          "updatedAt": "2026-03-03T10:15:30Z"
        }
      ]
    }
  ]
}
```

profiles-readiness.fixture.json:

```json
{
  "profilesReadiness": [
    {
      "profile": "VELOCITIES",
      "seriesReadiness": [
        { "seriesId": "550e8400-e29b-41d4-a716-446655440100", "isReady": true, "observations": "Equipos calibrados" },
        { "seriesId": "550e8400-e29b-41d4-a716-446655440101", "isReady": false, "observations": "" }
      ]
    },
    {
      "profile": "PRESSURES",
      "seriesReadiness": [
        { "seriesId": "550e8400-e29b-41d4-a716-446655440100", "isReady": true, "observations": "" },
        {
          "seriesId": "550e8400-e29b-41d4-a716-446655440101",
          "isReady": false,
          "observations": "Pendiente de sensores"
        }
      ]
    },
    {
      "profile": "MUNITIONS",
      "seriesReadiness": [
        { "seriesId": "550e8400-e29b-41d4-a716-446655440100", "isReady": true, "observations": "" },
        { "seriesId": "550e8400-e29b-41d4-a716-446655440101", "isReady": true, "observations": "" }
      ]
    },
    {
      "profile": "ARMAMENT",
      "seriesReadiness": [
        { "seriesId": "550e8400-e29b-41d4-a716-446655440100", "isReady": false, "observations": "Revisando el arma" },
        { "seriesId": "550e8400-e29b-41d4-a716-446655440101", "isReady": false, "observations": "" }
      ]
    }
  ]
}
```

widget-preferences.fixture.json:

```json
{
  "widgetsLayout": [
    "exec-prep-jlt",
    "exec-prep-tech",
    "security-countdown",
    "shot-selector",
    "data-intro-jlt-mao",
    "seguimiento"
  ]
}
```

equipment-selection.fixture.json:

```json
{
  "equipments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "selections": [
        {
          "itemId": "rd-9876",
          "itemType": "DOPPLER_RADAR",
          "seriesIds": ["550e8400-e29b-41d4-a716-446655440100"],
          "shootIds": ["550e8400-e29b-41d4-a716-446655440200"]
        },
        {
          "itemId": "ant-01",
          "itemType": "ANTENNA",
          "seriesIds": ["550e8400-e29b-41d4-a716-446655440100"],
          "shootIds": ["550e8400-e29b-41d4-a716-446655440200"]
        }
      ]
    }
  ]
}
```

---

## 🧩 Perfiles funcionales y readiness (funcional.md sección 3)

| Perfil                         | Puede escribir readiness             | Profile API enum                             |
| ------------------------------ | ------------------------------------ | -------------------------------------------- |
| Jefe/Técnico Balística         | ✅                                   | VELOCITIES, PRESSURES, TRAJECTOGRAPHY, VIDEO |
| Jefe/Técnico Municiones        | ✅                                   | MUNITIONS                                    |
| Jefe/Técnico Armamento         | ✅                                   | ARMAMENT                                     |
| JLT (Jefe Línea Tiro)          | ✅ Gestiona countdown + transiciones | —                                            |
| Director / Cliente / Consultor | ❌ Solo lectura                      | —                                            |

---

## 📋 Checklist obligatorio por servicio nuevo

Al añadir o modificar un endpoint del módulo de ejecución:

1. Tipos/Interfaces → Definir en execution.service.ts mapeando el Swagger schema.
2. httpResource → Crear trigger signal + resource en ExecutionService (Signal Trigger Pattern).
3. Store → Añadir estado derivado + effect() de sincronización en withHooks.onInit del ExecutionStore.
4. Mock fixture → Crear/actualizar JSON en apps/mock-server/src/fixtures/execution/.
5. Mock route → Añadir ruta Express en apps/mock-server/src/routes/execution/ y registrar.
6. Test servicio → Vitest en execution.service.spec.ts: verificar request HTTP + estado resource.
7. Test store → Vitest en execution.store.spec.ts: verificar que el estado se actualiza tras la respuesta.

---

## 🔗 Referencias del proyecto

- Golden Path: libs/domain/master-data/README.md
- Store: libs/domain/trial/execution/src/lib/+state/execution.store.ts
- Servicio: libs/domain/trial/execution/src/lib/services/execution.service.ts
- Swagger: apis/execution-api.json
- Doc funcional: funcional.md
- Skill Signal Trigger: .agents/skills/signal-trigger-pattern/SKILL.md
- Skill Mock Server: .agents/skills/mock-server-expert/SKILL.md
- Skill Testing: .agents/skills/angular-testing-expert/SKILL.md

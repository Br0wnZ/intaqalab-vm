---
name: widget-service-integration
description: >
  Implementa la integración completa GET+PUT de un endpoint de la API en un widget existente del panel de ejecución.
  Cubre: modelos TypeScript, métodos en ExecutionService, feature del store, mapper bidireccional, lógica de load/save en el widget padre, tabs hijas con dirty tracking, mocks Express coherentes y spec Vitest.
  USA ESTE SKILL cuando necesites conectar un widget del execution grid a sus endpoints reales de la API (GET para cargar datos del disparo, PUT para guardar).
  Referencia canónica: Widget 20 — Introducción de datos de munición (MunitionIntroduction).
argument-hint: "Número de widget y nombre (ej: '20 — Munition Introduction'). Opcionalmente, ruta del JSON de Swagger."
tools: [read, edit, search, execute, todo, agent]
---

# Widget Service Integration — Intaqalab Standard

Patrón canónico para conectar un widget existente del execution grid a sus endpoints GET y PUT de la API.
Referencia real: **Widget 20 — `MunitionIntroduction`**.

> [!IMPORTANT]
> **Lee la skill `execution-domain-expert` ANTES de empezar** si no conoces bien la arquitectura del dominio de ejecución.
> **Lee `signal-trigger-pattern`** para entender el patrón `httpResource` + trigger privado en `ExecutionService`.
> **PROHIBIDO EL USO DE `any`:** Todos los modelos, requests, responses, mappers, servicios, stores y componentes deben usar tipado estricto (`DistanceUnitEnum`, `TimeUnitEnum`, etc.). Nunca usar `as any`, `: any` o `any[]`.

---

## 🗺️ Rutas Clave

| Artefacto          | Ruta                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| Swagger API        | `apis/execution-api.json`                                              |
| ExecutionService   | `libs/domain/trial/execution/src/lib/services/execution.service.ts`    |
| ExecutionStore     | `libs/domain/trial/execution/src/lib/+state/execution.store.ts`        |
| State models       | `libs/domain/trial/execution/src/lib/+state/execution-state.models.ts` |
| Modelos de dominio | `libs/domain/trial/execution/src/lib/execution/models/`                |
| Widget dir         | `libs/domain/trial/execution/src/lib/execution/widgets/<widget-name>/` |
| Mock server store  | `mocks/src/fixtures/execution/execution-store.ts`                      |
| Mock fixture JSON  | `mocks/src/fixtures/execution/<fixture-name>.json`                     |
| Mock routes        | `mocks/src/routes/execution/`                                          |
| i18n ES            | `apps/intaqalab/public/i18n/es.json`                                   |

---

## 📋 Checklist de implementación (ejecutar en orden)

- [ ] Paso 1 — Leer Swagger e identificar endpoints
- [ ] Paso 2 — Añadir modelos TypeScript de Request/Response
- [ ] Paso 3 — Añadir métodos en ExecutionService (GET fetch + PUT)
- [ ] Paso 4 — Añadir feature store con estado del widget
- [ ] Paso 5 — Crear el mapper bidireccional
- [ ] Paso 6 — Implementar lógica de load/save en el widget padre
- [ ] Paso 7 — Implementar las tabs hijas (sub-componentes)
- [ ] Paso 8 — Añadir mocks Express coherentes
- [ ] Paso 9 — Verificar con npx vitest run y TypeScript

---

## Paso 1 — Leer Swagger e identificar endpoints

```bash
# Localizar los endpoints del widget en el Swagger
cat apis/execution-api.json | python3 -c "
import sys, json
api = json.load(sys.stdin)
for path, methods in api.get('paths', {}).items():
    if 'munition' in path.lower():  # cambia 'munition' por el recurso del widget
        for method, op in methods.items():
            print(f'{method.upper()} {path}  —  {op.get(\"summary\",\"\")}')
"
```

**Endpoints típicos de un widget con serie+disparo:**

- `GET  /fire-trials/{fireTrialId}/execution/<resource>/series/{seriesId}/shots/{shotId}`
- `PUT  /fire-trials/{fireTrialId}/execution/<resource>/series/{seriesId}/shots/{shotId}`

Anota:

- **Esquema de respuesta** (GET — qué devuelve)
- **Esquema de request** (PUT — qué acepta el body)
- **Parámetros de ruta** (normalmente `fireTrialId`, `seriesId`, `shotId`)

---

## Paso 2 — Añadir modelos TypeScript de Request/Response

Fichero: `libs/domain/trial/execution/src/lib/execution/models/<widget-resource>.models.ts`

> Si los modelos ya están en el fichero `index.ts` del directorio `models/`, añadirlos ahí.

```typescript
// GET Response
export interface <Resource>ComponentResponse {
  componentId: string;
  identificationData?: {
    denominationId?: string | null;
    batch?: string | null;
    clientNumber?: string | null;
    fuseWorkingModeId?: string | null;
    fuseGraduation?: number | null;
    observations?: string | null;
  } | null;
  weightData?: {
    balanceId?: number | null;
    weight?: number | null;
    weightAdded?: number | null;
    weightRemoved?: number | null;
    weighingDateTime?: string | null;
    weighingRange?: string | null;
    observations?: string | null;
  } | null;
  conditioningData?: {
    climaticChamberId?: number | null;
    chamberEntryDateTime?: string | null;
    chamberExitDateTime?: string | null;
    temperature?: number | null;
    programmedTemperature?: number | null;
    observations?: string | null;
  } | null;
}

export interface <Resource>Response {
  munitionData: <Resource>ComponentResponse[];
}

// PUT Request
export interface <Resource>ComponentRequest {
  componentId: string;
  identificationData: { /* campos según Swagger */ } | null;
  weightData: { /* campos según Swagger */ } | null;
  conditioningData: { /* campos según Swagger */ } | null;
}

export interface <Resource>Request {
  components: <Resource>ComponentRequest[];
}

// Params internas (para el trigger del httpResource)
export interface <Resource>Params {
  fireTrialId: string;
  seriesId: string;
  shotId: string;
  _t: number; // timestamp para forzar re-trigger en cada llamada
}

export interface <Resource>UpdateParams extends <Resource>Params {
  body: <Resource>Request;
}
```

**Exportar** los modelos desde el `index.ts` de `models/`:

```typescript
export type { <Resource>Response, <Resource>Request } from './<widget-resource>.models';
```

---

## Paso 3 — Añadir métodos en ExecutionService

> [!IMPORTANT]
> `ExecutionService` usa el patrón **trigger privado + `httpResource`** para cada operación.
> Las operaciones imperativamente iniciadas (al cambiar de disparo, al pulsar Guardar) usan
> un método `async` que:
>
> 1. Actualiza el trigger con `_t: Date.now()` para forzar el re-disparo.
> 2. Llama a `this.#awaitResource(resource)` para esperar la resolución.
> 3. Retorna `resource.value()!`.
>
> La API `#awaitResource` ya existe en `ExecutionService` — no la reimplementes.

```typescript
// === GET (Widget N) =========================================================

// Trigger reactivo (para actualizaciones en tiempo real desde el store)
readonly #get<Resource>Params = signal<<Resource>Params | null>(null);

readonly <resource>Resource = httpResource<<Resource>Response>(() => {
  const p = this.#get<Resource>Params();
  if (!p) return undefined;
  return {
    url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/<api-path>/series/${p.seriesId}/shots/${p.shotId}`,
    method: 'GET',
  };
});

get<Resource>(fireTrialId: string, seriesId: string, shotId: string): void {
  this.#get<Resource>Params.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
}

// Trigger dedicado para fetch imperativo (usado desde el widget, espera la respuesta)
readonly #fetch<Resource>Params = signal<<Resource>Params | null>(null);

readonly #fetch<Resource>Resource = httpResource<<Resource>Response>(() => {
  const p = this.#fetch<Resource>Params();
  if (!p) return undefined;
  return {
    url: `${this.#executionUrl}/fire-trials/${p.fireTrialId}/execution/<api-path>/series/${p.seriesId}/shots/${p.shotId}`,
    method: 'GET',
  };
});

async fetch<Resource>(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
): Promise<<Resource>Response> {
  this.#fetch<Resource>Params.set({ fireTrialId, seriesId, shotId, _t: Date.now() });
  await this.#awaitResource(this.#fetch<Resource>Resource);
  return this.#fetch<Resource>Resource.value()!;
}

// === PUT (Widget N) =========================================================

readonly #update<Resource>Params = signal<<Resource>UpdateParams | null>(null);

readonly update<Resource>Resource = httpResource<<Resource>Response>(() => {
  const params = this.#update<Resource>Params();
  if (!params) return undefined;
  return {
    url: `${this.#executionUrl}/fire-trials/${params.fireTrialId}/execution/<api-path>/series/${params.seriesId}/shots/${params.shotId}`,
    method: 'PUT',
    body: params.body,
  };
});

set<Resource>(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  body: <Resource>Request,
): void {
  this.#update<Resource>Params.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
}

async update<Resource>(
  fireTrialId: string,
  seriesId: string,
  shotId: string,
  body: <Resource>Request,
): Promise<<Resource>Response> {
  this.#update<Resource>Params.set({ fireTrialId, seriesId, shotId, body, _t: Date.now() });
  await this.#awaitResource(this.update<Resource>Resource);
  return this.update<Resource>Resource.value()!;
}
```

---

## Paso 4 — Añadir feature del store

### 4a. Modelos de estado (`execution-state.models.ts`)

```typescript
export interface <Widget>IdentificationState {
  componente: string | null;
  denominacion: string | null;
  lote: string | null;
  modoFuncionamiento: string | null;
  observaciones: string | null;
  // flags de validación del catálogo
  denominacionFromPlanning: boolean;
  loteFromPlanning: boolean;
  denominacionNotInStock: boolean;
  loteNotInStock: boolean;
}

export interface <Widget>PesosState {
  componente: string | null;
  balanza: string | null;
  peso: number | null;
  pesoAnadido: number | null;
  pesoRetirado: number | null;
  fechaHora: string | null;
  rangoPesada: string | null;
  observaciones: string | null;
}

export interface <Widget>AcondicionamientoState {
  camara: string | null;
  componente: string | null;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
  temperatura: number | null;
  temperaturaCorregida: number | null;
  observaciones: string | null;
}

export interface <Widget>State {
  serie: string | null;
  disparo: string | null;
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA';
  identificacion: <Widget>IdentificationState;
  pesos: <Widget>PesosState;
  acondicionamiento: <Widget>AcondicionamientoState;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  componenteOptions: { value: string; label: string; category: string }[];
  denominacionOptions: { value: string; label: string; componenteId: string; inStock: boolean }[];
  loteOptions: { value: string; label: string; denominacionId: string }[];
  modoFuncionamientoOptions: { value: string; label: string }[];
  balanzaOptions: { value: string; label: string; rangoMin: number; rangoMax: number; unit: string }[];
  camaraOptions: { value: string; label: string; temperatura: number }[];
}
```

### 4b. Feature store (`with<Widget>.ts`)

Crea `libs/domain/trial/execution/src/lib/+state/features/with-<widget-name>.ts`:

```typescript
import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';
import type {
  <Widget>AcondicionamientoState,
  <Widget>IdentificationState,
  <Widget>PesosState,
  <Widget>State,
} from '../execution-state.models';

interface <Widget>Slice { <widgetCamelName>: <Widget>State; }

const initialState: <Widget>Slice = {
  <widgetCamelName>: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    identificacion: {
      componente: null, denominacion: null, lote: null,
      modoFuncionamiento: null, observaciones: null,
      denominacionFromPlanning: false, loteFromPlanning: false,
      denominacionNotInStock: false, loteNotInStock: false,
    },
    pesos: {
      componente: null, balanza: null, peso: null,
      pesoAnadido: null, pesoRetirado: null, fechaHora: null,
      rangoPesada: null, observaciones: null,
    },
    acondicionamiento: {
      camara: null, componente: null,
      fechaHoraEntrada: null, fechaHoraSalida: null,
      temperatura: 20, temperaturaCorregida: null, observaciones: null,
    },
    serieOptions: [
      { value: 'calentamiento', label: 'Calentamiento' },
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
    ],
    componenteOptions: [
      { value: 'granada-01', label: 'Granada', category: 'granada' },
      { value: 'espoleta-01', label: 'Espoleta', category: 'espoleta' },
    ],
    denominacionOptions: [
      { value: 'den-01', label: '155mm M107', componenteId: 'granada-01', inStock: true },
    ],
    loteOptions: [
      { value: 'lote-01', label: 'Lote A-2024', denominacionId: 'den-01' },
    ],
    modoFuncionamientoOptions: [
      { value: 'percusion', label: 'Percusión' },
    ],
    balanzaOptions: [
      { value: 'bal-01', label: 'Balanza Precisión 500g', rangoMin: 0, rangoMax: 500, unit: 'g' },
      { value: 'bal-02', label: 'Balanza Precisión 2000g', rangoMin: 0, rangoMax: 2000, unit: 'g' },
    ],
    camaraOptions: [
      { value: 'camara-01', label: 'Cámara climática 01', temperatura: 20 },
      { value: 'camara-02', label: 'Cámara climática 02', temperatura: -10 },
    ],
  },
};

export function with<Widget>() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      update<Widget>Selector(updates: Partial<Pick<<Widget>State, 'serie' | 'disparo'>>): void {
        patchState(store, (state) => ({
          <widgetCamelName>: { ...state.<widgetCamelName>, ...updates },
        }));
      },
      update<Widget>Identification(updates: Partial<<Widget>IdentificationState>): void {
        patchState(store, (state) => ({
          <widgetCamelName>: {
            ...state.<widgetCamelName>,
            identificacion: { ...state.<widgetCamelName>.identificacion, ...updates },
          },
        }));
      },
      update<Widget>Pesos(updates: Partial<<Widget>PesosState>): void {
        patchState(store, (state) => ({
          <widgetCamelName>: {
            ...state.<widgetCamelName>,
            pesos: { ...state.<widgetCamelName>.pesos, ...updates },
          },
        }));
      },
      update<Widget>Acondicionamiento(updates: Partial<<Widget>AcondicionamientoState>): void {
        patchState(store, (state) => ({
          <widgetCamelName>: {
            ...state.<widgetCamelName>,
            acondicionamiento: { ...state.<widgetCamelName>.acondicionamiento, ...updates },
          },
        }));
      },
    })),
  );
}
```

### 4c. Registrar la feature en ExecutionStore

En `execution.store.ts`:

```typescript
import { with<Widget> } from './features/with-<widget-name>';

export const ExecutionStore = signalStore(
  // ...features existentes...
  with<Widget>(),
);

// Exportar los tipos de estado del widget para que el widget pueda importarlos
export type { <Widget>IdentificationState, <Widget>PesosState, <Widget>AcondicionamientoState } from '../+state/execution-state.models';
```

---

## Paso 5 — Crear el Mapper bidireccional

> [!IMPORTANT]
> **Fichero dedicado obligatorio:** El mapper DEBE ubicarse en un archivo independiente `<widget-name>.mapper.ts` en la carpeta del widget (ej. `trayectografia-introduction.mapper.ts`) junto con sus tests unitarios `<widget-name>.mapper.spec.ts`. NUNCA incluir funciones de mapeo, parseo o transformación pesadas directamente en el componente `.ts`. Mantener componentes delgados y limpios.
>
> **Regla de tipado estricto (Zero any):** El mapper DEBE estar 100% tipado con enums de dominio (`DistanceUnitEnum`, `TimeUnitEnum`, etc.) y modelos de TypeScript. PROHIBIDO usar `any`, `as any` o `any[]`.

### 5a. Regla de resolución de IDs numéricos

> [!IMPORTANT]
> La API Calibry devuelve IDs **numéricos** para entidades como balanzas y cámaras climáticas.
> El frontend usa **strings descriptivos** para los selectores.
> El mapper hace la resolución **bidireccional**:
>
> - `GET response` (número) → valor UI (string) — usado en `mapRemoteToState`
> - `PUT request` (string) → número — usado en `mapStateToRequest`
>
> IDs conocidos en esta implementación:
>
> - `21031` ↔ `'bal-01'`
> - `21032` ↔ `'bal-02'`
> - `21045` ↔ `'camara-01'`
> - `21046` ↔ `'camara-02'`

```typescript
function resolveBalanzaValue(balanceId: number | string | null | undefined): string | null {
  if (balanceId === null || balanceId === undefined) return null;
  const str = String(balanceId);
  if (str === '21031' || str === 'bal-01') return 'bal-01';
  if (str === '21032' || str === 'bal-02') return 'bal-02';
  return str; // ID desconocido: mantener como string
}

function resolveCamaraValue(id: number | string | null | undefined): string | null {
  if (id === null || id === undefined) return null;
  const str = String(id);
  if (str === '21045' || str === 'camara-01') return 'camara-01';
  if (str === '21046' || str === 'camara-02') return 'camara-02';
  if (str === 'sala-01') return 'sala-01';
  return str;
}
```

### 5b. `mapRemoteToState` — GET response → estado de tabs

```typescript
export function mapRemoteTo<Widget>State(
  response: <Resource>Response | null | undefined,
  fallbackComponentId?: string | null,
): {
  identificacion: Partial<<Widget>IdentificationState>;
  pesos: Partial<<Widget>PesosState>;
  acondicionamiento: Partial<<Widget>AcondicionamientoState>;
} {
  const components = response?.munitionData ?? [];
  if (components.length === 0) {
    return { identificacion: {}, pesos: {}, acondicionamiento: {} };
  }

  // Si se pasa fallbackComponentId, se busca ese componente; si no, el primero
  const target =
    (fallbackComponentId
      ? components.find((c) => c.componentId === fallbackComponentId)
      : null) ?? components[0];

  const ident = target.identificationData;
  const weights = target.weightData;
  const cond = target.conditioningData;

  return {
    identificacion: {
      componente: target.componentId,
      denominacion: ident?.denominationId ?? null,
      lote: ident?.batch ?? null,
      numeroCliente: ident?.clientNumber ?? null,
      modoFuncionamiento: ident?.fuseWorkingModeId ?? null,
      graduacionEspoleta: ident?.fuseGraduation ?? null,
      observaciones: ident?.observations ?? null,
    },
    pesos: {
      componente: target.componentId,
      balanza: resolveBalanzaValue(weights?.balanceId),
      peso: weights?.weight ?? null,
      pesoAnadido: weights?.weightAdded ?? null,
      pesoRetirado: weights?.weightRemoved ?? null,
      fechaHora: weights?.weighingDateTime ?? null,
      rangoPesada: weights?.weighingRange ?? null,
      observaciones: weights?.observations ?? null,
    },
    acondicionamiento: {
      camara: resolveCamaraValue(cond?.climaticChamberId),
      componente: target.componentId,
      // REGLA: truncar ISO 8601 a 16 chars (YYYY-MM-DDTHH:mm) para datetime-local
      fechaHoraEntrada: cond?.chamberEntryDateTime
        ? cond.chamberEntryDateTime.substring(0, 16)
        : null,
      fechaHoraSalida: cond?.chamberExitDateTime
        ? cond.chamberExitDateTime.substring(0, 16)
        : null,
      temperatura: cond?.temperature ?? null,
      temperaturaCorregida: cond?.programmedTemperature ?? null,
      observaciones: cond?.observations ?? null,
    },
  };
}
```

### 5c. `mapStateToRequest` — estado de tabs → PUT body

```typescript
export function map<Widget>StateToRequest(params: {
  componentId: string;
  identificacion: Partial<<Widget>IdentificationState>;
  pesos: Partial<<Widget>PesosState>;
  acondicionamiento: Partial<<Widget>AcondicionamientoState>;
  existingComponents?: <Resource>ComponentRequest[];
}): <Resource>Request {
  const { componentId, identificacion, pesos, acondicionamiento, existingComponents = [] } = params;

  // Resolver strings UI → IDs numéricos del backend
  let balanceId: number | null = null;
  if (pesos.balanza === 'bal-01') balanceId = 21031;
  else if (pesos.balanza === 'bal-02') balanceId = 21032;
  else if (pesos.balanza) balanceId = Number(pesos.balanza) || null;

  let climaticChamberId: number | null = null;
  if (acondicionamiento.camara === 'camara-01') climaticChamberId = 21045;
  else if (acondicionamiento.camara === 'camara-02') climaticChamberId = 21046;
  else if (acondicionamiento.camara) climaticChamberId = Number(acondicionamiento.camara) || null;

  const currentComponent: <Resource>ComponentRequest = {
    componentId,
    identificationData: {
      denominationId: identificacion.denominacion ?? null,
      batch: identificacion.lote ?? null,
      clientNumber: identificacion.numeroCliente ?? null,
      fuseWorkingModeId: identificacion.modoFuncionamiento ?? null,
      fuseGraduation: identificacion.graduacionEspoleta ?? null,
      fuseGraduationUnit: 'S' as TimeUnitEnum,
      observations: identificacion.observaciones ?? null,
    },
    weightData: {
      balanceId,
      weight: pesos.peso ?? null,
      weightUnit: 'G' as WeightUnitEnum,
      weightAdded: pesos.pesoAnadido ?? null,
      weightAddedUnit: 'G' as WeightUnitEnum,
      weightRemoved: pesos.pesoRetirado ?? null,
      weightRemovedUnit: 'G' as WeightUnitEnum,
      weighingDateTime: pesos.fechaHora ?? null,
      observations: pesos.observaciones ?? null,
    },
    conditioningData: {
      climaticChamberId,
      chamberEntryDateTime: acondicionamiento.fechaHoraEntrada ?? null,
      chamberExitDateTime: acondicionamiento.fechaHoraSalida ?? null,
      observations: acondicionamiento.observaciones ?? null,
    },
  };

  // Preservar otros componentes del disparo (soporte multi-componente)
  const otherComponents = existingComponents.filter((c) => c.componentId !== componentId);

  return { components: [currentComponent, ...otherComponents] };
}
```

---

## Paso 6 — Implementar el widget padre

### Reglas críticas del widget padre

1. **NO sobreescribir `ngOnInit()`** — `BaseFormWidgetComponent` registra la instancia automáticamente.
2. **`isDirty` = OR de los `isDirty()` de las tabs** — nunca incluir el selector de serie/disparo.
3. **Carga inicial idempotente** — usar `#lastLoadedActiveSelection` para evitar múltiples loads del mismo disparo.
4. **Selection guard** — usar `createSelectionGuard` + `ticket.isFresh()` para descartar respuestas desactualizadas.
5. **`[class.hidden]` en tabs** — en lugar de `@switch`/`@if` para preservar el estado interno de cada tab.
6. **`saveForm()` siempre hace `tab.save()`** — tras el PUT exitoso, para sincronizar el snapshot de dirty tracking.

```typescript
@Component({
  selector: 'inta-<widget-name>',
  imports: [
    FormField, ReadonlyContentDirective, FormTouchDirective,
    MatButtonModule, MatFormFieldModule, MatSelectModule, TranslateModule,
    <IdentTab>Component, <PesosTab>Component, <AcondTab>Component,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-2 flex flex-col gap-2 overflow-auto">
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Selectores de serie y disparo (navegación — NO dirty) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'...' | translate"
            [formField]="selectorForm.serie"
            (selectionChange)="onSerieSelected($event.value)">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
          <mat-select
            [placeholder]="'...' | translate"
            [formField]="selectorForm.disparo"
            (selectionChange)="onDisparoSelected($event.value)">
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.<WIDGET_KEY>.CURRENT_SHOT_BTN' | translate }}
        </button>
        <div class="flex-1"></div>
        <!-- Tab chips -->
        <div class="flex items-center gap-1 shrink-0">
          @for (tab of ['identificacion', 'pesos', 'acondicionamiento']; track tab) {
            <button type="button"
              class="px-2.5 py-0.5 rounded-full text-md font-semibold transition-colors cursor-pointer"
              [class]="activeTab() === tab
                ? 'bg-[var(--inta-button)] text-white'
                : 'border border-violet-300 text-violet-700 hover:bg-violet-50'"
              (click)="activeTab.set($any(tab))">
              {{ 'TRIAL_EXECUTION.WIDGETS.<WIDGET_KEY>.TAB_' + tab.toUpperCase() | translate }}
            </button>
          }
        </div>
      </div>

      <!-- Tab bodies: usar [class.hidden] para preservar estado interno -->
      <div intaReadonlyContent intaFormTouch #touch="intaFormTouch" class="flex-1 min-h-0">
        <inta-<ident-tab> [class.hidden]="activeTab() !== 'identificacion'" />
        <inta-<pesos-tab> [class.hidden]="activeTab() !== 'pesos'" />
        <inta-<acond-tab> [class.hidden]="activeTab() !== 'acondicionamiento'" />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Widget> extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  protected readonly activeTab = signal<TabType>('identificacion');

  // ViewChildren para delegar estado
  readonly identTab = viewChild(<IdentTab>Component);
  readonly pesosTab = viewChild(<PesosTab>Component);
  readonly acondTab = viewChild(<AcondTab>Component);
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  // Selection guard
  readonly #selectionKey = computed(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());

  // Options desde el store + planningSeries
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(
      this.#store.planningSeries(),
      this.#store.<widgetCamelName>().serieOptions,
    ),
  );

  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    const progressShots = this.#store.executionProgress()
      ?.series.find((s) => s.seriesId === selectedSerie)?.shots;
    if (progressShots?.length) {
      return mapShotsToDisparoOptions(progressShots, this.#store.<widgetCamelName>().disparoOptions);
    }
    const planningShots = this.#store.planningSeries()
      ?.find((s) => s.id === selectedSerie)?.shots;
    if (planningShots?.length) {
      return mapShotsToDisparoOptions(planningShots, this.#store.<widgetCamelName>().disparoOptions);
    }
    return this.#store.<widgetCamelName>().disparoOptions;
  });

  // Selector form (navegación — NO dirty)
  protected readonly selectorFormModel = signal<{ serie: string | null; disparo: string | null }>({
    serie: this.#store.<widgetCamelName>().serie,
    disparo: this.#store.<widgetCamelName>().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  // Dirty tracking: SOLO tabs de datos (no selectores)
  protected readonly isDirty = computed(
    () =>
      (this.identTab()?.isDirty() ?? false) ||
      (this.pesosTab()?.isDirty() ?? false) ||
      (this.acondTab()?.isDirty() ?? false),
  );

  protected readonly isValid = computed(
    () =>
      this.selectorForm().valid() &&
      (this.identTab()?.isValid() ?? true) &&
      (this.pesosTab()?.isValid() ?? true) &&
      (this.acondTab()?.isValid() ?? true),
  );

  // FormWidget contract
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.touchRef()?.touched() ?? false,
    valid: this.isValid(),
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super(); // NUNCA omitir — registra la instancia en WidgetStateService

    // Carga inicial idempotente al montar el widget con un disparo activo
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const activeSerieId = this.#store.activeSerieId() ?? this.serieOptions()[0]?.value ?? null;
      const activeShotId = this.#store.activeShotId() ?? this.disparoOptions()[0]?.value ?? null;

      if (!fireTrialId || !activeSerieId || !activeShotId) return;

      const selectionKey = `${activeSerieId}|${activeShotId}`;
      if (this.#lastLoadedActiveSelection() === selectionKey) return;

      untracked(() => {
        this.#lastLoadedActiveSelection.set(selectionKey);
        this.#setSelection(activeSerieId, activeShotId);
      });
    });
  }

  onSerieSelected(serie: string | null): void {
    const current = this.selectorFormModel();
    const disparo = this.#isShotInSerie(current.disparo, serie) ? current.disparo : null;
    this.selectorFormModel.set({ serie, disparo });
    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    const current = this.selectorFormModel();
    this.selectorFormModel.set({ ...current, disparo });
    this.#syncSelectionToStore(current.serie, disparo);
    void this.#loadSelectedShotData();
  }

  setCurrentShot(): void {
    const serie = this.#store.activeSerieId() ?? this.selectorFormModel().serie;
    const disparo = this.#store.activeShotId() ?? this.selectorFormModel().disparo;
    this.#setSelection(serie, disparo);
  }

  // CONTRATO de BaseFormWidgetComponent — invocado por WidgetStateService.saveAllDirtyForms()
  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const fireTrialId = this.#store.fireTrialId();

    this.#store.update<Widget>Selector({ serie, disparo });

    if (fireTrialId && serie && disparo) {
      const identUpdates = this.identTab()?.getFormUpdates() ?? this.#store.<widgetCamelName>().identificacion;
      const pesosUpdates = this.pesosTab()?.getFormUpdates() ?? this.#store.<widgetCamelName>().pesos;
      const acondUpdates = this.acondTab()?.getFormUpdates() ?? this.#store.<widgetCamelName>().acondicionamiento;

      const componentId =
        identUpdates.componente ??
        pesosUpdates.componente ??
        acondUpdates.componente ??
        this.#store.<widgetCamelName>().componenteOptions[0]?.value ??
        'granada-01';

      const payload = map<Widget>StateToRequest({
        componentId,
        identificacion: identUpdates,
        pesos: pesosUpdates,
        acondicionamiento: acondUpdates,
      });

      try {
        await this.#executionService.update<Resource>(fireTrialId, serie, disparo, payload);
        // Tras PUT exitoso: sincronizar snapshot en cada tab (queda limpio)
        this.identTab()?.save();
        this.pesosTab()?.save();
        this.acondTab()?.save();
      } catch (error) {
        console.error('Failed to save <widget name>', error);
        throw error; // re-throw para que el padre pueda mostrar el error
      }
    } else {
      // Sin contexto HTTP: guardar solo en el store local
      this.identTab()?.save();
      this.pesosTab()?.save();
      this.acondTab()?.save();
    }
  }

  resetForm(): void {
    const stored = this.#store.<widgetCamelName>();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.identTab()?.reset();
    this.pesosTab()?.reset();
    this.acondTab()?.reset();
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.selectorFormModel.set({ serie, disparo });
    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.selectorFormModel();
    const selectionKey = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();

    if (!fireTrialId || !serie || !disparo) return;

    try {
      const response = await this.#executionService.fetch<Resource>(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) return; // descarta respuesta desactualizada
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) return;
      this.#applyRemoteShotData({ munitionData: [] }); // tabs vacíos en error
    }
  }

  #applyRemoteShotData(response: <Resource>Response): void {
    const mapped = mapRemoteTo<Widget>State(response);
    if (mapped.identificacion && Object.keys(mapped.identificacion).length > 0) {
      this.#store.update<Widget>Identification(mapped.identificacion);
      this.identTab()?.applyData(mapped.identificacion);
    }
    if (mapped.pesos && Object.keys(mapped.pesos).length > 0) {
      this.#store.update<Widget>Pesos(mapped.pesos);
      this.pesosTab()?.applyData(mapped.pesos);
    }
    if (mapped.acondicionamiento && Object.keys(mapped.acondicionamiento).length > 0) {
      this.#store.update<Widget>Acondicionamiento(mapped.acondicionamiento);
      this.acondTab()?.applyData(mapped.acondicionamiento);
    }
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.update<Widget>Selector({ serie, disparo });
  }

  #isShotInSerie(disparo: string | null, serie: string | null): boolean {
    if (!disparo || !serie) return false;
    return (
      this.#store.executionProgress()
        ?.series.some((s) => s.seriesId === serie && s.shots.some((shot) => shot.shotId === disparo))
      ?? false
    );
  }
}
```

---

## Paso 7 — Implementar las tabs hijas

Cada tab es un componente presentacional que implementa el contrato:
`{ isDirty, isValid, getFormUpdates(), applyData(), save(), reset() }`

> [!IMPORTANT]
> **Regla de effects de cascada**: usar siempre `untracked()` para escribir en signals
> dentro de un `effect()`. Sin esto, Angular puede detectar un loop reactivo y lanzar
> `ExpressionChangedAfterItHasBeenCheckedError` o causar re-renders infinitos.

```typescript
@Component({
  selector: 'inta-<widget-ident-tab>',
  imports: [FormField, MatFormFieldModule, MatSelectModule, MatInputModule, TranslateModule],
  template: `<!-- campos del tab -->`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <Widget>IdentTabComponent {
  readonly #store = inject(ExecutionStore);

  readonly identFormModel = signal<FormModel>({
    componente: this.#store.<widgetCamelName>().identificacion.componente,
    denominacion: this.#store.<widgetCamelName>().identificacion.denominacion,
    lote: this.#store.<widgetCamelName>().identificacion.lote,
    modoFuncionamiento: this.#store.<widgetCamelName>().identificacion.modoFuncionamiento,
  });
  readonly identForm = form(this.identFormModel);

  // Campos fuera del form Signal Forms (signals simples para textarea, inputs)
  readonly observacionesField = signal<string | null>(
    this.#store.<widgetCamelName>().identificacion.observaciones,
  );

  // Dirty tracker por valor: si el usuario revierte manualmente a los valores guardados,
  // el formulario vuelve a estar limpio automáticamente
  readonly #dirtyTracker = createDirtyTracker(() => ({
    componente: this.identFormModel().componente,
    denominacion: this.identFormModel().denominacion,
    lote: this.identFormModel().lote,
    modoFuncionamiento: this.identFormModel().modoFuncionamiento,
    observaciones: this.observacionesField(),
  }));

  readonly isDirty = this.#dirtyTracker.isDirty;
  readonly isValid = computed(() => this.identForm().valid());

  // Effects de cascada — SIEMPRE con untracked() para las escrituras
  constructor() {
    // Si el componente cambia y la denominación actual no es válida, limpiar
    effect(() => {
      const opts = this.filteredDenominacionOptions();
      const current = this.identFormModel().denominacion;
      if (current && !opts.some((d) => d.value === current)) {
        untracked(() =>
          this.identFormModel.update((m) => ({ ...m, denominacion: null, lote: null })),
        );
      }
    });

    // Si la denominación cambia y el lote actual no es válido, limpiar o auto-seleccionar
    effect(() => {
      const opts = this.filteredLoteOptions();
      const current = this.identFormModel().lote;
      if (current && !opts.some((l) => l.value === current)) {
        untracked(() =>
          this.identFormModel.update((m) => ({
            ...m,
            lote: opts.length === 1 ? opts[0].value : null,
          })),
        );
      }
    });
  }

  getFormUpdates(): Partial<<Widget>IdentificationState> {
    const { componente, denominacion, lote, modoFuncionamiento } = this.identFormModel();
    return {
      componente, denominacion, lote, modoFuncionamiento,
      observaciones: this.observacionesField(),
    };
  }

  // Aplica datos del GET SIN marcar dirty (sincroniza el snapshot al final)
  applyData(data: Partial<<Widget>IdentificationState>): void {
    this.identFormModel.update((m) => ({
      ...m,
      componente: data.componente !== undefined ? data.componente : m.componente,
      denominacion: data.denominacion !== undefined ? data.denominacion : m.denominacion,
      lote: data.lote !== undefined ? data.lote : m.lote,
      modoFuncionamiento: data.modoFuncionamiento !== undefined ? data.modoFuncionamiento : m.modoFuncionamiento,
    }));
    if (data.observaciones !== undefined) this.observacionesField.set(data.observaciones);
    this.#dirtyTracker.syncSnapshot(); // CRÍTICO: el form queda limpio tras applyData
  }

  // Llamado desde el padre DESPUÉS del PUT exitoso
  save(): void {
    const updates = this.getFormUpdates();
    this.#store.update<Widget>Identification(updates);
    this.#dirtyTracker.syncSnapshot(); // CRÍTICO: el form queda limpio tras save
  }

  reset(): void {
    const stored = this.#store.<widgetCamelName>().identificacion;
    this.identFormModel.set({
      componente: stored.componente,
      denominacion: stored.denominacion,
      lote: stored.lote,
      modoFuncionamiento: stored.modoFuncionamiento,
    });
    this.observacionesField.set(stored.observaciones);
    this.#dirtyTracker.syncSnapshot();
  }
}
```

---

## Paso 8 — Mocks Express coherentes

### 8a. Fixture JSON coherente con el store

> [!IMPORTANT]
> Los IDs del fixture deben coincidir con las opciones iniciales del feature store:
>
> - `componentId` debe estar en `componenteOptions`
> - `denominationId` debe estar en `denominacionOptions` con el `componenteId` correcto
> - `batch` debe estar en `loteOptions` con el `denominacionId` correcto
> - `balanceId: 21031` → `bal-01`, `balanceId: 21032` → `bal-02`
> - `climaticChamberId: 21045` → `camara-01`, `climaticChamberId: 21046` → `camara-02`

```json
{
  "munitionData": [
    {
      "componentId": "granada-01",
      "identificationData": {
        "denominationId": "den-01",
        "batch": "lote-01",
        "clientNumber": null,
        "fuseWorkingModeId": null,
        "fuseGraduation": null,
        "observations": null
      },
      "weightData": {
        "balanceId": 21031,
        "weight": 44.5,
        "weightAdded": 0.0,
        "weightRemoved": 0.0,
        "weighingDateTime": "2026-01-10T09:30:00Z",
        "weighingRange": "0-500",
        "observations": null
      },
      "conditioningData": {
        "climaticChamberId": 21045,
        "chamberEntryDateTime": "2026-01-10T08:00:00Z",
        "chamberExitDateTime": "2026-01-10T10:00:00Z",
        "temperature": 20,
        "programmedTemperature": 21,
        "observations": null
      }
    }
  ]
}
```

### 8b. Mock Express — status editables

```typescript
// En execution-store.ts del mock server
set<Resource>(fireTrialId, seriesId, shotId, body) {
  const trial = this.trials.find((t) => t.id === fireTrialId);
  if (!trial) throw new HttpError(404, `FireTrial ${fireTrialId} not found`);

  // IMPORTANTE: aceptar PENDING, ACTIVE y FIRED (no solo ACTIVE)
  const shot = this.#findShot(seriesId, shotId);
  const editableStatuses = ['PENDING', 'ACTIVE', 'FIRED'];
  if (shot && !editableStatuses.includes(shot.status)) {
    throw new HttpError(422, `Shot ${shotId} not editable (status: ${shot.status})`);
  }

  return { munitionData: body.components };
}
```

---

## Paso 9 — Spec Vitest completo del widget padre

```typescript
const mockWidgetStateService = {
  updateWidgetFormState: () => { /* noop */ },
  registerWidgetInstance: () => { /* noop */ },
  unregisterWidgetInstance: () => { /* noop */ },
  addWidget: () => { /* noop */ },
  placedWidgets: () => [],
};

describe('<Widget>', () => {
  const renderWidget = (widgetId = 'test-widget', customProviders: Provider[] = []) =>
    render(<Widget>, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
        ExecutionService,
        { provide: TrialsDataService, useClass: MockTrialsDataService },
        ...customProviders,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('saveForm calls ExecutionService with correct params', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const updateSpy = vi.spyOn(execService, 'update<Resource>').mockResolvedValue(mockResponse);

    TestBed.inject(ExecutionStore).setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'disparo-1' });

    await fixture.componentInstance.saveForm();

    expect(updateSpy).toHaveBeenCalledWith('trial-123', 'serie-1', 'disparo-1', expect.any(Object));
  });

  it('saveForm handles network errors gracefully', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    vi.spyOn(execService, 'update<Resource>').mockRejectedValue(new Error('Network error'));

    TestBed.inject(ExecutionStore).setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'disparo-1' });

    await expect(fixture.componentInstance.saveForm()).rejects.toThrow('Network error');
  });

  it('fetches data on disparo change and applies to tabs and store', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    vi.spyOn(execService, 'fetch<Resource>').mockResolvedValue(mockResponse);

    TestBed.inject(ExecutionStore).setFireTrialId('trial-123');
    fixture.componentInstance.onSerieSelected('serie-1');
    fixture.componentInstance.onDisparoSelected('disparo-1');

    await vi.waitFor(() => {
      expect(execService.fetch<Resource>).toHaveBeenCalledWith('trial-123', 'serie-1', 'disparo-1');
    });

    // Verificar que el store recibe los datos del GET
    expect(TestBed.inject(ExecutionStore).<widgetCamelName>().identificacion.componente).toBe('granada-01');
  });

  it('saveForm delegates save() to child tabs after successful PUT', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    vi.spyOn(execService, 'update<Resource>').mockResolvedValue(mockResponse);

    const identSpy = vi.spyOn(fixture.componentInstance.identTab()!, 'save');
    const pesosSpy = vi.spyOn(fixture.componentInstance.pesosTab()!, 'save');
    const acondSpy = vi.spyOn(fixture.componentInstance.acondTab()!, 'save');

    TestBed.inject(ExecutionStore).setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'disparo-1' });
    await fixture.componentInstance.saveForm();

    expect(identSpy).toHaveBeenCalled();
    expect(pesosSpy).toHaveBeenCalled();
    expect(acondSpy).toHaveBeenCalled();
  });

  it('resetForm delegates reset() to child tabs', async () => {
    const { fixture } = await renderWidget();
    const identSpy = vi.spyOn(fixture.componentInstance.identTab()!, 'reset');

    fixture.componentInstance.resetForm();
    expect(identSpy).toHaveBeenCalled();
  });
});
```

### Ejecutar tests

```bash
# Widget específico
npx vitest run src/lib/execution/widgets/<widget-name>/

# Suite completa del dominio
npx nx test execution

# TypeScript check
cd libs/domain/trial/execution && npx tsc --noEmit
```

---

## Anti-patrones críticos

| ❌ NUNCA                                                             | ✅ SIEMPRE                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `override ngOnInit()` en el widget                                   | `BaseFormWidgetComponent.ngOnInit()` ya registra la instancia             |
| `effect(() => signal.set(...))` sin `untracked()`                    | `effect(() => { untracked(() => signal.set(...)) })`                      |
| `applyData()` sin `#dirtyTracker.syncSnapshot()`                     | Siempre sincronizar snapshot al final de `applyData()`                    |
| `save()` en tab sin `#dirtyTracker.syncSnapshot()`                   | Siempre sincronizar snapshot al final de `save()`                         |
| Fixture JSON con IDs de balanza/cámara desconocidos                  | Usar `21031`/`21032`/`21045`/`21046` según el mapeo bidireccional         |
| Mock PUT que rechaza status `PENDING`                                | Aceptar `['PENDING', 'ACTIVE', 'FIRED']`                                  |
| `isDirty` basado en los selectores de serie/disparo                  | `isDirty` = OR de los `isDirty()` de las tabs de datos                    |
| `this.#executionService.fetch<Resource>()` directo en el constructor | Usar `effect()` con `#lastLoadedActiveSelection` para idempotencia        |
| Opciones del store con IDs numéricos                                 | Opciones con strings descriptivos (`'bal-01'`); mapper hace la conversión |
| Tabs con `@if`/`@switch`                                             | Tabs con `[class.hidden]` para preservar el estado interno                |

---

## Flujo completo E2E

```
[Usuario selecciona disparo]
       ↓
onDisparoSelected() → #syncSelectionToStore() → #loadSelectedShotData()
       ↓
ExecutionService.fetch<Resource>(fireTrialId, seriesId, shotId)
  → #fetch<Resource>Params.set({ ..., _t: Date.now() })
  → #awaitResource(#fetch<Resource>Resource)
  → return resource.value()!
       ↓
#applyRemoteShotData(response)
  → mapRemoteTo<Widget>State(response)
  → store.update<Widget>Identification(...)  ← persiste en store
  → identTab.applyData(...)  ← syncSnapshot() al final → NO dirty
  → (ídem pesos y acond)
       ↓
[Usuario edita campos en las tabs]
       ↓
isDirty() === true → formState().dirty === true
       ↓
[Usuario pulsa "Guardar" en ExecutionHeader]
       ↓
WidgetStateService.saveAllDirtyForms()
  → instancia registrada por BaseFormWidgetComponent.ngOnInit()
  → <Widget>.saveForm()
       ↓
getFormUpdates() de cada tab
       ↓
map<Widget>StateToRequest({ componentId, identificacion, pesos, acondicionamiento })
  → strings UI → IDs numéricos del backend
       ↓
ExecutionService.update<Resource>(fireTrialId, seriesId, shotId, payload)
  → PUT al backend
       ↓
identTab.save() + pesosTab.save() + acondTab.save()
  → syncSnapshot() en cada tab → isDirty() === false
```

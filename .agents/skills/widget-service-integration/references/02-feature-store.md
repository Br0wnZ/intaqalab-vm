# 02 — Feature Store (`with<Widget>.ts`)

Guía para modelar el estado del widget en `execution-state.models.ts`, crear la feature de NgRx SignalStore (`with-<widget>.ts`) y registrarla en `ExecutionStore`.

---

## 1. Modelos de Estado (`execution-state.models.ts`)

```typescript
export interface <Widget>IdentificationState {
  componente: string | null;
  denominacion: string | null;
  lote: string | null;
  modoFuncionamiento: string | null;
  observaciones: string | null;
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

---

## 2. Feature Store (`with-<widget-name>.ts`)

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

---

## 3. Registro en `ExecutionStore`

En `libs/domain/trial/execution/src/lib/+state/execution.store.ts`:

```typescript
import { with<Widget> } from './features/with-<widget-name>';

export const ExecutionStore = signalStore(
  // ...features existentes...
  with<Widget>(),
);

export type {
  <Widget>IdentificationState,
  <Widget>PesosState,
  <Widget>AcondicionamientoState,
} from '../+state/execution-state.models';
```

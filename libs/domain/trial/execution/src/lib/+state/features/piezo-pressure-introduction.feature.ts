import { MeasureUnitEnum, TimeUnitEnum } from '@intaqalab/models';
import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { ShotDifferentialPressureData, ShotPiezoPressureItem, ShotTimesData } from '../../execution/models';
import type {
  PiezoPosicionState,
  PiezoPressureDataState,
  PiezoPressureIntroductionState,
} from '../execution-state.models';

interface PiezoPressureIntroductionSlice {
  piezoPressureIntroduction: PiezoPressureIntroductionState;
}

const defaultPiezoPressures: ShotPiezoPressureItem[] = [
  {
    position: 'CLOSING',
    piezoelectricSensorId: null,
    amplifierId: null,
    dataAcquisitionSystemId: null,
    maxPressure: null,
    maxPressureUnit: MeasureUnitEnum.BAR,
    observations: null,
  },
  {
    position: 'HALF',
    piezoelectricSensorId: null,
    amplifierId: null,
    dataAcquisitionSystemId: null,
    maxPressure: null,
    maxPressureUnit: MeasureUnitEnum.BAR,
    observations: null,
  },
  {
    position: 'SHELL',
    piezoelectricSensorId: null,
    amplifierId: null,
    dataAcquisitionSystemId: null,
    maxPressure: null,
    maxPressureUnit: MeasureUnitEnum.BAR,
    observations: null,
  },
  {
    position: 'OTHER',
    piezoelectricSensorId: null,
    amplifierId: null,
    dataAcquisitionSystemId: null,
    maxPressure: null,
    maxPressureUnit: MeasureUnitEnum.BAR,
    observations: null,
  },
];

const defaultDifferentialPressureData: ShotDifferentialPressureData = {
  positiveDifferentialPressure: null,
  positiveDifferentialPressureUnit: MeasureUnitEnum.BAR,
  negativeDifferentialPressure: null,
  negativeDifferentialPressureUnit: MeasureUnitEnum.BAR,
  observations: null,
};

const defaultTimesData: ShotTimesData = {
  actionTime: null,
  actionTimeUnit: TimeUnitEnum.MS,
  delayTime: null,
  delayTimeUnit: TimeUnitEnum.MS,
  observations: null,
};

const initialState: PiezoPressureIntroductionSlice = {
  piezoPressureIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    piezoPressures: defaultPiezoPressures,
    differentialPressureData: defaultDifferentialPressureData,
    timesData: defaultTimesData,
    presiones: [],
    cierre: {
      captador: null,
      amplificador: null,
      registrador: null,
      presionMaxima: null,
      tiempoAccion: null,
      tiempoRetardo: null,
    },
    intermedio: {
      captador: null,
      amplificador: null,
      registrador: null,
      presionMaxima: null,
      tiempoAccion: null,
      tiempoRetardo: null,
    },
    culote: {
      captador: null,
      amplificador: null,
      registrador: null,
      presionMaxima: null,
      tiempoAccion: null,
      tiempoRetardo: null,
    },
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    captadorOptions: [
      { value: 'captador-kistler-6215', label: 'Kistler 6215 / SN001' },
      { value: 'captador-kistler-6215b', label: 'Kistler 6215B / SN002' },
    ],
    amplificadorOptions: [
      { value: 'amp-kistler-5018', label: 'Kistler 5018 / SN101' },
      { value: 'amp-kistler-5019', label: 'Kistler 5019 / SN102' },
    ],
    registradorOptions: [
      { value: 'reg-yokogawa-dl850', label: 'Yokogawa DL850 / SN201' },
      { value: 'reg-yokogawa-dl9040', label: 'Yokogawa DL9040 / SN202' },
    ],
  },
};

export function withPiezoPressureIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Introducción datos presión piezoeléctrica */
      updatePiezoPressureIntroduction(updates: Partial<PiezoPressureIntroductionState>): void {
        patchState(store, (state) => ({
          piezoPressureIntroduction: { ...state.piezoPressureIntroduction, ...updates },
        }));
      },

      /** Reemplaza la lista completa de presiones piezoeléctricas */
      setPiezoPressures(piezoPressures: ShotPiezoPressureItem[]): void {
        patchState(store, (state) => ({
          piezoPressureIntroduction: { ...state.piezoPressureIntroduction, piezoPressures },
        }));
      },

      /** Actualiza o inserta la entrada para una posición concreta */
      updatePiezoPressureForPosition(position: string, updates: Partial<ShotPiezoPressureItem>): void {
        patchState(store, (state) => {
          const list = state.piezoPressureIntroduction.piezoPressures;
          const idx = list.findIndex((item) => item.position?.toUpperCase() === position.toUpperCase());
          const next = [...list];
          if (idx === -1) {
            next.push({
              position,
              maxPressureUnit: MeasureUnitEnum.BAR,
              ...updates,
            });
          } else {
            const current = list[idx];
            if (current) {
              next[idx] = { ...current, ...updates };
            }
          }
          return {
            piezoPressureIntroduction: {
              ...state.piezoPressureIntroduction,
              piezoPressures: next,
            },
          };
        });
      },

      /** Actualiza los datos de presión diferencial */
      setDifferentialPressureData(data: ShotDifferentialPressureData): void {
        patchState(store, (state) => ({
          piezoPressureIntroduction: { ...state.piezoPressureIntroduction, differentialPressureData: data },
        }));
      },

      /** Actualiza los datos de tiempos */
      setTimesData(data: ShotTimesData): void {
        patchState(store, (state) => ({
          piezoPressureIntroduction: { ...state.piezoPressureIntroduction, timesData: data },
        }));
      },

      /** Reemplaza los drafts de presión recibidos para el disparo seleccionado (legacy) */
      setPiezoPressureData(presiones: PiezoPressureDataState[]): void {
        patchState(store, (state) => ({
          piezoPressureIntroduction: { ...state.piezoPressureIntroduction, presiones },
        }));
      },

      /** Conserva en memoria los cambios del captador actualmente editado (legacy) */
      upsertPiezoPressureData(entry: PiezoPressureDataState): void {
        patchState(store, (state) => {
          const currentEntries = state.piezoPressureIntroduction.presiones ?? [];
          const entryIndex = currentEntries.findIndex(
            (currentEntry) =>
              currentEntry.piezoelectricSensorId === entry.piezoelectricSensorId ||
              (entry.piezoelectricSensorId !== null && currentEntry.piezoelectricSensorId === null),
          );
          const nextEntries = [...currentEntries];

          if (entryIndex === -1) {
            nextEntries.push(entry);
          } else {
            nextEntries[entryIndex] = entry;
          }

          return {
            piezoPressureIntroduction: {
              ...state.piezoPressureIntroduction,
              presiones: nextEntries,
            },
          };
        });
      },

      /** Actualiza los datos de una posición piezoeléctrica concreta (legacy) */
      updatePiezoPressurePosicion(
        posicion: 'cierre' | 'intermedio' | 'culote',
        updates: Partial<PiezoPosicionState>,
      ): void {
        patchState(store, (state) => {
          const currentPos = state.piezoPressureIntroduction[posicion] ?? {
            captador: null,
            amplificador: null,
            registrador: null,
            presionMaxima: null,
            tiempoAccion: null,
            tiempoRetardo: null,
          };
          return {
            piezoPressureIntroduction: {
              ...state.piezoPressureIntroduction,
              [posicion]: { ...currentPos, ...updates },
            },
          };
        });
      },
    })),
  );
}

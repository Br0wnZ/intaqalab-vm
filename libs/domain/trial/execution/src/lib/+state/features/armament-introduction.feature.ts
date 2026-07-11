import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type {
  ArmamentIntroductionState,
  CalibryEquipmentOption,
  CalibryTubeOption,
  CalibryTubeSerialOption,
  CalibryWeaponOption,
  CalibryWeaponSerialOption,
} from '../execution-state.models';

interface ArmamentIntroductionSlice {
  armamentIntroduction: ArmamentIntroductionState;
}

const initialState: ArmamentIntroductionSlice = {
  armamentIntroduction: {
    serie: null,
    disparo: null,
    arma: null,
    serieArma: null,
    tubo: null,
    serieTubo: null,
    equipoAtacado: null,
    equipoRetroceso: null,
    armaOptions: [
      { value: 'arma-01', label: 'Arma 01' },
      { value: 'arma-02', label: 'Arma 02' },
    ],
    serieArmaOptions: [
      { value: 'serie-arma-01', label: 'Serie Arma 01' },
      { value: 'serie-arma-02', label: 'Serie Arma 02' },
    ],
    tuboOptions: [
      { value: 'tubo-01', label: 'Tubo 01' },
      { value: 'tubo-02', label: 'Tubo 02' },
    ],
    serieTuboOptions: [
      { value: 'serie-tubo-01', label: 'Serie Tubo 01' },
      { value: 'serie-tubo-02', label: 'Serie Tubo 02' },
    ],
    equipoAtacadoOptions: [
      { value: 'eq-atac-01', label: 'Equipo Atacado 01' },
      { value: 'eq-atac-02', label: 'Equipo Atacado 02' },
    ],
    equipoRetrocesoOptions: [
      { value: 'eq-retro-01', label: 'Equipo Retroceso 01', family: 'dimensional' },
      { value: 'eq-retro-02', label: 'Equipo Retroceso 02', family: 'length' },
    ],
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
  },
};

export function withArmamentIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Introducción de datos de Armamento */
      updateArmamentIntroduction(updates: Partial<ArmamentIntroductionState>): void {
        patchState(store, (state) => ({
          armamentIntroduction: { ...state.armamentIntroduction, ...updates },
        }));
      },

      /** Reemplaza la lista de armas (cuando se integre con la API de Calibry) */
      setArmamentIntroductionArmaOptions(options: CalibryWeaponOption[]): void {
        patchState(store, (state) => ({
          armamentIntroduction: { ...state.armamentIntroduction, armaOptions: options },
        }));
      },

      /** Reemplaza la lista de números de serie del arma (filtrado por arma seleccionada) */
      setArmamentIntroductionSerieArmaOptions(options: CalibryWeaponSerialOption[]): void {
        patchState(store, (state) => ({
          armamentIntroduction: { ...state.armamentIntroduction, serieArmaOptions: options },
        }));
      },

      /** Reemplaza la lista de tubos (cuando se integre con la API de Calibry) */
      setArmamentIntroductionTuboOptions(options: CalibryTubeOption[]): void {
        patchState(store, (state) => ({
          armamentIntroduction: { ...state.armamentIntroduction, tuboOptions: options },
        }));
      },

      /** Reemplaza la lista de números de serie del tubo (filtrado por tubo seleccionado) */
      setArmamentIntroductionSerieTuboOptions(options: CalibryTubeSerialOption[]): void {
        patchState(store, (state) => ({
          armamentIntroduction: { ...state.armamentIntroduction, serieTuboOptions: options },
        }));
      },

      /** Reemplaza la lista de equipos atacados (cuando se integre con la API de Calibry) */
      setArmamentIntroductionEquipoAtacadoOptions(options: CalibryEquipmentOption[]): void {
        patchState(store, (state) => ({
          armamentIntroduction: { ...state.armamentIntroduction, equipoAtacadoOptions: options },
        }));
      },

      /** Reemplaza la lista de equipos de retroceso (cuando se integre con la API de Calibry) */
      setArmamentIntroductionEquipoRetrocesoOptions(options: CalibryEquipmentOption[]): void {
        patchState(store, (state) => ({
          armamentIntroduction: { ...state.armamentIntroduction, equipoRetrocesoOptions: options },
        }));
      },
    })),
  );
}

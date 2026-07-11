import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type {
  TrayectografiaFuncionamientosState,
  TrayectografiaIntroductionState,
  TrayectografiaTrayectoriaState,
  TrayectografiaTrazasState,
} from '../execution-state.models';

interface TrayectografiaIntroductionSlice {
  trayectografiaIntroduction: TrayectografiaIntroductionState;
}

const initialState: TrayectografiaIntroductionSlice = {
  trayectografiaIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    equipo: null,
    trayectorias: {
      alcance: 20,
      alcanceUnit: 'm',
      deriva: 12,
      derivaUnit: 'm',
      tiempoVuelo: 47,
      tiempoVueloUnit: 's',
      tiempoFuncionamientoEspoleta: 12,
      tiempoFuncionamientoEspoletaUnit: 's',
      alturaFuncionamientoEspoleta: 60,
      alturaFuncionamientoEspoletaUnit: 'm',
      alcanceFuncionamientoEspoleta: 120,
      alcanceFuncionamientoEspoletaUnit: 'm',
      flecha: 4,
      flechaUnit: 'm',
      calificacionVuelo: '3',
      coeficienteAerodinamico: 4,
      tiempoEyeccionBotesFumigenos: 12,
      tiempoEyeccionBotesFumigenosUnit: 's',
      observaciones: null,
    },
    funcionamientos: {
      funcionamientoEspoletasTrayectografia: '4',
      funcionamientoMunicionFumigenaRadar: '5',
      funcionamientoMunicionIluminanteRadar: '8',
      numeroBotesEyectados: 8,
      observaciones: null,
    },
    trazas: {
      tiempoTraza: 12,
      tiempoTrazaUnit: 's',
      existenciaTrazaRadar: null,
      observaciones: null,
    },
    equipoOptions: [
      { value: 'radar-doppler-01', label: 'Radar Doppler 01' },
      { value: 'radar-doppler-02', label: 'Radar Doppler 02' },
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

export function withTrayectografiaIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza el selector (serie/disparo/equipo) del widget Introducción datos trayectografía */
      updateTrayectografiaSelector(
        updates: Partial<Pick<TrayectografiaIntroductionState, 'serie' | 'disparo' | 'equipo' | 'estadoDisparo'>>,
      ): void {
        patchState(store, (state) => ({
          trayectografiaIntroduction: { ...state.trayectografiaIntroduction, ...updates },
        }));
      },

      /** Actualiza los datos del tab Trayectorias */
      updateTrayectografiaTrayectorias(updates: Partial<TrayectografiaTrayectoriaState>): void {
        patchState(store, (state) => ({
          trayectografiaIntroduction: {
            ...state.trayectografiaIntroduction,
            trayectorias: { ...state.trayectografiaIntroduction.trayectorias, ...updates },
          },
        }));
      },

      /** Actualiza los datos del tab Funcionamientos */
      updateTrayectografiaFuncionamientos(updates: Partial<TrayectografiaFuncionamientosState>): void {
        patchState(store, (state) => ({
          trayectografiaIntroduction: {
            ...state.trayectografiaIntroduction,
            funcionamientos: { ...state.trayectografiaIntroduction.funcionamientos, ...updates },
          },
        }));
      },

      /** Actualiza los datos del tab Trazas */
      updateTrayectografiaTrazas(updates: Partial<TrayectografiaTrazasState>): void {
        patchState(store, (state) => ({
          trayectografiaIntroduction: {
            ...state.trayectografiaIntroduction,
            trazas: { ...state.trayectografiaIntroduction.trazas, ...updates },
          },
        }));
      },
    })),
  );
}

import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type {
  MunitionIntroAcondicionamientoState,
  MunitionIntroIdentificationState,
  MunitionIntroPesosState,
  MunitionIntroductionState,
} from '../execution-state.models';

interface MunitionIntroductionSlice {
  munitionIntroduction: MunitionIntroductionState;
}

const initialState: MunitionIntroductionSlice = {
  munitionIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    identificacion: {
      componente: null,
      denominacion: null,
      lote: null,
      numeroCliente: null,
      modoFuncionamiento: null,
      graduacionEspoleta: null,
      observaciones: null,
      denominacionFromPlanning: false,
      loteFromPlanning: false,
      denominacionNotInStock: false,
      loteNotInStock: false,
    },
    pesos: {
      componente: null,
      balanza: null,
      peso: null,
      pesoAnadido: null,
      pesoRetirado: null,
      fechaHora: null,
      rangoPesada: null,
      observaciones: null,
    },
    acondicionamiento: {
      camara: null,
      componente: null,
      fechaHoraEntrada: null,
      fechaHoraSalida: null,
      temperatura: 20,
      temperaturaCorregida: null,
      observaciones: null,
    },
    serieOptions: [
      { value: 'calentamiento', label: 'Calentamiento' },
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    componenteOptions: [
      { value: 'espoleta-01', label: 'Espoleta', category: 'espoleta' },
      { value: 'granada-01', label: 'Granada', category: 'granada' },
      { value: 'polvo-01', label: 'Pólvora', category: 'polvo' },
      { value: 'carga-01', label: 'Carga propulsora', category: 'carga' },
    ],
    denominacionOptions: [
      { value: 'den-01', label: '155mm M107', componenteId: 'granada-01', inStock: true },
      { value: 'den-02', label: 'Espoleta M578', componenteId: 'espoleta-01', inStock: true },
      { value: 'den-03', label: 'Pólvora M232', componenteId: 'polvo-01', inStock: true },
      { value: 'den-04', label: 'Carga L8A1', componenteId: 'carga-01', inStock: true },
    ],
    loteOptions: [
      { value: 'lote-01', label: 'Lote A-2024', denominacionId: 'den-01' },
      { value: 'lote-02', label: 'Lote B-2024', denominacionId: 'den-01' },
      { value: 'lote-03', label: 'Lote C-2025', denominacionId: 'den-02' },
      { value: 'lote-04', label: 'Lote D-2025', denominacionId: 'den-03' },
    ],
    modoFuncionamientoOptions: [
      { value: 'percusion', label: 'Percusión' },
      { value: 'tiempo', label: 'Tiempo' },
      { value: 'ppd', label: 'PPD (Retardo)' },
      { value: 'superpercusion', label: 'Superpercusión' },
    ],
    balanzaOptions: [
      { value: 'bal-01', label: 'Balanza Precisión 500g', rangoMin: 0, rangoMax: 500, unit: 'g' },
      { value: 'bal-02', label: 'Balanza Precisión 2000g', rangoMin: 0, rangoMax: 2000, unit: 'g' },
    ],
    camaraOptions: [
      { value: 'camara-01', label: 'Cámara climática 01', temperatura: 20 },
      { value: 'camara-02', label: 'Cámara climática 02', temperatura: -10 },
      { value: 'sala-01', label: 'Sala climatizada 01', temperatura: 15 },
    ],
  },
};

export function withMunitionIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza selector de serie/disparo del widget Introducción datos municiones */
      updateMunitionIntroductionSelector(updates: Partial<Pick<MunitionIntroductionState, 'serie' | 'disparo'>>): void {
        patchState(store, (state) => ({
          munitionIntroduction: { ...state.munitionIntroduction, ...updates },
        }));
      },

      /** Actualiza el tab Identificación del widget Introducción datos municiones */
      updateMunitionIntroductionIdentification(updates: Partial<MunitionIntroIdentificationState>): void {
        patchState(store, (state) => ({
          munitionIntroduction: {
            ...state.munitionIntroduction,
            identificacion: { ...state.munitionIntroduction.identificacion, ...updates },
          },
        }));
      },

      /** Actualiza el tab Pesos del widget Introducción datos municiones */
      updateMunitionIntroductionPesos(updates: Partial<MunitionIntroPesosState>): void {
        patchState(store, (state) => ({
          munitionIntroduction: {
            ...state.munitionIntroduction,
            pesos: { ...state.munitionIntroduction.pesos, ...updates },
          },
        }));
      },

      /** Actualiza el tab Acondicionamiento del widget Introducción datos municiones */
      updateMunitionIntroductionAcondicionamiento(updates: Partial<MunitionIntroAcondicionamientoState>): void {
        patchState(store, (state) => ({
          munitionIntroduction: {
            ...state.munitionIntroduction,
            acondicionamiento: { ...state.munitionIntroduction.acondicionamiento, ...updates },
          },
        }));
      },
    })),
  );
}

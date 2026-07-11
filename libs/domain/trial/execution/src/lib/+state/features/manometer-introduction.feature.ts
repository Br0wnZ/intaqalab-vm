import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { ManometerIntroductionState } from '../execution-state.models';

interface ManometerIntroductionSlice {
  manometerIntroduction: ManometerIntroductionState;
}

const initialState: ManometerIntroductionSlice = {
  manometerIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    manometro: null,
    crusher: null,
    micrometroPalpador: null,
    h1: null,
    h1Unit: 'μm',
    h2: null,
    h2Unit: 'μm',
    h3: null,
    h3Unit: 'μm',
    h4: null,
    h4Unit: 'μm',
    h5: null,
    h5Unit: 'μm',
    presion: null,
    presionUnit: 'MPa',
    observaciones: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    manometroOptions: [
      { value: 'manometro-PN6-SN001', label: 'Manómetro PN6 / SN001' },
      { value: 'manometro-PN10-SN002', label: 'Manómetro PN10 / SN002' },
    ],
    crusherOptions: [
      { value: 'crusher-cobre-SN101', label: 'Crusher Cobre / SN101' },
      { value: 'crusher-plomo-SN102', label: 'Crusher Plomo / SN102' },
    ],
    micrometroPalpadorOptions: [
      { value: 'micrometro-SN201', label: 'Micrómetro palpador / SN201' },
      { value: 'micrometro-SN202', label: 'Micrómetro palpador / SN202' },
    ],
  },
};

export function withManometerIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Introducción datos presión manómetros */
      updateManometerIntroduction(updates: Partial<ManometerIntroductionState>): void {
        patchState(store, (state) => ({
          manometerIntroduction: { ...state.manometerIntroduction, ...updates },
        }));
      },
    })),
  );
}

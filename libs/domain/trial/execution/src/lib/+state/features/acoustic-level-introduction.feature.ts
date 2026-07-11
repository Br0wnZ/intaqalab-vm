import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { AcousticLevelIntroductionState } from '../execution-state.models';

interface AcousticLevelIntroductionSlice {
  acousticLevelIntroduction: AcousticLevelIntroductionState;
}

const initialState: AcousticLevelIntroductionSlice = {
  acousticLevelIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    equipo: null,
    xSonometro: null,
    ySonometro: null,
    zSonometro: null,
    distanciaSonometroBoca: null,
    distanciaSonometroBocaUnit: 'm',
    nivelAcustico: null,
    nivelAcusticoUnit: 'db',
    observaciones: null,
    equipoOptions: [
      { value: 'sonometro-norsonic-140', label: 'Norsonic 140 / SN001' },
      { value: 'sonometro-norsonic-145', label: 'Norsonic 145 / SN002' },
      { value: 'sonometro-bruel-2270', label: 'Brüel & Kjær 2270 / SN003' },
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

export function withAcousticLevelIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza los campos del widget Introducción datos nivel acústico */
      updateAcousticLevelIntroduction(updates: Partial<AcousticLevelIntroductionState>): void {
        patchState(store, (state) => ({
          acousticLevelIntroduction: { ...state.acousticLevelIntroduction, ...updates },
        }));
      },
    })),
  );
}

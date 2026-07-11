import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { SeguridadState } from '../execution-state.models';

interface SeguridadSlice {
  seguridad: SeguridadState;
}

const initialState: SeguridadSlice = {
  seguridad: {
    serie: 'funcionamiento-1',
    disparo: 'disparo-3',
    estadoDisparo: 'EN_CURSO',
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    camaraOptions: [
      { value: 'camara-001', label: 'Cámara 001' },
      { value: 'camara-002', label: 'Cámara 002' },
      { value: 'camara-003', label: 'Cámara 003' },
    ],
    grabadorOptions: [
      { value: 'grabador-001', label: 'Grabador 001' },
      { value: 'grabador-002', label: 'Grabador 002' },
    ],
    canalOptions: [
      { value: 'canal-1', label: 'Canal 1' },
      { value: 'canal-2', label: 'Canal 2' },
      { value: 'canal-3', label: 'Canal 3' },
      { value: 'canal-4', label: 'Canal 4' },
    ],
    prueba: { camara: null, grabador: null, canal: null, texto: null },
    blanco: { camara: null, grabador: null, canal: null, texto: null },
    boca: { camara: null, grabador: null, canal: null, texto: null },
    cierre: { camara: null, grabador: null, canal: null, texto: null },
    pique: { camara: null, grabador: null, canal: null, texto: null },
  },
};

export function withSeguridad() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza el estado del widget Seguridad */
      updateSeguridad(updates: Partial<SeguridadState>): void {
        patchState(store, (state) => ({
          seguridad: { ...state.seguridad, ...updates },
        }));
      },
    })),
  );
}

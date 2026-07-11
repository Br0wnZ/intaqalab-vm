import { computed } from '@angular/core';
import { patchState, signalStoreFeature, type, withComputed, withMethods, withState } from '@ngrx/signals';

import type { CalibryPiquetaOption, JltMaoState, MaoTopographyState } from '../execution-state.models';

interface JltMaoSlice {
  jltMao: JltMaoState;
}

const initialState: JltMaoSlice = {
  jltMao: {
    serie: null,
    disparo: null,
    ttn: null,
    piqueta: null,
    velocidadInicialTeorica: null,
    distanciaPrevistaPique: null,
    derivaTabular: null,
    tiempoVueloTeorico: null,
    diferenciaAngular: null,
    anguloTiro: null,
    graduacionEspoleta: null,
    alturaFuncionamiento: null,
    distanciaFuncionamiento: null,
    olt: null,
    estadoDisparo: 'EN_CURSO',
    piquetaOptions: [
      { value: 'piq-01', label: 'Piqueta 01', x: 500.0, y: 200.0 },
      { value: 'piq-02', label: 'Piqueta 02', x: 600.0, y: 350.0 },
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

export function withJltMao() {
  return signalStoreFeature(
    { state: type<{ maoTopography: MaoTopographyState }>() },
    withState(initialState),
    withComputed((store) => ({
      /** OLT JLT MAO: si hay pieza + piqueta + diferenciaAngular, se calcula; si no, se usa el valor guardado */
      jltMaoComputedOlt: computed((): number | null => {
        const s = store.jltMao();
        const maoTopo = store.maoTopography();
        const piqueta = s.piquetaOptions.find((p) => p.value === s.piqueta) ?? null;
        if (!piqueta || maoTopo.xPieza === null || maoTopo.yPieza === null || s.diferenciaAngular === null) {
          return s.olt;
        }
        const bearingRad = Math.atan2(piqueta.y - maoTopo.yPieza, piqueta.x - maoTopo.xPieza);
        const bearingMils = bearingRad * (3200 / Math.PI);
        return s.diferenciaAngular + bearingMils;
      }),
    })),
    withMethods((store) => ({
      /** Actualiza los campos del widget JLT MAO */
      updateJltMao(updates: Partial<JltMaoState>): void {
        patchState(store, (state) => ({
          jltMao: { ...state.jltMao, ...updates },
        }));
      },

      /** Reemplaza la lista de piquetas (cuando se integre con la API de Calibry) */
      setJltMaoPiquetaOptions(options: CalibryPiquetaOption[]): void {
        patchState(store, (state) => ({
          jltMao: { ...state.jltMao, piquetaOptions: options },
        }));
      },
    })),
  );
}

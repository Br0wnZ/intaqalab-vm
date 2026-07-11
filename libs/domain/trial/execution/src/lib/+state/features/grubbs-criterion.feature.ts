import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import type { GrubbsCriterionState } from '../execution-state.models';

interface GrubbsCriterionSlice {
  grubbsCriterion: GrubbsCriterionState;
}

const initialState: GrubbsCriterionSlice = {
  grubbsCriterion: {
    serie: null,
    variable: null,
    outliers: [],
    serieOptions: [
      { value: 'func-1', label: 'Funcionamiento I' },
      { value: 'func-2', label: 'Funcionamiento II' },
    ],
    variableOptions: [
      { value: 'velocidad', label: 'Velocidad inicial' },
      { value: 'presion', label: 'Presión máxima' },
    ],
  },
};

export function withGrubbsCriterion() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store) => ({
      /** Actualiza el estado del widget Criterio de Grubbs */
      updateGrubbsCriterion(updates: Partial<GrubbsCriterionState>): void {
        patchState(store, (state) => ({
          grubbsCriterion: { ...state.grubbsCriterion, ...updates },
        }));
      },

      /** Marca un disparo atípico como excluido o incluido */
      setGrubbsOutlierExcluded(shotId: string, excluded: boolean): void {
        patchState(store, (state) => ({
          grubbsCriterion: {
            ...state.grubbsCriterion,
            outliers: state.grubbsCriterion.outliers.map((o) => (o.shotId === shotId ? { ...o, excluded } : o)),
          },
        }));
      },
    })),
  );
}

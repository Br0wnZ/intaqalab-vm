import { computed } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type { JltStatus, TechUnitStatus } from '../execution-state.models';

interface ReadinessSlice {
  techUnits: TechUnitStatus[];
  jltStatus: JltStatus;
}

const initialState: ReadinessSlice = {
  techUnits: [
    {
      id: 'velocidades',
      labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.VELOCIDADES',
      ready: true,
      observations: 'Aquí las observaciones que han hecho',
    },
    {
      id: 'trayectografia',
      labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.TRAYECTOGRAFIA',
      ready: true,
      observations: 'Aquí las observaciones que han hecho',
    },
    {
      id: 'presiones',
      labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.PRESIONES',
      ready: true,
      observations: 'Aquí las observaciones que han hecho',
    },
    {
      id: 'municiones',
      labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.MUNICIONES',
      ready: true,
      observations: 'Aquí las observaciones que han hecho',
    },
    {
      id: 'video',
      labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.VIDEO',
      ready: true,
      observations: 'Aquí las observaciones que han hecho',
    },
    {
      id: 'armamento',
      labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.ARMAMENTO',
      ready: true,
      observations: 'Aquí las observaciones que han hecho',
    },
  ],
  jltStatus: {
    sanitary: false,
    security: false,
    boat: false,
    observations: '',
  },
};

export function withReadiness() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store) => ({
      // Global Readiness (JLT + Tech)
      isReadyForExecution: computed(() => {
        const jlt = store.jltStatus();
        const techReady = store.techUnits().every((u) => u.ready);
        return jlt.sanitary && jlt.security && jlt.boat && techReady;
      }),
    })),
    withMethods((store) => ({
      // --- Widgets Local State Methods ---
      updateTechUnit(id: string, updates: Partial<TechUnitStatus>): void {
        patchState(store, (state) => ({
          techUnits: state.techUnits.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        }));
      },

      updateJltStatus(updates: Partial<JltStatus>): void {
        patchState(store, (state) => ({
          jltStatus: { ...state.jltStatus, ...updates },
        }));
      },
    })),
  );
}

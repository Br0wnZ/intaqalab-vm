import { inject } from '@angular/core';
import { CadenceUnitEnum, SpeedUnitEnum } from '@intaqalab/models';
import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

import { ExecutionService } from '../../services/execution.service';
import type { VelocityIntroductionState } from '../execution-state.models';

interface VelocityIntroductionSlice {
  velocityIntroduction: VelocityIntroductionState;
}

const initialState: VelocityIntroductionSlice = {
  velocityIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    radarDoppler: null,
    antena: null,
    velocidad: null,
    velocidadUnit: SpeedUnitEnum.M_S,
    incertidumbreSoftware: null,
    incertidumbreSoftwareUnit: SpeedUnitEnum.M_S,
    perdida: null,
    perdidaUnit: SpeedUnitEnum.M_S,
    cadencia: null,
    cadenciaUnit: CadenceUnitEnum.SPM,
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
    radarDopplerOptions: [
      { value: 'W700I_SN8302', label: 'W700I_SN8302 / SL-520A_SN6124' },
      { value: 'W700I_SN9001', label: 'W700I_SN9001 / SL-520A_SN7200' },
    ],
    antenaOptions: [
      { value: 'SL520A_SN6124', label: 'W700I_SN8302 / SL-520A_SN6124' },
      { value: 'SL520A_SN7200', label: 'W700I_SN9001 / SL-520A_SN7200' },
    ],
  },
};

export function withVelocityIntroduction() {
  return signalStoreFeature(
    withState(initialState),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      /** Actualiza los campos del widget Introducción datos velocidades */
      updateVelocityIntroduction(updates: Partial<VelocityIntroductionState>): void {
        patchState(store, (state) => ({
          velocityIntroduction: { ...state.velocityIntroduction, ...updates },
        }));
      },

      /** Guarda los datos de velocidad del disparo en el backend */
      saveVelocityIntroduction(fireTrialId: string): void {
        const vel = store.velocityIntroduction();
        if (!vel.serie || !vel.disparo) {
          return;
        }

        executionService.setShotVelocity(fireTrialId, vel.serie, vel.disparo, [
          {
            radarDopplerId: vel.radarDoppler ? Number(vel.radarDoppler) || null : null,
            antennaId: vel.antena ? Number(vel.antena) || null : null,
            initialVelocity: vel.velocidad,
            initialVelocityUnit: vel.velocidadUnit || SpeedUnitEnum.M_S,
            softwareUncertainty: vel.incertidumbreSoftware,
            softwareUncertaintyUnit: vel.incertidumbreSoftwareUnit || SpeedUnitEnum.M_S,
            velocityLoss: vel.perdida,
            velocityLossUnit: vel.perdidaUnit || SpeedUnitEnum.M_S,
            cadence: vel.cadencia,
            cadenceUnit: vel.cadenciaUnit || CadenceUnitEnum.SPM,
            observations: vel.observaciones,
          },
        ]);
      },
    })),
  );
}

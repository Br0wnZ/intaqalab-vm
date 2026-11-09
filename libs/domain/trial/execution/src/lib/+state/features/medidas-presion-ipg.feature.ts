import { computed, inject } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import { ShotIpgPressuresService } from '../../data-access';
import type { ShotIpgPressuresRequest } from '../../execution/models/shot-ipg-pressures.models';
import type { MedidasPresionIpgState } from '../execution-state.models';

interface MedidasPresionIpgSlice {
  medidasPresionIpg: MedidasPresionIpgState;
}

const initialState: MedidasPresionIpgSlice = {
  medidasPresionIpg: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    sensorIpg: null,
    micromodulo: null,
    pmax: null,
    observaciones: null,
    serieOptions: [],
    disparoOptions: [],
    sensorIpgOptions: [
      { value: '21081', label: 'Sensor IPG 01 / SN-IPG-01' },
      { value: '21083', label: 'Sensor IPG 02 / SN-IPG-02' },
    ],
    micromoduloOptions: [
      { value: '21082', label: 'Micromódulo 01 / SN-MIC-01' },
      { value: '21084', label: 'Micromódulo 02 / SN-MIC-02' },
    ],
  },
};

export function withIpgPressureMeasurementsState() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((_store, shotIpgPressuresService = inject(ShotIpgPressuresService)) => ({
      isLoadingShotIpgPressures: computed(() => shotIpgPressuresService.shotIpgPressuresResource.isLoading()),
      isSavingShotIpgPressures: computed(() => shotIpgPressuresService.updateShotIpgPressuresResource.isLoading()),
    })),
    withMethods((store, shotIpgPressuresService = inject(ShotIpgPressuresService)) => ({
      async loadShotIpgPressures(fireTrialId: string, seriesId: string, shotId: string): Promise<void> {
        try {
          const response = await shotIpgPressuresService.fetchShotIpgPressures(fireTrialId, seriesId, shotId);
          if (response?.ipgPressuresData?.length) {
            const data = response.ipgPressuresData[0];
            patchState(store, (state) => ({
              medidasPresionIpg: {
                ...state.medidasPresionIpg,
                sensorIpg:
                  data.ipgSensorId !== null && data.ipgSensorId !== undefined
                    ? String(data.ipgSensorId)
                    : state.medidasPresionIpg.sensorIpg,
                micromodulo:
                  data.micromoduleId !== null && data.micromoduleId !== undefined
                    ? String(data.micromoduleId)
                    : state.medidasPresionIpg.micromodulo,
                pmax: data.maxPressure ?? state.medidasPresionIpg.pmax,
                observaciones: data.observations ?? state.medidasPresionIpg.observaciones,
              },
            }));
          }
        } catch (e) {
          console.error('Error loading ShotIpgPressures', e);
        }
      },
      async saveShotIpgPressures(
        fireTrialId: string,
        seriesId: string,
        shotId: string,
        requestBody: ShotIpgPressuresRequest,
      ): Promise<void> {
        await shotIpgPressuresService.updateShotIpgPressures(fireTrialId, seriesId, shotId, requestBody);
      },
      updateMedidasPresionIpgSelector(updates: Partial<Pick<MedidasPresionIpgState, 'serie' | 'disparo'>>): void {
        patchState(store, (state) => ({
          medidasPresionIpg: { ...state.medidasPresionIpg, ...updates },
        }));
      },
      updateMedidasPresionIpg(updates: Partial<MedidasPresionIpgState>): void {
        patchState(store, (state) => ({
          medidasPresionIpg: { ...state.medidasPresionIpg, ...updates },
        }));
      },
      updateIpgPressureMeasurements(updates: Partial<MedidasPresionIpgState>): void {
        patchState(store, (state) => ({
          medidasPresionIpg: { ...state.medidasPresionIpg, ...updates },
        }));
      },
      updateMedidasPresionIpgStateSelector(updates: Partial<Pick<MedidasPresionIpgState, 'serie' | 'disparo'>>): void {
        patchState(store, (state) => ({
          medidasPresionIpg: { ...state.medidasPresionIpg, ...updates },
        }));
      },
      updateMedidasPresionIpgState(updates: Partial<MedidasPresionIpgState>): void {
        patchState(store, (state) => ({
          medidasPresionIpg: { ...state.medidasPresionIpg, ...updates },
        }));
      },
    })),
  );
}

export const withMedidasPresionIpg = withIpgPressureMeasurementsState;

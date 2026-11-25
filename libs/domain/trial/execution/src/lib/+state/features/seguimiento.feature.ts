import { computed, inject } from '@angular/core';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import { CalibryCalculationService } from '../../data-access/execution/analytics/calibry-calculation.service';
import { ExecutionStateService } from '../../data-access/execution/state/execution-state.service';
import type { CalibryCalculation, ShotMeasurementsResponse } from '../../execution/models';
import type { SeguimientoState, SeguimientoTab } from '../execution-state.models';

interface SeguimientoSlice {
  seguimiento: SeguimientoState;
  isRecalculatingCalibry: boolean;
  calibryCalculationError: string | null;
}

const initialState: SeguimientoSlice = {
  isRecalculatingCalibry: false,
  calibryCalculationError: null,
  seguimiento: {
    activeTab: 'p-manom' as SeguimientoTab,
    presionVelocidadUnit: 'MPa',
    pesosUnit: 'g',
    activeTabs: ['velocidades', 'p-manom', 'p-pz-cie', 'p-pz-int', 'p-pz-cul', 'p-otro', 'p-ipg'] as SeguimientoTab[],
    numWeightScales: 2,
    numRadars: 2,
    numManometers: 3,
    numPiezoSensors: 1,
    series: [
      {
        serieId: 'funcionamiento-1',
        serieLabel: 'Serie 1',
        rows: [
          {
            disparo: 1,
            wcValues: [120, 16130],
            wpValues: [261.48, null],
            v0Values: [261.48, 261.48],
            v0c: 261.48,
            pManomValues: [261.48, 261.48, 261.48],
            pManomMean: 261.48,
            pMaxCierre: [261.48],
            pMaxIntermedio: [261.48],
            pMaxCulote: [261.48],
            pMaxOther: [261.48],
          },
          {
            disparo: 2,
            wcValues: [120, null],
            wpValues: [261.48, null],
            v0Values: [261.48, 261.48],
            v0c: 261.48,
            pManomValues: [261.48, 261.48, 261.48],
            pManomMean: 261.48,
            pMaxCierre: [261.48],
            pMaxIntermedio: [261.48],
            pMaxCulote: [261.48],
            pMaxOther: [261.48],
          },
          {
            disparo: 3,
            wcValues: [125, 16130],
            wpValues: [261.48, null],
            v0Values: [261.48, 261.48],
            v0c: 261.48,
            pManomValues: [261.48, 261.48, 261.48],
            pManomMean: 261.48,
            pMaxCierre: [261.48],
            pMaxIntermedio: [261.48],
            pMaxCulote: [261.48],
            pMaxOther: [261.48],
          },
          {
            disparo: 4,
            wcValues: [125, 16130],
            wpValues: [261.48, null],
            v0Values: [261.48, 261.48],
            v0c: 261.48,
            pManomValues: [261.48, 261.48, 261.48],
            pManomMean: 261.48,
            pMaxCierre: [261.48],
            pMaxIntermedio: [261.48],
            pMaxCulote: [261.48],
            pMaxOther: [261.48],
          },
        ],
      },
      {
        serieId: 'funcionamiento-2',
        serieLabel: 'Serie 2',
        rows: [
          {
            disparo: 1,
            wcValues: [122, 16200],
            wpValues: [263.1, null],
            v0Values: [263.1, 262.9],
            v0c: 263.0,
            pManomValues: [268.5, 267.8, 269.1],
            pManomMean: 268.47,
            pMaxCierre: [268.5],
            pMaxIntermedio: [267.8],
            pMaxCulote: [269.1],
            pMaxOther: [268.5],
          },
          {
            disparo: 2,
            wcValues: [122, 16200],
            wpValues: [263.1, null],
            v0Values: [262.8, 263.2],
            v0c: 263.0,
            pManomValues: [268.1, 267.5, 268.9],
            pManomMean: 268.17,
            pMaxCierre: [268.1],
            pMaxIntermedio: [267.5],
            pMaxCulote: [268.9],
            pMaxOther: [268.1],
          },
        ],
      },
    ],
  },
};

export function withSeguimiento() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((_, service = inject(ExecutionStateService)) => ({
      shotMeasurements: computed((): ShotMeasurementsResponse | null => {
        const resource = service.shotMeasurementsResource;
        return resource.hasValue() ? resource.value() : null;
      }),
      shotMeasurementsLoading: computed(() => {
        const resource = service.shotMeasurementsResource;
        return resource.isLoading() && !resource.hasValue();
      }),
      shotMeasurementsRefreshing: computed(() => service.shotMeasurementsResource.isLoading()),
      shotMeasurementsError: computed(() => {
        const resource = service.shotMeasurementsResource;
        return resource.status() === 'error' && !resource.hasValue();
      }),
    })),
    withMethods(
      (
        store,
        executionStateService = inject(ExecutionStateService),
        calibryCalculationService = inject(CalibryCalculationService),
      ) => ({
        /** Actualiza los campos del widget Seguimiento */
        updateSeguimiento(updates: Partial<SeguimientoState>): void {
          patchState(store, (state) => ({
            seguimiento: { ...state.seguimiento, ...updates },
          }));
        },
        loadShotMeasurements(fireTrialId: string): void {
          executionStateService.getShotMeasurements(fireTrialId);
        },
        reloadShotMeasurements(): void {
          executionStateService.reloadShotMeasurements();
        },
        async recalculateCalibryCalculation(fireTrialId: string): Promise<CalibryCalculation | null> {
          if (store.isRecalculatingCalibry()) return null;
          patchState(store, { isRecalculatingCalibry: true, calibryCalculationError: null });
          try {
            const calculation = await calibryCalculationService.recalculateCalibryCalculation(fireTrialId);
            executionStateService.reloadShotMeasurements();
            return calculation;
          } catch (error) {
            patchState(store, {
              calibryCalculationError: error instanceof Error ? error.message : 'Calibry calculation failed',
            });
            return null;
          } finally {
            patchState(store, { isRecalculatingCalibry: false });
          }
        },
      }),
    ),
  );
}

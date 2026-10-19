import { computed, inject } from '@angular/core';
import { SpeedUnitEnum } from '@intaqalab/models';
import { safeResourceValue } from '@intaqalab/utils';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import { ExecutionService } from '../../services/execution.service';
import type { TaradoPresionChartState, TaradoVelocidadChartState } from '../execution-state.models';

interface TaradoChartsSlice {
  taradoVelocidadChart: TaradoVelocidadChartState;
  taradoPresionChart: TaradoPresionChartState;
}

const initialState: TaradoChartsSlice = {
  taradoVelocidadChart: {
    selectedSerie: null,
    selectedDisparo: null,
    selectedVelocidadNominal: '',
    selectedConfiguracion: null,
    dataPoints: [],
    regression: null,
    serieOptions: [],
    disparoOptions: [],
    velocidadNominalOptions: [],
    configuracionOptions: [],
  },
  taradoPresionChart: {
    selectedSerie: null,
    selectedDisparo: null,
    presionBuscada: 335,
    dataPoints: [
      { wc: 400, presion: 246.93, serie: 'Baja Z1', disparo: 3 },
      { wc: 400, presion: 250.96, serie: 'Baja Z1', disparo: 4 },
      { wc: 400, presion: 249.27, serie: 'Baja Z1', disparo: 5 },
      { wc: 500, presion: 276.47, serie: 'Alta Z1', disparo: 6 },
      { wc: 500, presion: 279.56, serie: 'Alta Z1', disparo: 7 },
      { wc: 500, presion: 278.99, serie: 'Alta Z1', disparo: 8 },
      { wc: 810, presion: 365.63, serie: 'Baja Z3', disparo: 9 },
      { wc: 810, presion: 364.84, serie: 'Baja Z3', disparo: 10 },
      { wc: 810, presion: 366.12, serie: 'Baja Z3', disparo: 11 },
      { wc: 910, presion: 440.59, serie: 'Alta Z3', disparo: 12 },
      { wc: 910, presion: 440.27, serie: 'Alta Z3', disparo: 13 },
      { wc: 910, presion: 440.65, serie: 'Alta Z3', disparo: 14 },
    ],
    regression: {
      pendiente: 0.28986,
      ordenada: 130.99553,
      correlacion: 0.99841,
      wcTarado: 703.6,
      pesoTarado: 704,
    },
    serieOptions: [
      { value: 'Baja Z1', label: 'Baja Z1' },
      { value: 'Alta Z1', label: 'Alta Z1' },
      { value: 'Baja Z3', label: 'Baja Z3' },
      { value: 'Alta Z3', label: 'Alta Z3' },
    ],
    disparoOptions: [
      { value: '3', label: 'Disparo 3' },
      { value: '4', label: 'Disparo 4' },
      { value: '5', label: 'Disparo 5' },
      { value: '6', label: 'Disparo 6' },
      { value: '7', label: 'Disparo 7' },
      { value: '8', label: 'Disparo 8' },
      { value: '9', label: 'Disparo 9' },
      { value: '10', label: 'Disparo 10' },
      { value: '11', label: 'Disparo 11' },
      { value: '12', label: 'Disparo 12' },
      { value: '13', label: 'Disparo 13' },
      { value: '14', label: 'Disparo 14' },
    ],
  },
};

export function withTaradoCharts() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService)) => ({
      taradoVelocidadChartView: computed(() => {
        const chart = store.taradoVelocidadChart();
        const planningSeries = safeResourceValue(executionService.planningSeriesResource) ?? [];
        const planningConditions = safeResourceValue(executionService.planningConditionsResource);
        const response = safeResourceValue(executionService.propellantChargeAdjustmentResource);
        const configurations = safeResourceValue(executionService.propellantChargeAdjustmentConfigurationsResource);
        const seriesByShotId = new Map<string, { serieId: string; globalNumber: number | undefined }>();

        planningSeries.forEach((serie) => {
          (serie.shots ?? []).forEach((shot) => {
            seriesByShotId.set(shot.id, { serieId: serie.id, globalNumber: shot.globalNumber });
          });
        });

        const dataPoints =
          response?.points.flatMap((point, index) => {
            const planningShot = seriesByShotId.get(point.shotId);
            if (!planningShot) return [];
            return [
              {
                shotId: point.shotId,
                wc: point.powderWeight,
                v0c: point.velocity,
                serie: planningShot.serieId,
                disparo: planningShot.globalNumber ?? index + 1,
              },
            ];
          }) ?? [];

        const apiRegression = response?.regression;
        const regression = apiRegression
          ? {
              pendiente: apiRegression.slope,
              ordenada: apiRegression.intercept,
              correlacion: Math.sqrt(Math.max(apiRegression.rSquared ?? 0, 0)),
              wcTarado: response.powderWeightAtNominalSpeed ?? null,
              pesoTarado: response.adjustedPowderWeight ?? null,
            }
          : null;
        const nominalSpeedUnit = planningConditions?.units?.nominalSpeed ?? SpeedUnitEnum.M_S;
        const nominalSpeedValues = new Set(
          (planningConditions?.series ?? []).flatMap((serie) =>
            serie.shots.flatMap((shot) =>
              shot.nominalSpeed !== null && shot.nominalSpeed !== undefined && Number.isFinite(shot.nominalSpeed)
                ? [shot.nominalSpeed]
                : [],
            ),
          ),
        );

        return {
          ...chart,
          dataPoints,
          regression,
          serieOptions: planningSeries.map((serie, index) => ({
            value: serie.id,
            label: serie.name || `Serie ${index + 1}`,
          })),
          disparoOptions: planningSeries.flatMap((serie) =>
            (serie.shots ?? []).map((shot, index) => ({
              value: shot.id,
              label: `Disparo ${shot.globalNumber ?? index + 1}`,
            })),
          ),
          velocidadNominalOptions: [...nominalSpeedValues]
            .sort((first, second) => first - second)
            .map((speed) => ({
              value: String(speed),
              label: `${speed} ${nominalSpeedUnit === SpeedUnitEnum.KM_H ? 'km/h' : 'm/s'}`,
            })),
          configuracionOptions: (configurations ?? []).map((configuration) => ({
            value: configuration.configurationId,
            label: configuration.name,
          })),
        };
      }),
    })),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      /** Actualiza el estado del widget Gráfica Tarado - Velocidad */
      updateTaradoVelocidadChart(updates: Partial<TaradoVelocidadChartState>): void {
        patchState(store, (state) => ({
          taradoVelocidadChart: { ...state.taradoVelocidadChart, ...updates },
        }));
      },

      loadTaradoVelocidadChart(fireTrialId: string): void {
        executionService.listPropellantChargeAdjustmentConfigurations(fireTrialId);
        this.calculateTaradoVelocidadChart(fireTrialId);
      },

      calculateTaradoVelocidadChart(fireTrialId: string): void {
        const planningSeries = safeResourceValue(executionService.planningSeriesResource);
        const planningConditions = safeResourceValue(executionService.planningConditionsResource);
        const chart = store.taradoVelocidadChart();
        if (!planningSeries || !planningConditions) return;

        const shotIds = planningSeries.flatMap((serie) => {
          if (chart.selectedSerie?.length && !chart.selectedSerie.includes(serie.id)) return [];
          return (serie.shots ?? [])
            .filter((shot) => {
              if (!chart.selectedDisparo?.length) return true;
              return (
                chart.selectedDisparo.includes(shot.id) ||
                chart.selectedDisparo.includes(String(shot.globalNumber ?? ''))
              );
            })
            .map((shot) => shot.id);
        });

        if (shotIds.length === 0) return;
        const selectedNominalSpeed = chart.selectedVelocidadNominal?.trim();
        const nominalSpeeds = new Set(
          planningConditions.series.flatMap((serie) =>
            serie.shots.flatMap((shot) =>
              shotIds.includes(shot.shotId) &&
              shot.nominalSpeed !== null &&
              shot.nominalSpeed !== undefined &&
              Number.isFinite(shot.nominalSpeed)
                ? [shot.nominalSpeed]
                : [],
            ),
          ),
        );
        const nominalSpeed = selectedNominalSpeed
          ? Number(selectedNominalSpeed)
          : nominalSpeeds.size === 1
            ? [...nominalSpeeds][0]
            : undefined;
        if (nominalSpeed === undefined || !Number.isFinite(nominalSpeed)) return;
        executionService.getPropellantChargeAdjustment(fireTrialId, {
          shotIds: [...new Set(shotIds)],
          nominalSpeed,
          nominalSpeedUnit: planningConditions.units?.nominalSpeed ?? SpeedUnitEnum.M_S,
        });
      },

      /** Actualiza los campos del widget Gráfica Tarado - Presiones */
      updateTaradoPresionChart(updates: Partial<TaradoPresionChartState>): void {
        patchState(store, (state) => ({
          taradoPresionChart: { ...state.taradoPresionChart, ...updates },
        }));
      },
    })),
  );
}

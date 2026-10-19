import { computed, inject } from '@angular/core';
import { safeResourceValue } from '@intaqalab/utils';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import { ExecutionService } from '../../services/execution.service';
import type { UniformidadChartState } from '../execution-state.models';

interface UniformidadChartSlice {
  uniformidadChart: UniformidadChartState;
}

const initialState: UniformidadChartSlice = {
  uniformidadChart: {
    selectedConfig: null,
    selectedSerie: null,
    selectedDisparo: null,
    dataPoints: [],
    configOptions: [],
    serieOptions: [],
    disparoOptions: [],
  },
};

export function withUniformidadChart() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService)) => ({
      uniformidadChartView: computed(() => {
        const chart = store.uniformidadChart();
        const configurations =
          safeResourceValue(executionService.propellantChargeAdjustmentConfigurationsResource) ?? [];
        const response = executionService.velocityUniformityResource.isLoading()
          ? null
          : safeResourceValue(executionService.velocityUniformityResource);
        const planningSeries = safeResourceValue(executionService.planningSeriesResource) ?? [];
        const shotLookup = new Map(
          planningSeries.flatMap((serie) =>
            (serie.shots ?? []).map(
              (shot, index) => [shot.id, { serieId: serie.id, globalNumber: shot.globalNumber ?? index + 1 }] as const,
            ),
          ),
        );

        return {
          ...chart,
          configOptions: configurations.map((configuration) => ({
            id: configuration.configurationId,
            label: configuration.name,
            velocidadNominal: configuration.nominalSpeed,
            pendiente: configuration.configurationId === chart.selectedConfig ? (response?.slope ?? null) : null,
            wcTarado:
              configuration.configurationId === chart.selectedConfig ? (response?.adjustedPowderWeight ?? null) : null,
          })),
          serieOptions: planningSeries.map((serie, index) => ({
            value: serie.id,
            label: serie.name?.trim() || `Serie ${index + 1}`,
          })),
          disparoOptions: planningSeries.flatMap((serie) =>
            (serie.shots ?? []).map((shot, index) => ({
              value: shot.id,
              label: `Disparo ${shot.globalNumber ?? index + 1}`,
            })),
          ),
          dataPoints:
            response?.points.flatMap((point) => {
              const shot = shotLookup.get(point.shotId);
              if (!shot) return [];
              return [
                {
                  shotId: point.shotId,
                  wc: point.powderWeight,
                  v0c: point.velocity,
                  serie: shot.serieId,
                  disparo: shot.globalNumber,
                },
              ];
            }) ?? [],
          response: response ?? null,
        };
      }),
    })),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      /** Actualiza los campos del widget Gráfica Uniformidad */
      updateUniformidadChart(updates: Partial<UniformidadChartState>): void {
        patchState(store, (state) => ({
          uniformidadChart: { ...state.uniformidadChart, ...updates },
        }));
      },

      loadUniformidadChart(fireTrialId: string): void {
        executionService.listPropellantChargeAdjustmentConfigurations(fireTrialId);
      },

      calculateUniformidadChart(fireTrialId: string): void {
        const chart = store.uniformidadChart();
        if (!chart.selectedConfig || !chart.selectedDisparo?.length) return;

        const planningSeries = safeResourceValue(executionService.planningSeriesResource) ?? [];
        const selectedShotIds = new Set(chart.selectedDisparo);
        const shotIds = planningSeries.flatMap((serie) => {
          if (chart.selectedSerie && serie.id !== chart.selectedSerie) return [];
          return (serie.shots ?? []).flatMap((shot, index) =>
            selectedShotIds.has(shot.id) || selectedShotIds.has(String(shot.globalNumber ?? index + 1))
              ? [shot.id]
              : [],
          );
        });
        const uniqueShotIds = [...new Set(shotIds)];
        if (uniqueShotIds.length === 0) return;

        executionService.getVelocityUniformity(fireTrialId, {
          configurationId: chart.selectedConfig,
          shotIds: uniqueShotIds,
        });
      },

      clearUniformidadChartCalculation(): void {
        executionService.clearVelocityUniformity();
      },
    })),
  );
}

import type { SeguimientoSerieData, SeguimientoShotRow } from '../../../+state/execution-state.models';
import type { PlanningSeriesItem, ShotMeasurementsResponse } from '../../../services/execution.service';

export const mapShotMeasurements = (
  response: ShotMeasurementsResponse,
  planningSeries: readonly PlanningSeriesItem[],
): SeguimientoSerieData[] =>
  response.series.map((series) => {
    const plannedSeries = planningSeries.find((item) => item.id === series.seriesId);

    return {
      serieId: series.seriesId,
      serieLabel: plannedSeries?.name || series.seriesId,
      rows: series.shots.map((shot, index): SeguimientoShotRow => {
        const plannedShot = plannedSeries?.shots?.find((item) => item.id === shot.shotId);
        const velocities = shot.velocities.map((item) => item.initialVelocity);
        const definedVelocities = velocities.filter((value): value is number => value !== null);
        const averageVelocity =
          definedVelocities.length > 0
            ? definedVelocities.reduce((sum, value) => sum + value, 0) / definedVelocities.length
            : null;

        return {
          disparo: plannedShot?.globalNumber ?? index + 1,
          wcValues: shot.powderWeights.map((item) => item.weight),
          wpValues: shot.projectileWeights.map((item) => item.weight),
          v0Values: velocities,
          v0c: averageVelocity,
          pManomValues: [],
          pManomMean: null,
          pMaxCierre: shot.piezoPressures
            .filter((item) => item.position === 'CLOSING')
            .map((item) => item.maxPressure ?? null),
          pMaxIntermedio: shot.piezoPressures
            .filter((item) => item.position === 'HALF')
            .map((item) => item.maxPressure ?? null),
          pMaxCulote: shot.piezoPressures
            .filter((item) => item.position === 'SHELL')
            .map((item) => item.maxPressure ?? null),
          pMaxOther: shot.piezoPressures
            .filter((item) => item.position === 'OTHER')
            .map((item) => item.maxPressure ?? null),
        };
      }),
    };
  });

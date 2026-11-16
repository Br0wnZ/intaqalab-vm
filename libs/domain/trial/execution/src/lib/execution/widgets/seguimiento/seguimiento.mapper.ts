import type { TrialMeasuresResponse } from '@intaqalab/data-access-planning';
import type { MeasureUnitEnum } from '@intaqalab/models';
import { PressureUnitEnum, SpeedUnitEnum } from '@intaqalab/models';

import type { SeguimientoSerieData, SeguimientoShotRow, SeguimientoTab } from '../../../+state/execution-state.models';
import type { PlanningSeriesItem } from '../../../services/execution.service';
import type { ShotMeasurementsResponse } from '../../models/execution-runtime.models';

const MEASURE_TABS = [
  { value: 'velocidades', code: 'VELOCITY' },
  { value: 'p-manom', code: 'MANOMETER' },
  { value: 'p-pz-cie', code: 'CLOSING' },
  { value: 'p-pz-int', code: 'HALF' },
  { value: 'p-pz-cul', code: 'SHELL' },
  { value: 'p-otro', code: 'OTHER' },
  { value: 'p-ipg', code: 'IPG' },
] as const satisfies readonly { value: SeguimientoTab; code: string }[];

const getPlannedMeasures = (response: TrialMeasuresResponse | undefined) =>
  response?.series.flatMap((series) => Object.values(series.measures).flat()) ?? [];

const matchesTab = (magnitudeCode: string | null | undefined, tab: SeguimientoTab): boolean => {
  const option = MEASURE_TABS.find((item) => item.value === tab);
  return Boolean(magnitudeCode && !magnitudeCode.includes('CAMERA') && option && magnitudeCode.includes(option.code));
};

export const getSeguimientoTabs = (response: TrialMeasuresResponse | undefined): SeguimientoTab[] => {
  const measures = getPlannedMeasures(response);
  return MEASURE_TABS.filter((tab) => measures.some((measure) => matchesTab(measure.magnitudeCode, tab.value))).map(
    (tab) => tab.value,
  );
};

export const getSeguimientoUnits = (
  response: TrialMeasuresResponse | undefined,
  tab: SeguimientoTab,
): MeasureUnitEnum[] => {
  const units = new Set(
    getPlannedMeasures(response)
      .filter((measure) => matchesTab(measure.magnitudeCode, tab))
      .map((measure) => measure.measureUnit),
  );
  const allowedUnits = tab === 'velocidades' ? Object.values(SpeedUnitEnum) : Object.values(PressureUnitEnum);
  return allowedUnits.filter((unit) => units.has(unit));
};

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

import type { SeriesArmamentData, ShotArmamentData, TrialArmamentResponse } from '../models/planning-armament.model';
import type {
  MeasureData,
  MeasureFamilyKey,
  SeriesMeasuresData,
  TrialMeasuresResponse,
} from '../models/planning-measures.model';
import type { MunitionConfigResponse, TrialMunitionsRawItem } from '../models/planning-munitions.model';
import type { PlanningSeriesItem, PlanningSeriesShotItem } from '../models/planning-series.model';

/**
 * Selectores puros sobre los modelos raw del GET de planning.
 * Sin dependencias de Angular: reutilizables e inmediatamente testables.
 */

/** Devuelve la serie planificada por su id. */
export function getSeriesById(
  series: readonly PlanningSeriesItem[] | null | undefined,
  seriesId: string,
): PlanningSeriesItem | undefined {
  if (!series) return undefined;
  return series.find((serie) => serie.id === seriesId);
}

/** Devuelve un disparo por su id buscando en todas las series. */
export function getShotById(
  series: readonly PlanningSeriesItem[] | null | undefined,
  shotId: string,
): PlanningSeriesShotItem | undefined {
  if (!series) return undefined;
  for (const serie of series) {
    const shot = serie.shots?.find((candidate) => candidate.id === shotId);
    if (shot) return shot;
  }
  return undefined;
}

/**
 * Aplana y ordena todos los disparos de la prueba por `globalNumber` ascendente.
 * Los disparos sin `globalNumber` se dejan al final en su orden de origen.
 */
export function flattenSeriesShots(series: readonly PlanningSeriesItem[] | null | undefined): PlanningSeriesShotItem[] {
  if (!series) return [];
  return series
    .flatMap((serie) => serie.shots ?? [])
    .filter((shot): shot is PlanningSeriesShotItem => Boolean(shot))
    .sort(
      (left, right) => (left.globalNumber ?? Number.MAX_SAFE_INTEGER) - (right.globalNumber ?? Number.MAX_SAFE_INTEGER),
    );
}

/** Devuelve todas las medidas de una familia concreta para la serie indicada. */
export function getMeasuresForFamily(
  measures: TrialMeasuresResponse | null | undefined,
  seriesId: string,
  family: MeasureFamilyKey,
): MeasureData[] {
  const seriesMeasures = findSeriesMeasures(measures, seriesId);
  if (!seriesMeasures) return [];
  return [...seriesMeasures.measures[family]];
}

/** Devuelve la medida planificada de una serie por su `magnitudeCode` (p. ej. `BAL_INITIAL_VELOCITY`). */
export function getMeasureByMagnitudeCode(
  measures: TrialMeasuresResponse | null | undefined,
  seriesId: string,
  magnitudeCode: string,
): MeasureData | undefined {
  const seriesMeasures = findSeriesMeasures(measures, seriesId);
  if (!seriesMeasures) return undefined;
  const families = seriesMeasures.measures;
  const allMeasures = [
    ...families.topographyMeasures,
    ...families.munitionsMeasures,
    ...families.armamentMeasures,
    ...families.ballisticsMeasures,
  ];
  return allMeasures.find((measure) => measure.magnitudeCode === magnitudeCode);
}

function findSeriesMeasures(
  measures: TrialMeasuresResponse | null | undefined,
  seriesId: string,
): SeriesMeasuresData | undefined {
  if (!measures?.series) return undefined;
  return measures.series.find((entry) => entry.seriesId === seriesId);
}

/**
 * Devuelve las configuraciones de munición asignadas al disparo indicado.
 * Una configuración sin `assignedShotIds` (o con lista vacía) aplica a todos los disparos.
 */
export function getMunitionConfigsByShotId(
  munitions: TrialMunitionsRawItem | null | undefined,
  seriesId: string,
  shotId: string,
): MunitionConfigResponse[] {
  const series = munitions?.series.find((entry) => entry.seriesId === seriesId);
  if (!series) return [];
  return series.configurations.filter((config) => isConfigAssignedToShot(config, shotId));
}

function isConfigAssignedToShot(config: MunitionConfigResponse, shotId: string): boolean {
  const assignedShotIds = config.assignedShotIds;
  if (!Array.isArray(assignedShotIds) || assignedShotIds.length === 0) return true;
  return assignedShotIds.includes(shotId);
}

/** Devuelve el armamento planificado de un disparo concreto. */
export function getArmamentByShotId(
  armament: TrialArmamentResponse | null | undefined,
  seriesId: string,
  shotId: string,
): ShotArmamentData | undefined {
  const series: SeriesArmamentData | undefined = armament?.series.find((entry) => entry.seriesId === seriesId);
  if (!series) return undefined;
  return series.shots.find((shot) => shot.shotId === shotId);
}

/** Estilo de etiqueta de disparo: `Disparo 5` (plain) o `Disparo #05` (padded). */
export type ShotLabelStyle = 'plain' | 'padded';

/**
 * Etiqueta visible de un disparo: usa `globalNumber` y, si falta, la posición (1-based).
 * Única implementación del patrón repetido en los selectores de disparo de execution.
 */
export function formatShotLabel(
  globalNumber: number | null | undefined,
  index: number,
  style: ShotLabelStyle = 'plain',
): string {
  const shotNumber = globalNumber ?? index + 1;
  return style === 'padded' ? `Disparo #${String(shotNumber).padStart(2, '0')}` : `Disparo ${shotNumber}`;
}

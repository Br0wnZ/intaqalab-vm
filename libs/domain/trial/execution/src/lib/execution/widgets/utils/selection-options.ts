import {
  type PlanningSeriesItem,
  type PlanningSeriesShotItem,
  type TrialShotsHandle,
  formatShotLabel,
} from '@intaqalab/data-access-planning';

export type PlanningSeriesSource = PlanningSeriesItem[] | TrialShotsHandle | null | undefined;

export interface ShotSelectionOption {
  value: string;
  label: string;
}

export interface ShotSelection {
  serie: string | null;
  disparo: string | null;
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export function mapRadarSeriesToOptions(
  responseSeries: Array<{ seriesId: string }>,
  planningSeries: PlanningSeriesItem[],
): ShotSelectionOption[] {
  return responseSeries
    .map((serie, responseIndex) => {
      const planningIndex = planningSeries.findIndex((item) => item.id === serie.seriesId);
      const plannedSerie = planningSeries[planningIndex];

      return {
        value: serie.seriesId,
        label: `Serie ${plannedSerie?.executionOrder ?? responseIndex + 1}`,
        order: plannedSerie?.executionOrder ?? (planningIndex >= 0 ? planningIndex + 1 : responseIndex + 1),
        responseIndex,
      };
    })
    .sort((left, right) => left.order - right.order || left.responseIndex - right.responseIndex)
    .map(({ value, label }) => ({ value, label }));
}

export function mapRadarShotsToOptions(
  responseShots: Array<{ shotId: string }>,
  planningShots: PlanningSeriesShotItem[],
): ShotSelectionOption[] {
  return responseShots
    .map((shot, responseIndex) => {
      const planningIndex = planningShots.findIndex((item) => item.id === shot.shotId);
      const plannedShot = planningShots[planningIndex];
      const order = plannedShot?.globalNumber ?? (planningIndex >= 0 ? planningIndex + 1 : responseIndex + 1);

      return {
        value: shot.shotId,
        label: formatShotLabel(plannedShot?.globalNumber, planningIndex >= 0 ? planningIndex : responseIndex),
        order,
        responseIndex,
      };
    })
    .sort((left, right) => left.order - right.order || left.responseIndex - right.responseIndex)
    .map(({ value, label }) => ({ value, label }));
}

export function resolveInitialShotSelection(params: {
  seriesOptions: ShotSelectionOption[];
  activeSerieId: string | null;
  activeShotId: string | null;
  getShotOptions: (serieId: string) => ShotSelectionOption[];
}): ShotSelection {
  const { seriesOptions, activeSerieId, activeShotId, getShotOptions } = params;
  if (activeSerieId && activeShotId) {
    return { serie: activeSerieId, disparo: activeShotId };
  }

  const serie = seriesOptions[0]?.value ?? null;
  return { serie, disparo: serie ? (getShotOptions(serie)[0]?.value ?? null) : null };
}

function isTrialShotsHandle(source: unknown): source is TrialShotsHandle {
  return (
    typeof source === 'object' &&
    source !== null &&
    'series' in source &&
    typeof (source as { series?: unknown }).series === 'function'
  );
}

function resolvePlanningSeries(source: PlanningSeriesSource): PlanningSeriesItem[] | null | undefined {
  if (source === null) {
    return undefined;
  }
  if (Array.isArray(source)) {
    return source;
  }
  if (isTrialShotsHandle(source)) {
    return source.series();
  }
  return undefined;
}

/**
 * Mapea las series de planificación a opciones para el selector.
 * Acepta array de series o el handle `TrialShotsHandle` devuelto por `injectTrialShots()`.
 */
export function mapPlanningSeriesToOptions(
  planningSeries?: PlanningSeriesSource,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> {
  const series = resolvePlanningSeries(planningSeries);
  if (series?.length) {
    return series.map((serie, index) => ({
      value: serie.id,
      label: serie.name?.trim() || `Serie ${index + 1}`,
    }));
  }
  return fallbackOptions;
}

/**
 * Mapea los disparos de una serie a opciones para el selector.
 */
export function mapShotsToDisparoOptions(
  shots?: Array<{ shotId?: string; id?: string; globalNumber?: number | null }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
  planningShots: PlanningSeriesShotItem[] | null | undefined = [],
): Array<{ value: string; label: string }> {
  if (shots?.length) {
    const planningNumbersByShotId = new Map((planningShots ?? []).map((shot) => [shot.id, shot.globalNumber]));
    return shots.map((shot, index) => {
      const shotId = shot.shotId ?? shot.id ?? '';
      const globalNumber = planningNumbersByShotId.get(shotId) ?? shot.globalNumber ?? index + 1;
      return {
        value: shot.shotId ?? shot.id ?? `disparo-${index + 1}`,
        label: `Disparo ${globalNumber}`,
      };
    });
  }
  return fallbackOptions;
}

/**
 * Applies planning global numbers to stored shot options by shot ID.
 */
export function mapShotOptionsToPlanningNumbers(
  options: Array<{ value: string; label: string }>,
  planningShots: PlanningSeriesShotItem[] | null | undefined = [],
): Array<{ value: string; label: string }> {
  const planningNumbersByShotId = new Map(
    (planningShots ?? []).map((shot, index) => [shot.id, { globalNumber: shot.globalNumber, index }]),
  );

  return options.map((option) => {
    const planningShot = planningNumbersByShotId.get(option.value);
    return planningShot
      ? { ...option, label: `Disparo ${planningShot.globalNumber ?? planningShot.index + 1}` }
      : option;
  });
}

/**
 * Construye las opciones de disparo para el selector combinando
 * datos de progreso de ejecución y planificación.
 *
 * Lógica centralizada para todos los widgets de ejecución:
 * 1. Si hay progressShots → usa globalNumber de planningShots vía lookup
 * 2. Si solo hay planningShots → usa directamente (ya traen globalNumber)
 * 3. Fallback → opciones almacenadas con renumeración desde planificación
 */
export function buildDisparoOptions(params: {
  selectedSerie: string | null;
  executionProgress:
    | { series: Array<{ seriesId: string; shots: Array<{ shotId: string; status?: string | null }> }> }
    | null
    | undefined;
  planningSeries: PlanningSeriesSource;
  storedOptions?: Array<{ value: string; label: string }>;
}): Array<{ value: string; label: string }> {
  const { selectedSerie, executionProgress, storedOptions = [] } = params;
  const planningSeries = resolvePlanningSeries(params.planningSeries);
  const planningShots = planningSeries?.find((serie) => serie.id === selectedSerie)?.shots;
  const progressShots = selectedSerie
    ? executionProgress?.series.find((serie) => serie.seriesId === selectedSerie)?.shots
    : undefined;

  if (progressShots?.length) {
    return mapShotsToDisparoOptions(progressShots, storedOptions, planningShots);
  }
  if (planningShots?.length) {
    return mapShotsToDisparoOptions(planningShots, storedOptions);
  }
  return mapShotOptionsToPlanningNumbers(storedOptions, planningSeries?.flatMap((serie) => serie.shots ?? []) ?? []);
}

export type SelectedShotState = 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;

export function mapSelectedShotStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'EN_CURSO':
      return 'En curso';
    case 'PENDIENTE':
      return 'Pendiente';
    case 'EJECUTADA':
      return 'Ejecutado';
    default:
      return '';
  }
}

export function mapSelectedShotStatusClass(status: string | null | undefined): string {
  switch (status) {
    case 'EN_CURSO':
      return 'bg-blue-100 text-blue-700';
    case 'PENDIENTE':
      return 'bg-slate-100 text-slate-700';
    case 'EJECUTADA':
      return 'bg-green-100 text-green-700';
    default:
      return '';
  }
}

/**
 * Resolves the status for the selected shot, preferring active state and execution progress.
 */
export function mapSelectedShotStatus(
  progress:
    | {
        series: Array<{
          seriesId: string;
          shots: Array<{ shotId: string; status?: string | null }>;
        }>;
      }
    | null
    | undefined,
  selectedSerieId: string | null,
  selectedShotId: string | null,
  activeSerieId: string | null,
  activeShotId: string | null,
  fallback: SelectedShotState,
): SelectedShotState {
  if (selectedSerieId && selectedShotId && selectedSerieId === activeSerieId && selectedShotId === activeShotId) {
    return 'EN_CURSO';
  }

  if (!selectedSerieId || !selectedShotId) {
    return fallback;
  }

  const selectedStatus = progress?.series
    .find((serie) => serie.seriesId === selectedSerieId)
    ?.shots.find((shot) => shot.shotId === selectedShotId)?.status;

  switch (selectedStatus) {
    case 'ACTIVE':
      return 'EN_CURSO';
    case 'PENDING':
      return 'PENDIENTE';
    case 'FIRED':
      return 'EJECUTADA';
    default:
      return fallback;
  }
}

/**
 * Mapea las series de planificación a opciones para el selector.
 */
export function mapPlanningSeriesToOptions(
  planningSeries?: Array<{ id: string; name?: string | null }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> {
  if (planningSeries?.length) {
    return planningSeries.map((serie, index) => ({
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
  planningShots: Array<{ id: string; globalNumber?: number | null }> = [],
): Array<{ value: string; label: string }> {
  if (shots?.length) {
    const planningNumbersByShotId = new Map(planningShots.map((shot) => [shot.id, shot.globalNumber]));
    return shots.map((shot, index) => ({
      value: shot.shotId ?? shot.id ?? `disparo-${index + 1}`,
      label: `Disparo ${shot.globalNumber ?? planningNumbersByShotId.get(shot.shotId ?? shot.id ?? '') ?? index + 1}`,
    }));
  }
  return fallbackOptions;
}

/**
 * Applies planning global numbers to stored shot options by shot ID.
 */
export function mapShotOptionsToPlanningNumbers(
  options: Array<{ value: string; label: string }>,
  planningShots: Array<{ id: string; globalNumber?: number | null }> = [],
): Array<{ value: string; label: string }> {
  const planningNumbersByShotId = new Map(
    planningShots.map((shot, index) => [shot.id, { globalNumber: shot.globalNumber, index }]),
  );

  return options.map((option) => {
    const planningShot = planningNumbersByShotId.get(option.value);
    return planningShot
      ? { ...option, label: `Disparo ${planningShot.globalNumber ?? planningShot.index + 1}` }
      : option;
  });
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

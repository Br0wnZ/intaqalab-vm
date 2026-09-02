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
  shots?: Array<{ shotId?: string; id?: string }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> {
  if (shots?.length) {
    return shots.map((shot, index) => ({
      value: shot.shotId ?? shot.id ?? `disparo-${index + 1}`,
      label: `Disparo ${index + 1}`,
    }));
  }
  return fallbackOptions;
}

import type { TrialArmamentResponse } from '@intaqalab/data-access-planning';

export function getBulkCompatibleArmamentSeries(planning: TrialArmamentResponse | null): Map<string, string> {
  const compatibleSeries = new Map<string, string>();
  for (const series of planning?.series ?? []) {
    const first = series.shots[0]?.armament;
    const weaponId = normalizeEquipmentId(first?.weaponExternalId);
    const tubeId = first?.tubeExternalId === null ? null : normalizeEquipmentId(first?.tubeExternalId);
    if (weaponId === undefined || tubeId === undefined) continue;
    if (
      series.shots.every(
        ({ armament }) =>
          normalizeEquipmentId(armament?.weaponExternalId) === weaponId &&
          (armament?.tubeExternalId === null ? null : normalizeEquipmentId(armament?.tubeExternalId)) === tubeId,
      )
    ) {
      compatibleSeries.set(series.seriesId, JSON.stringify([weaponId, tubeId]));
    }
  }
  return compatibleSeries;
}

function normalizeEquipmentId(value: unknown): string | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  return String(value).trim() || undefined;
}

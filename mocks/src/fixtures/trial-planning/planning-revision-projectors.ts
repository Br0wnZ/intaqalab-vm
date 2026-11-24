import type { PlanningChange } from '../execution/planning-changes-store';

/**
 * Proyectores puros: aplican cambios `ACCEPTED` sobre una COPIA del dato baseline
 * (nunca mutan el fixture ni el store en memoria). Un cambio solo se aplica si su `field`
 * ya existe como propiedad del destino; si no, se ignora.
 */

function coerceLike(current: unknown, newValue: string | null): unknown {
  if (newValue === null) return null;
  if (typeof current === 'number') {
    const parsed = Number.parseFloat(newValue.replace(',', '.'));
    return Number.isNaN(parsed) ? current : parsed;
  }
  if (typeof current === 'boolean') return newValue === 'true';
  return newValue;
}

function applyChange(target: object, change: PlanningChange): void {
  if (!Object.prototype.hasOwnProperty.call(target, change.field)) return;
  const record = target as Record<string, unknown>;
  record[change.field] = coerceLike(record[change.field], change.newValue);
}

/** `affectedShots` llega como etiquetas `D{n}` (n = globalNumber). */
function matchesShot(shot: { shotId?: string; globalNumber?: number }, change: PlanningChange): boolean {
  if (change.shotId) return shot.shotId === change.shotId;
  const labels = change.affectedShots ?? [];
  return shot.globalNumber !== undefined && labels.includes(`D${shot.globalNumber}`);
}

export function projectPlanningInfo<T extends object>(baseline: T, changes: readonly PlanningChange[]): T {
  const result = structuredClone(baseline);
  changes.filter((c) => c.resourceType === 'PLANNING_INFO').forEach((change) => applyChange(result, change));
  return result;
}

interface ConditionsLike {
  series?: Array<{ shots?: Array<object & { shotId?: string; globalNumber?: number }> }>;
}

export function projectConditions<T extends ConditionsLike>(baseline: T, changes: readonly PlanningChange[]): T {
  const result = structuredClone(baseline);
  const shotChanges = changes.filter((c) => c.resourceType === 'SHOT_CONDITIONS');
  for (const shot of (result.series ?? []).flatMap((serie) => serie.shots ?? [])) {
    shotChanges.filter((change) => matchesShot(shot, change)).forEach((change) => applyChange(shot, change));
  }
  return result;
}

interface MunitionsLike {
  series?: Array<{ configurations?: Array<object & { id?: string; components?: Array<object & { id?: string }> }> }>;
}

export function projectMunitions<T extends MunitionsLike>(baseline: T, changes: readonly PlanningChange[]): T {
  const result = structuredClone(baseline);
  const configurations = (result.series ?? []).flatMap((serie) => serie.configurations ?? []);
  for (const change of changes) {
    if (change.resourceType === 'MUNITION') {
      configurations.filter((c) => c.id === change.resourceId).forEach((c) => applyChange(c, change));
    }
    if (change.resourceType === 'MUNITION_COMPONENT') {
      configurations
        .flatMap((c) => c.components ?? [])
        .filter((component) => component.id === change.resourceId)
        .forEach((component) => applyChange(component, change));
    }
  }
  return result;
}

interface ArmamentLike {
  series?: Array<{ shots?: Array<{ shotId?: string; armament?: object }> }>;
}

export function projectArmament<T extends ArmamentLike>(baseline: T, changes: readonly PlanningChange[]): T {
  const result = structuredClone(baseline);
  const armamentChanges = changes.filter((c) => c.resourceType === 'ARMAMENT');
  for (const shot of (result.series ?? []).flatMap((serie) => serie.shots ?? [])) {
    if (!shot.armament) continue;
    const armament = shot.armament;
    armamentChanges
      .filter((change) => change.shotId !== null && change.shotId === shot.shotId)
      .forEach((change) => applyChange(armament, change));
  }
  return result;
}

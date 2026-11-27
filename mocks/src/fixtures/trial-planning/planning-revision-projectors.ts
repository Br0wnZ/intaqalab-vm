import type { PlanningChange } from '../execution/planning-changes-store';

/**
 * Proyectores puros: aplican cambios `ACCEPTED` sobre una COPIA del dato baseline
 * (nunca mutan el fixture ni el store en memoria). Un cambio solo se aplica si su `field`
 * ya existe como propiedad del destino; si no, se ignora.
 */

function coerceLike(current: unknown, newValue: string | null, field?: string): unknown {
  if (newValue === null) return null;
  if (field === 'stanagCriteriaIds') {
    try {
      const parsed: unknown = JSON.parse(newValue);
      return Array.isArray(parsed) ? parsed : current;
    } catch {
      return current;
    }
  }
  if (typeof current === 'number' || isNumericPlanningField(field)) {
    const parsed = Number(newValue);
    return Number.isNaN(parsed) ? current : parsed;
  }
  if (
    typeof current === 'boolean' ||
    field === 'hypochelometricReviewBefore' ||
    field === 'hypochelometricReviewAfter'
  ) {
    return newValue === 'true';
  }
  return newValue;
}

function isNumericPlanningField(field: string | undefined): boolean {
  if (!field) return false;
  return (
    [
      'maxEmissionDates',
      'percentageTechnicalUnits',
      'percentageEndTrial',
      'daysSignReport',
      'distance',
      'targetInclination',
      'elevation',
      'orientation',
      'angle',
      'range',
      'functioningHeight',
      'nominalSpeed',
      'powderWeight',
      'projectileWeight',
      'maxAllowedErrors',
      'quantity',
      'fuseMeasurement',
      'weaponExternalId',
      'tubeExternalId',
      'lifeUsefulPercentage',
      'tubeLifePercentage',
    ].includes(field) ||
    field.startsWith('ratingCriteria.') ||
    (field.startsWith('reconditioning.') && field !== 'reconditioning.observations')
  );
}

function assignPath(target: object, path: string, value: unknown): void {
  const segments = path.split('.');
  let current = target as Record<string, unknown>;
  for (const segment of segments.slice(0, -1)) {
    const child = current[segment];
    if (typeof child !== 'object' || child === null || Array.isArray(child)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }
  current[segments.at(-1) ?? path] = value;
}

function applyChange(target: object, change: PlanningChange): void {
  const record = target as Record<string, unknown>;
  const field = change.field;
  if (field === 'stanagCriteriaIds') {
    const parsed = coerceLike(record['stanagCriteria'], change.newValue, field);
    if (!Array.isArray(parsed)) return;
    const names = new Map(
      (Array.isArray(record['stanagCriteria']) ? record['stanagCriteria'] : []).flatMap((item) => {
        if (typeof item !== 'object' || item === null) return [];
        const row = item as Record<string, unknown>;
        return typeof row['id'] === 'string' ? [[row['id'], row['name']] as const] : [];
      }),
    );
    record['stanagCriteria'] = parsed.flatMap((id) =>
      typeof id === 'string' ? [{ id, name: typeof names.get(id) === 'string' ? names.get(id) : id }] : [],
    );
    return;
  }

  if (field in record) {
    record[field] = coerceLike(record[field], change.newValue, field);
    return;
  }

  if (field.startsWith('ratingCriteria.')) {
    assignPath(target, field, coerceLike(undefined, change.newValue, field));
    return;
  }
  if (field.includes('.')) {
    assignPath(target, field, coerceLike(undefined, change.newValue, field));
    return;
  }

  const dateControlFields = new Set([
    'maxEmissionDates',
    'percentageTechnicalUnits',
    'percentageEndTrial',
    'daysSignReport',
  ]);
  if (dateControlFields.has(field) && typeof record['dateControl'] === 'object' && record['dateControl'] !== null) {
    const dateControl = record['dateControl'] as Record<string, unknown>;
    dateControl[field] = coerceLike(dateControl[field], change.newValue, field);
    return;
  }

  const unitFields = new Set(['speedUnit', 'pressureUnit']);
  if (
    unitFields.has(field) &&
    typeof record['ratingCriteriaUnits'] === 'object' &&
    record['ratingCriteriaUnits'] !== null
  ) {
    const units = record['ratingCriteriaUnits'] as Record<string, unknown>;
    units[field] = change.newValue;
  }
}

export function projectPlanningInfo<T extends object>(baseline: T, changes: readonly PlanningChange[]): T {
  const result = structuredClone(baseline);
  changes.filter((c) => c.resourceType === 'PLANNING_INFO').forEach((change) => applyChange(result, change));
  return result;
}

interface ConditionsLike {
  units?: object;
  series?: Array<{ shots?: Array<object & { shotId?: string; globalNumber?: number }> }>;
}

export function projectConditions<T extends ConditionsLike>(baseline: T, changes: readonly PlanningChange[]): T {
  const result = structuredClone(baseline);
  const shotChanges = changes.filter((c) => c.resourceType === 'SHOT_CONDITIONS');
  const unitFieldMap: Readonly<Record<string, string>> = {
    distanceUnit: 'distance',
    orientationUnit: 'orientation',
    targetInclinationUnit: 'targetInclination',
    elevationUnit: 'elevation',
    angleUnit: 'angle',
    rangeUnit: 'range',
    functioningHeightUnit: 'functioningHeight',
    nominalSpeedUnit: 'nominalSpeed',
    powderWeightUnit: 'powderWeight',
  };
  const unitChanges = changes.filter(
    (change) => change.resourceType === 'PLANNING_INFO' && change.field in unitFieldMap,
  );
  if (typeof result['units'] === 'object' && result['units'] !== null) {
    const units = result['units'] as Record<string, unknown>;
    for (const change of unitChanges) {
      const unitField = unitFieldMap[change.field];
      if (unitField) units[unitField] = change.newValue;
    }
  }
  for (const shot of (result.series ?? []).flatMap((serie) => serie.shots ?? [])) {
    shotChanges.filter((change) => shot.shotId === change.resourceId).forEach((change) => applyChange(shot, change));
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
      configurations
        .filter((c) => c.id === change.resourceId)
        .forEach((c) => {
          const configuration = c as Record<string, unknown>;
          if (change.field === 'denominationId') {
            const denomination = configuration['denomination'];
            if (typeof denomination === 'object' && denomination !== null) {
              (denomination as Record<string, unknown>)['id'] = change.newValue;
            } else if (typeof denomination === 'string') {
              configuration['denomination'] = change.newValue;
            }
            return;
          }
          if (change.field.startsWith('reconditioning.')) {
            applyChange(c, change);
            return;
          }
          applyChange(c, change);
        });
    }
    if (change.resourceType === 'MUNITION_COMPONENT') {
      configurations
        .flatMap((c) => c.components ?? [])
        .filter((component) => component.id === change.resourceId)
        .forEach((component) => {
          const componentRecord = component as Record<string, unknown>;
          if (change.field === 'typeId') {
            const type = componentRecord['type'];
            if (typeof type === 'object' && type !== null) (type as Record<string, unknown>)['id'] = change.newValue;
            return;
          }
          if (change.field === 'denominationId') {
            const denomination = componentRecord['denomination'];
            if (typeof denomination === 'object' && denomination !== null) {
              (denomination as Record<string, unknown>)['id'] = change.newValue;
            }
            return;
          }
          if (change.field === 'fuseWorkingModeId') {
            const fuseWorkingMode = componentRecord['fuseWorkingMode'];
            if (typeof fuseWorkingMode === 'object' && fuseWorkingMode !== null) {
              (fuseWorkingMode as Record<string, unknown>)['id'] = change.newValue;
            }
            return;
          }
          applyChange(component, change);
        });
    }
  }
  return result;
}

interface ArmamentShotLike {
  shotId?: string;
  armament?: object & { id?: string };
}

interface ArmamentSeriesLike {
  shots?: ArmamentShotLike[];
}

interface ArmamentLike {
  series?: ArmamentSeriesLike[];
}

export function projectArmament<T extends ArmamentLike>(baseline: T, changes: readonly PlanningChange[]): T {
  const result = structuredClone(baseline);
  const armamentChanges = changes.filter((c) => c.resourceType === 'ARMAMENT');
  for (const shot of (result.series ?? []).flatMap((serie) => serie.shots ?? [])) {
    if (!shot.armament) continue;
    const armament = shot.armament;
    armamentChanges
      .filter((change) => change.resourceId === armament.id)
      .forEach((change) => {
        const field =
          change.field === 'itemType'
            ? 'itemType' in armament
              ? 'itemType'
              : 'weaponType'
            : change.field === 'lifeUsefulPercentage'
              ? 'tubeLifePercentage'
              : change.field;
        if (!(field in armament)) return;
        const record = armament as Record<string, unknown>;
        record[field] = coerceLike(record[field], change.newValue, field);
      });
  }
  return result;
}

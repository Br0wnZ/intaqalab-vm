import type { PlanningFormSnapshotEvent } from '@intaqalab/planning';
import { deepEqual } from '@intaqalab/utils';

import type {
  PlanningChangeLocalOnlyReason,
  PlanningChangeResourceType,
  PlanningChangeSection,
  PlanningChangeValue,
  PlanningDetectedChange,
} from '../../models/planning-changes.models';

interface DiffContext {
  fireTrialId: string;
  executedShotIds?: ReadonlyArray<string>;
}

interface ChangeDescriptor {
  identity: string;
  resourceType: PlanningChangeResourceType | null;
  resourceId: string | null;
  field: string;
  parameter: string;
  previousValue: PlanningChangeValue;
  newValue: PlanningChangeValue;
  affectedShots: ReadonlyArray<string>;
  operation?: 'UPDATE' | 'ADD' | 'REMOVE';
  persistable?: boolean;
  localOnlyReason?: PlanningChangeLocalOnlyReason;
}

type UnknownRecord = Record<string, unknown>;

const GENERAL_FIELD_MAP = new Map<string, string>([
  ['goal', 'goal'],
  ['hypochelometricReviewBefore', 'hypochelometricReviewBefore'],
  ['hypochelometricReviewAfter', 'hypochelometricReviewAfter'],
  ['observations', 'observations'],
  ['requeriments', 'requirements'],
  ['requirements', 'requirements'],
  ['additionalInfo', 'additionalInfo'],
  ['maxEmissionDates', 'maxEmissionDates'],
  ['percentageTechnicalUnits', 'percentageTechnicalUnits'],
  ['percentageEndTrial', 'percentageEndTrial'],
  ['daysSignReport', 'daysSignReport'],
]);

const CONDITION_FIELDS = new Set([
  'elevation',
  'orientation',
  'date',
  'targetTypeId',
  'targetMaterialId',
  'targetDimensionsId',
  'targetThicknessId',
  'distance',
  'targetInclination',
  'angle',
  'range',
  'impactZoneId',
  'loadingZoneId',
  'functioningHeight',
  'nominalSpeed',
  'powderWeight',
  'projectileWeight',
  'observations',
]);

const CONDITION_UNIT_MAP = new Map<string, string>([
  ['distanceUnit', 'distanceUnit'],
  ['orientationUnit', 'orientationUnit'],
  ['targetInclinationUnit', 'targetInclinationUnit'],
  ['elevationUnit', 'elevationUnit'],
  ['angleUnit', 'angleUnit'],
  ['rangeUnit', 'rangeUnit'],
  ['functioningHeightUnit', 'functioningHeightUnit'],
  ['nominalSpeedUnit', 'nominalSpeedUnit'],
  ['powderWeightUnit', 'powderWeightUnit'],
]);

const MUNITION_FIELD_MAP = new Map<string, string>([
  ['batch', 'batch'],
  ['denomination', 'denominationId'],
  ['observations', 'observations'],
  ['maxAllowedErrors', 'maxAllowedErrors'],
]);

const ARMAMENT_FIELD_MAP = new Map<string, string>([
  ['weaponType', 'itemType'],
  ['weaponExternalId', 'weaponExternalId'],
  ['tubeExternalId', 'tubeExternalId'],
  ['isInstrumented', 'isInstrumented'],
  ['tubeLifePercentage', 'lifeUsefulPercentage'],
  ['observations', 'observations'],
]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function array(value: unknown): ReadonlyArray<unknown> {
  return Array.isArray(value) ? value : [];
}

function string(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function planningValue(value: unknown): PlanningChangeValue {
  if (value === null) return null;
  if (isRecord(value) && 'id' in value && 'name' in value) {
    const id = value['id'];
    return typeof id === 'string' || typeof id === 'number' ? id : null;
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) {
    return [...value];
  }
  return null;
}

function apiFieldIsSupported(resourceType: PlanningChangeResourceType, field: string): boolean {
  if (resourceType === 'PLANNING_INFO' && field.startsWith('ratingCriteria.')) {
    return /^ratingCriteria\.(v0c|v0cMean|v0cStdDev|p|pMean|projectile|fuse|primer)\.(useful1Min|useful1Max|uselessMin|uselessMax)$/.test(
      field,
    );
  }

  const allowed: Readonly<Record<PlanningChangeResourceType, ReadonlySet<string>>> = {
    PLANNING_INFO: new Set([
      'goal',
      'hypochelometricReviewBefore',
      'hypochelometricReviewAfter',
      'observations',
      'requirements',
      'additionalInfo',
      'maxEmissionDates',
      'percentageTechnicalUnits',
      'percentageEndTrial',
      'daysSignReport',
      'stanagCriteriaIds',
      'speedUnit',
      'pressureUnit',
      'distanceUnit',
      'orientationUnit',
      'targetInclinationUnit',
      'elevationUnit',
      'angleUnit',
      'rangeUnit',
      'functioningHeightUnit',
      'nominalSpeedUnit',
      'powderWeightUnit',
    ]),
    SHOT_CONDITIONS: CONDITION_FIELDS,
    MUNITION: new Set([
      'batch',
      'denominationId',
      'observations',
      'maxAllowedErrors',
      'reconditioning.temperature',
      'reconditioning.tolerance',
      'reconditioning.timeMin',
      'reconditioning.timeMax',
      'reconditioning.observations',
    ]),
    MUNITION_COMPONENT: new Set([
      'batch',
      'denominationId',
      'observations',
      'maxAllowedErrors',
      'reconditioning.temperature',
      'reconditioning.tolerance',
      'reconditioning.timeMin',
      'reconditioning.timeMax',
      'reconditioning.observations',
      'typeId',
      'loadingZoneValue',
      'quantity',
      'clientNumber',
      'fuseWorkingModeId',
      'fuseMeasurement',
    ]),
    ARMAMENT: new Set([
      'itemType',
      'weaponExternalId',
      'tubeExternalId',
      'isInstrumented',
      'lifeUsefulPercentage',
      'observations',
    ]),
  };

  return allowed[resourceType].has(field);
}

function addFieldDiff(
  changes: ChangeDescriptor[],
  options: {
    section: PlanningChangeSection;
    identity: string;
    resourceType: PlanningChangeResourceType | null;
    resourceId: string | null;
    field: string;
    parameter?: string;
    previousValue: unknown;
    newValue: unknown;
    hasPreviousValueOverride?: boolean;
    previousValueOverride?: unknown;
    affectedShots?: ReadonlyArray<string>;
    allowPersistence?: boolean;
    localOnlyReason?: PlanningChangeLocalOnlyReason;
  },
): void {
  const comparisonPreviousValue = planningValue(options.previousValue);
  const previousValue = planningValue(
    options.hasPreviousValueOverride ? options.previousValueOverride : options.previousValue,
  );
  const newValue = planningValue(options.newValue);
  if (deepEqual(comparisonPreviousValue, newValue)) return;

  const resourceType = options.resourceType;
  const persistable =
    options.allowPersistence !== false &&
    resourceType !== null &&
    options.resourceId !== null &&
    apiFieldIsSupported(resourceType, options.field);

  changes.push({
    identity: `${options.section}::${options.identity}::${options.field}`,
    resourceType,
    resourceId: options.resourceId,
    field: options.field,
    parameter: options.parameter ?? options.field,
    previousValue,
    newValue,
    affectedShots: options.affectedShots ?? [],
    operation: 'UPDATE',
    persistable,
    localOnlyReason: persistable ? undefined : (options.localOnlyReason ?? 'UNSUPPORTED_CONTRACT'),
  });
}

function makeAddedOrRemovedChange(
  changes: ChangeDescriptor[],
  section: PlanningChangeSection,
  identity: string,
  parameter: string,
  value: unknown,
  operation: 'ADD' | 'REMOVE',
  affectedShots: ReadonlyArray<string> = [],
): void {
  changes.push({
    identity: `${section}::${identity}::${operation}`,
    resourceType: null,
    resourceId: null,
    field: parameter,
    parameter,
    previousValue: operation === 'ADD' ? null : planningValue(value),
    newValue: operation === 'REMOVE' ? null : planningValue(value),
    affectedShots,
    operation,
    persistable: false,
    localOnlyReason: 'UNSUPPORTED_CONTRACT',
  });
}

function createDetectedChanges(
  section: PlanningChangeSection,
  changes: ReadonlyArray<ChangeDescriptor>,
): PlanningDetectedChange[] {
  return changes.map((change) => {
    const operation = change.operation ?? 'UPDATE';
    const action = operation === 'ADD' ? 'Alta' : operation === 'REMOVE' ? 'Baja' : 'Modificación';
    return {
      id: change.identity,
      key: change.identity,
      section,
      resourceType: change.resourceType,
      resourceId: change.resourceId,
      field: change.field,
      parameter: change.parameter,
      operation,
      action,
      previousValue: change.previousValue,
      newValue: change.newValue,
      affectedShots: [...change.affectedShots],
      persistable: change.persistable === true,
      status: change.persistable === true ? 'READY' : 'LOCAL_ONLY',
      localOnlyReason: change.persistable === true ? undefined : (change.localOnlyReason ?? 'UNSUPPORTED_CONTRACT'),
      classification: 'none',
      requiresApproval: false,
      requestClient: false,
    };
  });
}

function leafRecord(value: unknown, prefix = ''): Array<{ path: string; value: unknown }> {
  if (!isRecord(value)) return prefix ? [{ path: prefix, value }] : [];
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isRecord(child)) return leafRecord(child, path);
    return [{ path, value: child }];
  });
}

function valueAtPath(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => record(current)[part], root);
}

function generalDataChanges(baseline: unknown, current: unknown, fireTrialId: string): ChangeDescriptor[] {
  const baselineSnapshot = record(baseline);
  const currentSnapshot = record(current);
  const baselineModel = record(baselineSnapshot['model']);
  const currentModel = record(currentSnapshot['model']);
  const rawPlanningInfo = baselineSnapshot['rawPlanningInfo'];
  const hasRawPlanningInfo = isRecord(rawPlanningInfo);
  const rawDateControl = record(record(rawPlanningInfo)['dateControl']);
  const changes: ChangeDescriptor[] = [];

  for (const [modelField, apiField] of GENERAL_FIELD_MAP) {
    addFieldDiff(changes, {
      section: 'general-data',
      identity: `PLANNING_INFO:${fireTrialId}`,
      resourceType: 'PLANNING_INFO',
      resourceId: fireTrialId,
      field: apiField,
      parameter: apiField,
      previousValue: baselineModel[modelField],
      newValue: currentModel[modelField],
      hasPreviousValueOverride: hasRawPlanningInfo,
      previousValueOverride: rawDateControl[apiField] ?? record(rawPlanningInfo)[apiField],
    });
  }

  const baselineCriteria = leafRecord(baselineSnapshot['ratingCriteria']);
  const currentCriteria = leafRecord(currentSnapshot['ratingCriteria']);
  const criteriaFields = new Set([
    ...baselineCriteria.map((entry) => entry.path),
    ...currentCriteria.map((entry) => entry.path),
  ]);
  for (const field of criteriaFields) {
    if (!apiFieldIsSupported('PLANNING_INFO', `ratingCriteria.${field}`)) continue;
    const oldValue = baselineCriteria.find((entry) => entry.path === field)?.value;
    const newValue = currentCriteria.find((entry) => entry.path === field)?.value;
    addFieldDiff(changes, {
      section: 'general-data',
      identity: `PLANNING_INFO:${fireTrialId}`,
      resourceType: 'PLANNING_INFO',
      resourceId: fireTrialId,
      field: `ratingCriteria.${field}`,
      previousValue: oldValue,
      newValue,
      hasPreviousValueOverride: hasRawPlanningInfo,
      previousValueOverride: valueAtPath(record(rawPlanningInfo)['ratingCriteria'], field),
    });
  }

  const unitKeys = ['speedUnit', 'pressureUnit'] as const;
  const oldUnits = record(baselineSnapshot['ratingCriteriaUnits']);
  const newUnits = record(currentSnapshot['ratingCriteriaUnits']);
  for (const field of unitKeys) {
    addFieldDiff(changes, {
      section: 'general-data',
      identity: `PLANNING_INFO:${fireTrialId}`,
      resourceType: 'PLANNING_INFO',
      resourceId: fireTrialId,
      field,
      previousValue: oldUnits[field],
      newValue: newUnits[field],
      hasPreviousValueOverride: hasRawPlanningInfo,
      previousValueOverride: record(record(rawPlanningInfo)['ratingCriteriaUnits'])[field],
    });
  }

  return changes;
}

function rowsById(value: unknown, idField: string): Map<string, UnknownRecord> {
  return new Map(
    array(value).flatMap((item) => {
      const itemRecord = record(item);
      const id = string(itemRecord[idField]);
      return id ? [[id, itemRecord] as const] : [];
    }),
  );
}

function nestedRowsById(value: unknown, outerField: string, idField: string): Map<string, UnknownRecord> {
  const rows = new Map<string, UnknownRecord>();
  for (const outer of array(value)) {
    for (const item of array(record(outer)[outerField])) {
      const itemRecord = record(item);
      const id = string(itemRecord[idField]);
      if (id) rows.set(id, itemRecord);
    }
  }
  return rows;
}

function conditionsChanges(baseline: unknown, current: unknown, context: DiffContext): ChangeDescriptor[] {
  const baselineSnapshot = record(baseline);
  const currentSnapshot = record(current);
  const baselineSeries = baselineSnapshot['series'] ?? baseline;
  const currentSeries = currentSnapshot['series'] ?? current;
  const oldShots = nestedRowsById(baselineSeries, 'shots', 'shotId');
  const newShots = nestedRowsById(currentSeries, 'shots', 'shotId');
  const rawShots = nestedRowsById(baselineSnapshot['rawSeries'], 'shots', 'shotId');
  const changes: ChangeDescriptor[] = [];

  for (const shotId of new Set([...oldShots.keys(), ...newShots.keys()])) {
    const previous = oldShots.get(shotId);
    const next = newShots.get(shotId);
    if (!previous || !next) {
      makeAddedOrRemovedChange(
        changes,
        'shooting-conditions',
        `SHOT_CONDITIONS:${shotId}`,
        'Disparo',
        next ?? previous,
        previous ? 'REMOVE' : 'ADD',
        [shotId],
      );
      continue;
    }

    const affectsExecutedShot = (context.executedShotIds ?? []).includes(shotId);

    for (const field of CONDITION_FIELDS) {
      const rawShot = rawShots.get(shotId);
      addFieldDiff(changes, {
        section: 'shooting-conditions',
        identity: `SHOT_CONDITIONS:${shotId}`,
        resourceType: 'SHOT_CONDITIONS',
        resourceId: shotId,
        field,
        previousValue: previous[field],
        newValue: next[field],
        hasPreviousValueOverride: rawShot !== undefined,
        previousValueOverride: rawShot?.[field],
        affectedShots: [shotId],
        allowPersistence: !affectsExecutedShot,
        localOnlyReason: affectsExecutedShot ? 'EXECUTED_SHOT' : undefined,
      });
    }
  }

  const oldUnits = record(baselineSnapshot['units']);
  const newUnits = record(currentSnapshot['units']);
  const rawUnits = record(baselineSnapshot['rawUnits']);
  const oldFirstShot = [...oldShots.values()][0] ?? {};
  const newFirstShot = [...newShots.values()][0] ?? {};
  for (const [sourceField, apiField] of CONDITION_UNIT_MAP) {
    const oldValue = oldUnits[sourceField] ?? oldFirstShot[sourceField];
    const newValue = newUnits[sourceField] ?? newFirstShot[sourceField];
    addFieldDiff(changes, {
      section: 'shooting-conditions',
      identity: `PLANNING_INFO:${context.fireTrialId}`,
      resourceType: 'PLANNING_INFO',
      resourceId: context.fireTrialId,
      field: apiField,
      previousValue: oldValue,
      newValue,
      hasPreviousValueOverride: Object.keys(rawUnits).length > 0,
      previousValueOverride: rawUnits[sourceField.replace(/Unit$/, '')],
    });
  }

  return changes;
}

function munitionChanges(baseline: unknown, current: unknown, context: DiffContext): ChangeDescriptor[] {
  const baselineSnapshot = record(baseline);
  const currentSnapshot = record(current);
  const oldConfigurations = nestedRowsById(baselineSnapshot['series'] ?? baseline, 'configurations', 'id');
  const newConfigurations = nestedRowsById(currentSnapshot['series'] ?? current, 'configurations', 'id');
  const rawConfigurations = rowsById(baselineSnapshot['rawConfigurations'], 'id');
  const persistedIds = new Set(
    array(baselineSnapshot['persistedConfigurationIds']).filter((id): id is string => typeof id === 'string'),
  );
  const changes: ChangeDescriptor[] = [];

  for (const configurationId of new Set([...oldConfigurations.keys(), ...newConfigurations.keys()])) {
    const previous = oldConfigurations.get(configurationId);
    const next = newConfigurations.get(configurationId);
    const affectedShots = [
      ...new Set(
        [...array(previous?.['assignedShotIds']), ...array(next?.['assignedShotIds'])].filter(
          (shotId): shotId is string => typeof shotId === 'string',
        ),
      ),
    ];
    const affectsExecutedShot = affectedShots.some((shotId) => (context.executedShotIds ?? []).includes(shotId));
    if (!previous || !next) {
      makeAddedOrRemovedChange(
        changes,
        'munitions',
        `MUNITION:${configurationId}`,
        'Configuración de munición',
        next ?? previous,
        previous ? 'REMOVE' : 'ADD',
        affectedShots,
      );
      continue;
    }

    for (const [modelField, apiField] of MUNITION_FIELD_MAP) {
      const rawConfiguration = rawConfigurations.get(configurationId);
      const rawDenomination = record(rawConfiguration?.['denomination']);
      const rawValue = modelField === 'denomination' ? rawDenomination['id'] : rawConfiguration?.[modelField];
      addFieldDiff(changes, {
        section: 'munitions',
        identity: `MUNITION:${configurationId}`,
        resourceType: 'MUNITION',
        resourceId: configurationId,
        field: apiField,
        previousValue: previous[modelField],
        newValue: next[modelField],
        hasPreviousValueOverride: rawConfiguration !== undefined,
        previousValueOverride: rawValue,
        affectedShots,
        allowPersistence: persistedIds.has(configurationId) && !affectsExecutedShot,
        localOnlyReason: affectsExecutedShot ? 'EXECUTED_SHOT' : undefined,
      });
    }

    for (const field of ['clientNumber', 'assignedShotIds', 'selectedComponents', 'munitionTypeId']) {
      addFieldDiff(changes, {
        section: 'munitions',
        identity: `MUNITION:${configurationId}`,
        resourceType: 'MUNITION',
        resourceId: configurationId,
        field,
        previousValue: previous[field],
        newValue: next[field],
        affectedShots,
        allowPersistence: false,
      });
    }

    const oldReconditioning = record(previous['reconditioning']);
    const newReconditioning = record(next['reconditioning']);
    for (const field of ['temperature', 'tolerance', 'timeMin', 'timeMax', 'observations']) {
      const rawReconditioning = record(rawConfigurations.get(configurationId)?.['reconditioning']);
      const rawConfiguration = rawConfigurations.get(configurationId);
      addFieldDiff(changes, {
        section: 'munitions',
        identity: `MUNITION:${configurationId}`,
        resourceType: 'MUNITION',
        resourceId: configurationId,
        field: `reconditioning.${field}`,
        previousValue: oldReconditioning[field],
        newValue: newReconditioning[field],
        hasPreviousValueOverride: rawConfiguration !== undefined,
        previousValueOverride: rawReconditioning[field],
        affectedShots,
        allowPersistence: persistedIds.has(configurationId) && !affectsExecutedShot,
        localOnlyReason: affectsExecutedShot ? 'EXECUTED_SHOT' : undefined,
      });
    }

    const oldComponents = new Map(
      array(previous['components']).flatMap((component) => {
        const item = record(component);
        const typeId = string(record(item['type'])['id']);
        const denominationId = string(record(item['denomination'])['id']);
        const componentId =
          string(item['id']) ?? (typeId && denominationId ? `local:${typeId}:${denominationId}` : null);
        return componentId ? [[componentId, item] as const] : [];
      }),
    );
    const newComponents = new Map(
      array(next['components']).flatMap((component) => {
        const item = record(component);
        const typeId = string(record(item['type'])['id']);
        const denominationId = string(record(item['denomination'])['id']);
        const componentId =
          string(item['id']) ?? (typeId && denominationId ? `local:${typeId}:${denominationId}` : null);
        return componentId ? [[componentId, item] as const] : [];
      }),
    );
    const rawComponents = new Map(
      array(rawConfigurations.get(configurationId)?.['components']).flatMap((component) => {
        const item = record(component);
        const id = string(item['id']);
        return id ? [[id, item] as const] : [];
      }),
    );
    const componentFieldValues: ReadonlyArray<readonly [string, (component: UnknownRecord) => unknown]> = [
      ['typeId', (component) => record(component['type'])['id']],
      ['denominationId', (component) => record(component['denomination'])['id']],
      ['batch', (component) => component['batch']],
      ['loadingZoneValue', (component) => component['loadingZoneValue']],
      ['quantity', (component) => component['quantity']],
      ['reconditioning.temperature', (component) => record(component['reconditioning'])['temperature']],
      ['reconditioning.tolerance', (component) => record(component['reconditioning'])['tolerance']],
      ['reconditioning.timeMin', (component) => record(component['reconditioning'])['timeMin']],
      ['reconditioning.timeMax', (component) => record(component['reconditioning'])['timeMax']],
      ['reconditioning.observations', (component) => record(component['reconditioning'])['observations']],
      ['clientNumber', (component) => component['clientNumber']],
      ['observations', (component) => component['observations']],
      ['fuseWorkingModeId', (component) => record(component['fuseWorkingMode'])['id']],
      ['fuseMeasurement', (component) => component['fuseMeasurement']],
      ['maxAllowedErrors', (component) => component['maxAllowedErrors']],
    ];
    for (const componentId of new Set([...oldComponents.keys(), ...newComponents.keys()])) {
      const oldComponent = oldComponents.get(componentId);
      const newComponent = newComponents.get(componentId);
      if (!oldComponent || !newComponent) {
        makeAddedOrRemovedChange(
          changes,
          'munitions',
          `MUNITION_COMPONENT:${configurationId}:${componentId}`,
          'Componente de munición',
          newComponent ?? oldComponent,
          oldComponent ? 'REMOVE' : 'ADD',
        );
        continue;
      }
      for (const [field, getValue] of componentFieldValues) {
        const rawComponent = rawComponents.get(componentId);
        const rawValue =
          field === 'typeId'
            ? record(rawComponent?.['type'])['id']
            : field === 'denominationId'
              ? record(rawComponent?.['denomination'])['id']
              : field.startsWith('reconditioning.')
                ? record(rawComponent?.['reconditioning'])[field.slice('reconditioning.'.length)]
                : field === 'fuseWorkingModeId'
                  ? record(rawComponent?.['fuseWorkingMode'])['id']
                  : rawComponent?.[field];
        addFieldDiff(changes, {
          section: 'munitions',
          identity: `MUNITION_COMPONENT:${configurationId}:${componentId}`,
          resourceType: 'MUNITION_COMPONENT',
          resourceId: configurationId,
          field,
          parameter: `components.${field}`,
          previousValue: getValue(oldComponent),
          newValue: getValue(newComponent),
          hasPreviousValueOverride: rawComponent !== undefined,
          previousValueOverride: rawValue,
          affectedShots,
          // The tab contract supplies configuration.id as resourceId. Keep component diffs visible but
          // unpersistable until backend confirms a matching MUNITION_COMPONENT identity contract.
          allowPersistence: false,
        });
      }
    }
  }

  return changes;
}

function armamentChanges(baseline: unknown, current: unknown, context: DiffContext): ChangeDescriptor[] {
  const baselineSnapshot = record(baseline);
  const oldShots = nestedRowsById(baselineSnapshot['series'] ?? baseline, 'shots', 'shotId');
  const newShots = nestedRowsById(current, 'shots', 'shotId');
  const rawShots = nestedRowsById(baselineSnapshot['rawSeries'], 'shots', 'shotId');
  const changes: ChangeDescriptor[] = [];
  const shotsByArmamentId = new Map<string, Set<string>>();
  for (const shotId of new Set([...oldShots.keys(), ...newShots.keys()])) {
    const armament = record(newShots.get(shotId)?.['armament'] ?? oldShots.get(shotId)?.['armament']);
    const armamentId = string(armament['id']);
    if (!armamentId) continue;
    const shotIds = shotsByArmamentId.get(armamentId) ?? new Set<string>();
    shotIds.add(shotId);
    shotsByArmamentId.set(armamentId, shotIds);
  }

  for (const shotId of new Set([...oldShots.keys(), ...newShots.keys()])) {
    const previousShot = oldShots.get(shotId);
    const nextShot = newShots.get(shotId);
    if (!previousShot || !nextShot) continue;
    const previous = record(previousShot['armament']);
    const next = record(nextShot['armament']);
    const rawArmament = record(rawShots.get(shotId)?.['armament']);
    const armamentId = string(next['id']) ?? string(previous['id']) ?? string(rawArmament['id']);
    const affectedShots = [...(armamentId ? (shotsByArmamentId.get(armamentId) ?? new Set([shotId])) : [shotId])];
    const affectsExecutedShot = affectedShots.some((affectedShot) =>
      (context.executedShotIds ?? []).includes(affectedShot),
    );
    for (const [modelField, apiField] of ARMAMENT_FIELD_MAP) {
      const oldValue = previous[modelField];
      const newValue = next[modelField];
      const serializedOld =
        modelField === 'weaponType' && typeof oldValue === 'string' && oldValue.length > 0
          ? oldValue.toUpperCase()
          : oldValue;
      const serializedNew =
        modelField === 'weaponType' && typeof newValue === 'string' && newValue.length > 0
          ? newValue.toUpperCase()
          : newValue;
      const rawField =
        modelField === 'weaponType'
          ? (rawArmament['itemType'] ?? rawArmament['weaponType'])
          : modelField === 'tubeLifePercentage'
            ? rawArmament['tubeLifePercentage']
            : rawArmament[modelField];
      addFieldDiff(changes, {
        section: 'armament',
        identity: `ARMAMENT:${armamentId ?? `local:${shotId}`}`,
        resourceType: 'ARMAMENT',
        resourceId: armamentId,
        field: apiField,
        previousValue: serializedOld,
        newValue: serializedNew,
        hasPreviousValueOverride: Object.keys(rawArmament).length > 0,
        previousValueOverride: rawField,
        affectedShots,
        allowPersistence: armamentId !== null && !affectsExecutedShot,
        localOnlyReason: affectsExecutedShot ? 'EXECUTED_SHOT' : undefined,
      });
    }
  }

  const deduplicated = new Map<string, ChangeDescriptor>();
  for (const change of changes) {
    const previous = deduplicated.get(change.identity);
    if (!previous) {
      deduplicated.set(change.identity, change);
      continue;
    }
    const matchingValues =
      deepEqual(previous.previousValue, change.previousValue) && deepEqual(previous.newValue, change.newValue);
    deduplicated.set(change.identity, {
      ...previous,
      affectedShots: [...new Set([...previous.affectedShots, ...change.affectedShots])],
      persistable: previous.persistable === true && change.persistable === true && matchingValues,
    });
  }

  return [...deduplicated.values()];
}

function measureChanges(baseline: unknown, current: unknown): ChangeDescriptor[] {
  const baselineSnapshot = record(baseline);
  const currentSnapshot = record(current);
  const oldMeasures = new Map<string, UnknownRecord>();
  const newMeasures = new Map<string, UnknownRecord>();
  const categories = ['topografia', 'municiones', 'armamento', 'balistica'];
  const collect = (source: unknown, target: Map<string, UnknownRecord>): void => {
    for (const serie of array(source)) {
      const serieId = string(record(serie)['id']) ?? 'unknown-series';
      for (const category of categories) {
        for (const measure of array(record(serie)[category])) {
          const item = record(measure);
          const measureId = string(item['id']);
          if (measureId) target.set(measureId, { ...item, serieId, category });
        }
      }
    }
  };
  collect(record(baseline)['series'] ?? baseline, oldMeasures);
  collect(record(current)['series'] ?? current, newMeasures);
  const changes: ChangeDescriptor[] = [];

  for (const measureId of new Set([...oldMeasures.keys(), ...newMeasures.keys()])) {
    const previous = oldMeasures.get(measureId);
    const next = newMeasures.get(measureId);
    if (!previous || !next) {
      makeAddedOrRemovedChange(
        changes,
        'measures',
        `MEASURE:${measureId}`,
        'Medida',
        next ?? previous,
        previous ? 'REMOVE' : 'ADD',
      );
      continue;
    }
    for (const field of ['measureUnit', 'minLimit', 'maxLimit', 'deviation']) {
      addFieldDiff(changes, {
        section: 'measures',
        identity: `MEASURE:${measureId}`,
        resourceType: null,
        resourceId: measureId,
        field,
        parameter: `${String(next['category'])}.${field}`,
        previousValue: previous[field],
        newValue: next[field],
        allowPersistence: false,
      });
    }
  }

  addFieldDiff(changes, {
    section: 'measures',
    identity: 'MEASURES:configuration-mode',
    resourceType: null,
    resourceId: null,
    field: 'seriesConfiguration',
    previousValue: baselineSnapshot['seriesConfiguration'],
    newValue: currentSnapshot['seriesConfiguration'],
    parameter: 'seriesConfiguration',
    allowPersistence: false,
  });

  return changes;
}

function seriesAndShotsChanges(baseline: unknown, current: unknown): ChangeDescriptor[] {
  const oldSeries = rowsById(baseline, 'id');
  const newSeries = rowsById(current, 'id');
  const changes: ChangeDescriptor[] = [];
  for (const seriesId of new Set([...oldSeries.keys(), ...newSeries.keys()])) {
    const previous = oldSeries.get(seriesId);
    const next = newSeries.get(seriesId);
    if (!previous || !next) {
      makeAddedOrRemovedChange(
        changes,
        'series-and-shots',
        `SERIES:${seriesId}`,
        'Serie',
        next ?? previous,
        previous ? 'REMOVE' : 'ADD',
      );
      continue;
    }
    for (const field of ['name', 'shotQuantity', 'executionOrder', 'observations']) {
      addFieldDiff(changes, {
        section: 'series-and-shots',
        identity: `SERIES:${seriesId}`,
        resourceType: null,
        resourceId: seriesId,
        field,
        previousValue: previous[field],
        newValue: next[field],
        allowPersistence: false,
      });
    }

    const oldShots = rowsById(previous['shots'], 'id');
    const newShots = rowsById(next['shots'], 'id');
    for (const shotId of new Set([...oldShots.keys(), ...newShots.keys()])) {
      const oldShot = oldShots.get(shotId);
      const newShot = newShots.get(shotId);
      if (!oldShot || !newShot) {
        makeAddedOrRemovedChange(
          changes,
          'series-and-shots',
          `SHOT:${shotId}`,
          'Disparo',
          newShot ?? oldShot,
          oldShot ? 'REMOVE' : 'ADD',
          [shotId],
        );
        continue;
      }
      for (const field of ['globalNumber', 'observation']) {
        addFieldDiff(changes, {
          section: 'series-and-shots',
          identity: `SHOT:${shotId}`,
          resourceType: null,
          resourceId: shotId,
          field,
          previousValue: oldShot[field],
          newValue: newShot[field],
          affectedShots: [shotId],
          allowPersistence: false,
        });
      }
    }
  }
  return changes;
}

export function diffPlanningFormSnapshot(
  event: PlanningFormSnapshotEvent,
  context: DiffContext,
): PlanningDetectedChange[] {
  let descriptors: ChangeDescriptor[];
  switch (event.section) {
    case 'general-data':
      descriptors = generalDataChanges(event.baseline, event.current, context.fireTrialId);
      break;
    case 'shooting-conditions':
      descriptors = conditionsChanges(event.baseline, event.current, context);
      break;
    case 'munitions':
      descriptors = munitionChanges(event.baseline, event.current, context);
      break;
    case 'armament':
      descriptors = armamentChanges(event.baseline, event.current, context);
      break;
    case 'measures':
      descriptors = measureChanges(event.baseline, event.current);
      break;
    case 'series-and-shots':
      descriptors = seriesAndShotsChanges(event.baseline, event.current);
      break;
  }

  return createDetectedChanges(event.section, descriptors).sort((a, b) => a.key.localeCompare(b.key));
}

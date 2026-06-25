import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectFireTrialsEndpoint, injectPlanningEndpoint } from '@intaqalab/config';
import type {
  CalendarTrialScheduleApiResponse,
  FireTrial,
  FireTrialScheduleItem,
  MasterData,
  TargetDimension,
  TargetThickness,
} from '@intaqalab/models';
import { MeasureUnitEnum } from '@intaqalab/models';

import type {
  Serie,
  ShootingConditionsResponse,
  ShootingConditionsUnits,
  Shot,
  UpdateConditionsRequest,
} from '../models/shooting-conditions.model';

/** Unidad de distancia por defecto cuando el backend no la devuelve. */
const DEFAULT_DISTANCE_UNIT = MeasureUnitEnum.M;
/** Unidad de ángulo por defecto cuando el backend no la devuelve. */
const DEFAULT_ANGLE_UNIT = MeasureUnitEnum.DEGREES;
/** Unidad de velocidad por defecto cuando el backend no la devuelve. */
const DEFAULT_SPEED_UNIT = MeasureUnitEnum.M_S;
/** Unidad de peso por defecto cuando el backend no la devuelve. */
const DEFAULT_WEIGHT_UNIT = MeasureUnitEnum.KG;

function mapShotRecord(shot: Record<string, unknown>, units: ShootingConditionsUnits): Shot {
  const date = shot['date'];
  return {
    shotId: (shot['shotId'] as string) ?? '',
    globalNumber: (shot['globalNumber'] as number) ?? 0,
    date: Array.isArray(date) ? ((date[0] as string) ?? '') : ((date as string | null) ?? ''),
    targetTypeId: (shot['targetTypeId'] as string) ?? '',
    targetMaterialId: (shot['targetMaterialId'] as string) ?? '',
    targetDimensionsId: (shot['targetDimensionsId'] as string) ?? '',
    targetThicknessId: (shot['targetThicknessId'] as string) ?? '',
    distance: (shot['distance'] as number) ?? 0,
    distanceUnit: (shot['distanceUnit'] as string) ?? units.distance ?? DEFAULT_DISTANCE_UNIT,
    targetInclination: (shot['targetInclination'] as number) ?? 0,
    targetInclinationUnit: (shot['targetInclinationUnit'] as string) ?? units.targetInclination ?? DEFAULT_ANGLE_UNIT,
    orientation: (shot['orientation'] as number) ?? 0,
    orientationUnit: (shot['orientationUnit'] as string) ?? units.orientation ?? DEFAULT_ANGLE_UNIT,
    elevation: (shot['elevation'] as number) ?? 0,
    elevationUnit: (shot['elevationUnit'] as string) ?? units.elevation ?? DEFAULT_ANGLE_UNIT,
    angle: (shot['angle'] as number) ?? 0,
    angleUnit: (shot['angleUnit'] as string) ?? units.angle ?? DEFAULT_ANGLE_UNIT,
    range: (shot['range'] as number) ?? 0,
    rangeUnit: (shot['rangeUnit'] as string) ?? units.range ?? DEFAULT_DISTANCE_UNIT,
    impactZoneId: (shot['impactZoneId'] as string) ?? '',
    functioningHeight: (shot['functioningHeight'] as number) ?? 0,
    functioningHeightUnit:
      (shot['functioningHeightUnit'] as string) ?? units.functioningHeight ?? DEFAULT_DISTANCE_UNIT,
    nominalSpeed: (shot['nominalSpeed'] as number) ?? 0,
    nominalSpeedUnit: (shot['nominalSpeedUnit'] as string) ?? units.nominalSpeed ?? DEFAULT_SPEED_UNIT,
    powderWeight: (shot['powderWeight'] as number) ?? 0,
    powderWeightUnit: (shot['powderWeightUnit'] as string) ?? units.powderWeight ?? DEFAULT_WEIGHT_UNIT,
    projectileWeight: ((shot['projectileWeight'] ?? shot['projectWeight']) as number) ?? 0,
    projectileWeightUnit: (shot['projectileWeightUnit'] as string) ?? units.projectileWeight ?? DEFAULT_WEIGHT_UNIT,
    observations: (shot['observations'] as string | null) ?? '',
  };
}

function parseUnits(raw: unknown): ShootingConditionsUnits {
  const u = (raw ?? {}) as Record<string, unknown>;
  return {
    distance: (u['distance'] as ShootingConditionsUnits['distance']) ?? null,
    orientation: (u['orientation'] as ShootingConditionsUnits['orientation']) ?? null,
    targetInclination: (u['targetInclination'] as ShootingConditionsUnits['targetInclination']) ?? null,
    elevation: (u['elevation'] as ShootingConditionsUnits['elevation']) ?? null,
    angle: (u['angle'] as ShootingConditionsUnits['angle']) ?? null,
    range: (u['range'] as ShootingConditionsUnits['range']) ?? null,
    functioningHeight: (u['functioningHeight'] as ShootingConditionsUnits['functioningHeight']) ?? null,
    nominalSpeed: (u['nominalSpeed'] as ShootingConditionsUnits['nominalSpeed']) ?? null,
    powderWeight: (u['powderWeight'] as ShootingConditionsUnits['powderWeight']) ?? null,
    projectileWeight: (u['projectileWeight'] as ShootingConditionsUnits['projectileWeight']) ?? null,
  };
}

const DEFAULT_UNITS: ShootingConditionsUnits = {
  distance: null,
  orientation: null,
  targetInclination: null,
  elevation: null,
  angle: null,
  range: null,
  functioningHeight: null,
  nominalSpeed: null,
  powderWeight: null,
  projectileWeight: null,
};

function parseSeriesArray(items: unknown[], units: ShootingConditionsUnits): Serie[] {
  if (!items.length) return [];

  return items.map((rawItem) => {
    const item = rawItem as Record<string, unknown>;
    return {
      seriesId: (item['seriesId'] as string) ?? (item['id'] as string) ?? '',
      seriesName: (item['seriesName'] as string) ?? (item['name'] as string) ?? '',
      shots: ((item['shots'] as Record<string, unknown>[]) ?? []).map((s) => mapShotRecord(s, units)),
    };
  });
}

export interface LoadingZone {
  id: string;
  denomination: { id: string; name: string };
  zone: string;
  caliber: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ShootingConditionsService {
  readonly #getConditionsParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #getTrialSchedulesParams = signal<{ trialId: FireTrial['id'] } | null>(null);
  readonly #updateConditionsParams = signal<UpdateConditionsRequest | null>(null);
  readonly #shouldLoadTargetTypes = signal(false);
  readonly #shouldLoadTargetMaterials = signal(false);
  readonly #shouldLoadTargetDimensions = signal(false);
  readonly #shouldLoadTargetThicknesses = signal(false);
  readonly #shouldLoadImpactZones = signal(false);
  readonly #shouldLoadLoadingZones = signal(false);

  readonly #planningUrl = injectPlanningEndpoint();
  readonly #fireTrialsUrl = injectFireTrialsEndpoint();

  readonly conditionsResource = httpResource<ShootingConditionsResponse>(
    () => {
      const params = this.#getConditionsParams();
      if (!params) return undefined;

      const encodedTrialId = encodeURIComponent(params.trialId);
      return {
        url: `${this.#planningUrl}/fire-trials/${encodedTrialId}/planning/conditions`,
        method: 'GET',
      };
    },
    {
      defaultValue: {
        units: DEFAULT_UNITS,
        series: [],
      },
      parse: (raw): ShootingConditionsResponse => {
        const response = raw as Record<string, unknown>;
        const units = parseUnits(response?.['units']);
        const seriesRaw: unknown[] = Array.isArray(raw)
          ? (raw as unknown[])
          : Array.isArray(response?.['series'])
            ? (response['series'] as unknown[])
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((raw as any)?.items ?? []);
        return { units, series: parseSeriesArray(seriesRaw, units) };
      },
    },
  );

  readonly updateConditionsResource = httpResource<void>(() => {
    const params = this.#updateConditionsParams();
    if (!params) return undefined;
    const { trialId, ...body } = params;
    const encodedTrialId = encodeURIComponent(trialId);
    return {
      url: `${this.#planningUrl}/fire-trials/${encodedTrialId}/planning/conditions`,
      method: 'PUT',
      body,
    };
  });

  readonly getTrialSchedulesResource = httpResource<CalendarTrialScheduleApiResponse>(
    () => {
      const params = this.#getTrialSchedulesParams();
      if (!params) return undefined;
      const encodedTrialId = encodeURIComponent(params.trialId);
      return {
        url: `${this.#fireTrialsUrl}/${encodedTrialId}/schedule`,
        method: 'GET',
      };
    },
    {
      defaultValue: [],
      parse: (raw): CalendarTrialScheduleApiResponse => this.#extractItems<FireTrialScheduleItem>(raw),
    },
  );

  readonly getTargetTypesResource = httpResource<MasterData[]>(
    () => {
      if (!this.#shouldLoadTargetTypes()) return undefined;
      return {
        url: `${this.#planningUrl}/target-types?pageSize=100&active=true`,
        method: 'GET',
      };
    },
    {
      defaultValue: [],
      parse: (raw): MasterData[] => this.#extractItems<MasterData>(raw),
    },
  );

  readonly getTargetMaterialsResource = httpResource<MasterData[]>(
    () => {
      if (!this.#shouldLoadTargetMaterials()) return undefined;
      return {
        url: `${this.#planningUrl}/target-materials?pageSize=100&active=true`,
        method: 'GET',
      };
    },
    {
      defaultValue: [],
      parse: (raw): MasterData[] => this.#extractItems<MasterData>(raw),
    },
  );

  readonly getTargetDimensionsResource = httpResource<TargetDimension[]>(
    () => {
      if (!this.#shouldLoadTargetDimensions()) return undefined;
      return {
        url: `${this.#planningUrl}/target-dimensions?pageSize=100&active=true`,
        method: 'GET',
      };
    },
    {
      defaultValue: [],
      parse: (raw): TargetDimension[] => this.#extractItems<TargetDimension>(raw),
    },
  );

  readonly getTargetThicknessesResource = httpResource<TargetThickness[]>(
    () => {
      if (!this.#shouldLoadTargetThicknesses()) return undefined;
      return {
        url: `${this.#planningUrl}/target-thicknesses?pageSize=100&active=true`,
        method: 'GET',
      };
    },
    {
      defaultValue: [],
      parse: (raw): TargetThickness[] => this.#extractItems<TargetThickness>(raw),
    },
  );

  readonly getImpactZonesResource = httpResource<MasterData[]>(
    () => {
      if (!this.#shouldLoadImpactZones()) return undefined;
      return {
        url: `${this.#planningUrl}/impact-zones?pageSize=100&active=true`,
        method: 'GET',
      };
    },
    {
      defaultValue: [],
      parse: (raw): MasterData[] => this.#extractItems<MasterData>(raw),
    },
  );

  readonly getLoadingZonesResource = httpResource<LoadingZone[]>(
    () => {
      if (!this.#shouldLoadLoadingZones()) return undefined;
      return {
        url: `${this.#planningUrl}/loading-zone?pageSize=1000&active=true`,
        method: 'GET',
      };
    },
    {
      defaultValue: [],
      parse: (raw): LoadingZone[] => this.#extractItems<LoadingZone>(raw),
    },
  );

  readonly getShootingConditions = (trialId: FireTrial['id']) => {
    this.#getConditionsParams.set({ trialId });
  };

  readonly updateShootingConditions = (data: UpdateConditionsRequest) => {
    this.#updateConditionsParams.set(data);
  };

  readonly getTargetTypes = () => {
    this.#shouldLoadTargetTypes.set(true);
    this.getTargetTypesResource.reload();
  };

  readonly getTargetMaterials = () => {
    this.#shouldLoadTargetMaterials.set(true);
    this.getTargetMaterialsResource.reload();
  };

  readonly getTargetDimensions = () => {
    this.#shouldLoadTargetDimensions.set(true);
    this.getTargetDimensionsResource.reload();
  };

  readonly getTargetThicknesses = () => {
    this.#shouldLoadTargetThicknesses.set(true);
    this.getTargetThicknessesResource.reload();
  };

  readonly getImpactZones = () => {
    this.#shouldLoadImpactZones.set(true);
    this.getImpactZonesResource.reload();
  };

  readonly getLoadingZones = () => {
    this.#shouldLoadLoadingZones.set(true);
    this.getLoadingZonesResource.reload();
  };

  readonly getTrialSchedules = (trialId: FireTrial['id']) => {
    this.#getTrialSchedulesParams.set({ trialId });
  };

  #extractItems<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'items' in raw && Array.isArray((raw as { items: unknown }).items)) {
      return (raw as { items: T[] }).items;
    }
    return [];
  }
}

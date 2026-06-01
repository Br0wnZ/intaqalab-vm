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

import type { Serie, Shot, UpdateConditionsRequest } from '../models/shooting-conditions.model';

function mapShotRecord(shot: Record<string, unknown>): Shot {
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
    targetInclination: (shot['targetInclination'] as number) ?? 0,
    orientation: (shot['orientation'] as number) ?? 0,
    elevation: (shot['elevation'] as number) ?? 0,
    angle: (shot['angle'] as number) ?? 0,
    range: (shot['range'] as number) ?? 0,
    impactZoneId: (shot['impactZoneId'] as string) ?? '',
    functioningHeight: (shot['functioningHeight'] as number) ?? 0,
    nominalSpeed: (shot['nominalSpeed'] as number) ?? 0,
    powderWeight: (shot['powderWeight'] as number) ?? 0,
    projectileWeight: (shot['projectileWeight'] as number) ?? 0,
    observations: (shot['observations'] as string | null) ?? '',
  };
}

function parseConditionsResponse(items: unknown[]): Serie[] {
  if (!items.length) return [];

  // New API format: each item is { units, series: { id, name, shots } }
  const firstItem = items[0] as Record<string, unknown>;
  if (firstItem['series'] && typeof firstItem['series'] === 'object' && !Array.isArray(firstItem['series'])) {
    const seriesMap = new Map<string, { seriesId: string; seriesName: string; shots: Shot[] }>();
    for (const rawItem of items) {
      const item = rawItem as { series: { id: string; name: string; shots: Record<string, unknown>[] } };
      const { id, name, shots } = item.series;
      if (!seriesMap.has(name)) {
        seriesMap.set(name, { seriesId: id, seriesName: name, shots: [] });
      }
      seriesMap.get(name)!.shots.push(...shots.map(mapShotRecord));
    }
    return Array.from(seriesMap.values());
  }

  // Legacy format: items are Serie-like objects directly
  return items.map((rawItem) => {
    const item = rawItem as Record<string, unknown>;
    return {
      seriesId: (item['seriesId'] as string) ?? (item['id'] as string) ?? '',
      seriesName: (item['seriesName'] as string) ?? (item['name'] as string) ?? '',
      shots: ((item['shots'] as Record<string, unknown>[]) ?? []).map(mapShotRecord),
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

  readonly conditionsResource = httpResource<Serie[]>(
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
      defaultValue: [],
      parse: (raw): Serie[] => {
        const items: unknown[] = Array.isArray(raw)
          ? raw
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((raw as any)?.series ?? (raw as any)?.items ?? []);
        return parseConditionsResponse(items);
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
        url: `${this.#planningUrl}/target-types?pageSize=100`,
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
        url: `${this.#planningUrl}/target-materials?pageSize=100`,
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
        url: `${this.#planningUrl}/target-dimensions?pageSize=100`,
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
        url: `${this.#planningUrl}/target-thicknesses?pageSize=100`,
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
        url: `${this.#planningUrl}/impact-zones?pageSize=100`,
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
        url: `${this.#planningUrl}/loading-zone?pageSize=1000`,
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

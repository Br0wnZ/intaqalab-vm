import type { Request } from 'express';

import { getFixture } from '../../utils';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface TrialMunitionsResponse {
  series: SeriesMunitionsData[];
}

interface SeriesMunitionsData {
  seriesId: string;
  seriesName: string;
  configurations: MunitionConfigResponse[];
}

interface MunitionConfigResponse {
  id: string;
  seriesId: string;
  munitionTypeId?: string;
  denomination: string;
  batch?: string;
  reconditioning?: ReconditioningData;
  maxAllowedErrors?: number;
  observations?: string;
  components: MunitionComponent[];
  assignedShotIds?: string[] | null;
}

interface ReconditioningData {
  temperature?: number;
  tolerance?: number;
  timeMin?: number;
  timeMax?: number;
  observations?: string;
}

interface MunitionComponent {
  id: string;
  munitionTypeId?: string;
  type: MunitionComponentType;
  denomination: MunitionDenomination;
  batch?: string;
  reconditioning?: ReconditioningData;
  clientNumber?: number;
  observations?: string;
  fuseWorkingMode?: FuseWorkingMode;
  fuseMeasurement?: number;
  maxAllowedErrors?: number;
}

interface MunitionComponentType {
  id: string;
  type: string;
  label: string;
}

interface MunitionDenomination {
  id: string;
  name: string;
}

interface FuseWorkingMode {
  id: string;
  type: string;
  label: string;
}

interface MunitionBulkUpdateRequest {
  configurations: MunitionConfigRequest[];
}

interface MunitionConfigRequest {
  id?: string;
  seriesId: string;
  denomination?: string;
  denominationId?: string;
  batch?: string;
  observations?: string;
  reconditioning?: ReconditioningData;
  maxAllowedErrors?: number;
  components?: MunitionComponentRequest[];
  assignedShotIds?: string[];
}

interface MunitionComponentRequest {
  typeId: string;
  denominationId: string;
  batch?: string;
  reconditioning?: ReconditioningData;
  clientNumber?: number;
  observations?: string;
  fuseWorkingModeId?: string;
  fuseMeasurement?: number;
  maxAllowedErrors?: number;
}

const trialMunitionsStore: Map<string, TrialMunitionsResponse> = new Map();

const defaultFixture = getFixture<TrialMunitionsResponse>('fixtures/munitions', 'trial-munitions-fixture.json');

export function getMunitionsDispatcher(req: Request): TrialMunitionsResponse {
  const { fireTrialId } = req.params;

  const storedData = trialMunitionsStore.get(fireTrialId);
  if (storedData) {
    return storedData;
  }

  const clonedFixture = JSON.parse(JSON.stringify(defaultFixture)) as TrialMunitionsResponse;
  trialMunitionsStore.set(fireTrialId, clonedFixture);
  return clonedFixture;
}

export function updateMunitionsDispatcher(req: Request): TrialMunitionsResponse {
  const { fireTrialId } = req.params;
  const body = req.body as MunitionBulkUpdateRequest;

  const currentData = trialMunitionsStore.get(fireTrialId) || { series: [] };

  const updatedSeries = processConfigurationUpdates(currentData.series, body.configurations);

  const result: TrialMunitionsResponse = { series: updatedSeries };
  trialMunitionsStore.set(fireTrialId, result);

  return result;
}

function processConfigurationUpdates(
  existingSeries: SeriesMunitionsData[],
  configurations: MunitionConfigRequest[],
): SeriesMunitionsData[] {
  const configsBySeriesId = new Map<string, MunitionConfigRequest[]>();

  for (const config of configurations) {
    const existing = configsBySeriesId.get(config.seriesId);
    if (existing) {
      existing.push(config);
    } else {
      configsBySeriesId.set(config.seriesId, [config]);
    }
  }

  const updatedSeries: SeriesMunitionsData[] = [];

  for (const [seriesId, configs] of configsBySeriesId) {
    const existingSerie = existingSeries.find((s) => s.seriesId === seriesId);

    const seriesData: SeriesMunitionsData = {
      seriesId,
      seriesName: existingSerie?.seriesName || `Serie ${seriesId}`,
      configurations: configs.map((config) => transformConfigRequest(config)),
    };

    updatedSeries.push(seriesData);
  }

  for (const serie of existingSeries) {
    if (!configsBySeriesId.has(serie.seriesId)) {
      updatedSeries.push(serie);
    }
  }

  return updatedSeries;
}

function transformConfigRequest(config: MunitionConfigRequest): MunitionConfigResponse {
  return {
    id: config.id || generateUuid(),
    seriesId: config.seriesId,
    munitionTypeId: undefined,
    denomination: config.denominationId || config.denomination || 'Unknown Denomination',
    batch: config.batch,
    reconditioning: config.reconditioning,
    maxAllowedErrors: config.maxAllowedErrors,
    observations: config.observations,
    components: (config.components || []).map(transformComponentRequest),
    assignedShotIds: config.assignedShotIds || null,
  };
}

function transformComponentRequest(comp: MunitionComponentRequest): MunitionComponent {
  return {
    id: generateUuid(),
    type: {
      id: comp.typeId,
      type: 'UNKNOWN',
      label: 'Unknown',
    },
    denomination: {
      id: comp.denominationId,
      name: 'Unknown',
    },
    batch: comp.batch,
    reconditioning: comp.reconditioning,
    clientNumber: comp.clientNumber,
    observations: comp.observations,
    fuseWorkingMode: comp.fuseWorkingModeId
      ? {
          id: comp.fuseWorkingModeId,
          type: 'UNKNOWN',
          label: 'Unknown',
        }
      : undefined,
    fuseMeasurement: comp.fuseMeasurement,
    maxAllowedErrors: comp.maxAllowedErrors,
  };
}

export function resetMunitionsStore(): void {
  trialMunitionsStore.clear();
}

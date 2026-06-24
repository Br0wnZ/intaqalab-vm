export type ReconditioningData = {
  temperature?: number;
  tolerance?: number;
  timeMin?: number;
  timeMax?: number;
  observations?: string;
};

export type MunitionComponentType = {
  id: string;
  type: string;
  label: string;
};

export type MunitionDenomination = {
  id: string;
  name: string;
};

export type MunitionComponent = {
  id: string;
  type: MunitionComponentType;
  denomination: MunitionDenomination | null;
  batch?: string;
  reconditioning?: ReconditioningData | null;
  clientNumber?: string | number;
  observations?: string;
  fuseWorkingMode?: FuseWorkingMode | null;
  fuseMeasurement?: number;
  maxAllowedErrors?: number;
};

/** Nested id wrapper returned by the planning API for some reference fields */
export type BackendNestedId = {
  value: string;
};

/** Raw type reference as returned by the planning/munitions backend */
export type BackendTypeRef = {
  id: BackendNestedId | null;
  label: string | null;
  type: string | null;
};

/** Raw denomination reference as returned by the planning/munitions backend */
export type BackendDenominationRef = {
  id: BackendNestedId | null;
  name: string | null;
};

/**
 * Raw component shape as returned by the planning/munitions backend.
 * The backend may return either hydrated objects (type, denomination, fuseWorkingMode)
 * or id-based references (typeId, denominationId, fuseWorkingModeId).
 */
export type BackendMunitionComponent = {
  id?: string;
  munitionTypeId?: string | null;
  // Hydrated references
  type?: MunitionComponentType | null;
  denomination?: MunitionDenomination | null;
  fuseWorkingMode?: FuseWorkingMode | null;
  // Id-based references
  typeId?: BackendTypeRef | null;
  denominationId?: BackendDenominationRef | null;
  fuseWorkingModeId?: string | null;
  batch?: string;
  reconditioning?: ReconditioningData | null;
  clientNumber?: string | number;
  observations?: string;
  fuseMeasurement?: number;
  maxAllowedErrors?: number;
};

export type MunitionComponentRequest = {
  typeId: string;
  denominationId: string;
  batch?: string;
  reconditioning?: ReconditioningData;
  clientNumber?: string | number;
  observations?: string;
  fuseWorkingModeId?: string;
  fuseMeasurement?: number;
  maxAllowedErrors?: number;
};

export type MunitionConfigResponse = {
  id: string;
  seriesId: string;
  munitionTypeId?: string | null;
  denomination: MunitionDenomination | null;
  batch?: string;
  reconditioning?: ReconditioningData | null;
  maxAllowedErrors?: number;
  observations?: string;
  components: BackendMunitionComponent[];
  assignedShotIds?: string[] | null;
};

export type MunitionConfigRequest = {
  id?: string;
  seriesId: string;
  denominationId: string;
  batch?: string;
  observations?: string;
  reconditioning?: ReconditioningData;
  maxAllowedErrors?: number;
  components?: MunitionComponentRequest[];
  assignedShotIds?: string[];
};

export type SeriesMunitionsData = {
  seriesId: string;
  seriesName: string;
  configurations: MunitionConfigResponse[];
};

export type TrialMunitionsResponse = {
  series: SeriesMunitionsData[];
};

/**
 * Raw shape of each element returned by the planning/munitions GET endpoint.
 * The API returns an array of these; `units` is excluded from mapping.
 */
export type TrialMunitionsRawItem = {
  units?: { tempUnit: string | null; timeUnit: string | null };
  series: SeriesMunitionsData[];
};

export type MunitionBulkUpdateRequest = {
  configurations: MunitionConfigRequest[];
};

export type ComponentType = {
  id: string;
  type: string;
  label: string;
};

export type Denomination = {
  id: string;
  name: string;
};

export type FuseWorkingMode = {
  id: string;
  type: string;
  label: string;
};

export type ComponentDetail = {
  id?: string;
  type: ComponentType;
  denomination: Denomination;
  batch: string;
  reconditioning?: ReconditioningData;
  clientNumber: string;
  observations: string;
  fuseWorkingMode?: FuseWorkingMode;
  fuseMeasurement: number;
  maxAllowedErrors: number;
  manufacturerNumber: string;
  quantity?: number;
  loadingZoneId?: string;
};

export type Configuration = {
  id: string;
  seriesId: string;
  munitionTypeId?: string;
  denomination: string;
  batch: string;
  reconditioning?: ReconditioningData;
  maxAllowedErrors: number;
  observations: string;
  components: ComponentDetail[];
  assignedShotIds: string[] | null;
  selectedComponents?: string[];
};

export type Serie = {
  seriesId: string;
  seriesName: string;
  configurations: Configuration[];
};

export type Munitions = {
  series: Serie[];
};

export function createEmptyReconditioning(): ReconditioningData {
  return {
    temperature: undefined,
    tolerance: undefined,
    timeMin: undefined,
    timeMax: undefined,
    observations: undefined,
  };
}

export function createEmptyComponentType(): ComponentType {
  return {
    id: '',
    type: '',
    label: '',
  };
}

export function createEmptyDenomination(): Denomination {
  return {
    id: '',
    name: '',
  };
}

export function createEmptyComponentDetail(typeValue: string): ComponentDetail {
  return {
    type: { id: '', type: typeValue, label: typeValue },
    denomination: createEmptyDenomination(),
    batch: '',
    clientNumber: '',
    observations: '',
    fuseWorkingMode: undefined,
    fuseMeasurement: 0,
    maxAllowedErrors: 0,
    manufacturerNumber: '',
    reconditioning: undefined,
    quantity: 0,
    loadingZoneId: '',
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createEmptyConfiguration(seriesId = ''): Configuration {
  return {
    id: generateId(),
    seriesId,
    munitionTypeId: '',
    denomination: '',
    batch: '',
    maxAllowedErrors: 0,
    observations: '',
    components: [],
    assignedShotIds: null,
    selectedComponents: [],
    reconditioning: undefined,
  };
}

export function createEmptySerie(name = ''): Serie {
  return {
    seriesId: generateId(),
    seriesName: name,
    configurations: [],
  };
}

export type MassiveConfigFormData = {
  denomination: string;
  batch: string;
  assignedShotIds: string[] | null;
  maxAllowedErrors: number;
  clientNumber: string | undefined;
  observations: string;
  selectedComponents: string[];
  componentsData: Record<string, ComponentDetail>;
  reconditioning?: ReconditioningData;
};

export type MassiveConfigDialogData = {
  preloadedData?: Partial<MassiveConfigFormData>;
};

export const createEmptyMassiveConfigFormData = (): MassiveConfigFormData => {
  return {
    denomination: '',
    batch: '',
    assignedShotIds: null,
    maxAllowedErrors: 0,
    clientNumber: undefined,
    observations: '',
    selectedComponents: [],
    componentsData: {},
    reconditioning: undefined,
  };
};

export function getSelectedComponentTypes(config: Configuration): string[] {
  return config.components.map((c) => c.type.type.toLowerCase());
}

export function hasReconditioning(reconditioning?: ReconditioningData): boolean {
  return reconditioning !== undefined && reconditioning !== null;
}

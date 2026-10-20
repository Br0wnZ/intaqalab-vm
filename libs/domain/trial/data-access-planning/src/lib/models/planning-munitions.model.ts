/**
 * Modelos del GET `/fire-trials/{fireTrialId}/planning/munitions`
 * (Swagger planning-api v1.3.0 → TrialMunitionsRawItem / SeriesMunitionsData).
 * Shape raw del backend: las referencias de catálogo llegan hidratadas o como id-planos.
 */
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

export type FuseWorkingMode = {
  id: string;
  type: string;
  label: string;
};

/** Nested id wrapper devuelto por la API de planning para campos de referencia. */
export type BackendNestedId = {
  value: string;
};

/** Referencia de tipo raw del backend de planning/munitions. */
export type BackendTypeRef = {
  id: BackendNestedId | null;
  label: string | null;
  type: string | null;
};

/** Referencia de denominación raw del backend de planning/munitions. */
export type BackendDenominationRef = {
  id: BackendNestedId | null;
  name: string | null;
};

/**
 * Componente raw del endpoint de planning/munitions.
 * El backend puede devolver referencias hidratadas (type, denomination, fuseWorkingMode)
 * o solo ids (typeId, denominationId, fuseWorkingModeId).
 */
export type BackendMunitionComponent = {
  id?: string;
  munitionTypeId?: string | null;
  type?: MunitionComponentType | null;
  denomination?: MunitionDenomination | null;
  fuseWorkingMode?: FuseWorkingMode | null;
  typeId?: BackendTypeRef | null;
  denominationId?: BackendDenominationRef | null;
  fuseWorkingModeId?: string | null;
  batch?: string;
  loadingZoneValue?: string | null;
  quantity?: number | null;
  reconditioning?: ReconditioningData | null;
  clientNumber?: string | number;
  observations?: string;
  fuseMeasurement?: number;
  maxAllowedErrors?: number;
};

export type MunitionConfigResponse = {
  id: string;
  seriesId: string;
  munitionTypeId?: string | null;
  denomination: MunitionDenomination | null;
  batch?: string;
  clientNumber?: string | number | null;
  reconditioning?: ReconditioningData | null;
  maxAllowedErrors?: number;
  observations?: string;
  components: BackendMunitionComponent[];
  assignedShotIds?: string[] | null;
};

export type SeriesMunitionsData = {
  seriesId: string;
  seriesName: string;
  configurations: MunitionConfigResponse[];
};

/** Elemento raw del GET de munitions: `units` se ignora en el mapeo. */
export type TrialMunitionsRawItem = {
  units?: { tempUnit: string | null; timeUnit: string | null };
  series: SeriesMunitionsData[];
};

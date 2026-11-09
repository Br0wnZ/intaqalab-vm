export interface PlanningComponentType {
  id: string;
  label: string;
  category: string;
}

export interface PlanningDenominationOption {
  id: string;
  name: string;
  componentTypeId: string;
  batch?: string | null;
  clientNumber?: string | null;
}

export interface WarehouseStockBatch {
  denominationId: string;
  batch: string;
}

export interface PlanningComponentData {
  componentTypeId: string;
  denominationId: string | null;
  batch: string | null;
  clientNumber: string | null;
}

export interface PlanningOptionsGroup {
  componentTypes: PlanningComponentType[];
  denominations: PlanningDenominationOption[];
  componentData: Record<string, PlanningComponentData>;
  denominationData: Record<string, PlanningComponentData>;
}

export interface PlanningMunitionOptionData {
  configurationIds: string[];
  componentTypes: PlanningComponentType[];
  denominations: PlanningDenominationOption[];
  optionsBySelection: Record<string, PlanningOptionsGroup>;
  optionsByShot: Record<string, PlanningOptionsGroup>;
  optionsBySeries: Record<string, PlanningOptionsGroup>;
}

export interface PlanningSpecimen {
  specimenId: string;
  batch?: string;
}

export interface PlanningUser {
  id: string;
  name: string;
}

export interface DateControlParameters {
  maxEmissionDates: number;
  percentageTechnicalUnits: number;
  percentageEndTrial: number;
  daysSignReport: number;
  reportDeadlineDate: string;
}

export interface PlanningResponse {
  goal: string;
  specimens: PlanningSpecimen[];
  planningUser: PlanningUser;
  executionDate: string;
  observations?: string;
  requirements?: string;
  additionalInfo?: string;
  dateControl?: DateControlParameters;
}

export interface PlanningRequest {
  goal: string;
  specimens: PlanningSpecimen[];
  planningUserId: string;
  executionDate: string;
  observations?: string;
  requirements?: string;
  additionalInfo?: string;
  dateControl?: DateControlParameters;
}

export interface PlanningApprovalRequest {
  approved: boolean;
  comments?: string | null;
}

/** Modelos de planning/series y planning/conditions: fuente única en @intaqalab/data-access-planning. */
export type {
  PlanningConditionsResponse,
  PlanningConditionsSeries,
  PlanningConditionsShot,
  PlanningSeriesItem,
  PlanningSeriesShotItem,
} from '@intaqalab/data-access-planning';

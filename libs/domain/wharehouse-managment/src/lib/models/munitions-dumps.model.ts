export interface MunitionsDumpDialog {
  item: MunitionsDumpModel | null;
}

export interface MunitionsDumpModel {
  id?: string;
  munitionDumpId: string;
  cells: MunitionsDumpModelCell[];
  maxRiskGroupNeqPerCell: number;
  maxNeq: number;
  currentNeq?: number;
  occupancyPercentage?: number;
  active: boolean;
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MunitionsDumpModelCell {
  name: string;
  currentTotalNeq?: number;
  currentRiskGroups11And12Neq?: number;
  currentOtherRiskGroupsNeq?: number;
}

export interface MunitionDumpForm {
  name: string;
  cellsCount: string;
  cells: string[];
  enabled: boolean;
  neqMaxCell: number | null;
  neqMax: number | null;
}

export type MunitionTypePayload = {
  munitionDumpId?: string;
  cells: {
    name: string;
  }[];
  maxRiskGroupNeqPerCell: number;
  maxNeq: number;
  active: boolean;
};

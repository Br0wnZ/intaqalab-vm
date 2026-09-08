import type { TrialPlanningInfo } from './trial-planing-info.model';

export enum SpecimenType {
  Weapon = 'weapon',
  Tube = 'tube',
  Mortar = 'mortar',
  Bundle = 'bundle',
  Munition = 'denomination',
}

/** Valor de PlanningSpecimenTypeEnum (apis/planning-api-json.json), exigido por el PUT /planning/info. */
export type PlanningSpecimenApiType = 'MUNITION' | 'TUBE' | 'WEAPON' | 'MORTAR' | 'BUNDLE';

const SPECIMEN_TYPE_TO_API_TYPE: Record<SpecimenType, PlanningSpecimenApiType> = {
  [SpecimenType.Weapon]: 'WEAPON',
  [SpecimenType.Tube]: 'TUBE',
  [SpecimenType.Mortar]: 'MORTAR',
  [SpecimenType.Bundle]: 'BUNDLE',
  [SpecimenType.Munition]: 'MUNITION',
};

export function mapSpecimenTypeToApiType(type: SpecimenType): PlanningSpecimenApiType {
  return SPECIMEN_TYPE_TO_API_TYPE[type];
}

export type SpecimenOption = {
  id: string;
  name: {
    es: string;
    en: string;
  };
  label: string;
  type?: SpecimenType;
};

export type SpecimenDialogResult = { specimenId: string; type: PlanningSpecimenApiType; batch: string };

export type SpecimensManagmentDialogData = {
  specimens: SpecimenOption[];
  selectedSpecimenIds?: string[];
  selectedSpecimens?: SpecimenDialogResult[];
  planningInfo?: TrialPlanningInfo;
  fireTrialId?: string | null;
};

export type SpecimenSelection = {
  id: string;
  label: string;
  type: SpecimenType;
  serialNumber?: string;
  lot?: string;
};

export type SpecimenApiResponse = SpecimenOption & {
  active: boolean;
};

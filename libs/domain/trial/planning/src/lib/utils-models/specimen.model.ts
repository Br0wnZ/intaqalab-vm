import type { TrialPlanningInfo } from './trial-planing-info.model';

export enum SpecimenType {
  Weapon = 'weapon',
  Tube = 'tube',
  Munition = 'denomination',
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

export type SpecimensManagmentDialogData = {
  specimens: SpecimenOption[];
  selectedSpecimenIds?: string[];
  selectedSpecimens?: { specimenId: string; batch: string }[];
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

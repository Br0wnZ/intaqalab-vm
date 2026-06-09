import type { DenominationModel } from './denominations.model';

// forms

export interface MunitionIdentificationForm {
  munitionTypeId: string;
  denominationId: string | DenominationModel;
  batch: string;
  quantity: number | null;
}

export interface MunitionLocationForm {
  munitionDumpId: string;
  cellName: string;
}

export interface ComponentListMunitionForm {
  munitionTypeId: string;
  denominationId: string | DenominationModel;
  batch: string;
  showUbication: boolean;
  munitionDumpId: string;
  cellName: string;
  quantity: number;
}

export interface MunitionGeneralDataForm {
  client: string;
  entryDate: Date;
  plannedFireTrialId: string;
  observations: string;
}

// munition

export interface MunitionStockPostModel {
  id?: string;
  munitionTypeId: string;
  denominationId: string;
  batch: string;
  quantity: number;
  generalData: {
    clientId: string;
    entryDate: string;
    plannedFireTrialId: string;
    observations: string;
  };
  location: {
    munitionDumpId: string;
    cellName: string;
  };
  associatedComponents: MunitionStockAssociadtedComponentPost[];
}
export interface MunitionStockAssociadtedComponentPost {
  munitionTypeId: string;
  denominationId: string;
  batch: string;
}

// munition components

export type MunitionComponentStockPostModel = MunitionComponentPostModel[];

export interface MunitionComponentPostModel {
  munitionTypeId: string;
  denominationId: string;
  batch: string;
  quantity: number;
  generalData: {
    clientId: string;
    entryDate: string;
    plannedFireTrialId: string;
    observations: string;
  };
  location: {
    munitionDumpId: string;
    cellName: string;
  };
}

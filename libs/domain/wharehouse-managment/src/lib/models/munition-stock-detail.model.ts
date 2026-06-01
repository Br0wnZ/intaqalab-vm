export interface MunitionDetailResponseModel extends MunitionComponentDetailResponseModel {
  totalNeq?: number;
  weight: number;
  associatedComponents: AssociatedComponent[];
}

export type StockEntity = 'munitions' | 'munition-components';

export interface AssociatedComponent {
  id: string;
  munitionType: {
    id: string;
    name: string;
  };
  denomination: {
    id: string;
    name: string;
  };
  batch: string;
  quantity: number;
}

export interface MunitionComponentDetailResponseModel {
  id: string;
  munitionType: {
    id: string;
    name: string;
  };
  denomination: {
    id: string;
    name: string;
  };
  batch: string;
  quantity: number;
  generalData: {
    client: {
      id: string;
      name: string;
    };
    entryDate: string;
    plannedFireTrial: {
      id: string;
      name: string;
      scheduledDate: string;
    };
    observations: string;
  };
  location: {
    munitionDump: {
      id: string;
      munitionDumpId: string;
    };
    cellName: string;
  };

  retirementDate: string;
  retirementReason: string;
  status: string;
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

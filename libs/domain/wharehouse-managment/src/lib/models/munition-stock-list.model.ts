import type { PaginatedSortedViewRequest } from '@intaqalab/models';

import type { WarehouseMunitionStatusType } from './utils.model';

export interface MunitionStockListSearch extends PaginatedSortedViewRequest {
  clientIds?: string[];
  denominationIds?: string[];
  batches?: string;
  plannedFireTrialIds?: string[];
  munitionTypeIds?: string[];
  munitionDumpIds?: string[];
  cellNames?: string[];
  quantityMin?: number;
  quantityMax?: number;
  status?: WarehouseMunitionStatusType;
  entryDateFrom?: string;
  entryDateTo?: string;
  retirementDateFrom?: string;
  retirementDateTo?: string;
  hasCertificate?: boolean;
}

export interface MunitionStockListPaginatedResponse {
  page: number;
  pageSize: number;
  totalElements: number;
  items: MunitionStockListResponse[];
}

export interface MunitionStockListResponse {
  id: string;
  category: string;
  munitionType: {
    id: string;
    name: string;
  };
  denomination: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
  };
  batch: string;
  munitionDump: {
    id: string;
    munitionDumpId: string;
  };
  cellName: string;
  status: string;
  plannedFireTrial: {
    id: string;
    name: string;
  };
  quantity: number;
  totalNeq: number;
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

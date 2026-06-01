import type { PaginatedSortedViewRequest } from '@intaqalab/models';

export interface MovementListSearch extends PaginatedSortedViewRequest {
  dateTimeFrom?: string;
  dateTimeTo?: string;
  movementTypes?: string[];
  userIds?: string[];
  originMunitionDumpIds?: string[];
  destinationMunitionDumpIds?: string[];
  quantityMin?: number;
  quantityMax?: number;
  affectedNeq?: number;
  associatedFireTrialIds?: string[];
}

export interface MovementListPaginatedResponse {
  page: number;
  pageSize: number;
  totalElements: number;
  items: MovementListItem[];
}

export interface MovementListItem {
  date: string;
  movementType: string;
  user: {
    id: string;
    name: string;
  };
  originMunitionDump: {
    id: string;
    munitionDumpId: string;
  };
  destinationMunitionDump: {
    id: string;
    munitionDumpId: string;
  };
  quantity: number;
  affectedNeq: number;
  reason: string;
  associatedFireTrial: {
    id: string;
    name: string;
  };
  observations: string;
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

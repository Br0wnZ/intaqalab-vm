import type { PaginatedSortedViewRequest } from '@intaqalab/models';

export interface DenominationModel {
  id: string;
  name: string;
  category: DenominationsCategoryType;
  munitionType: {
    id: string;
    name: string;
  };
  neq?: number;
  munitionTypeId?: string;
  unNumber?: string;
  riskGroups?: DenominationsRiskGroupsType;
  compatibility?: DenominationsCompatibilityType;
  weight?: number;
  active: boolean;
}

export interface DenominationDialog {
  item: DenominationModel | null;
}

export interface DenominationUpSertModel {
  id?: string;
  name: string;
  munitionType: {
    id: string;
    name: string;
  };
  category: string;
  munitionTypeId: string; // COMPONENTE DE MUNICION
  neq?: number;
  unNumber?: string;
  riskGroups?: string;
  compatibility?: DenominationsCompatibilityType;
  weight?: number;
  active: boolean;
}

export interface SearchDenominationsPaginatedSortedRequest extends PaginatedSortedViewRequest {
  name?: string;
  category?: DenominationsCategoryType;
  munitionTypeId?: string;
  active?: boolean;
}

export type DenominationsCategoryType = 'MUNITION' | 'MUNITION_COMPONENT';

export type DenominationsCompatibilityType =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'J'
  | 'K'
  | 'L'
  | 'N'
  | 'S';

export type DenominationsRiskGroupsType = '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6';

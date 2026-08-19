import type { PaginatedSortedViewRequest } from '@intaqalab/models';

export interface MunitionComponentsModel {
  id: string;
  category: WarehouseMunitionCategoryType;
  name: {
    es: string;
    en: string;
  };
  label: string;
  observations: string;
  active: boolean;
}

export interface MunitionDialog {
  item: MunitionComponentsModel | null;
}

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type MunitionDialogOutput = Optional<Omit<MunitionComponentsModel, 'label' | 'active'>, 'id'>;
export interface SearchPaginatedSortedRequest extends PaginatedSortedViewRequest {
  name?: string;
  category?: WarehouseMunitionCategoryType;
}

export type GroupedMunitionsByCategory = Record<MunitionComponentsModel['category'], Array<MunitionComponentsModel>>;

export type WarehouseMunitionCategoryType = 'MUNITION' | 'MUNITION_COMPONENT';

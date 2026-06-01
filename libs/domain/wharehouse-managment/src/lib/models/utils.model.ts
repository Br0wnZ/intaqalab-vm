import { HttpParams } from '@angular/common/http';
import type { PaginatedSortedViewRequest } from '@intaqalab/models';

import type {
  GroupedMunitionsByCategory,
  MunitionComponentsModel,
  WarehouseMunitionCategoryType,
} from './munition-components.model';

export const setParamsAsHttpParams = (params: PaginatedSortedViewRequest) => {
  let result = new HttpParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    result = result.append(key, value as string);
  });

  return result;
};

export const getMunitionsPartitionedByCategory = (
  data: MunitionComponentsModel[] | undefined,
  category: WarehouseMunitionCategoryType,
) => {
  if (!data || !category) return [];

  const result = {
    MUNITION: data.filter((e) => e.category === 'MUNITION'),
    MUNITION_COMPONENT: data.filter((e) => e.category === 'MUNITION_COMPONENT'),
    DEFAULT: data,
  };

  return result[category] ?? result['DEFAULT'];
};

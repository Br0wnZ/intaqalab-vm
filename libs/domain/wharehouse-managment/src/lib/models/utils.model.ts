import { HttpParams } from '@angular/common/http';
import type { PaginatedSortedViewRequest } from '@intaqalab/models';

import type { MunitionComponentsModel } from './munition-components.model';

export const setParamsAsHttpParams = (params: PaginatedSortedViewRequest) => {
  let result = new HttpParams();

  const sortData = { sortDirection: '', sortField: '' };

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;

    if (key === 'sortField' || key === 'sortDirection') {
      sortData[key] = value as string;
    } else {
      result = result.append(key, value as string);
    }
  });

  if (sortData.sortField) result = result.append('sort', `${sortData.sortField};${sortData.sortDirection}`);

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

export const WarehouseMunitionCategory = { MUNITION: 'MUNITION', MUNITION_COMPONENT: 'MUNITION_COMPONENT' } as const;
export type WarehouseMunitionCategoryType = typeof WarehouseMunitionCategory[keyof typeof WarehouseMunitionCategory];

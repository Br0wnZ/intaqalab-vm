import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface RequestComponentType extends RequestPaginationParams {
  category?: string;
}
type DataResponse = PaginatedApiResponse<MunitionComponentsModel>;
export interface MunitionComponentsModel {
  id: string;
  name: {
    es: string;
    en: string;
  };
  label: string;
  observations: string;
  active: boolean;
  category: string;
}

export function wharehouseManagmentComponentTypesDispatcher(params: RequestComponentType): DataResponse {
  const allData = getFixture<MunitionComponentsModel[]>(
    'fixtures/wharehouse-managment/component-types',
    'component-types-fixture.json',
  );
  const filteredByCategory = searchableByCategory(allData, params);
  return paginate(filteredByCategory, params);
}

function searchableByCategory(allData: MunitionComponentsModel[], params: RequestComponentType) {
  const category = params.category;
  if (category !== undefined && category !== '') {
    return allData.filter((e) => e.category === category);
  } else {
    return allData;
  }
}

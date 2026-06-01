import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface MaterialMasterResponse {
  id: string;
  name: { es: string; en: string };
  label: string;
  description?: string;
}

type DataResponse = PaginatedApiResponse<MaterialMasterResponse>;
export function masterDataMaterialDispatcher(params: RequestPaginationParams): DataResponse {
  const allData = seed(30);
  return paginate(allData, params);
}

function seed(total = 20): MaterialMasterResponse[] {
  const item = getFixture<MaterialMasterResponse>('fixtures/master-data/material', 'material-fixture.json');
  console.log('aqui esta todo:', item);
  const data: MaterialMasterResponse[] = new Array(total).fill(null).map((_, i) => {
    return {
      enabled: !!(i % 2),
      id: `${item.id} ${i}`,
      name: {
        en: `${item.name.en} ${i}`,
        es: `${item.name.es} ${i}`,
      },
      description: `${item.description} ${i}`,
      label: `${item.name.es} ${i}`,
    };
  });

  return data;
}

import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface TrialTypeMasterResponse {
  id: string;
  name: { es: string; en: string };
  label: string;
  active: boolean;
  description?: string;
}

type DataResponse = PaginatedApiResponse<TrialTypeMasterResponse>;
export function masterDataTrialTypeDispatcher(params: RequestPaginationParams): DataResponse {
  const allData = seed(30);
  return paginate(allData, params);
}

function seed(total = 20): TrialTypeMasterResponse[] {
  const item = getFixture<TrialTypeMasterResponse>('fixtures/master-data/trial-type', 'trial-type-fixture.json');
  console.log('aqui esta todo:', item);
  const data: TrialTypeMasterResponse[] = new Array(total).fill(null).map((_, i) => {
    return {
      active: !!(i % 2),
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

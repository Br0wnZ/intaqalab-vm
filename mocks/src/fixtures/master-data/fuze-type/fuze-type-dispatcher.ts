import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface FuzeTypeMasterResponse {
  id: string;
  name: { es: string; en: string };
  label: string;
  description?: string;
}

type DataResponse = PaginatedApiResponse<FuzeTypeMasterResponse>;
export function masterDataFuzeTypeslDispatcher(params: RequestPaginationParams): DataResponse {
  const allData = getFixture<FuzeTypeMasterResponse[]>('fixtures/master-data/fuze-type', 'fuze-type-fixture.json');
  return paginate(allData, params);
}

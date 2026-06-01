import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface TargetTypeMasterResponse {
  id: string;
  name: { es: string; en: string };
  label: string;
  description?: string;
}

type DataResponse = PaginatedApiResponse<TargetTypeMasterResponse>;
export function masterDataTargetTypeDispatcher(params: RequestPaginationParams): DataResponse {
  const allData = getFixture<TargetTypeMasterResponse[]>(
    'fixtures/master-data/target-type',
    'target-type-fixture.json',
  );
  return paginate(allData, params);
}

import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface DimensionMasterResponse {
  id: string;
  label: string;
  height?: string;
  width?: string;
  diameter?: string;
}

type DataResponse = PaginatedApiResponse<DimensionMasterResponse>;
export function masterDataDimensionDispatcher(params: RequestPaginationParams): DataResponse {
  const allData = getFixture<DimensionMasterResponse[]>('fixtures/master-data/dimension', 'dimension-fixture.json');
  return paginate(allData, params);
}

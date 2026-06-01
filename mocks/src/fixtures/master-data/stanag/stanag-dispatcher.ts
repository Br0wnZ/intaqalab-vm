import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface StanagMasterResponse {
  id: string;
  variable: { id: string; name: string };
  description: string;
  numThreshold: number;
  measureUnit: { id: string; name: string };
  calcType: { id: string; name: string };
  involvedLayers: { id: string; name: string };
  startLayer: string;
  endLayer: string;
  active: boolean;
}

type DataResponse = PaginatedApiResponse<StanagMasterResponse>;
export function masterDataStanagDispatcher(params: RequestPaginationParams): DataResponse {
  const allData = getFixture<StanagMasterResponse[]>('fixtures/master-data/stanag', 'stanag-fixture.json');
  return paginate(allData, params);
}

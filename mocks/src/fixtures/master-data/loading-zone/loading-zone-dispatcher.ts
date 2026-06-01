import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';
import type { LoadingAreaDenominationsResponse } from './denominations-loading-zone/denominations-loading-zone-dispatcher';

interface LoadingAreaMasterResponse {
  id: string;
  denomination: LoadingAreaDenominationsResponse;
  zones: string[];
  active: boolean;
  weapon: string;
  caliber: string;
  observations?: string;
}

type DataResponse = PaginatedApiResponse<LoadingAreaMasterResponse>;
export function masterDataLoadingAreaDispatcher(params: RequestPaginationParams): DataResponse {
  const item = getFixture<LoadingAreaMasterResponse>('fixtures/master-data/loading-zone', 'loading-zone-fixture.json');
  const denominationsFixture = getFixture<LoadingAreaDenominationsResponse[]>(
    'fixtures/master-data/loading-zone/denominations-loading-zone',
    'denominations-loading-zone-fixture.json',
  );
  const zones = [
    ['UNICA'],
    ['1', '2', '3', '4', '5', '6', '7'],
    ['1M', '2M', '3M', '4M', '5M', '6M'],
    ['3W', '4W', '5W', '6W', '7W'],
    ['3G', '4G', '5G'],
    ['(4½)', '6 (5)', '7R', '8S'],
  ];

  const randomNumberBetweenRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const allData: LoadingAreaMasterResponse[] = denominationsFixture.map((denomination, index) => {
    return {
      id: `${item.id}${index}`,
      denomination,
      zones: zones[randomNumberBetweenRange(0, zones.length - 1)],
      active: true,
      weapon: item.weapon[randomNumberBetweenRange(0, 3)] || '',
      caliber: `${item.caliber}${index} mm`,
      observations: `${item.observations} ${index + 1}`,
    };
  });

  return paginate(allData, params);
}

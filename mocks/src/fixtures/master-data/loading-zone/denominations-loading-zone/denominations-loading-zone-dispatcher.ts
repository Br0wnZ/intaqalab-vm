import { getFixture } from '../../../../utils';

export interface LoadingAreaDenominationsResponse {
  id: string;
  name: string;
}

type DataResponse = LoadingAreaDenominationsResponse[];
export function masterDataLoadingAreaDenominationsDispatcher(): DataResponse {
  const allData = getFixture<LoadingAreaDenominationsResponse[]>(
    'fixtures/master-data/loading-zone/denominations-loading-zone',
    'denominations-loading-zone-fixture.json',
  );

  return allData;
}

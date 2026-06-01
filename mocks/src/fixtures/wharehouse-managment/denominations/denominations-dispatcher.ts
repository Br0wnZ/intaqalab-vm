import { getFixture, paginate, searchableByExactCategory, searchableByName } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface DenominationModel {
  id: string;
  name: string;
  category: 'MUNITION' | 'MUNITION_COMPONENT';
  munitionType: {
    id: string;
    name: string;
  };
  neq?: number;
  unNumber?: string;
  riskGroup?: '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6';
  compatibility?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' | 'L' | 'N' | 'S';
  weight?: number;
  active: boolean;
}
type DataResponse = PaginatedApiResponse<DenominationModel>;

type RequestByNameAndCategory = RequestPaginationParams & { name?: string; category?: string; munitionTypeId?: string };

export function wharehouseManagmentDenominationsDispatcher(params: RequestByNameAndCategory): DataResponse {
  const allData = getFixture<DenominationModel[]>(
    'fixtures/wharehouse-managment/denominations',
    'denominations-fixture.json',
  );
  let filtered = searchableByName(allData, params);
  filtered = searchableByExactCategory(allData, params);
  filtered = searchableByExactMunitionType(allData, params);
  const response = paginate(filtered, params);
  return response;
}

function searchableByExactMunitionType(
  allData: DenominationModel[],
  params: RequestByNameAndCategory,
): DenominationModel[] {
  if (params.munitionTypeId === undefined || params.munitionTypeId.trim() === '') {
    return allData;
  }
  const munitionTypeId = params.munitionTypeId;
  return allData.filter((e) => e.munitionType.id === munitionTypeId);
}

// function seed(total = 20): DenominationModel[] {
//   const item = getFixture<DenominationModel>(
//     'fixtures/wharehouse-managment/denominations',
//     'denominations-fixture.json',
//   );

//   const data: DenominationModel[] = new Array(total).fill(null).map((_, i) => {
//     return {
//       active: !!(i % 2),
//       id: `${item.id} ${i}`,
//       name: `${item.name} ${i}`,
//       category: i % 2 ? 'MUNITION' : 'MUNITION_COMPONENT',
//       munitionType: item.munitionType,
//       compatibility: item.compatibility,
//       neq: i,
//       weight: i * 10,
//       unNumber: item.unNumber,
//       riskGroup: item.riskGroup,
//     };
//   });

//   return data;
// }

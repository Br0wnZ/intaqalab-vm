import { paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface MunitionsDumpModel {
  id: string;
  name: string;
  cells: string[];
  cellsCount: number;
  enabled: boolean;
  neqMaxCell?: number;
  neqMax: number;
}

type DataResponse = PaginatedApiResponse<MunitionsDumpModel>;

export function wharehouseManagmentMunitionsDumpsDispatcher(params: RequestPaginationParams): DataResponse {
  const allData = seed(80);
  const response = paginate(allData, params);
  return response;
}

function seed(total = 20): MunitionsDumpModel[] {
  const data: MunitionsDumpModel[] = new Array(total).fill(null).map((_, i) => {
    return {
      enabled: !!(i % 2),
      cells: [`a ${i}`, `b ${i}`, `c ${i}`],
      cellsCount: 3,
      id: `id-${i + 1}`,
      name: `munitionDamup - ${i + 1}`,
      neqMax: i,
      neqMaxCell: i,
    };
  });

  return data;
}

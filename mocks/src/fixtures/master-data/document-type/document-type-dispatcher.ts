import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse, RequestPaginationParams } from '../../../utils.model';

interface DocumentTypeMasterResponse {
  id: string;
  name: { es: string; en: string };
  label: string;
  active: boolean;
  observations: string;
  category: 'GENERAL' | 'SPECIFIC';
}

type DataResponse = PaginatedApiResponse<DocumentTypeMasterResponse>;
export function masterDataDocumentTypeslDispatcher(params: RequestPaginationParams): DataResponse {
  const allData = seed(30);
  return paginate(allData, params);
}

function seed(total = 20): DocumentTypeMasterResponse[] {
  const item = getFixture<DocumentTypeMasterResponse>(
    'fixtures/master-data/document-type',
    'document-type-fixture.json',
  );
  const data: DocumentTypeMasterResponse[] = new Array(total).fill(null).map((_, i) => {
    return {
      active: !!(i % 2),
      id: `${item.id}-${i}`,
      name: {
        en: `Document type ${i}`,
        es: `Tipo documento ${i}`,
      },
      label: `Tipo documento ${i}`,
      observations: '',
      category: i % 2 === 0 ? 'GENERAL' : 'SPECIFIC',
    };
  });

  return data;
}

import type { ParsedQs } from 'qs';

import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse } from '../../../utils.model';
import type { DocumentSubtype } from '../../trials-docs/docs-subtypes-dispatcher';
import type { EventLogUsersResponse } from '../users/users-dispatcher';

export interface EventLogDocumentsResponse {
  title: string;
  type: DocumentSubtype;
  date: string;
  action: string;
  user: EventLogUsersResponse;
  hardwareId: string;
  accessCount: number;
}

export interface EventLogDocumentsFilters {
  type: DocumentSubtype;
  dateStart?: string;
  dateEnd?: string;
  action?: string[];
  userId?: string[];
  hardwareId?: string;
}

const DDBB: EventLogDocumentsResponse[] = [];

type DataResponse = PaginatedApiResponse<EventLogDocumentsResponse>;
export function eventLogDocumentsDispatcher(query: ParsedQs): DataResponse {
  if (!DDBB.length) DDBB.push(...seed(30));

  let dataToSend: EventLogDocumentsResponse[] = DDBB;

  const pageSize = query['pageSize'] || 10;
  const pageSizeNumber = parseInt(pageSize as string, 10);

  const page = query['page'] || 1;
  const pageNumber = parseInt(page as string, 10);

  if (query['type']) dataToSend = filterByType(dataToSend, query['type'] as string);

  if (query['date']) dataToSend = filterByDateRange(dataToSend, query['date'] as string);

  if (query['action']) dataToSend = filterByAction(dataToSend, DDBB, query['action'] as string);

  if (query['userId']) dataToSend = filterByUser(dataToSend, DDBB, query['userId'] as string);

  if (query['hardwareId']) dataToSend = filterByHardwareId(dataToSend, DDBB, query['hardwareId'] as string);

  if (query['sort']) dataToSend = sortArray(dataToSend, query['sort'] as string);

  return paginate(dataToSend, { pageSize: pageSizeNumber, page: pageNumber });
}

function seed(total = 20): EventLogDocumentsResponse[] {
  const item = getFixture<EventLogDocumentsResponse>('fixtures/event-log/documents', 'documents-fixture.json');

  const data: EventLogDocumentsResponse[] = new Array(total).fill(null).map((_, i) => {
    const userHardwareId = randomNumberBetweenRange(1, 7);
    return {
      title: `Documento ${i + 1}`,
      type: randomType(),
      date: `2026/${randomNumberBetweenRange(0, 1)}/${randomNumberBetweenRange(1, 17)}`,
      action: randomAction(),
      user: { id: `${item.user.id}${userHardwareId}`, label: `${item.user.label} ${userHardwareId}` },
      hardwareId: `${item.hardwareId}${userHardwareId}`,
      accessCount: randomAccessCount(),
    };
  });

  return data;
}

function randomType(): DocumentSubtype {
  const documentTypes = [
    { id: 'b1e1e7e0-1a2b-4c3d-8e9f-1a2b3c4d5e6f', name: 'Autorización' },
    { id: 'c2f2f8f1-2b3c-5d4e-9f0a-2b3c4d5e6f7a', name: 'Certificado de conformidad' },
    { id: 'd3g3g9g2-3c4d-6e5f-0a1b-3c4d5e6f7a8b', name: 'Comunicaciones' },
    { id: 'e4h4h0h3-4d5e-7f6a-1b2c-4d5e6f7a8b9c', name: 'Datos meteorológicos' },
    { id: 'f5i5i1i4-5e6f-8a7b-2c3d-5e6f7a8b9c0d', name: 'Documentación de referencia' },
    { id: 'a6j6j2j5-6f7a-9b8c-3d4e-6f7a8b9c0d1e', name: 'Informe de actividad técnica' },
    { id: 'b7k7k3k6-7a8b-0c9d-4e5f-7a8b9c0d1e2f', name: 'Informe externo' },
    { id: 'c8l8l4l7-8b9c-1d0e-5f6a-8b9c0d1e2f3a', name: 'Otros' },
    { id: 'd9m9m5m8-9c0d-2e1f-6a7b-9c0d1e2f3a4b', name: 'Plan de ensayos' },
    { id: 'e0n0n6n9-0d1e-3f2a-7b8c-0d1e2f3a4b5c', name: 'Presupuesto' },
    { id: 'f1o1o7o0-1e2f-4a3b-8c9d-1e2f3a4b5c6d', name: 'Solicitud' },
    { id: 'a2p2p8p1-2f3a-5b4c-9d0e-2f3a4b5c6d7e', name: 'Catálogo de Ensayos' },
    { id: 'b3q3q9q2-3a4b-6c5d-0e1f-3a4b5c6d7e8f', name: 'Nota de experiencias' },
  ] as const;

  const randomNumber = Math.floor(Math.random() * (12 - 0 + 1) + 0);

  return documentTypes[randomNumber];
}

function randomAction() {
  const actions = ['add', 'view', 'modify', 'link', 'delete'] as const;
  const randomNumberBetweenZeroAndFour = Math.floor(Math.random() * (4 - 0 + 1) + 0);

  return actions[randomNumberBetweenZeroAndFour];
}

function randomNumberBetweenRange(max: number, min: number) {
  const randomStringNumber = Math.floor(Math.random() * (max - min + 1) + min);
  return randomStringNumber.toString();
}

function randomAccessCount() {
  const randomStringNumber = Math.floor(Math.random() * (6 - 1 + 1) + 1);
  return randomStringNumber;
}

function filterByDateRange(array: EventLogDocumentsResponse[], date: string) {
  const filteredArray: EventLogDocumentsResponse[] = [];
  const startDate = {
    year: parseInt(date.split(';')[0].split('/')[0]),
    month: parseInt(date.split(';')[0].split('/')[1]),
    day: parseInt(date.split(';')[0].split('/')[2]),
  };
  const endDate = {
    year: parseInt(date.split(';')[1].split('/')[0]),
    month: parseInt(date.split(';')[1].split('/')[1]),
    day: parseInt(date.split(';')[1].split('/')[2]),
  };

  const found = array.filter((row) => {
    const rowYear = parseInt(row.date.split('/')[0]);
    const rowMonth = parseInt(row.date.split('/')[1]);
    const rowDay = parseInt(row.date.split('/')[2]);

    return (
      startDate.year <= rowYear &&
      endDate.year >= rowYear &&
      startDate.month <= rowMonth &&
      endDate.month >= rowMonth &&
      startDate.day <= rowDay &&
      endDate.day >= rowDay
    );
  });

  if (found) filteredArray.push(...found);

  return filteredArray;
}

function filterByAction(
  dataToSend: EventLogDocumentsResponse[],
  dataBase: EventLogDocumentsResponse[],
  actions: string,
) {
  const filteredArray: EventLogDocumentsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;
  const actionsArray = actions.split(';');

  actionsArray.forEach((action) => {
    const found = arrayToFilter.filter((row) => row.action === action);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByUser(dataToSend: EventLogDocumentsResponse[], dataBase: EventLogDocumentsResponse[], userIds: string) {
  const filteredArray: EventLogDocumentsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;
  const userIdsArray = userIds.split(';');

  userIdsArray.forEach((userId) => {
    const found = arrayToFilter.filter((item) => item.user.id === userId);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByHardwareId(
  dataToSend: EventLogDocumentsResponse[],
  dataBase: EventLogDocumentsResponse[],
  hardwareId: string,
) {
  const filteredArray: EventLogDocumentsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;

  const found = arrayToFilter.filter((item) => item.hardwareId === hardwareId);
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function filterByType(dataToFilter: EventLogDocumentsResponse[], types: string) {
  const filteredArray: EventLogDocumentsResponse[] = [];
  const typesArray = types.split(';');

  typesArray.forEach((type) => {
    const found = dataToFilter.filter((row) => row.type.id === type);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function sortArray(array: EventLogDocumentsResponse[], sort: string) {
  const sortedArray = array;
  const sortedColumn = sort.split(';')[0] as keyof EventLogDocumentsResponse;
  const sortDirection = sort.split(';')[1];

  sortedArray.sort((a: EventLogDocumentsResponse, b: EventLogDocumentsResponse) => {
    const A = a[sortedColumn];
    const B = b[sortedColumn];

    if (A < B) return sortDirection === 'asc' ? -1 : 1;
    if (A > B) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  return sortedArray;
}

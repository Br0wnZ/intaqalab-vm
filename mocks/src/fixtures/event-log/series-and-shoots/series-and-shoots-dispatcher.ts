import type { ParsedQs } from 'qs';

import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse } from '../../../utils.model';
import type { EventLogUsersResponse } from '../users/users-dispatcher';

export interface EventLogEventLogSeriesAndShootsResponse {
  date: string;
  action: 'create' | 'edit';
  user: EventLogUsersResponse;
  hardwareId: string;
  element: 'serie' | 'shoot';
  visibleNumber: string;
  internalId: string;
}

const DDBB: EventLogEventLogSeriesAndShootsResponse[] = [];

type DataResponse = PaginatedApiResponse<EventLogEventLogSeriesAndShootsResponse>;
export function eventLogSeriesAndShootsDispatcher(query: ParsedQs): DataResponse {
  if (!DDBB.length) DDBB.push(...seed(30));

  let dataToSend: EventLogEventLogSeriesAndShootsResponse[] = DDBB;

  const pageSize = query['pageSize'] || 10;
  const pageSizeNumber = parseInt(pageSize as string, 10);

  const page = query['page'] || 1;
  const pageNumber = parseInt(page as string, 10);

  if (query['date']) dataToSend = filterByDateRange(DDBB, query['date'] as string);

  if (query['action']) dataToSend = filterByAction(dataToSend, DDBB, query['action'] as string);

  if (query['userId']) dataToSend = filterByUser(dataToSend, DDBB, query['userId'] as string);

  if (query['hardwareId']) dataToSend = filterByHardwareId(dataToSend, DDBB, query['hardwareId'] as string);

  if (query['element']) dataToSend = filterByElement(dataToSend, DDBB, query['element'] as string);

  if (query['visibleNumber']) dataToSend = filterByVisibleNumber(dataToSend, DDBB, query['visibleNumber'] as string);

  if (query['internalId']) dataToSend = filterByInternalId(dataToSend, DDBB, query['internalId'] as string);

  if (query['sort']) dataToSend = sortArray(dataToSend, query['sort'] as string);

  return paginate(dataToSend, { pageSize: pageSizeNumber, page: pageNumber });
}

function seed(total = 20): EventLogEventLogSeriesAndShootsResponse[] {
  const item = getFixture<EventLogEventLogSeriesAndShootsResponse>(
    'fixtures/event-log/series-and-shoots',
    'series-and-shoots-fixture.json',
  );

  const data: EventLogEventLogSeriesAndShootsResponse[] = new Array(total).fill(null).map((_, i) => {
    const userHardwareId = randomNumberBetweenRange(1, 7);
    const element = randomElement();

    return {
      date: `2026/${randomNumberBetweenRange(0, 1)}/${randomNumberBetweenRange(1, 28)}`,
      action: randomAction(),
      user: { id: `${item.user.id}${userHardwareId}`, label: `${item.user.label} ${userHardwareId}` },
      hardwareId: `${item.hardwareId}${userHardwareId}`,
      element,
      visibleNumber: randomNumberBetweenRange(1, 10),
      internalId: randomInternalId(element),
    };
  });

  return data;
}

function randomAction() {
  const actions = ['create', 'edit'] as const;
  const randomNumberBetweenZeroAndOne = Math.floor(Math.random() * (1 - 0 + 1) + 0);

  return actions[randomNumberBetweenZeroAndOne];
}

function randomElement() {
  const actions = ['serie', 'shoot'] as const;
  const randomNumberBetweenZeroAndOne = Math.floor(Math.random() * (1 - 0 + 1) + 0);

  return actions[randomNumberBetweenZeroAndOne];
}

function randomInternalId(element: 'serie' | 'shoot') {
  const randomNumberBetweenOneAndFourty = Math.floor(Math.random() * (40 - 1 + 1) + 1);

  return `${element === 'serie' ? 'SER' : 'DSPR'}-000${randomNumberBetweenOneAndFourty}`;
}

function randomNumberBetweenRange(max: number, min: number) {
  const randomStringNumber = Math.floor(Math.random() * (max - min + 1) + min);
  return randomStringNumber.toString();
}

function filterByDateRange(array: EventLogEventLogSeriesAndShootsResponse[], date: string) {
  const filteredArray: EventLogEventLogSeriesAndShootsResponse[] = [];
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
  dataToSend: EventLogEventLogSeriesAndShootsResponse[],
  dataBase: EventLogEventLogSeriesAndShootsResponse[],
  actions: string,
) {
  const filteredArray: EventLogEventLogSeriesAndShootsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;
  const actionsArray = actions.split(';');

  actionsArray.forEach((action) => {
    const found = arrayToFilter.filter((row) => row.action === action);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByUser(
  dataToSend: EventLogEventLogSeriesAndShootsResponse[],
  dataBase: EventLogEventLogSeriesAndShootsResponse[],
  userIds: string,
) {
  const filteredArray: EventLogEventLogSeriesAndShootsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;
  const userIdsArray = userIds.split(';');

  userIdsArray.forEach((userId) => {
    const found = arrayToFilter.filter((item) => item.user.id === userId);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByHardwareId(
  dataToSend: EventLogEventLogSeriesAndShootsResponse[],
  dataBase: EventLogEventLogSeriesAndShootsResponse[],
  hardwareId: string,
) {
  const filteredArray: EventLogEventLogSeriesAndShootsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;

  const found = arrayToFilter.filter((item) => item.hardwareId === hardwareId);
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function filterByElement(
  dataToSend: EventLogEventLogSeriesAndShootsResponse[],
  dataBase: EventLogEventLogSeriesAndShootsResponse[],
  elements: string,
) {
  const filteredArray: EventLogEventLogSeriesAndShootsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;
  const elementsArray = elements.split(';');

  elementsArray.forEach((element) => {
    const found = arrayToFilter.filter((row) => row.element === element);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByVisibleNumber(
  dataToSend: EventLogEventLogSeriesAndShootsResponse[],
  dataBase: EventLogEventLogSeriesAndShootsResponse[],
  visibleNumber: string,
) {
  const filteredArray: EventLogEventLogSeriesAndShootsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;

  const found = arrayToFilter.filter((item) => item.visibleNumber === visibleNumber);
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function filterByInternalId(
  dataToSend: EventLogEventLogSeriesAndShootsResponse[],
  dataBase: EventLogEventLogSeriesAndShootsResponse[],
  internalId: string,
) {
  const filteredArray: EventLogEventLogSeriesAndShootsResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;

  const found = arrayToFilter.filter((item) => item.internalId.includes(internalId));
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function sortArray(array: EventLogEventLogSeriesAndShootsResponse[], sort: string) {
  const sortedArray = array;
  const sortedColumn = sort.split(';')[0] as keyof EventLogEventLogSeriesAndShootsResponse;
  const sortDirection = sort.split(';')[1];

  sortedArray.sort((a: EventLogEventLogSeriesAndShootsResponse, b: EventLogEventLogSeriesAndShootsResponse) => {
    const A = a[sortedColumn];
    const B = b[sortedColumn];

    if (A < B) return sortDirection === 'asc' ? -1 : 1;
    if (A > B) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  return sortedArray;
}

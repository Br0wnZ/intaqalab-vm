import type { ParsedQs } from 'qs';

import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse } from '../../../utils.model';
import type { EventLogUsersResponse } from '../users/users-dispatcher';

export interface EventLogEventLogGeneralDataResponse {
  date: string;
  action: string;
  user: EventLogUsersResponse;
  hardwareId: string;
  value: string;
}

export interface EventLogEventLogGeneralDataFilters {
  dateStart?: string;
  dateEnd?: string;
  action?: string[];
  userId?: string[];
  hardwareId?: string;
  value?: string;
}

const DDBB: EventLogEventLogGeneralDataResponse[] = [];

type DataResponse = PaginatedApiResponse<EventLogEventLogGeneralDataResponse>;
export function eventLogGeneralDataDispatcher(query: ParsedQs): DataResponse {
  if (!DDBB.length) DDBB.push(...seed(30));

  let dataToSend: EventLogEventLogGeneralDataResponse[] = DDBB;

  const pageSize = query['pageSize'] || 10;
  const pageSizeNumber = parseInt(pageSize as string, 10);

  const page = query['page'] || 1;
  const pageNumber = parseInt(page as string, 10);

  if (query['date']) dataToSend = filterByDateRange(DDBB, query['date'] as string);

  if (query['action']) dataToSend = filterByAction(dataToSend, DDBB, query['action'] as string);

  if (query['userId']) dataToSend = filterByUser(dataToSend, DDBB, query['userId'] as string);

  if (query['hardwareId']) dataToSend = filterByHardwareId(dataToSend, DDBB, query['hardwareId'] as string);

  if (query['value']) dataToSend = filterByValue(dataToSend, DDBB, query['value'] as string);

  if (query['sort']) dataToSend = sortArray(dataToSend, query['sort'] as string);

  return paginate(dataToSend, { pageSize: pageSizeNumber, page: pageNumber });
}

function seed(total = 20): EventLogEventLogGeneralDataResponse[] {
  const item = getFixture<EventLogEventLogGeneralDataResponse>(
    'fixtures/event-log/general-data',
    'general-data-fixture.json',
  );

  const data: EventLogEventLogGeneralDataResponse[] = new Array(total).fill(null).map((_, i) => {
    const userHardwareId = randomNumberBetweenRange(1, 7);
    return {
      date: `202${randomNumberBetweenRange(4, 5)}/${randomNumberBetweenRange(0, 3)}/${randomNumberBetweenRange(1, 28)}`,
      action: randomAction(),
      user: { id: `${item.user.id}${userHardwareId}`, label: `${item.user.label} ${userHardwareId}` },
      hardwareId: `${item.hardwareId}${userHardwareId}`,
      value: `${item.value} ${i}`,
    };
  });

  return data;
}

function randomAction() {
  const actions = ['create', 'edit'] as const;
  const randomNumberBetweenZeroAndOne = Math.floor(Math.random() * (1 - 0 + 1) + 0);

  return actions[randomNumberBetweenZeroAndOne];
}

function randomNumberBetweenRange(max: number, min: number) {
  const randomStringNumber = Math.floor(Math.random() * (max - min + 1) + min);
  return randomStringNumber.toString();
}

function filterByDateRange(array: EventLogEventLogGeneralDataResponse[], date: string) {
  const filteredArray: EventLogEventLogGeneralDataResponse[] = [];
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
  dataToSend: EventLogEventLogGeneralDataResponse[],
  dataBase: EventLogEventLogGeneralDataResponse[],
  actions: string,
) {
  const filteredArray: EventLogEventLogGeneralDataResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;
  const actionsArray = actions.split(';');

  actionsArray.forEach((action) => {
    const found = arrayToFilter.filter((row) => row.action === action);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByUser(
  dataToSend: EventLogEventLogGeneralDataResponse[],
  dataBase: EventLogEventLogGeneralDataResponse[],
  userIds: string,
) {
  const filteredArray: EventLogEventLogGeneralDataResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;
  const userIdsArray = userIds.split(';');

  userIdsArray.forEach((userId) => {
    const found = arrayToFilter.filter((item) => item.user.id === userId);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByHardwareId(
  dataToSend: EventLogEventLogGeneralDataResponse[],
  dataBase: EventLogEventLogGeneralDataResponse[],
  hardwareId: string,
) {
  const filteredArray: EventLogEventLogGeneralDataResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;

  const found = arrayToFilter.filter((item) => item.hardwareId === hardwareId);
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function filterByValue(
  dataToSend: EventLogEventLogGeneralDataResponse[],
  dataBase: EventLogEventLogGeneralDataResponse[],
  value: string,
) {
  const filteredArray: EventLogEventLogGeneralDataResponse[] = [];
  const arrayToFilter = dataToSend?.length ? dataToSend : dataBase;

  const found = arrayToFilter.filter((item) => item.value.includes(value));
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function sortArray(array: EventLogEventLogGeneralDataResponse[], sort: string) {
  const sortedArray = array;
  const sortedColumn = sort.split(';')[0] as keyof EventLogEventLogGeneralDataResponse;
  const sortDirection = sort.split(';')[1];

  sortedArray.sort((a: EventLogEventLogGeneralDataResponse, b: EventLogEventLogGeneralDataResponse) => {
    const A = a[sortedColumn];
    const B = b[sortedColumn];

    if (A < B) return sortDirection === 'asc' ? -1 : 1;
    if (A > B) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  return sortedArray;
}

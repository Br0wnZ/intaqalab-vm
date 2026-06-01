import type { ParsedQs } from 'qs';

import { getFixture, paginate } from '../../../utils';
import type { PaginatedApiResponse } from '../../../utils.model';
import type { EventLogUsersResponse } from '../users/users-dispatcher';

export interface EventLogMeasuresResponse {
  date: string;
  action: 'create' | 'edit';
  user: EventLogUsersResponse;
  hardwareId: string;
  instrument: EventLogInstrumentResponse;
  value: string;
  measure: EventLogMeasureResponse;
  shoot: string;
  serie: string;
}

interface EventLogInstrumentResponse {
  id: string;
  label: string;
}

interface EventLogMeasureResponse {
  id: string;
  label: string;
}

const DDBB: EventLogMeasuresResponse[] = [];

type DataResponse = PaginatedApiResponse<EventLogMeasuresResponse>;
export function measuresDispatcher(query: ParsedQs): DataResponse {
  if (!DDBB.length) DDBB.push(...seed(30));

  let dataToSend: EventLogMeasuresResponse[] = DDBB;

  const pageSize = query['pageSize'] || 10;
  const pageSizeNumber = parseInt(pageSize as string, 10);

  const page = query['page'] || 1;
  const pageNumber = parseInt(page as string, 10);

  if (query['date']) dataToSend = filterByDateRange(dataToSend, query['date'] as string);

  if (query['action']) dataToSend = filterByAction(dataToSend, query['action'] as string);

  if (query['user']) dataToSend = filterByUser(dataToSend, query['user'] as string);

  if (query['hardwareId']) dataToSend = filterByHardwareId(dataToSend, query['hardwareId'] as string);

  if (query['instrument']) dataToSend = filterByInstrument(dataToSend, query['instrument'] as string);

  if (query['value']) dataToSend = filterByValue(dataToSend, query['value'] as string);

  if (query['measure']) dataToSend = filterByMeasure(dataToSend, query['measure'] as string);

  if (query['shoot']) dataToSend = filterByShoot(dataToSend, query['shoot'] as string);

  if (query['serie']) dataToSend = filterBySerie(dataToSend, query['serie'] as string);

  if (query['sort']) dataToSend = sortArray(dataToSend, query['sort'] as string);

  return paginate(dataToSend, { pageSize: pageSizeNumber, page: pageNumber });
}

function seed(total = 20): EventLogMeasuresResponse[] {
  const item = getFixture<EventLogMeasuresResponse>('fixtures/event-log/measures', 'measures-fixture.json');

  const data: EventLogMeasuresResponse[] = new Array(total).fill(null).map((_, i) => {
    const userHardwareId = randomNumberBetweenRange(1, 7);
    //const element = randomElement();

    return {
      date: `2026/${randomNumberBetweenRange(0, 1)}/${randomNumberBetweenRange(1, 28)}`,
      action: randomAction(),
      user: { id: `${item.user.id}${userHardwareId}`, label: `${item.user.label} ${userHardwareId}` },
      hardwareId: `${item.hardwareId}${userHardwareId}`,
      instrument: randomInstrument(),
      value: randomNumberBetweenRange(1, 17620),
      measure: randomMeasure(),
      shoot: randomNumberBetweenRange(1, 5),
      serie: `Serie ${randomNumberBetweenRange(1, 10)}`,
    };
  });

  return data;
}

function randomAction() {
  const actions = ['create', 'edit'] as const;
  const randomNumberBetweenZeroAndOne = Math.floor(Math.random() * (1 - 0 + 1) + 0);

  return actions[randomNumberBetweenZeroAndOne];
}

function randomInstrument() {
  const instruments = [
    { id: 'coor', label: 'Coordenadas' },
    { id: 'crono', label: 'Crono 3' },
    { id: 'record', label: 'Grabador vídeo digital' },
  ] as const;
  const randomNumberBetweenZeroAndOne = Math.floor(Math.random() * (2 - 0 + 1) + 0);

  return instruments[randomNumberBetweenZeroAndOne];
}

function randomMeasure() {
  const measures = [
    { id: 'cX', label: 'Coordenada X' },
    { id: 'cY', label: 'Coordenada Y' },
    { id: 'tof', label: 'Tiempo de vuelo' },
    { id: 'fli', label: 'Tiemmpo de vuelo' },
    { id: 'dist', label: 'Distancia' },
  ] as const;
  const randomNumberBetweenZeroAndOne = Math.floor(Math.random() * (3 - 0 + 1) + 0);

  return measures[randomNumberBetweenZeroAndOne];
}

function randomNumberBetweenRange(max: number, min: number) {
  const randomStringNumber = Math.floor(Math.random() * (max - min + 1) + min);
  return randomStringNumber.toString();
}

function filterByDateRange(array: EventLogMeasuresResponse[], date: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];
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

function filterByAction(dataToSend: EventLogMeasuresResponse[], actions: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];
  const actionsArray = actions.split(';');

  actionsArray.forEach((action) => {
    const found = dataToSend.filter((row) => row.action === action);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByUser(dataToSend: EventLogMeasuresResponse[], userIds: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];
  const userIdsArray = userIds.split(';');

  userIdsArray.forEach((user) => {
    const found = dataToSend.filter((item) => item.user.id === user);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByHardwareId(dataToSend: EventLogMeasuresResponse[], hardwareId: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];

  const found = dataToSend.filter((item) => item.hardwareId === hardwareId);
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function filterByInstrument(dataToSend: EventLogMeasuresResponse[], instrument: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];
  const instrumentsArray = instrument.split(';');

  instrumentsArray.forEach((instrument) => {
    const found = dataToSend.filter((row) => row.instrument.id === instrument);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByValue(dataToSend: EventLogMeasuresResponse[], value: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];

  const found = dataToSend.filter((item) => item.value === value);
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function filterByMeasure(dataToSend: EventLogMeasuresResponse[], measure: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];
  const instrumentsArray = measure.split(';');

  instrumentsArray.forEach((measure) => {
    const found = dataToSend.filter((row) => row.measure.id === measure);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function filterByShoot(dataToSend: EventLogMeasuresResponse[], shoot: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];

  const found = dataToSend.filter((item) => item.shoot === shoot);
  if (found) filteredArray.push(...found);

  return filteredArray;
}

function filterBySerie(dataToSend: EventLogMeasuresResponse[], serie: string) {
  const filteredArray: EventLogMeasuresResponse[] = [];
  const seriesArray = serie.split(';');

  seriesArray.forEach((serie) => {
    const found = dataToSend.filter((row) => row.serie === serie);
    if (found) filteredArray.push(...found);
  });

  return filteredArray;
}

function sortArray(array: EventLogMeasuresResponse[], sort: string) {
  const sortedArray = array;
  const sortedColumn = sort.split(';')[0] as keyof EventLogMeasuresResponse;
  const sortDirection = sort.split(';')[1];

  sortedArray.sort((a: EventLogMeasuresResponse, b: EventLogMeasuresResponse) => {
    const A = a[sortedColumn];
    const B = b[sortedColumn];

    if (A < B) return sortDirection === 'asc' ? -1 : 1;
    if (A > B) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  return sortedArray;
}

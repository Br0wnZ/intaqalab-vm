import type { EventLogFilters, EventLogSearch } from './event-log.model';

export type MapFnType = ((date: Date) => string) | ((array: string[]) => string);

export const arrayToString = (array: string[]) => array.join(';');

export const isArray = (array: unknown[]) => Array.isArray(array);

export const isDate = (date: Date) => date instanceof Date;

export const formatDate = (date: Date) => `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

export const castEventLogFiltersToEventLogSearch = (eventLogFilters: EventLogFilters) => {
  const filtersArray = Object.entries(eventLogFilters);

  const dataToSend: Partial<EventLogSearch> = {};

  filtersArray.forEach(([key, value]) => {
    if (!value || value.length < 1) return;

    let normalizedValue = '';

    const handlers: Record<string, MapFnType> = {
      date: formatDate,
      array: arrayToString,
    };

    if (isArray(value)) normalizedValue = handlers['array'](value);

    if (isDate(value)) normalizedValue = handlers['date'](value);

    if (!normalizedValue) normalizedValue = value.trim();

    dataToSend[<keyof EventLogSearch>key] = normalizedValue;
  });

  return dataToSend;
};

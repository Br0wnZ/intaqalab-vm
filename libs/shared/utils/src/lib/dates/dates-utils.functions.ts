import { endOfWeek, endOfYear, startOfWeek, startOfYear } from 'date-fns';
import { endOfMonth, startOfMonth } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function getStartEndOfWeek(date: Date) {
  const start = formatDateToYYYYMMDD(startOfWeek(date, { weekStartsOn: 1, locale: es }));
  const end = formatDateToYYYYMMDD(endOfWeek(date, { weekStartsOn: 1, locale: es }));
  return { start, end };
}

export function getStartEndOfMonth(date: Date) {
  const start = formatDateToYYYYMMDD(startOfMonth(date));
  const end = formatDateToYYYYMMDD(endOfMonth(date));
  return { start, end };
}

export function getStartEndYear(date: Date) {
  const start = formatDateToYYYYMMDD(startOfYear(date));
  const end = formatDateToYYYYMMDD(endOfYear(date));
  return { start, end };
}

function formatDateToYYYYMMDD(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

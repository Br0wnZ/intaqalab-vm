import type { CalendarViewObservation } from '@intaqalab/models';

export function getObservationByDay(
  observationList: CalendarViewObservation[],
  dateToSearch: Date,
): CalendarViewObservation | null {
  for (const observation of observationList) {
    const dateToFind = dateToSearch.getDate();
    const monthToFind = dateToSearch.getMonth();
    if (observation.date.getDate() === dateToFind && observation.date.getMonth() === monthToFind) {
      return observation;
    }
  }
  return null;
}

export function contains(dates: Date[], dateToSearch: Date): boolean {
  const dateToFind = dateToSearch.getDate();
  const monthToFind = dateToSearch.getMonth();
  for (const date of dates) {
    if (date.getDate() === dateToFind && date.getMonth() === monthToFind) {
      return true;
    }
  }
  return false;
}

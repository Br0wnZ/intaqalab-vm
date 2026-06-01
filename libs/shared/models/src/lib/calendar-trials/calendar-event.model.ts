import type { CalendarEvent } from 'angular-calendar';

import type { TrialStatus } from '../trials/trial-status.enum';

export type CalendarEventsApiResponse =
  | CalendarTrialApiResponse
  | CalendarNoNoTamApiResponse
  | CalendarHolidayApiResponse
  | CalendarObservationApiResponse;

export interface CalendarTrialApiResponse {
  id: string;
  date: string;
  eventType: 'FIRE_TRIAL';
  description: string;
  lineOfShootId: string;
  fireTrial: {
    id: string;
    status: TrialStatus;
    trialNumber: string;
    description: string;
    client: {
      id: string;
      name: string;
    };
  };
}

export interface CalendarNoNoTamApiResponse {
  date: string;
  eventType: 'NO_NOTAM';
  id: string;
}
export interface CalendarHolidayApiResponse {
  date: string;
  eventType: 'HOLIDAY';
  description: string;
  id: string;
}

export interface CalendarObservationApiResponse {
  date: string;
  eventType: 'OBSERVATION';
  description: string;
  id: string;
}

export type HolidaysNoNotamDaysApiResponse = (CalendarViewNoNotam | CalendarViewHoliday)[];
// view models

export interface CalendarParsedModel {
  no_notams: CalendarViewNoNotam[];
  holidays: CalendarViewHoliday[];
  trials: CalendarTrialApiResponse[];
  observations: CalendarViewObservation[];
}

export interface CalendarViewModel {
  no_notams: CalendarViewNoNotam[];
  holidays: CalendarViewHoliday[];
  trials: CalendarTrialApiResponse[];
  observations: CalendarViewObservation[];
}

export interface CalendarEventViewModel {
  no_notams: CalendarViewNoNotam[];
  holidays: CalendarViewHoliday[];
  trials: CalendarEvent[];
  observations: CalendarViewObservation[];
}

export interface CalendarViewHoliday {
  date: Date;
  eventType: 'HOLIDAY';
  description: string;
  id: string;
}
export interface CalendarViewObservation {
  date: Date;
  eventType: 'OBSERVATION';
  description: string;
  id: string;
}

export interface CalendarViewNoNotam {
  date: Date;
  eventType: 'NO_NOTAM';
  id: string;
}

export interface CalendarViewTrial {
  id: number;
  title: string;
  date: Date;
  eventType: 'TRIAL';
  trialid: number;
  description: string;
  observations: string;
}

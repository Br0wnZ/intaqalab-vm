import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { injectCalendarEndpoint } from '@intaqalab/config';
import type {
  CalendarEventsApiResponse,
  CalendarParsedModel,
  CalendarViewModel,
  HolidaysNoNotamDaysApiResponse,
} from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { getStartEndOfMonth, getStartEndOfWeek, getStartEndYear } from '@intaqalab/utils';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

const SKIP_STATUS: TrialStatus[] = [TrialStatus.CANCELLED, TrialStatus.VOIDED];

@Injectable({
  providedIn: 'root',
})
export class CalendarEventsDataService {
  readonly #httpClient = inject(HttpClient);

  readonly #url = injectCalendarEndpoint();

  getWeekEvents(date: Date, line: string): Observable<CalendarParsedModel> {
    const { end, start } = getStartEndOfWeek(date);
    return this.#getEvents(start, end, line);
  }

  getMonthEvents(date: Date, line: string): Observable<CalendarParsedModel> {
    const { end, start } = getStartEndOfMonth(date);
    return this.#getEvents(start, end, line);
  }

  getDayEvents(date: Date, line: string): Observable<CalendarParsedModel> {
    const { end, start } = getStartEndOfWeek(date);
    return this.#getEvents(start, end, line);
  }

  getHolidaysNoNotamDaysOfYear(date: Date, lineOfShootId: string): Observable<HolidaysNoNotamDaysApiResponse> {
    const { end, start } = getStartEndYear(date);
    let params = new HttpParams({
      fromObject: {
        startDate: start,
        endDate: end,
        lineOfShootId,
        eventType: ['NO_NOTAM', 'HOLIDAY'],
      },
    });
    if (lineOfShootId !== '') {
      params = params.set('lineOfShootId', lineOfShootId);
    }

    return this.#httpClient.get<HolidaysNoNotamDaysApiResponse>(`${this.#url}/events`, {
      params,
    });
  }

  #getEvents(startDate: string, endDate: string, lineOfShootId: string): Observable<CalendarViewModel> {
    let params = new HttpParams({
      fromObject: {
        startDate,
        endDate,
      },
    });
    if (lineOfShootId !== '') {
      params = params.set('lineOfShootId', lineOfShootId);
    }

    return this.#httpClient
      .get<CalendarEventsApiResponse[]>(`${this.#url}/events`, {
        params,
      })
      .pipe(
        map((res) => {
          const parsed: CalendarParsedModel = {
            holidays: [],
            no_notams: [],
            trials: [],
            observations: [],
          };

          res.forEach((item) => {
            if (item.eventType === 'HOLIDAY') {
              parsed.holidays.push({
                description: item.description,
                date: new Date(item.date),
                eventType: item.eventType,
                id: item.id,
              });
            } else if (item.eventType === 'NO_NOTAM') {
              parsed.no_notams.push({
                date: new Date(item.date),
                eventType: item.eventType,
                id: item.id,
              });
            } else if (item.eventType === 'FIRE_TRIAL') {
              if (!SKIP_STATUS.includes(item.fireTrial.status)) {
                parsed.trials.push({
                  id: item.id,
                  date: item.date,
                  eventType: item.eventType,
                  fireTrial: item.fireTrial,
                  description: item.description,
                  lineOfShootId: item.lineOfShootId,
                });
              }
            } else {
              parsed.observations.push({
                date: new Date(item.date),
                description: item.description,
                eventType: 'OBSERVATION',
                id: item.id,
              });
            }
          });
          return parsed;
        }),
      );
  }
}

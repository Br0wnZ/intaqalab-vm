import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { injectCalendarEndpoint } from '@intaqalab/config';
import { format } from 'date-fns';
import { lastValueFrom } from 'rxjs';

import type { SpecialDayActionToPerform } from '../components/shell/special-days-manager-modal-shell.component';

interface GroupedActionsToPerform {
  holidayAdd: string[];
  holidayRemove: string[];
  noNoTamAdd: string[];
  noNOTamRemove: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SpecialDaysDataServiceService {
  readonly #httpClient = inject(HttpClient);
  readonly #calendarUrl = injectCalendarEndpoint();

  async dispatchActions(actionsToPerform: SpecialDayActionToPerform[]) {
    const groupedActions = this.#groupActionsToPerform(actionsToPerform);
    if (groupedActions.holidayAdd.length) {
      await this.#createHolidays(groupedActions.holidayAdd);
    }
    if (groupedActions.holidayRemove.length) {
      await this.#deleteHolidays(groupedActions.holidayRemove);
    }
    if (groupedActions.noNoTamAdd.length) {
      await this.#createNoNotams(groupedActions.noNoTamAdd);
    }
    if (groupedActions.noNOTamRemove.length) {
      await this.#deleteNoNotams(groupedActions.noNOTamRemove);
    }
    return true;
  }

  #groupActionsToPerform(actionsToPerform: SpecialDayActionToPerform[]): GroupedActionsToPerform {
    const result: GroupedActionsToPerform = {
      holidayAdd: [],
      holidayRemove: [],
      noNoTamAdd: [],
      noNOTamRemove: [],
    };

    for (const action of actionsToPerform) {
      const date = format(action.date, 'yyyy-MM-dd');
      if (action.entity === 'HOLIDAY') {
        if (action.action === 'ADD') {
          result.holidayAdd.push(date);
        } else {
          result.holidayRemove.push(date);
        }
      }
      if (action.entity === 'NO_NOTAM') {
        if (action.action === 'ADD') {
          result.noNoTamAdd.push(date);
        } else {
          result.noNOTamRemove.push(date);
        }
      }
    }

    return result;
  }

  #createHolidays(dates: string[]) {
    return lastValueFrom(this.#httpClient.post<unknown>(`${this.#calendarUrl}/holidays`, { dates }));
  }

  #deleteHolidays(dates: string[]) {
    return lastValueFrom(this.#httpClient.delete<unknown>(`${this.#calendarUrl}/holidays`, { body: { dates } }));
  }

  #createNoNotams(dates: string[]) {
    return lastValueFrom(this.#httpClient.post<unknown>(`${this.#calendarUrl}/no-notams`, { dates }));
  }

  #deleteNoNotams(dates: string[]) {
    return lastValueFrom(this.#httpClient.delete<unknown>(`${this.#calendarUrl}/no-notams`, { body: { dates } }));
  }
}

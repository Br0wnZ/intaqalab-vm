import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { injectCalendarEndpoint } from '@intaqalab/config';
import type { CalendarViewObservation } from '@intaqalab/models';
import { format } from 'date-fns';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CalendarObservationsDataService {
  readonly #httpClient = inject(HttpClient);
  readonly #calendarUrl = injectCalendarEndpoint();

  save(date: Date, description: string): Observable<unknown> {
    return this.#httpClient.post<unknown>(`${this.#calendarUrl}/days/${format(date, 'yyyy-MM-dd')}/observations`, {
      description,
    });
  }

  delete(observation: CalendarViewObservation): Observable<unknown> {
    return this.#httpClient.delete<unknown>(
      `${this.#calendarUrl}/days/${format(observation.date, 'yyyy-MM-dd')}/observations/${observation.id}`,
    );
  }

  edit(observation: CalendarViewObservation, newDescription: string): Observable<unknown> {
    return this.#httpClient.put<unknown>(
      `${this.#calendarUrl}/days/${format(observation.date, 'yyyy-MM-dd')}/observations/${observation.id}`,
      { description: newDescription },
    );
  }
}

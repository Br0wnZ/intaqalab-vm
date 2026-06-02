import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import { SKIP_ERROR_TOAST } from '@intaqalab/config';
import type { CalendarTrialScheduleApiResponse } from '@intaqalab/models';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CalendarTrialScheduleService {
  readonly #httpClient = inject(HttpClient);

  readonly #apiUrl = injectFireTrialsEndpoint();

  getSchedule(fireTrialId: string) {
    const encodedTrialId = encodeURIComponent(fireTrialId);
    return lastValueFrom(
      this.#httpClient.get<CalendarTrialScheduleApiResponse>(`${this.#apiUrl}/${encodedTrialId}/schedule`, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      }),
    );
  }

  update(fireTrialId: string, payload: CalendarTrialScheduleApiResponse) {
    const encodedTrialId = encodeURIComponent(fireTrialId);
    return this.#httpClient.put<CalendarTrialScheduleApiResponse>(
      `${this.#apiUrl}/${encodedTrialId}/schedule`,
      payload,
      {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      },
    );
  }
}

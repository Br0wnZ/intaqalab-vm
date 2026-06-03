import { HttpClient, HttpContext, httpResource } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import { SKIP_ERROR_TOAST } from '@intaqalab/config';
import type { CalendarTrialScheduleApiResponse } from '@intaqalab/models';
import type { Observable } from 'rxjs';
import { lastValueFrom, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CalendarTrialScheduleService {
  readonly #httpClient = inject(HttpClient);
  readonly #apiUrl = injectFireTrialsEndpoint();

  readonly #scheduleTrigger = signal<string | null>(null);
  readonly #updateParams = signal<{ trialId: string; payload: CalendarTrialScheduleApiResponse } | null>(null);

  /** Reactive GET resource — re-fetches when trialId or scheduleChangeTrigger changes. */
  readonly scheduleResource = httpResource<CalendarTrialScheduleApiResponse>(() => {
    const trialId = this.#scheduleTrigger();
    if (!trialId) return undefined;
    return {
      url: `${this.#apiUrl}/${encodeURIComponent(trialId)}/schedule`,
      method: 'GET',
      context: new HttpContext().set(SKIP_ERROR_TOAST, true),
    };
  });

  /** Reactive PUT resource — fires when updateParams is set. */
  readonly updateResource = httpResource<CalendarTrialScheduleApiResponse>(() => {
    const params = this.#updateParams();
    if (!params) return undefined;
    return {
      url: `${this.#apiUrl}/${encodeURIComponent(params.trialId)}/schedule`,
      method: 'PUT',
      body: params.payload,
      context: new HttpContext().set(SKIP_ERROR_TOAST, true),
    };
  });

  /**
   * Shared trigger signal — kept for backward compatibility with components that
   * depend on it reactively (PlanningScheduledDatesComponent, etc.).
   * Also incremented automatically after any successful update.
   */
  readonly scheduleChangeTrigger = signal<number>(0);

  constructor() {
    // Auto-reload GET and notify listeners when a PUT succeeds.
    effect(() => {
      const status = this.updateResource.status();
      if (status === 'resolved') {
        this.scheduleResource.reload();
        this.scheduleChangeTrigger.update((n) => n + 1);
      }
    });
  }

  /** Set the active trial for reactive GET loading. */
  loadSchedule(trialId: string): void {
    this.#scheduleTrigger.set(trialId);
  }

  /** Trigger a PUT via httpResource (store-driven path). */
  updateSchedule(trialId: string, payload: CalendarTrialScheduleApiResponse): void {
    this.#updateParams.set({ trialId, payload });
  }

  /** Reload the reactive schedule resource. */
  reload(): void {
    this.scheduleResource.reload();
  }

  // ─── Backward-compatible imperative API ──────────────────────────────────

  triggerRefresh(): void {
    this.scheduleChangeTrigger.update((n) => n + 1);
    if (this.#scheduleTrigger()) {
      this.scheduleResource.reload();
    }
  }

  getSchedule(fireTrialId: string): Promise<CalendarTrialScheduleApiResponse> {
    const encodedTrialId = encodeURIComponent(fireTrialId);
    return lastValueFrom(
      this.#httpClient.get<CalendarTrialScheduleApiResponse>(`${this.#apiUrl}/${encodedTrialId}/schedule`, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      }),
    );
  }

  update(fireTrialId: string, payload: CalendarTrialScheduleApiResponse): Observable<CalendarTrialScheduleApiResponse> {
    const encodedTrialId = encodeURIComponent(fireTrialId);
    return this.#httpClient
      .put<CalendarTrialScheduleApiResponse>(`${this.#apiUrl}/${encodedTrialId}/schedule`, payload, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .pipe(tap(() => this.triggerRefresh()));
  }
}

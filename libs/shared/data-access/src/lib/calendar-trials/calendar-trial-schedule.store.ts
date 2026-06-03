import { computed, inject } from '@angular/core';
import type { CalendarTrialScheduleApiResponse } from '@intaqalab/models';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { CalendarTrialScheduleService } from './calendar-trial-schedule.service';

interface CalendarTrialScheduleState {
  isInitialized: boolean;
}

const initialState: CalendarTrialScheduleState = {
  isInitialized: false,
};

export const CalendarTrialScheduleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store, service = inject(CalendarTrialScheduleService)) => ({
    schedule: computed(() => service.scheduleResource.value() ?? []),
    isLoading: computed(() => service.scheduleResource.isLoading()),
    isUpdating: computed(() => service.updateResource.isLoading()),
    updateStatus: computed(() => service.updateResource.status()),
    hasError: computed(() => service.scheduleResource.error() !== null),
    /** Exposed for components that need to react to any schedule change (new + legacy paths). */
    scheduleChangeTrigger: computed(() => service.scheduleChangeTrigger()),
  })),

  withMethods((store, service = inject(CalendarTrialScheduleService)) => ({
    loadSchedule(trialId: string): void {
      service.loadSchedule(trialId);
    },

    updateSchedule(trialId: string, payload: CalendarTrialScheduleApiResponse): void {
      service.updateSchedule(trialId, payload);
    },

    reload(): void {
      service.reload();
    },
  })),
);

export type CalendarTrialScheduleStoreType = InstanceType<typeof CalendarTrialScheduleStore>;

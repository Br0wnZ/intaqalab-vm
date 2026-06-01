import { inject } from '@angular/core';
import { CalendarEventsDataService, LinesOfShotDataService } from '@intaqalab/data-access';
import type {
  CalendarEventViewModel,
  CalendarParsedModel,
  CalendarTrialApiResponse,
  CalendarViewHoliday,
  CalendarViewNoNotam,
  CalendarViewObservation,
  LinesOfShot
} from '@intaqalab/models';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import type { CalendarEvent } from 'angular-calendar';
import { CalendarView } from 'angular-calendar';
import { firstValueFrom } from 'rxjs';

import type { LinesOfShotViewState } from '../models/lines-of-shoot.model';

function calendarEventFromTrial(event: CalendarTrialApiResponse): CalendarEvent<CalendarTrialApiResponse> {
  return {
    start: new Date(event.date),
    title: event.description,
    id: `${event.date}${event.fireTrial.id}`,
    meta: {
      ...event,
    },
  };
}

interface CalendarTrialState {
  linesOfShot: LinesOfShot[];
  linesOfShotSelected: string | null;
  view: CalendarView;
  viewDate: Date;
  trials: CalendarTrialApiResponse[] | null;
  holidays: CalendarViewHoliday[] | null;
  no_notams: CalendarViewNoNotam[] | null;
  observations: CalendarViewObservation[] | null;
  loading: boolean;
  error: string | null;
  showWeekends: boolean;
}

export const CalendarTrialStore = signalStore(
  withState<CalendarTrialState>({
    linesOfShot: [],
    linesOfShotSelected: null,
    view: CalendarView.Month,
    // viewDate: new Date('2025-11-26T03:24:00'),
    viewDate: new Date(),
    trials: [],
    holidays: [],
    no_notams: [],
    observations: [],
    loading: false,
    error: null,
    showWeekends: false,
  }),
  withComputed((state) => {
    const noData = () => {
      return [state.no_notams(), state.trials(), state.holidays()].every((e) => e === null);
    };

    return {
      groupedEvents: () => {
        if (noData()) {
          return null;
        } else {
          const result: CalendarEventViewModel = {
            holidays: state.holidays() || [],
            no_notams: state.no_notams() || [],
            trials: (state.trials() || []).map(calendarEventFromTrial),
            observations: state.observations() || [],
          };
          return result;
        }
      },
      schedulerLinesOfShotData: () => {
        const data: LinesOfShotViewState = {
          list: state.linesOfShot().filter((e) => !!e.id),
          current: state.linesOfShotSelected(),
        };
        return data;
      },
    };
  }),

  withMethods((store) => {
    const linesOfShotService = inject(LinesOfShotDataService);
    const eventsCalendarService = inject(CalendarEventsDataService);

    return {
      async _loadItems() {
        try {
          const date = store.viewDate();
          const lineId = store.linesOfShotSelected();
          const calendarView = store.view();
          if (lineId === null) {
            return;
          }
          patchState(store, { loading: true, error: null });
          let data: CalendarParsedModel;
          if (calendarView === CalendarView.Month) {
            data = await firstValueFrom(eventsCalendarService.getMonthEvents(date, lineId));
          } else if (calendarView === CalendarView.Week) {
            data = await firstValueFrom(eventsCalendarService.getWeekEvents(date, lineId));
          } else {
            data = await firstValueFrom(eventsCalendarService.getDayEvents(date, lineId));
          }
          const { holidays, no_notams, trials, observations } = data;
          patchState(store, { loading: false, holidays, no_notams, trials, observations });
        } catch (err) {
          console.log(err);
          patchState(store, {
            loading: false,
            error: 'Error al cargar los trials',
          });
        }
      },
      async initView() {
        patchState(store, { loading: true, error: null });
        try {
          const linesOfShotList = await firstValueFrom(linesOfShotService.list(true));
          patchState(store, { linesOfShot: linesOfShotList });

          const defaultLineId = linesOfShotList.length > 0 ? linesOfShotList[0].id : '';
          patchState(store, { linesOfShotSelected: defaultLineId });
          patchState(store, { loading: false, error: null });
          await this._loadItems();
        } catch (err) {
          console.log(err);
          patchState(store, {
            loading: false,
            error: 'Error al cargar los trials',
          });
        }
      },
      async refreshView() {
        this._loadItems();
      },
      changeLine(lineId: string) {
        patchState(store, { linesOfShotSelected: lineId });
        this._loadItems();
        console.log('Line changed to', lineId);
      },
      setView(view: CalendarView) {
        patchState(store, { view });
        this._loadItems();
      },
      setViewDate(viewDate: Date) {
        patchState(store, { viewDate });
        this._loadItems();
      },
      setShowWeekends(showWeekends: boolean) {
        patchState(store, { showWeekends });
      },
    };
  }),

  withHooks({
    onInit(store) {
      store.initView();
    },
  }),
);

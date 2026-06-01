import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CalendarTrialScheduleService } from '@intaqalab/data-access';
import type {
  CalendarTrialSchedule,
  CalendarTrialScheduleApiResponse,
  HasIdAndTrialNumber,
  LinesOfShotViewState,
  TrialSchedulerModalShellInput,
} from '@intaqalab/models';
import { format } from 'date-fns';
import type { Observable } from 'rxjs';
import { lastValueFrom, map, of, switchMap } from 'rxjs';

import { TrialSchedulerModalShellComponent } from './components/shell/trial-scheduler-modal-shell.component';

@Injectable({
  providedIn: 'root',
})
export class TrialScheduleService {
  readonly #dialog = inject(MatDialog);
  readonly #calendarTrialScheduleService = inject(CalendarTrialScheduleService);

  async selectLinesAndDatesToSchedule(
    trial: HasIdAndTrialNumber,
    linesOfShotViewState: LinesOfShotViewState,
    day?: Date,
  ) {
    const scheduledData = await this.#calendarTrialScheduleService.getSchedule(trial.id);
    if (day) {
      scheduledData.push({
        date: format(day, 'yyyy-MM-dd'),
        lineOfShootId: linesOfShotViewState.current,
      });
    }

    const inputData: TrialSchedulerModalShellInput = {
      trial,
      defaultValues: scheduledData,
      linesOfShotViewState,
      touched: !!day,
    };
    const dialogRef = this.#dialog.open(TrialSchedulerModalShellComponent, {
      data: inputData,
      maxWidth: 1200,
      width: '100vw',
      height: '100vh',
      maxHeight: 750,
    });

    const ref: Observable<boolean> = dialogRef.afterClosed().pipe(
      switchMap((result: CalendarTrialSchedule[] | false) => {
        if (result) {
          const payload = result.map((e) => {
            return {
              date: format(e.date, 'yyyy-MM-dd'),
              lineOfShootId: e.lineOfShootId,
            };
          });
          return this.#calendarTrialScheduleService.update(trial.id, payload).pipe(map(() => true));
        } else {
          return of(false as const);
        }
      }),
    );

    return lastValueFrom(ref);
  }
}

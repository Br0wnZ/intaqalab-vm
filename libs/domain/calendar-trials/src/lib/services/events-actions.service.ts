import { Injectable, inject } from '@angular/core';
import { CalendarTrialScheduleService } from '@intaqalab/data-access';
import type { CalendarTrialApiResponse, CalendarViewObservation } from '@intaqalab/models';
import { TrialScheduleService, TrialTableSelectorModalService } from '@intaqalab/trial-management';
import { UiDialogService } from '@intaqalab/ui';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { lastValueFrom } from 'rxjs';

import type { LinesOfShotViewState } from '../models/lines-of-shoot.model';
import { CalendarObservationsDataService } from './data/calendar-observations-data.service';

@Injectable({
  providedIn: 'root',
})
export class EventsActionsService {
  selectTrialModalService = inject(TrialTableSelectorModalService);
  scheduleService = inject(TrialScheduleService);
  async schedule(linesOfShotData: LinesOfShotViewState, day: Date) {
    const trial = await this.selectTrialModalService.select();
    if (trial) {
      let current = linesOfShotData.current ?? '';
      if (current === '') {
        const record = linesOfShotData.list.find((e) => !!e.id);
        if (record) {
          current = record.id;
        }
      }
      const sanitizedLinesOfShotData = {
        ...linesOfShotData,
        current,
      };
      const value = await this.scheduleService.selectLinesAndDatesToSchedule(trial, sanitizedLinesOfShotData, day);
      return value;
    }
    return false;
  }

  translate = inject(TranslateService);
  calendarTrialScheduleService = inject(CalendarTrialScheduleService);
  async unprogramTrial(trial: CalendarTrialApiResponse): Promise<boolean> {
    const dayMsg = format(new Date(trial.date), 'dd-MM-yyyy');
    const description = this.translate.instant('TRIAL_SCHEDULER.UNPROGAM.DESCRIPTION', {
      id: trial.fireTrial.trialNumber,
      day: dayMsg,
    });

    const confirm = await this.dialogService.confirm({
      description,
      labelButtonConfirm: 'TRIAL_SCHEDULER.UNPROGAM.LABEL_COFIRM',
      title: 'TRIAL_SCHEDULER.UNPROGAM.TITLE',
      title2: '',
    });

    if (confirm) {
      const trialId = trial.fireTrial.id;
      const trialSchedules = await this.calendarTrialScheduleService.getSchedule(trialId);
      const index = trialSchedules.findIndex((element) => {
        return element.lineOfShootId === trial.lineOfShootId && element.date === trial.date;
      });
      if (index > -1) {
        trialSchedules.splice(index, 1);
        await lastValueFrom(this.calendarTrialScheduleService.update(trialId, trialSchedules));
      }
    }
    return confirm;
  }

  dialogService = inject(UiDialogService);
  observationsService = inject(CalendarObservationsDataService);
  async addObservationsToDay(day: Date) {
    const description = await this.dialogService.input({
      labelCancel: 'COMMONS.CANCEL',
      labelButtonConfirm: 'CALENDAR_TRIALS.MODAL_ADD_OBS.ADD',
      placeholder: 'CALENDAR_TRIALS.MODAL_ADD_OBS.PLACEHOLDER',
      title: 'CALENDAR_TRIALS.MODAL_ADD_OBS.TITLE',
    });

    if (description !== false) {
      await lastValueFrom(this.observationsService.save(day, description));
      return true;
    } else {
      return false;
    }
  }

  async editObservationsToDay(observations: CalendarViewObservation) {
    console.log('editing observations', observations);
    const description = await this.dialogService.input({
      labelCancel: 'COMMONS.CANCEL',
      labelButtonConfirm: 'CALENDAR_TRIALS.MODAL_ADD_OBS.EDIT',
      placeholder: 'CALENDAR_TRIALS.MODAL_ADD_OBS.PLACEHOLDER',
      title: 'CALENDAR_TRIALS.MODAL_ADD_OBS.TITLE',
      fieldText: observations.description,
    });

    if (description !== false) {
      await lastValueFrom(this.observationsService.edit(observations, description));
      return true;
    } else {
      return false;
    }
  }

  async deleteObs(observations: CalendarViewObservation): Promise<boolean> {
    const dayMsg = format(new Date(observations.date), 'dd-MM-yyyy');
    const description = this.translate.instant('CALENDAR_TRIALS.CONFIRM_DELETE_OBS.DESCRIPTION', {
      day: dayMsg,
    });

    const confirm = await this.dialogService.confirm({
      description,
      labelButtonConfirm: 'CALENDAR_TRIALS.CONFIRM_DELETE_OBS.LABEL_COFIRM',
      title: 'CALENDAR_TRIALS.CONFIRM_DELETE_OBS.TITLE',
      title2: '',
    });

    if (confirm) {
      await lastValueFrom(this.observationsService.delete(observations));
      return true;
    }
    return false;
  }
}

import type { FireTrialScheduleItem } from '../trials/trial.model';

export interface LinesOfShot {
  id: string;
  label: string;
}
export type LineOfShotDictionary = Record<string, LinesOfShot>;

export interface HasIdAndTrialNumber {
  id: string;
  trialNumber: string;
}

export interface TrialSchedulerModalShellInput {
  trial: HasIdAndTrialNumber;
  linesOfShotViewState: LinesOfShotViewState;
  defaultValues: CalendarTrialScheduleApiResponse;
  fromModal?: boolean;
  touched?: boolean;
}

export interface LinesOfShotViewState {
  list: LinesOfShot[];
  current: string;
}

export type CalendarTrialScheduleApiResponse = FireTrialScheduleItem[];

export type CalendarTrialSchedule = {
  date: Date;
  lineOfShootId: string;
};

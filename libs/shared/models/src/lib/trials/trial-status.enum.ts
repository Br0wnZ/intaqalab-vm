import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

export enum TrialStatus {
  UNDER_REVIEW = 'UNDER_REVIEW',
  PLANNED = 'PLANNED',
  PREPARED = 'PREPARED',
  IN_PROGRESS = 'IN_PROGRESS',
  INTERRUPTED = 'INTERRUPTED',
  STARTED = 'STARTED',
  EXECUTED = 'EXECUTED',
  ANALYZING = 'ANALYZING',
  FINALIZING = 'FINALIZING',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  VOIDED = 'VOIDED',
}

export const injectTrialStatus = () => {
  const translate = inject(TranslateService);
  const trialStatusTranslations = toSignal(translate.getStreamOnTranslationChange('UTILS_TRIALS.TRIAL_STATUS'));
  return computed(() => {
    const translations = trialStatusTranslations();
    return [
      { value: TrialStatus.UNDER_REVIEW, label: translations.UNDER_REVIEW },
      { value: TrialStatus.PLANNED, label: translations['PLANNED'] },
      { value: TrialStatus.IN_PROGRESS, label: translations['IN_PROGRESS'] },
      { value: TrialStatus.INTERRUPTED, label: translations['INTERRUPTED'] },
      { value: TrialStatus.STARTED, label: translations['STARTED'] },
      { value: TrialStatus.EXECUTED, label: translations['EXECUTED'] },
      { value: TrialStatus.ANALYZING, label: translations['ANALYZING'] },
      { value: TrialStatus.FINALIZING, label: translations['FINALIZING'] },
      { value: TrialStatus.CLOSED, label: translations['CLOSED'] },
      { value: TrialStatus.CANCELLED, label: translations['CANCELLED'] },
      { value: TrialStatus.VOIDED, label: translations['VOIDED'] },
    ];
  });
};

export interface HasStatus {
  status: TrialStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type TrialActions = 'MODIFY' | 'CANCEL' | 'ANNUL' | 'REACTIVATE' | 'CLOSE' | 'REOPEN' | 'REMOVE' | 'EXECUTION';

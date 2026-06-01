import type { PipeTransform } from '@angular/core';
import { Pipe, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TrialStatus } from '@intaqalab/models';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'trialStatusLabel',
})
export class TrialStatusLabelPipe implements PipeTransform {
  readonly #translate = inject(TranslateService);
  readonly #trialStatusTranslations = toSignal(
    this.#translate.getStreamOnTranslationChange('UTILS_TRIALS.TRIAL_STATUS'),
  );

  transform(status: TrialStatus): string {
    const translations = this.#trialStatusTranslations();
    if (!translations) return status;
    const found = [
      { value: TrialStatus.UNDER_REVIEW, label: translations.UNDER_REVIEW },
      { value: TrialStatus.PLANNED, label: translations['PLANNED'] },
      { value: TrialStatus.PREPARED, label: translations['PREPARED'] },
      { value: TrialStatus.IN_PROGRESS, label: translations['IN_PROGRESS'] },
      { value: TrialStatus.INTERRUPTED, label: translations['INTERRUPTED'] },
      { value: TrialStatus.STARTED, label: translations['STARTED'] },
      { value: TrialStatus.EXECUTED, label: translations['EXECUTED'] },
      { value: TrialStatus.ANALYZING, label: translations['ANALYZING'] },
      { value: TrialStatus.FINALIZING, label: translations['FINALIZING'] },
      { value: TrialStatus.CLOSED, label: translations['CLOSED'] },
      { value: TrialStatus.CANCELLED, label: translations['CANCELLED'] },
      { value: TrialStatus.VOIDED, label: translations['VOIDED'] },
    ].find((s) => s.value === status);
    return found?.label ?? status;
  }
}

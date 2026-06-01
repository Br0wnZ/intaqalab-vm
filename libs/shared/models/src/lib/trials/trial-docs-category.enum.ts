import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

export enum TrialDocsCategory {
  ALL = 'ALL',
  SPECIFIC = 'SPECIFIC',
  GENERAL = 'GENERAL',
}

export const injectTrialDocsCategory = () => {
  const translate = inject(TranslateService);
  const trialDocsCategoryTranslations = toSignal(
    translate.getStreamOnTranslationChange('TRIAL_DOCS.FILTERS.OPTIONS.CATEGORY'),
  );
  return computed(() => {
    const translations = trialDocsCategoryTranslations();
    return [
      { value: TrialDocsCategory.ALL, label: translations.ALL },
      { value: TrialDocsCategory.SPECIFIC, label: translations.SPECIFIC },
      { value: TrialDocsCategory.GENERAL, label: translations.GENERAL },
    ];
  });
};

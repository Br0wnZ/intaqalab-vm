import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

export enum TrialDocsStatus {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  OBSOLETE = 'OBSOLETE',
}

export const injectTrialDocsStatus = () => {
  const translate = inject(TranslateService);
  const trialDocsStatusTranslations = toSignal(
    translate.getStreamOnTranslationChange('TRIAL_DOCS.FILTERS.OPTIONS.STATUS'),
  );
  return computed(() => {
    const translations = trialDocsStatusTranslations();
    return [
      { value: TrialDocsStatus.ALL, label: translations.ALL },
      { value: TrialDocsStatus.ACTIVE, label: translations.ACTIVE },
      { value: TrialDocsStatus.OBSOLETE, label: translations.OBSOLETE },
    ];
  });
};

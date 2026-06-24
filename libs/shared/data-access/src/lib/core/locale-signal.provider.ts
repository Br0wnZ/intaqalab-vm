import { computed } from '@angular/core';
import type { EnvironmentProviders } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';
import { LOCALE_SIGNAL } from '@intaqalab/utils';
import type { AppLocale } from '@intaqalab/utils';

import { LanguageService } from './language-service';

/**
 * Provides a reactive `LOCALE_SIGNAL` token bound to `LanguageService.currentLanguage`.
 *
 * Register in `app.config.ts` providers to enable locale-reactive formatting
 * in `IntaDecimalPipe` and `LocaleDecimalInputDirective`.
 *
 * @example
 * // app.config.ts
 * import { provideLocaleSignal } from '@intaqalab/data-access';
 *
 * export const Config: ApplicationConfig = {
 *   providers: [
 *     ...provideLocaleSignal(),
 *   ],
 * };
 */
export function provideLocaleSignal(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: LOCALE_SIGNAL,
      useFactory: (ls: LanguageService) =>
        computed<AppLocale>(() => (ls.currentLanguage() === 'en' ? 'en-US' : 'es-ES')),
      deps: [LanguageService],
    },
  ]);
}

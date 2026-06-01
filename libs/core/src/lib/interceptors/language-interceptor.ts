import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const DEFAULT_LANGUAGE = 'es';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const translateService = inject(TranslateService);
  const currentLang = translateService.getCurrentLang() || DEFAULT_LANGUAGE;

  const langRequest = req.clone({
    setHeaders: {
      'Accept-Language': currentLang,
    },
  });

  return next(langRequest);
};

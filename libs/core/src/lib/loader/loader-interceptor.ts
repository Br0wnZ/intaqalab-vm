import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LoaderService } from './services/loader.service';

const EXCLUDED_URLS = ['/i18n/', '/assets/', '/execution/state', '/openid-connect/token'];

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const shouldSkip = EXCLUDED_URLS.some((url) => req.url.includes(url));

  if (shouldSkip) {
    return next(req);
  }

  const loader = inject(LoaderService);
  loader.show();

  return next(req).pipe(finalize(() => loader.hide()));
};

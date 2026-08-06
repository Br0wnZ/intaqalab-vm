import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { MutationLoaderService } from './services/mutation-loader.service';

const EXCLUDED_URLS = ['/i18n/', '/assets/', '/execution/state', '/openid-connect/token'];
const MUTATION_METHODS = ['PUT', 'POST', 'DELETE'];

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const shouldSkip = EXCLUDED_URLS.some((url) => req.url.includes(url));

  if (shouldSkip) {
    return next(req);
  }

  const isMutation = MUTATION_METHODS.includes(req.method.toUpperCase());

  if (!isMutation) {
    return next(req);
  }

  const mutationLoader = inject(MutationLoaderService);
  mutationLoader.show();

  return next(req).pipe(finalize(() => mutationLoader.hide()));
};

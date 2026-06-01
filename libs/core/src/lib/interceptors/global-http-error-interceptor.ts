import type { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SKIP_ERROR_TOAST } from '@intaqalab/config';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

const HTTP_ERROR_KEY_MAP: Record<number, string> = {
  0: 'HTTP_ERRORS.NO_CONNECTION',
  400: 'HTTP_ERRORS.BAD_REQUEST',
  401: 'HTTP_ERRORS.UNAUTHORIZED',
  403: 'HTTP_ERRORS.FORBIDDEN',
  500: 'HTTP_ERRORS.SERVER_ERROR',
};

const HTTP_ERROR_TOAST_EXCLUDED_STATUSES = new Set([404]);

export const globalHttpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastrService);
  const translate = inject(TranslateService);
  const skipErrorToast = req.context.get(SKIP_ERROR_TOAST);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!skipErrorToast && !HTTP_ERROR_TOAST_EXCLUDED_STATUSES.has(error.status)) {
        const messageKey = resolveErrorTranslationKey(error.status);
        const title = translate.instant('HTTP_ERRORS.TITLE');
        const message = translate.instant(messageKey);

        toastService.error(message, title, {
          timeOut: 4000,
          progressBar: true,
          closeButton: true,
        });
      }

      return throwError(() => error);
    }),
  );
};

const resolveErrorTranslationKey = (status: number): string => {
  return HTTP_ERROR_KEY_MAP[status] ?? 'HTTP_ERRORS.DEFAULT';
};

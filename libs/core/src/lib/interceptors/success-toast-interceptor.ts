import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { injectApiUrl, TOAST_FEEDBACK } from '@intaqalab/config';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { tap } from 'rxjs';

export const successToastInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const translate = inject(TranslateService);
  const baseApiUrl = injectApiUrl();
  const toastConfig = req.context.get(TOAST_FEEDBACK);
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse && req.url.startsWith(baseApiUrl)) {
          const method = req.method.toUpperCase();
          if (['POST', 'PUT', 'DELETE'].includes(method)) {
            const title = translate.instant('TOAST.DEFAULT_TITLE');
            const message = translate.instant(toastConfig.message);
            toastr.success(message, title, {
              timeOut: 3000,
              progressBar: true,
              closeButton: true,
            });
          }
        }
      },
    }),
  );
};

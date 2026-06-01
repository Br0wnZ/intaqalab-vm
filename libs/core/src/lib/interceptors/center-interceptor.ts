import type { HttpInterceptorFn } from '@angular/common/http';
import { SKIP_CENTER_INTERCEPTOR, injectApiUrl } from '@intaqalab/config';

export const centerInterceptor: HttpInterceptorFn = (req, next) => {
  const baseApiUrl = injectApiUrl();
  const offset = baseApiUrl.length;
  const centerId = '2f40f684-4201-4903-95ea-0871aa3281e9';

  const skipInterceptor = req.context.get(SKIP_CENTER_INTERCEPTOR);
  if (skipInterceptor) {
    return next(req);
  }

  const url = req.url;
  if (url.startsWith(baseApiUrl)) {
    const isRemote = baseApiUrl.startsWith('http');
    let urlWithCenter: string;

    if (isRemote) {
      // Modo remoto directo: insertar /centers/{id} DESPUÉS del segmento versionado
      // Ej: {apiUrl}/fire-trials-api/1.0.0/fire-trials → {apiUrl}/fire-trials-api/1.0.0/centers/{id}/fire-trials
      const remainder = url.substring(offset);
      const match = remainder.match(/^(\/[^/]+\/\d+\.\d+\.\d+)(\/.*)?$/);
      if (match) {
        const apiVersionPath = match[1];
        const resourcePath = match[2] || '';
        urlWithCenter = `${baseApiUrl}${apiVersionPath}/centers/${centerId}${resourcePath}`;
      } else {
        urlWithCenter = `${baseApiUrl}/centers/${centerId}${remainder}`;
      }
    } else {
      // Modo proxy local: insertar /centers/{id} después de apiUrl (el proxy reestructura la URL)
      urlWithCenter = `${baseApiUrl}/centers/${centerId}${url.substring(offset)}`;
    }

    const apiReq = req.clone({ url: urlWithCenter });
    return next(apiReq);
  } else {
    return next(req);
  }
};

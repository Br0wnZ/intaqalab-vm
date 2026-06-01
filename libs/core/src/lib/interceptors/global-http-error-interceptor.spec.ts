import { HttpContext, HttpErrorResponse, HttpRequest, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { SKIP_ERROR_TOAST } from '@intaqalab/config';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { throwError } from 'rxjs';
import { vi } from 'vitest';

import { globalHttpErrorInterceptor } from './global-http-error-interceptor';

describe('globalHttpErrorInterceptor', () => {
  let mockToastrService: { error: ReturnType<typeof vi.fn> };
  let mockTranslateService: { instant: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockToastrService = { error: vi.fn() };
    mockTranslateService = { instant: vi.fn((key: string) => `Translated: ${key}`) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: ToastrService, useValue: mockToastrService },
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(globalHttpErrorInterceptor).toBeTruthy();
  });

  function runInterceptor(status: number, skipErrorToast = false): Promise<void> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, skipErrorToast);
    const baseReq = new HttpRequest('GET', '/api/test');
    const req = baseReq.clone({ context });
    const error = new HttpErrorResponse({ status, statusText: 'Error', url: '/api/test' });
    const next = vi.fn(() => throwError(() => error));

    return new Promise<void>((resolve, reject) => {
      TestBed.runInInjectionContext(() => {
        globalHttpErrorInterceptor(req, next).subscribe({
          next: () => resolve(),
          error: () => resolve(),
        });
      });
    });
  }

  it('should show toaster for status 0 (no connection)', async () => {
    await runInterceptor(0);

    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.TITLE');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.NO_CONNECTION');
    expect(mockToastrService.error).toHaveBeenCalledWith(
      'Translated: HTTP_ERRORS.NO_CONNECTION',
      'Translated: HTTP_ERRORS.TITLE',
      { timeOut: 4000, progressBar: true, closeButton: true },
    );
  });

  it('should show toaster for status 400 (bad request)', async () => {
    await runInterceptor(400);

    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.TITLE');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.BAD_REQUEST');
    expect(mockToastrService.error).toHaveBeenCalledWith(
      'Translated: HTTP_ERRORS.BAD_REQUEST',
      'Translated: HTTP_ERRORS.TITLE',
      { timeOut: 4000, progressBar: true, closeButton: true },
    );
  });

  it('should show toaster for status 401 (unauthorized)', async () => {
    await runInterceptor(401);

    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.TITLE');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.UNAUTHORIZED');
    expect(mockToastrService.error).toHaveBeenCalledWith(
      'Translated: HTTP_ERRORS.UNAUTHORIZED',
      'Translated: HTTP_ERRORS.TITLE',
      { timeOut: 4000, progressBar: true, closeButton: true },
    );
  });

  it('should show toaster for status 403 (forbidden)', async () => {
    await runInterceptor(403);

    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.TITLE');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.FORBIDDEN');
    expect(mockToastrService.error).toHaveBeenCalledWith(
      'Translated: HTTP_ERRORS.FORBIDDEN',
      'Translated: HTTP_ERRORS.TITLE',
      { timeOut: 4000, progressBar: true, closeButton: true },
    );
  });

  it('should NOT show toaster for status 404 (not found)', async () => {
    await runInterceptor(404);

    expect(mockToastrService.error).not.toHaveBeenCalled();
    expect(mockTranslateService.instant).not.toHaveBeenCalled();
  });

  it('should show toaster for status 500 (server error)', async () => {
    await runInterceptor(500);

    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.TITLE');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.SERVER_ERROR');
    expect(mockToastrService.error).toHaveBeenCalledWith(
      'Translated: HTTP_ERRORS.SERVER_ERROR',
      'Translated: HTTP_ERRORS.TITLE',
      { timeOut: 4000, progressBar: true, closeButton: true },
    );
  });

  it('should show toaster with default message for unknown status 503', async () => {
    await runInterceptor(503);

    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.TITLE');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('HTTP_ERRORS.DEFAULT');
    expect(mockToastrService.error).toHaveBeenCalledWith(
      'Translated: HTTP_ERRORS.DEFAULT',
      'Translated: HTTP_ERRORS.TITLE',
      { timeOut: 4000, progressBar: true, closeButton: true },
    );
  });

  it('should NOT show a toaster if SKIP_ERROR_TOAST context token is true', async () => {
    await runInterceptor(500, true);

    expect(mockToastrService.error).not.toHaveBeenCalled();
    expect(mockTranslateService.instant).not.toHaveBeenCalled();
  });
});

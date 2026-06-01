import { delay, of, throwError } from 'rxjs';
import { vi } from 'vitest';

/**
 * 🎭 Crear mock de TranslateService (i18n)
 */
export function createMockTranslateService() {
  return {
    instant: vi.fn((key: string, params?: Record<string, unknown>) => {
      // Simular interpolación básica
      if (params) {
        return `${key}_${JSON.stringify(params)}`;
      }
      return key;
    }),
    get: vi.fn((key: string) => of(key)),
    stream: vi.fn((key: string) => of(key)),
    use: vi.fn(),
    setDefaultLang: vi.fn(),
    addLangs: vi.fn(),
    getLangs: vi.fn(() => ['en', 'es']),
    currentLang: 'en',
  };
}

/**
 * 🎭 Crear mock de HttpClient genérico
 */
export function createMockHttpClient() {
  return {
    get: vi.fn(() => of({})),
    post: vi.fn(() => of({})),
    put: vi.fn(() => of({})),
    patch: vi.fn(() => of({})),
    delete: vi.fn(() => of({})),
    request: vi.fn(() => of({})),
  };
}

/**
 * 🎭 Crear mock de Router
 */
export function createMockRouter() {
  return {
    navigate: vi.fn().mockResolvedValue(true),
    navigateByUrl: vi.fn().mockResolvedValue(true),
    url: '/',
    events: of(),
    createUrlTree: vi.fn(),
    serializeUrl: vi.fn(),
  };
}

/**
 * 🎭 Crear mock de ActivatedRoute
 */
export function createMockActivatedRoute(params: Record<string, unknown> = {}) {
  return {
    snapshot: {
      params,
      queryParams: {},
      data: {},
    },
    params: of(params),
    queryParams: of({}),
    data: of({}),
    paramMap: of({
      get: (key: string) => params[key],
      has: (key: string) => key in params,
    }),
  };
}

/**
 * 🎯 Helper para simular delay en async operations
 */
export function createDelayedResponse<T>(value: T, delayMs = 100) {
  return of(value).pipe(delay(delayMs));
}

/**
 * 🎯 Helper para simular error en async operations
 */
export function createErrorResponse(message = 'Error', delayMs = 100) {
  return throwError(() => new Error(message)).pipe(delay(delayMs));
}

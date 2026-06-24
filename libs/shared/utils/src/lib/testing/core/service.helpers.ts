import { signal } from '@angular/core';
import { delay, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { LOCALE_SIGNAL } from '../../tokens/locale-signal.token';
import type { AppLocale } from '../../tokens/locale-signal.token';

/**
 * 🌍 Crear mock de LanguageService con signal reactivo
 *
 * @example
 * const mock = createMockLanguageService('en');
 * mock.currentLanguage.set('es'); // change language in tests
 */
export function createMockLanguageService(initialLang: 'es' | 'en' = 'es') {
  const currentLanguage = signal<'es' | 'en'>(initialLang);
  return {
    currentLanguage,
    getCurrentLanguage: vi.fn(() => currentLanguage()),
    setLanguage: vi.fn(async (lang: 'es' | 'en') => {
      currentLanguage.set(lang);
    }),
    supportedLanguages: ['es', 'en'] as const,
    isLanguageSupported: vi.fn((lang: string) => ['es', 'en'].includes(lang)),
    getTranslation: vi.fn((key: string) => key),
  };
}

/**
 * 🌍 Provider helper for `LOCALE_SIGNAL` token in tests.
 *
 * Use in components that import `IntaDecimalPipe` or `LocaleDecimalInputDirective`.
 *
 * @example
 * const { provider, localeSignal } = createLocaleSignalProvider('es-ES');
 * TestBed.configureTestingModule({ providers: [provider] });
 * localeSignal.set('en-US'); // change locale during test
 */
export function createLocaleSignalProvider(initialLocale: AppLocale = 'es-ES') {
  const localeSignal = signal<AppLocale>(initialLocale);
  return {
    localeSignal,
    provider: { provide: LOCALE_SIGNAL, useValue: localeSignal },
  };
}

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

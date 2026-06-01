import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LanguageService } from './language-service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateServiceMock: TranslateService;
  let localStorageGetItemSpy: ReturnType<typeof vi.spyOn>;
  let localStorageSetItemSpy: ReturnType<typeof vi.spyOn>;

  const createService = (savedLanguage: string | null = null, browserLang = 'es') => {
    localStorageGetItemSpy.mockReturnValue(savedLanguage);
    vi.mocked(translateServiceMock.getBrowserLang).mockReturnValue(browserLang);
    vi.mocked(translateServiceMock.use).mockReturnValue(of({}));

    return TestBed.inject(LanguageService);
  };

  beforeEach(() => {
    translateServiceMock = {
      getBrowserLang: vi.fn().mockReturnValue('es'),
      use: vi.fn().mockReturnValue(of({})),
      instant: vi.fn().mockImplementation((key: string) => key),
    } as unknown as TranslateService;

    localStorageGetItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    localStorageGetItemSpy.mockReturnValue(null);

    TestBed.configureTestingModule({
      providers: [LanguageService, { provide: TranslateService, useValue: translateServiceMock }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageGetItemSpy.mockRestore();
    localStorageSetItemSpy.mockRestore();
  });

  describe('initialization', () => {
    it('should be created', () => {
      service = createService();
      expect(service).toBeTruthy();
    });

    it('should initialize with saved language from localStorage', () => {
      service = createService('en');

      expect(translateServiceMock.use).toHaveBeenCalledWith('en');
      expect(service.currentLanguage()).toBe('en');
    });

    it('should initialize with browser language when no saved language', () => {
      service = createService(null, 'en');

      expect(translateServiceMock.use).toHaveBeenCalledWith('en');
      expect(service.currentLanguage()).toBe('en');
    });

    it('should default to "es" when browser language is not supported', () => {
      service = createService(null, 'fr');

      expect(translateServiceMock.use).toHaveBeenCalledWith('es');
      expect(service.currentLanguage()).toBe('es');
    });

    it('should prioritize saved language over browser language', () => {
      service = createService('es', 'en');

      expect(translateServiceMock.use).toHaveBeenCalledWith('es');
      expect(service.currentLanguage()).toBe('es');
    });
  });

  describe('setLanguage', () => {
    beforeEach(() => {
      service = createService();
      vi.clearAllMocks();
      vi.mocked(translateServiceMock.use).mockReturnValue(of({}));
    });

    it('should call translate.use with the provided language', () => {
      service.setLanguage('en');

      expect(translateServiceMock.use).toHaveBeenCalledWith('en');
    });

    it('should update the currentLanguage signal', () => {
      service.setLanguage('en');

      expect(service.currentLanguage()).toBe('en');
    });

    it('should save the language to localStorage', () => {
      service.setLanguage('en');

      expect(localStorageSetItemSpy).toHaveBeenCalledWith('app-language', 'en');
    });

    it('should set document.documentElement.lang', () => {
      service.setLanguage('en');

      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return the current language', () => {
      service = createService('en');

      expect(service.getCurrentLanguage()).toBe('en');
    });

    it('should return "es" as default', () => {
      service = createService(null, 'es');

      expect(service.getCurrentLanguage()).toBe('es');
    });
  });

  describe('getTranslation', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should call translate.instant with key', () => {
      vi.mocked(translateServiceMock.instant).mockReturnValue('translated');

      const result = service.getTranslation('test.key');

      expect(translateServiceMock.instant).toHaveBeenCalledWith('test.key', undefined);
      expect(result).toBe('translated');
    });

    it('should pass params to translate.instant', () => {
      const params = { name: 'John' };
      vi.mocked(translateServiceMock.instant).mockReturnValue('Hello John');

      const result = service.getTranslation('greeting', params);

      expect(translateServiceMock.instant).toHaveBeenCalledWith('greeting', params);
      expect(result).toBe('Hello John');
    });
  });

  describe('isLanguageSupported', () => {
    beforeEach(() => {
      service = createService();
    });

    it('should return true for supported languages', () => {
      expect(service.isLanguageSupported('es')).toBe(true);
      expect(service.isLanguageSupported('en')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(service.isLanguageSupported('fr')).toBe(false);
      expect(service.isLanguageSupported('de')).toBe(false);
      expect(service.isLanguageSupported('')).toBe(false);
    });
  });

  describe('supportedLanguages', () => {
    it('should contain es and en', () => {
      service = createService();

      expect(service.supportedLanguages).toEqual(['es', 'en']);
    });
  });
});

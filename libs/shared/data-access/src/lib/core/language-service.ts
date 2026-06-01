import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'es' | 'en';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  currentLanguage = signal<SupportedLanguage>('es');

  supportedLanguages: SupportedLanguage[] = ['es', 'en'];

  readonly #translate = inject(TranslateService);

  constructor() {
    this.#initializeLanguage();
  }

  #initializeLanguage() {
    const savedLanguage = localStorage.getItem('app-language') as SupportedLanguage;

    const browserLang = this.#translate.getBrowserLang() as SupportedLanguage;

    const languageToUse = savedLanguage || (this.supportedLanguages.includes(browserLang) ? browserLang : 'es');

    this.setLanguage(languageToUse);
  }

  setLanguage(lang: SupportedLanguage) {
    this.#translate.use(lang).subscribe(() => {
      this.currentLanguage.set(lang);

      localStorage.setItem('app-language', lang);

      document.documentElement.lang = lang;

      console.log(`Idioma cambiado a: ${lang}`);
    });
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage();
  }

  getTranslation(key: string, params?: Record<string, unknown>): string {
    return this.#translate.instant(key, params);
  }

  isLanguageSupported(lang: string): boolean {
    return this.supportedLanguages.includes(lang as SupportedLanguage);
  }
}

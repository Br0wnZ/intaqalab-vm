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

  readonly initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.#initializeLanguage();
  }

  #initializeLanguage(): Promise<void> {
    this.#translate.addLangs(this.supportedLanguages);
    this.#translate.setDefaultLang('es');

    const savedLanguage = localStorage.getItem('app-language') as SupportedLanguage;

    const browserLang = this.#translate.getBrowserLang() as SupportedLanguage;

    const languageToUse = savedLanguage || (this.supportedLanguages.includes(browserLang) ? browserLang : 'es');

    return this.setLanguage(languageToUse);
  }

  setLanguage(lang: SupportedLanguage): Promise<void> {
    return new Promise<void>((resolve) => {
      this.#translate.use(lang).subscribe(() => {
        this.currentLanguage.set(lang);

        localStorage.setItem('app-language', lang);

        document.documentElement.lang = lang;

        console.log(`Idioma cambiado a: ${lang}`);
        resolve();
      });
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

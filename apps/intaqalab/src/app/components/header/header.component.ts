import { Component, computed, inject, isDevMode, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { FeatureFlagService } from '@intaqalab/config';
import { AuthService, HeaderToolsComponent } from '@intaqalab/core';
import { LanguageService, type SupportedLanguage } from '@intaqalab/data-access';
import { IntaIconComponent } from '@intaqalab/ui';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, MatButtonModule, MatMenuModule, HeaderToolsComponent, IntaIconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected authService = inject(AuthService);
  protected user = this.authService.user;
  protected featureFlags = inject(FeatureFlagService);

  logout = output<void>();
  readonly isDevMode = isDevMode();

  protected userView = computed(() => {
    const userValue = this.user();
    if (userValue) {
      return userValue.name;
    } else {
      return '';
    }
  });

  get tabsNavigationEnabled(): boolean {
    return this.featureFlags.tabsNavigation();
  }

  toggleTabsNavigation() {
    this.featureFlags.toggleTabsNavigation();
  }

  readonly languageService = inject(LanguageService);

  changeLanguage(lang: SupportedLanguage) {
    this.languageService.setLanguage(lang);
  }

  getFlag(lang: SupportedLanguage): string {
    const flags: Record<SupportedLanguage, string> = {
      es: '🇪🇸',
      en: '🇬🇧',
    };
    return flags[lang];
  }

  getLanguageName(lang: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
      es: 'Español',
      en: 'English',
    };
    return names[lang];
  }
}

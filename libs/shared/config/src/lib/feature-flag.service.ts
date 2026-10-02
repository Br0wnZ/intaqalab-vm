import { Injectable, inject, signal } from '@angular/core';

import { APP_ENV } from './environment.token';
import type { AppFeatures } from './environment.types';

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  readonly #env = inject(APP_ENV);

  readonly tabsNavigation = signal<boolean>(this.#getInitialTabsNavigationValue());
  readonly executionEnabled = signal<boolean>(this.#env.features.enableExecution);

  isEnabled(feature: keyof AppFeatures): boolean {
    return this.#env.features[feature];
  }

  #getInitialTabsNavigationValue(): boolean {
    const localOverride = localStorage.getItem('ENABLED_TABS_NAVIGATION');
    if (localOverride !== null) {
      return localOverride === 'true';
    }
    return this.#env.features.enableTabsNavigation;
  }

  toggleTabsNavigation(): void {
    const currentValue = this.tabsNavigation();
    const newValue = !currentValue;

    localStorage.setItem('ENABLED_TABS_NAVIGATION', newValue.toString());
    this.tabsNavigation.set(newValue);

    window.location.reload();
  }
}

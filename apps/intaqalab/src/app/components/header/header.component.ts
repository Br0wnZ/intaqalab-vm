import { Component, computed, inject, isDevMode, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FeatureFlagService } from '@intaqalab/config';
import { AuthService, HeaderToolsComponent } from '@intaqalab/core';
import { IntaIconComponent } from '@intaqalab/ui';

@Component({
  selector: 'app-header',
  imports: [MatIconModule, MatButtonModule, HeaderToolsComponent, IntaIconComponent],
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
}

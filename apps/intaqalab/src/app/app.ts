import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FeatureFlagService } from '@intaqalab/config';
import type { CommandTab } from '@intaqalab/core';
import { AuthService, LoaderComponent, Role, TabsTopComponent } from '@intaqalab/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { EMPTY, catchError, filter, of, switchMap, tap } from 'rxjs';

import { environment } from '../environments/environment';

import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { HeaderComponent } from './components/header/header.component';
import { MenuLeftComponent } from './components/menu-left/menu-left.component';
import { BreadcrumbService } from './services/breadcrumb/breadcrumb.service';
import { CommandsTabService } from './services/tabs/commands-tab-service';

@Component({
  imports: [RouterModule, MenuLeftComponent, HeaderComponent, BreadcrumbComponent, LoaderComponent, TabsTopComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly #tabsService = inject(CommandsTabService);
  readonly #breadcrumbService = inject(BreadcrumbService);
  readonly featureFlags = inject(FeatureFlagService);
  readonly #router = inject(Router);
  readonly #oidcSecurityService = inject(OidcSecurityService);
  readonly #authService = inject(AuthService);

  userData$ = this.#oidcSecurityService.userData$;

  isAuthenticated = signal(false);

  // eslint-disable-next-line no-unused-private-class-members
  readonly #authCheck = toSignal(
    environment.enableMocksAuthBypass
      ? of({
          isAuthenticated: true,
          userData: {
            sub: 'mock-user-admin',
            email_verified: true,
            name: 'Dev Admin',
            family_name: 'Admin Mock',
            given_name: 'Dev',
            preferred_username: 'dev.admin',
            email: 'dev@intaqalab.local',
          },
        }).pipe(
          tap(({ userData }) => {
            this.#authService.setUserData(userData);
            this.isAuthenticated.set(true);
            this.#authService.setRoles(Object.values(Role));
          }),
        )
      : this.#oidcSecurityService.checkAuth().pipe(
          tap(({ isAuthenticated, userData }) => {
            this.#authService.setUserData(userData);
            this.isAuthenticated.set(isAuthenticated);
            if (!isAuthenticated) {
              this.#oidcSecurityService.authorize();
            }
          }),
          filter(({ isAuthenticated }) => isAuthenticated),
          switchMap(() => this.#oidcSecurityService.getPayloadFromAccessToken()),
          tap((payload) => {
            if (payload?.realm_access?.roles) {
              this.#authService.setRawRoles(payload.realm_access.roles);
            }
          }),
          catchError(() => {
            this.#oidcSecurityService.authorize();
            return EMPTY;
          }),
        ),
  );

  tabToAdd = this.#tabsService.tabToAdd;
  menuCollapsed = signal(false);
  activeRoutedView = signal<boolean>(true);

  constructor() {
    this.#router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.activeRoutedView.set(true);
      });
  }

  actionTabsHandler(tabCommand: CommandTab) {
    this.activeRoutedView.set(false);
    this.#tabsService.executeCommand(tabCommand);
  }

  onTabChanged(event: { index: number; label: string }) {
    this.activeRoutedView.set(false);
    this.#breadcrumbService.setItems([{ label: event.label, url: '' }]);
  }

  logout(): void {
    this.#oidcSecurityService.logoff().subscribe((result) => console.log(result));
  }

  logoffAndRevokeTokens(): void {
    this.#oidcSecurityService.logoffAndRevokeTokens().subscribe((result) => console.log('logoffffffffff', result));
  }
}

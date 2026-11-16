/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-empty-function */
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEs from '@angular/common/locales/es';
import type { ApplicationConfig } from '@angular/core';
import {
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import type { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import {
  RouteReuseStrategy,
  provideRouter,
  withAutoCleanupInjectors,
  withComponentInputBinding,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';
import { provideAppEnvironment, provideIntaDateAdapter } from '@intaqalab/config';
import {
  centerInterceptor,
  globalHttpErrorInterceptor,
  languageInterceptor,
  loaderInterceptor,
  provideHeaderWidget,
  successToastInterceptor,
} from '@intaqalab/core';
import { LanguageService, provideLocaleSignal } from '@intaqalab/data-access';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { authInterceptor, provideAuth } from 'angular-auth-oidc-client';
import { provideToastr } from 'ngx-toastr';

import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

registerLocaleData(localeEs);

export class NoReuseStrategy implements RouteReuseStrategy {
  shouldDetach(route: ActivatedRouteSnapshot) {
    return false;
  }
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null) {}
  shouldAttach(route: ActivatedRouteSnapshot) {
    return false;
  }
  retrieve(route: ActivatedRouteSnapshot) {
    return null;
  }
  shouldReuseRoute() {
    return false;
  }
  shouldDestroyInjector(): boolean {
    return true;
  }
}

export const Config: ApplicationConfig = {
  providers: [
    provideAppEnvironment(environment),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withAutoCleanupInjectors(),
      withViewTransitions({ skipInitialTransition: true }),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
    ),
    {
      provide: RouteReuseStrategy,
      useClass: NoReuseStrategy,
    },
    provideHttpClient(
      withInterceptors([
        loaderInterceptor,
        centerInterceptor,
        languageInterceptor,
        globalHttpErrorInterceptor,
        successToastInterceptor,
        authInterceptor(),
      ]),
    ),
    provideAuth({
      config: {
        ...environment.authConfig,
      },
    }),
    { provide: LOCALE_ID, useValue: 'es-ES' },
    ...provideIntaDateAdapter(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),
    provideAppInitializer(() => {
      return inject(LanguageService).initializationPromise;
    }),
    provideLocaleSignal(),
    provideToastr(),
    ...(!environment.production ? [provideHeaderWidget()] : []),
  ],
};

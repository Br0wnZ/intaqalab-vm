import { InjectionToken } from '@angular/core';
import type { Type } from '@angular/core';

// Auth utils
import { HeaderToolsComponent } from './lib/utils-auth/header-tools/header-tools.component';

// Interceptors
export * from './lib/interceptors/center-interceptor';
export * from './lib/interceptors/global-http-error-interceptor';
export * from './lib/loader/loader-interceptor';
export * from './lib/interceptors/success-toast-interceptor';
export * from './lib/interceptors/language-interceptor';
export * from '@intaqalab/config';

// Site utils
export * from './lib/loader/components/loader/loader.component';
export * from './lib/utils-site/components/tabs-top/tabs-top.component';
export * from './lib/utils-site/components/tabs-top/taps-top.model';

export type CommandTab = {
  command: 'TRIAL_LIST' | 'TRIAL_DETAIL' | 'TRIAL_VIEW_DOCUMENT' | 'EXECUTION';
  argument?: string;
};
export const injectionTokenTabCommand = new InjectionToken<(command: CommandTab) => void>('tabCommand');

export { HeaderToolsComponent } from './lib/utils-auth/header-tools/header-tools.component';
export * from './lib/utils-auth/auth-service';
export * from './lib/utils-auth/directives/has-role/has-role.directive';
export * from './lib/utils-auth/models/role.model';
export * from './lib/utils-auth/models/role-groups.constants';
export * from './lib/utils-auth/guards/role.guard';
export * from './lib/utils-auth/components/button-role-actions/button-role-actions.component';

export const AUTH_WIDGET = new InjectionToken<Type<unknown>>('AUTH_WIDGET');
export function provideHeaderWidget() {
  return {
    provide: AUTH_WIDGET,
    useValue: HeaderToolsComponent,
  };
}

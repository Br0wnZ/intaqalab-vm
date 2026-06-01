import { InjectionToken } from '@angular/core';

export interface Config {
  production: boolean;
  apiUrl: string;
  enableTablNavigation: boolean;
}

export const CONFIG = new InjectionToken<Config>('CONFIG');

import type { OpenIdConfiguration } from 'angular-auth-oidc-client';

export const Endpoints = {
  LinesOfShot: 'linesOfShot',
  FireTrials: 'fireTrials',
  Users: 'users',
  Clients: 'clients',
  FireTrialTypes: 'fireTrialTypes',
  Calendar: 'calendar',
  Documents: 'documents',
  WhareHouse: 'whareHouse',
  Specimens: 'specimens',
  EventLog: 'eventLog',
  MunitionComponentTypes: 'munitionComponentTypes',
  MunitionDenominations: 'munitionDenominations',
  FuseWorkingModes: 'fuseWorkingModes',
  Planning: 'planning',
  Execution: 'execution',
  Centers: 'centers',
} as const;

export type ApiEndpointKey = (typeof Endpoints)[keyof typeof Endpoints];

export interface AppFeatures {
  enableTabsNavigation: boolean;
}

export interface AppEnvironment {
  production: boolean;
  /**
   * URL base de la API.
   * - En mocks: '/api' (redirigido por proxy a localhost:3000)
   * - En DES/PRE/PRO: URL absoluta real (ej: https://apis.des.inta.es/intaqalab)
   */
  apiUrl: string;
  enableMocksAuthBypass?: boolean;
  authConfig: OpenIdConfiguration
  features: AppFeatures;
  endpoints: Record<ApiEndpointKey, string>;
}

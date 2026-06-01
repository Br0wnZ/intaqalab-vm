import type { Signal } from '@angular/core';
import { computed, inject } from '@angular/core';

import { APP_ENV } from './environment.token';
import type { ApiEndpointKey, AppEnvironment } from './environment.types';
import { Endpoints } from './environment.types';

export function injectEnv(): AppEnvironment {
  return inject(APP_ENV);
}

export function injectApiUrl(): string {
  return inject(APP_ENV).apiUrl;
}

/**
 * Construye la URL completa para un endpoint dado.
 * Normaliza slashes para evitar dobles barras o rutas rotas.
 */
export function injectApiEndpoint(endpointKey: ApiEndpointKey): string {
  const env = inject(APP_ENV);
  const path = env.endpoints[endpointKey];
  const baseUrl = env.apiUrl.endsWith('/') ? env.apiUrl.slice(0, -1) : env.apiUrl;
  const endpointPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${endpointPath}`;
}

export function injectLinesOfShotEndpoint(): string {
  return injectApiEndpoint(Endpoints.LinesOfShot);
}

export function injectFireTrialsEndpoint(): string {
  return injectApiEndpoint(Endpoints.FireTrials);
}

export function injectUsersEndpoint(): string {
  return injectApiEndpoint(Endpoints.Users);
}

export function injectClientsEndpoint(): string {
  return injectApiEndpoint(Endpoints.Clients);
}

export function injectFireTrialTypesEndpoint(): string {
  return injectApiEndpoint(Endpoints.FireTrialTypes);
}

export function injectCalendarEndpoint(): string {
  return injectApiEndpoint(Endpoints.Calendar);
}

export function injectDocumentsEndpoint(): string {
  return injectApiEndpoint(Endpoints.Documents);
}

export function injectPlanningEndpoint(): string {
  return injectApiEndpoint(Endpoints.Planning);
}

export function injectExecutionEndpoint(): string {
  return injectApiEndpoint(Endpoints.Execution);
}

export function injectWharehouseEndpoint(): string {
  return injectApiEndpoint(Endpoints.WhareHouse);
}

export function injectEventLogEndpoint(): string {
  return injectApiEndpoint(Endpoints.EventLog);
}

export function injectSpecimensEndpoint(): string {
  return injectApiEndpoint(Endpoints.Specimens);
}

export function injectMunitionComponentTypesEndpoint(): string {
  return injectApiEndpoint(Endpoints.MunitionComponentTypes);
}

export function injectMunitionDenominationsEndpoint(): string {
  return injectApiEndpoint(Endpoints.MunitionDenominations);
}

export function injectFuseWorkingModesEndpoint(): string {
  return injectApiEndpoint(Endpoints.FuseWorkingModes);
}

export function injectCentersEndpoint(): string {
  return injectApiEndpoint(Endpoints.Centers);
}

export function injectFeatureFlag(feature: keyof AppEnvironment['features']): Signal<boolean> {
  const env = inject(APP_ENV);
  return computed(() => env.features[feature]);
}

export function injectIsProduction(): boolean {
  return inject(APP_ENV).production;
}

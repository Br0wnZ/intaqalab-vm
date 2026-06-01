import type { EnvironmentProviders } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';

import { APP_ENV } from './environment.token';
import type { AppEnvironment } from './environment.types';

/**
 * Registra el entorno en el sistema de inyección de Angular.
 *
 * Uso en app.config.ts:
 *   providers: [provideAppEnvironment(environment)]
 *
 * Uso en tests:
 *   TestBed.configureTestingModule({
 *     providers: [{ provide: APP_ENV, useValue: mockEnvironment }]
 *   });
 */
export function provideAppEnvironment(env: AppEnvironment): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: APP_ENV, useValue: env }]);
}

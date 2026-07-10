import type { EnvironmentProviders } from '@angular/core';
import { makeEnvironmentProviders } from '@angular/core';

import { APP_ENV } from './environment.token';
import type { AppEnvironment } from './environment.types';

export function provideEnvironment(env: AppEnvironment): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: APP_ENV, useValue: env }]);
}

export function provideTestingEnvironment(): EnvironmentProviders {
  const testingEnv: AppEnvironment = {
    production: false,
    apiUrl: 'http://localhost:3000/api',
    features: {
      enableTabsNavigation: true,
    },
    authConfig: {},
    endpoints: {
      linesOfShot: 'lines-of-shoot',
      fireTrials: 'fire-trials',
      users: 'users',
      clients: 'clients',
      fireTrialTypes: 'fire-trial-types',
      calendar: 'calendar',
      documents: 'documents',
      whareHouse: 'warehouse',
      specimens: 'specimens',
      eventLog: 'event-log',
      munitionComponentTypes: 'munition-component-types',
      munitionDenominations: 'munition-denominations',
      fuseWorkingModes: 'fuse-working-modes',
      planning: 'planning',
      execution: 'execution',
      centers: 'centers',
    },
  };

  return provideEnvironment(testingEnv);
}

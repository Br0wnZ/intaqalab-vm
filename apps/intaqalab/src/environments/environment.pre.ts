import type { AppEnvironment } from '@intaqalab/config';

import { baseEnvironment } from './environment.base';

export const environment: AppEnvironment = {
  ...baseEnvironment,
  authConfig: {
    ...baseEnvironment.authConfig,
    authority: 'https://iam.pre.inta.es/realms/global',
    secureRoutes: ['https://apis.pre.inta.es/intaqalab/'],
    clientId: '74a8819d-43e4-479a-a603-2b2406b4fa69'
  },
  production: false,
  apiUrl: 'https://apis.pre.inta.es/intaqalab',
  endpoints: {
    ...baseEnvironment.endpoints,
    fireTrials: 'fire-trials-api/1.1.0/fire-trials',
    calendar: 'fire-trials-api/1.1.0/calendar',
    linesOfShot: 'fire-trials-api/1.1.0/lines-of-shoot',
    fireTrialTypes: 'fire-trials-api/1.1.0/fire-trial-types',
    clients: 'clients-api/1.0.0/clients',
  },
};

import type { AppEnvironment } from '@intaqalab/config';

import { baseEnvironment } from './environment.base';

export const environment: AppEnvironment = {
  ...baseEnvironment,
  production: false,
  apiUrl: 'https://apis.des.inta.es/intaqalab',
  endpoints: {
    ...baseEnvironment.endpoints,
    fireTrials: 'fire-trials-api/1.1.0/fire-trials',
    calendar: 'fire-trials-api/1.1.0/calendar',
    linesOfShot: 'fire-trials-api/1.1.0/lines-of-shoot',
    fireTrialTypes: 'fire-trials-api/1.1.0/fire-trial-types',
    clients: 'clients-api/1.0.0/clients',
  },
};

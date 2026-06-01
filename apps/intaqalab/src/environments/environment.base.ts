import type { AppEnvironment } from '@intaqalab/config';

export const baseEnvironment: Omit<AppEnvironment, 'production' | 'apiUrl'> = {
  features: {
    enableTabsNavigation: false,
  },
  authConfig: {
    authority: 'https://iam.des.inta.es/realms/intaqalab',
    redirectUrl: window.location.origin,
    clientId: '32853603-4a07-4725-bc1b-4c983f956b4d',
    scope: 'openid profile email offline_access',
    responseType: 'code',
    useCustomAuth0Domain: false,
    silentRenew: true,
    useRefreshToken: true,
    // logLevel: LogLevel.Debug,
    renewTimeBeforeTokenExpiresInSeconds: 60,
    postLogoutRedirectUri: 'https://intranet.inta.es/',
    secureRoutes: ['https://apis.des.inta.es/intaqalab/'],
  },
  endpoints: {
    linesOfShot: 'fire-trials-api/1.1.0/lines-of-shoot',
    fireTrials: 'fire-trials-api/1.1.0/fire-trials',
    users: 'users-api/1.0.0',
    clients: 'clients-api/1.0.0',
    fireTrialTypes: 'fire-trials-api/1.1.0/fire-trial-types',
    calendar: 'fire-trials-api/1.1.0/calendar',
    documents: 'fire-trials-documents-api/1.0.0',
    whareHouse: 'warehouse-api/1.0.0/warehouse',
    specimens: 'specimens-api/1.0.0',
    eventLog: 'event-log-api/1.0.0',
    munitionComponentTypes: 'munition-component-types-api/1.0.0',
    munitionDenominations: 'munition-denominations-api/1.0.0',
    fuseWorkingModes: 'fuse-working-modes-api/1.0.0',
    planning: 'planning-api/1.2.0',
    execution: 'execution-api/1.0.0',
    centers: 'centers-api/1.0.0/centers',
  },
};

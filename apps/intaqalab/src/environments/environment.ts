import type { AppEnvironment } from '@intaqalab/config';

import { baseEnvironment } from './environment.base';

export const environment: AppEnvironment = {
  ...baseEnvironment,
  production: false,
  apiUrl: '/api',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enableMocksAuthBypass: (import.meta as any).env?.NG_APP_MOCKS_AUTH === 'true' || (import.meta as any).env?.VITE_MOCKS_AUTH === 'true',
};

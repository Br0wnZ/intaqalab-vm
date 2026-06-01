import type { Route } from '@angular/router';

import { Execution } from './execution/execution';
import { ExecutionProfileService } from './execution/services/execution-profile.service';
import { ExecutionGeneralDataStore } from './stores/execution-general-data.store';

export const executionRoutes: Route[] = [
  {
    path: '',
    component: Execution,
    providers: [ExecutionProfileService, ExecutionGeneralDataStore],
  },
];

import type { Route } from '@angular/router';

import { ExecutionStore } from './+state/execution.store';
import { Execution } from './execution/execution';
import { ExecutionProfileService } from './execution/services/execution-profile.service';

export const executionRoutes: Route[] = [
  {
    path: '',
    component: Execution,
    providers: [ExecutionProfileService, ExecutionStore],
  },
  {
    path: ':fireTrialId',
    component: Execution,
    providers: [ExecutionProfileService, ExecutionStore],
  },
];

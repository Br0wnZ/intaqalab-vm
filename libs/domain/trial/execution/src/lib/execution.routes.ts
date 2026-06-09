import type { Route } from '@angular/router';

import { Execution } from './execution/execution';
import { ExecutionProfileService } from './execution/services/execution-profile.service';
import { ExecutionStore } from './+state/execution.store';

export const executionRoutes: Route[] = [
  {
    path: '',
    component: Execution,
    providers: [ExecutionProfileService, ExecutionStore],
  },
];

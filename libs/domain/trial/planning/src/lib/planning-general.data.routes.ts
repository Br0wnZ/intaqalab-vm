import type { Route } from '@angular/router';

import { FeaturePlanningGeneralDataShellComponent } from './components/shell/feature-planning-general-data-shell.component';

export const routes: Route[] = [
  {
    path: ':id',
    component: FeaturePlanningGeneralDataShellComponent,
    data: { breadcrumb: 'BREADCRUMB.PLANNING_DETAIL' },
  },
];

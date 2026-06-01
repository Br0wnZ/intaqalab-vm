import type { TabTopProcess } from '@intaqalab/core';

import { routes } from './lib/feature-calendar-trials.routes';

export { EventsActionsService } from './lib/services/events-actions.service';

export default routes;

export const TopTabTrialList: TabTopProcess = {
  label: 'TAPS_TOP.CALENDAR_TRIALS',
  data: null,
  loader: () =>
    // @ts-expect-error - dynamic import path may be resolved at runtime; TS path resolution with NodeNext can be strict
    import('./lib/components/shell/feature-calendar-trials-shell.component.ts').then(
      (m) => m.FeatureCalendarTrialsShellComponent,
    ),
  injector: null,
  route: '/calendar-trials',
};

export { SpecialDaysManagerComponent } from './lib/special-days-manager/components/shell/special-days-manager-modal-shell.component';

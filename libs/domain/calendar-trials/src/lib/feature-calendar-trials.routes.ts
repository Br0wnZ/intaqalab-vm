import { inject } from '@angular/core';
import type { Route } from '@angular/router';
import { Router } from '@angular/router';
import type { CommandTab } from '@intaqalab/core';
import { injectionTokenTabCommand } from '@intaqalab/core';

import { FeatureCalendarTrialsShellComponent } from './components/shell/feature-calendar-trials-shell.component';

export const routes: Route[] = [
  {
    path: '',
    component: FeatureCalendarTrialsShellComponent,
    data: { breadcrumb: 'BREADCRUMB.CALENDAR' },
    providers: [
      {
        provide: injectionTokenTabCommand,
        useFactory: () => {
          const router = inject(Router);
          return (command: CommandTab) => {
            router.navigateByUrl(`/trial/view/${command.argument}`);
          };
        },
      },
    ],
  },
];

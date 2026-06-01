import type { Routes } from '@angular/router';

import { EventLogShellComponent } from './components/shell/event-log-shell.component';

export const routes: Routes = [
  {
    path: '**',
    component: EventLogShellComponent,
  },
];

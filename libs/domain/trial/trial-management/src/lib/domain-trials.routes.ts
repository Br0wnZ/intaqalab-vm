import { inject } from '@angular/core';
import type { ResolveFn, Routes } from '@angular/router';
import { Router } from '@angular/router';
import type { CommandTab } from '@intaqalab/core';
import { injectionTokenTabCommand } from '@intaqalab/core';

import {
  FeatureTrialCreateShellComponent,
  injectionTokenComponentCreateModifyShell,
} from './components/create-shell/feature-trial-create-shell.component';
import { FeatureTrialListShellComponent } from './components/list/components/shell/feature-trial-list-shell.component';
import {
  TrialDocsShellComponent,
  injectionTokenTrialViewDocument,
} from './components/trial-docs-shell/trial-docs-shell.component';
import {
  FeatureTrialViewShellComponent,
  injectionTokenTrialViewComponent,
} from './components/view-shell/feature-trial-view-shell.component';

const resolveInjectionToken: ResolveFn<unknown> = (route) => {
  const id = route.paramMap.get('id');
  const data = inject(injectionTokenTrialViewComponent);
  data.id = `${id}`;
  return data;
};

const resolveInjectionTokenDocument: ResolveFn<unknown> = (route) => {
  const id = route.paramMap.get('id');
  const data = inject(injectionTokenTrialViewDocument);
  data.id = `${id}`;
  return data;
};

export const routes: Routes = [
  {
    path: '',
    children: [
      { path: '', redirectTo: 'new', pathMatch: 'full' },
      {
        path: 'new',
        component: FeatureTrialCreateShellComponent,
        data: { breadcrumb: 'BREADCRUMB.TRIAL_NEW' },
        providers: [
          {
            provide: injectionTokenComponentCreateModifyShell,
            useValue: {
              id: null,
            },
          },
        ],
      },
    ],
  },
  {
    path: 'list',
    component: FeatureTrialListShellComponent,
    data: { breadcrumb: 'BREADCRUMB.TRIAL_LIST' },
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
  {
    path: 'view/:id',
    component: FeatureTrialViewShellComponent,
    data: { breadcrumb: 'BREADCRUMB.TRIAL_VIEW' },
    providers: [
      {
        provide: injectionTokenTabCommand,
        useFactory: () => {
          const router = inject(Router);
          return (command: CommandTab) => {
            if (command.command === 'TRIAL_LIST') {
              router.navigateByUrl('/trial/list');
            } else {
              router.navigateByUrl(`/trial/document/${command.argument}`);
            }
          };
        },
      },
      {
        provide: injectionTokenTrialViewComponent,
        useValue: {
          id: null,
        },
      },
    ],
    resolve: {
      resolveInjectionToken,
    },
  },
  {
    path: 'document/:id',
    component: TrialDocsShellComponent,
    data: { breadcrumb: 'BREADCRUMB.TRIAL_DOCUMENT' },
    providers: [
      {
        provide: injectionTokenTrialViewDocument,
        useValue: {
          id: null,
        },
      },
    ],
    resolve: {
      resolveInjectionTokenDocument,
    },
  },
];

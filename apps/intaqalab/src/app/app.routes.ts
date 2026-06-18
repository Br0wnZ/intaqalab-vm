import type { Route } from '@angular/router';
import {
  ALL_ROLES_EXCEPT_VIEWER,
  MENU_EVENT_LOG_ROLES,
  MENU_EXECUTION_ROLES,
  MENU_TRIAL_LIST_ROLES,
  MENU_WAREHOUSE_ROLES,
  canMatchRole,
} from '@intaqalab/core';

import { resolveLazyModule } from './lazy-utils';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'trial/new',
  },
  {
    path: 'demos',
    loadChildren: () => resolveLazyModule(import('@intaqalab/demos')),
    data: { breadcrumb: 'BREADCRUMB.DEMOS' },
  },
  {
    path: 'planning',
    loadChildren: () => resolveLazyModule(import('@intaqalab/planning')),
    data: { breadcrumb: 'BREADCRUMB.PLANNING' },
  },
  {
    // Calendario: todos excepto Viewer
    path: 'calendar-trials',
    loadChildren: () => resolveLazyModule(import('@intaqalab/calendar-trials')),
    data: {
      breadcrumb: 'BREADCRUMB.CALENDAR_TRIALS',
      roles: [...ALL_ROLES_EXCEPT_VIEWER],
    },
    canMatch: [canMatchRole],
  },
  {
    // Pruebas de fuego (lista + detalle): todos incluido Viewer (verá sus pruebas)
    path: 'trial',
    loadChildren: () => resolveLazyModule(import('@intaqalab/trial-management')),
    data: {
      breadcrumb: 'BREADCRUMB.TRIALS',
      roles: [...MENU_TRIAL_LIST_ROLES],
    },
    canMatch: [canMatchRole],
  },
  {
    // Maestros de almacén: solo Admin + Municiones
    path: 'master-data',
    loadChildren: () => resolveLazyModule(import('@intaqalab/master-data')),
    data: {
      breadcrumb: 'BREADCRUMB.CATALOG',
      roles: [...MENU_WAREHOUSE_ROLES],
    },
    canMatch: [canMatchRole],
  },
  {
    // Alta de munición / Stock: solo Admin + Municiones
    path: 'wharehouse-managment',
    loadChildren: () => resolveLazyModule(import('@intaqalab/wharehouse-managment')),
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE',
      roles: [...MENU_WAREHOUSE_ROLES],
    },
    canMatch: [canMatchRole],
  },
  {
    // Event log: todos excepto Viewer y Municiones
    path: 'event-log',
    loadChildren: () => resolveLazyModule(import('@intaqalab/event-log')),
    data: {
      breadcrumb: 'BREADCRUMB.EVENT_LOG',
      roles: [...MENU_EVENT_LOG_ROLES],
    },
    canMatch: [canMatchRole],
  },
  {
    // Ejecución: todos los roles incluido Viewer
    path: 'execution',
    loadChildren: () => resolveLazyModule(import('@intaqalab/execution')),
    data: {
      breadcrumb: 'BREADCRUMB.EXECUTION',
      roles: [...MENU_EXECUTION_ROLES],
    },
    canMatch: [canMatchRole],
  },
  {
    path: '**',
    redirectTo: 'planning',
  },
];

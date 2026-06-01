import type { Route } from '@angular/router';
import { Role, canMatchRole } from '@intaqalab/core';

import { resolveLazyModule } from './lazy-utils';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'planning',
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
    path: 'calendar-trials',
    loadChildren: () => resolveLazyModule(import('@intaqalab/calendar-trials')),
    data: {
      breadcrumb: 'BREADCRUMB.CALENDAR_TRIALS',
      roles: [
        Role.INTAQALAB_ADMIN,
        Role.HEAD_ARMAMENT_TRIALS,
        Role.INTAQALAB_TRIAL_ENGINEER,
        Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
        Role.INTAQALAB_SHOOTING_LINE_HEAD,
        Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
        Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
        Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
        Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
        Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
        Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
        Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
        Role.INTAQALAB_TRIAL_CONSULTANT,
        Role.INTAQALAB_VIEWER,
      ],
    },
    canMatch: [canMatchRole],
  },
  {
    path: 'trial',
    loadChildren: () => resolveLazyModule(import('@intaqalab/trial-management')),
    data: {
      breadcrumb: 'BREADCRUMB.TRIALS',
      roles: [
        Role.INTAQALAB_ADMIN,
        Role.HEAD_ARMAMENT_TRIALS,
        Role.INTAQALAB_TRIAL_ENGINEER,
        Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
        Role.INTAQALAB_SHOOTING_LINE_HEAD,
        Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
        Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
        Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
        Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
        Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
        Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
        Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
        Role.INTAQALAB_TRIAL_CONSULTANT,
        Role.INTAQALAB_VIEWER,
      ],
    },
    canMatch: [canMatchRole],
  },
  {
    path: 'master-data',
    loadChildren: () => resolveLazyModule(import('@intaqalab/master-data')),
    data: {
      breadcrumb: 'BREADCRUMB.CATALOG',
      roles: [Role.INTAQALAB_ADMIN, Role.HEAD_ARMAMENT_TRIALS],
    },
    canMatch: [canMatchRole],
  },
  {
    path: 'wharehouse-managment',
    loadChildren: () => resolveLazyModule(import('@intaqalab/wharehouse-managment')),
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE',
      roles: [
        Role.INTAQALAB_ADMIN,
        Role.HEAD_ARMAMENT_TRIALS,
        Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
        Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
      ],
    },
    canMatch: [canMatchRole],
  },
  {
    path: 'event-log',
    loadChildren: () => resolveLazyModule(import('@intaqalab/event-log')),
    data: {
      breadcrumb: 'BREADCRUMB.EVENT_LOG',
      roles: [Role.INTAQALAB_ADMIN, Role.HEAD_ARMAMENT_TRIALS, Role.INTAQALAB_TRIAL_CONSULTANT],
    },
    canMatch: [canMatchRole],
  },
  {
    path: 'execution',
    loadChildren: () => resolveLazyModule(import('@intaqalab/execution')),
    data: {
      breadcrumb: 'BREADCRUMB.EXECUTION',
      roles: [
        Role.INTAQALAB_ADMIN,
        Role.HEAD_ARMAMENT_TRIALS,
        Role.INTAQALAB_TRIAL_ENGINEER,
        Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
        Role.INTAQALAB_SHOOTING_LINE_HEAD,
        Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
        Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
        Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
        Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
        Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
        Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
        Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
        Role.INTAQALAB_TRIAL_CONSULTANT,
        Role.INTAQALAB_VIEWER,
      ],
    },
    canMatch: [canMatchRole],
  },
];

import type { Routes } from '@angular/router';
import { MENU_STOCK_MUNITION_ROLES, MENU_WAREHOUSE_ROLES, canMatchRole } from '@intaqalab/core';

import { DenominationsStore } from './+state/denominations.store';
import { MovementsListStore } from './+state/movements-list.store';
import { MunitionComponentStore } from './+state/munition-component.store';
import { MunitionsDumpsStore } from './+state/munition-dumps.store';
import { MunitionsStockDetailStore } from './+state/munition-stock-detail.store';
import { StockListStore } from './+state/stock-list.store';
import { DenominationsListComponent } from './components/denominations/list/denominations-list.component';
import { MovementsListComponent } from './components/movements/list/movements-list.component';
import { MunitionComponentsListComponent } from './components/munition-components/list/munition-components-list.component';
import { MunitionStockDetailShellComponent } from './components/munition-stock-detail/shell/munition-stock-detail-shell.component';
import { MunitionsDumpsListComponent } from './components/munitions-dumps/list/munitions-dumps-list.component';
import { MunitionsShellComponent } from './components/munitions/shell/munitions-shell.component';
import { StockListComponent } from './components/stock-list/list/stock-list.component';

const STOCK_ROLES = MENU_STOCK_MUNITION_ROLES;

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'stock',
  },
  {
    path: 'munition-components',
    component: MunitionComponentsListComponent,
    providers: [MunitionComponentStore],
    canMatch: [canMatchRole],
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE_MUNITION_COMPONENTS',
      roles: [...MENU_WAREHOUSE_ROLES],
    },
  },
  {
    path: 'denominations',
    component: DenominationsListComponent,
    providers: [DenominationsStore],
    canMatch: [canMatchRole],
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE_DENOMINATIONS',
      roles: [...MENU_WAREHOUSE_ROLES],
    },
  },
  {
    path: 'munitions-dumps',
    component: MunitionsDumpsListComponent,
    providers: [MunitionsDumpsStore],
    canMatch: [canMatchRole],
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE_MUNITIONS_DUMPS',
      roles: [...MENU_WAREHOUSE_ROLES],
    },
  },
  {
    path: 'munitions',
    component: MunitionsShellComponent,
    providers: [DenominationsStore, MunitionComponentStore, MunitionsDumpsStore],
    canMatch: [canMatchRole],
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE_MUNITIONS',
      roles: [...MENU_WAREHOUSE_ROLES],
    },
  },
  {
    path: 'stock',
    component: StockListComponent,
    providers: [StockListStore, MunitionComponentStore, MunitionsDumpsStore],
    canMatch: [canMatchRole],
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE_STOCK',
      roles: STOCK_ROLES,
    },
  },
  {
    path: 'stock/:entity/:id',
    component: MunitionStockDetailShellComponent,
    providers: [MunitionsStockDetailStore],
    canMatch: [canMatchRole],
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE_STOCK',
      roles: STOCK_ROLES,
    },
  },
  {
    path: 'movements',
    component: MovementsListComponent,
    providers: [MovementsListStore, MunitionsDumpsStore],
    canMatch: [canMatchRole],
    data: {
      breadcrumb: 'BREADCRUMB.WAREHOUSE_MOVEMENTS',
      roles: [...MENU_WAREHOUSE_ROLES],
    },
  },
];

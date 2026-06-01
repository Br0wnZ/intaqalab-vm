import type { Routes } from '@angular/router';

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

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'denominations',
  },
  {
    path: 'munition-components',
    component: MunitionComponentsListComponent,
    providers: [MunitionComponentStore],
    data: { breadcrumb: 'BREADCRUMB.WAREHOUSE_MUNITION_COMPONENTS' },
  },
  {
    path: 'denominations',
    component: DenominationsListComponent,
    providers: [DenominationsStore],
    data: { breadcrumb: 'BREADCRUMB.WAREHOUSE_DENOMINATIONS' },
  },
  {
    path: 'munitions-dumps',
    component: MunitionsDumpsListComponent,
    providers: [MunitionsDumpsStore],
    data: { breadcrumb: 'BREADCRUMB.WAREHOUSE_MUNITIONS_DUMPS' },
  },
  {
    path: 'munitions',
    component: MunitionsShellComponent,
    providers: [DenominationsStore, MunitionComponentStore, MunitionsDumpsStore],
    data: { breadcrumb: 'BREADCRUMB.WAREHOUSE_MUNITIONS' },
  },
  {
    path: 'stock',
    component: StockListComponent,
    providers: [StockListStore, MunitionComponentStore, MunitionsDumpsStore],
    data: { breadcrumb: 'BREADCRUMB.WAREHOUSE_STOCK' },
  },
  {
    path: 'stock/:entity/:id',
    component: MunitionStockDetailShellComponent,
    providers: [MunitionsStockDetailStore],
    data: { breadcrumb: 'BREADCRUMB.WAREHOUSE_STOCK' },
  },
  {
    path: 'movements',
    component: MovementsListComponent,
    providers: [MovementsListStore, MunitionsDumpsStore],
    data: { breadcrumb: 'BREADCRUMB.WAREHOUSE_MOVEMENTS' },
  },
];

import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { BooleanStatusBadge, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import type { MunitionsDumpsStoreType } from '../../../+state/munition-dumps.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import { StockListStore } from '../../../+state/stock-list.store';
import type { MunitionStockListResponse, MunitionStockListSearch } from '../../../models/munition-stock-list.model';
import { WarehouseMunitionStatus } from '../../../models/utils.model';
import { MunitionsStockDetailService } from '../../../services/munitions-stock-detail.service';
import { TransferDialogComponent } from '../../shared/transfer-dialog/transfer-dialog.component';
import { StockListFilterComponent } from '../filter/stock-list-filter.component';
import { NeqDataComponent } from '../neq-data/neq-data.component';

const DEFAULT_COLUMNS = [
  'munitionTypeName',
  'client',
  'denominationName',
  'batches',
  'munitionDumpName',
  'cellName',
  'status',
  'plannedFireTrial',
  'quantity',
  'totalNeq',
  'actions',
] as const;
@Component({
  selector: 'inta-stock-list',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    IntaIconComponent,
    StockListFilterComponent,
    BooleanStatusBadge,
    MatMenuModule,
    NeqDataComponent,
    MatSlideToggleModule,
  ],
  template: `
    <div class="flex justify-between items-center">
      <h2 class="text-base font-semibold text-gray-900 my-6">
        {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.TITLE' | translate }}
      </h2>
      <div class="flex items-center gap-2 relative">
        <button
          type="button"
          class="self-center text-client-primary hover:text-client-primary/80 transition-colors"
          (mouseenter)="showTooltip = true"
          (mouseleave)="showTooltip = false"
        >
          <ui-inta-icon name="info" size="lg" />
        </button>
        @if (showTooltip) {
          <div
            class="absolute right-full top-0 mr-3 w-[600px] bg-slate-800 text-white rounded-lg shadow-lg p-4 text-sm z-50 whitespace-pre-line text-left"
          >
            {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.NEQ_DATA.NEQ_BUTTON_TOOLTIP' | translate }}
            <div
              class="absolute left-full top-3 w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-slate-800"
            ></div>
          </div>
        }
        <button mat-flat-button [matMenuTriggerFor]="menu">
          {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.NEQ_DATA.NEQ_BUTTON' | translate }}
        </button>
      </div>
      <mat-menu panelClass="warehouse-mat-mene-neq" #menu="matMenu">
        <inta-stock-list-neq-data></inta-stock-list-neq-data>
      </mat-menu>
    </div>

    <inta-stock-list-filter [showOnlyActive]="showOnlyActive()" (filtersData)="setFiltersData($event)" />

    <div class="w-full flex justify-end mb-4 mt-6">
      <div class="flex items-center gap-2 mr-4">
        <mat-slide-toggle
          color="primary"
          [checked]="showOnlyActive()"
          (change)="showOnlyActive.set($event.checked)"
        ></mat-slide-toggle>
        <span class="text-sm text-gray-700">
          {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.TOGGLE_ACTIVE_FILTER' | translate }}
        </span>
      </div>
      <button
        mat-flat-button
        data-testid="transfer-btn"
        [disabled]="selection.selected.length === 0"
        (click)="transfer()"
      >
        {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.TRANSFER' | translate }}
      </button>
    </div>
    <div class="inta-bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table
          mat-table
          matSort
          class="w-full !bg-white"
          [dataSource]="stockListStore.items()"
          (matSortChange)="onSort($event)"
        >
          <ng-container matColumnDef="munitionTypeName">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_TYPE' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <div class="flex items-center gap-1">
                <mat-checkbox
                  [checked]="selection.isSelected(item)"
                  [disabled]="item.status === 'RETIRED'"
                  (click)="$event.stopPropagation()"
                  (change)="selection.toggle(item)"
                ></mat-checkbox>
                <span>{{ item.munitionType.name }}</span>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="denominationName">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_DENOMINATION' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.denomination.name }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="batches">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_BATCH' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.batch }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="client">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_CLIENT' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.client.name }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="plannedFireTrial">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_TRIAL' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item?.plannedFireTrial?.name }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="munitionDumpName">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_MUNITION_DUMP' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.munitionDump.munitionDumpId }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="cellName">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_CELL_NAME' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.cellName }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_STATUS' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              @if (item.status !== '') {
                <ui-boolean-status-badge
                  [isActive]="item.status === status.AVAILABLE"
                  [label]="'WHAREHOUSE_MANAGMENT.MUNITION_DETAIL.STATUS_' + item.status"
                />
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_QUANTITY' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.quantity }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="totalNeq">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.STOCK_LIST.COL_NEQ_TOTAL' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.totalNeq }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.ACTIONS' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 !bg-white">
              <button mat-icon-button class="!text-gray-600 scale-90" (click)="navigate(item)">
                <ui-inta-icon name="file" size="xxl" />
              </button>
            </td>
          </ng-container>

          <tr *matHeaderRowDef="displayedColumns()" mat-header-row></tr>
          <tr *matRowDef="let row; columns: displayedColumns()" mat-row class="hover:bg-gray-50 transition-colors"></tr>
        </table>
      </div>
      <mat-paginator
        class="!bg-white"
        [length]="stockListStore.totalElements()"
        [pageIndex]="pageIndex()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="[5, 10, 25, 50]"
        (page)="onPage($event)"
      />
    </div>
  `,
  styles: `
    .cdk-overlay-pane {
      min-width: 350px;
      .mat-mdc-menu-panel {
        min-width: 100%;
        border-radius: 8px;
        box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.1);
        .mat-mdc-menu-content {
          padding: 0;
        }
      }
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockListComponent {
  readonly stockListStore = inject(StockListStore);
  readonly #munitionDumpsStore: MunitionsDumpsStoreType = inject(MunitionsDumpsStore);
  readonly #munitionsStockDetailService = inject(MunitionsStockDetailService);

  readonly #dialog = inject(MatDialog);
  readonly #router = inject(Router);

  readonly displayedColumns = computed(() => [...DEFAULT_COLUMNS]);
  selection = new SelectionModel<MunitionStockListResponse>(true, []);
  showTooltip = false;
  readonly status = WarehouseMunitionStatus;
  readonly showOnlyActive = signal<boolean>(true);

  pageIndex = signal(0);
  pageSize = signal(10);
  sortField = signal<string | undefined>(undefined);
  sortDirection = signal<'asc' | 'desc' | ''>('');
  filtersData = signal<MunitionStockListSearch | undefined>(undefined);

  constructor() {
    this.#munitionDumpsStore.search({ pageSize: 500, active: true });

    effect(() => {
      const page = this.pageIndex() + 1;
      const pageSize = this.pageSize();
      const sortDirection = this.sortDirection();
      const sortField = sortDirection ? this.sortField() : undefined;
      const status = this.showOnlyActive() ? this.status.AVAILABLE : this.status.RETIRED;
      const filters = this.filtersData();

      this.stockListStore.search({ ...filters, status, page, pageSize, sortDirection, sortField });
    });

    effect(() => {
      const result = this.#munitionsStockDetailService.transferResource.statusCode();

      if (result === 201) {
        this.stockListStore.reload();
        this.selection.clear();
      }
    });
  }

  async transfer() {
    const items = this.selection.selected;

    if (!items.length) return;

    const dialogRef = this.#dialog.open(TransferDialogComponent, {
      data: { items },
      width: '1024px',
    });

    await firstValueFrom(dialogRef.afterClosed());
  }

  navigate(item: MunitionStockListResponse) {
    if (item.category === 'MUNITION') {
      this.#router.navigateByUrl(`/wharehouse-managment/stock/munitions/${item.id}`);
    } else {
      this.#router.navigateByUrl(`/wharehouse-managment/stock/munitions-components/${item.id}`);
    }
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onSort(event: Sort) {
    this.sortField.set(event.active);
    this.sortDirection.set(event.direction);
  }

  setFiltersData(data: MunitionStockListSearch) {
    this.filtersData.set(data);
  }
}

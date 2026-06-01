import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { BooleanStatusBadge, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { delay } from 'rxjs';

import { StockListStore } from '../../../+state/stock-list.store';
import type { MunitionStockListResponse, MunitionStockListSearch } from '../../../models/munition-stock-list.model';
import { TransferDialogComponent } from '../../shared/transfer-dialog/transfer-dialog.component';
import { StockListFilterComponent } from '../filter/stock-list-filter.component';

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
  ],
  template: `
    <inta-stock-list-filter (filtersData)="setFiltersData($event)" />

    <div class="w-full flex justify-end mb-4 mt-6">
      <button mat-flat-button [disabled]="selection.selected.length === 0" (click)="transfer()">
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
                  [isActive]="item.status === 'AVAILABLE'"
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
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockListComponent {
  readonly stockListStore = inject(StockListStore);

  readonly #dialog = inject(MatDialog);
  readonly #router = inject(Router);

  readonly displayedColumns = computed(() => [...DEFAULT_COLUMNS]);
  selection = new SelectionModel<MunitionStockListResponse>();

  pageIndex = signal(0);
  pageSize = signal(10);
  sortField = signal<string | undefined>(undefined);
  sortDirection = signal<'asc' | 'desc' | ''>('');
  filtersData = signal<MunitionStockListSearch | undefined>(undefined);

  constructor() {
    effect(() => {
      const page = this.pageIndex() + 1;
      const pageSize = this.pageSize();
      const sortDirection = this.sortDirection();
      const sortField = sortDirection ? this.sortField() : undefined;
      const filters = this.filtersData();

      this.stockListStore.search({ ...filters, page, pageSize, sortDirection, sortField });
    });
  }

  transfer() {
    const item = this.selection.selected;
    if (item.length > 0) {
      this.#dialog
        .open(TransferDialogComponent, {
          data: { item: item[0] },
          width: '1024px',
        })
        .afterClosed()
        .pipe(delay(500))
        .subscribe((success) => {
          if (success) {
            this.stockListStore.reload();
          }
        });
    }
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

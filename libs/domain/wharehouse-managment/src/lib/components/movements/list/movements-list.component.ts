import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { IntaDatePipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { MovementsListStore } from '../../../+state/movements-list.store';
import { MovementsFilterComponent } from '../filter/movements-filter.component';

const DEFAULT_COLUMNS = [
  'userName',
  'date',
  'movementType',
  'originMunitionDumpId',
  'destinationMunitionDumpId',
  'quantity',
  'totalNeq',
  'reason',
  'associatedFireTrialName',
] as const;
@Component({
  selector: 'inta-movements-list',
  imports: [
    MovementsFilterComponent,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    IntaDatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
  ],
  template: `
    <inta-movements-filter [stockId]="stockId" />

    <div class="inta-bg-white rounded-lg shadow-sm overflow-hidden rounded-t-none">
      <div class="overflow-x-auto">
        <table mat-table matSort class="w-full" [dataSource]="store.items()" (matSortChange)="onSort($event)">
          <ng-container matColumnDef="userName">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_USER' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.user.name }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_DATE' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.date | intaDate: 'dd-MM-yyyy HH:mm:ss' }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="movementType">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_MOVEMENT_TYPE' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.MOVEMENT_' + item.movementType | translate }}
            </td>
          </ng-container>

          <ng-container matColumnDef="originMunitionDumpId">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_MUNITION_DUMP_ORIGIN' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.originMunitionDump?.munitionDumpId }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="destinationMunitionDumpId">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_MUNITION_DUMP_DESTINATION' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.destinationMunitionDump?.munitionDumpId }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_QUANTITY' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.quantity }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="reason">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_REASON' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              @if (!!item.reason) {
                <span>{{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.REASON_' + item.reason | translate }}</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="totalNeq">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_NEQ_AFECTED' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.affectedNeq }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="associatedFireTrialName">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'WHAREHOUSE_MANAGMENT.MOVEMENTS.TABLE.COL_TRIAL_ASSOCIATED' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item?.associatedFireTrial?.name }}</span>
            </td>
          </ng-container>

          <tr *matHeaderRowDef="displayedColumns()" mat-header-row></tr>
          <tr *matRowDef="let row; columns: displayedColumns()" mat-row class="hover:bg-gray-50 transition-colors"></tr>
        </table>
      </div>
      <mat-paginator
        class="!bg-white"
        [length]="store.totalElements()"
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
export class MovementsListComponent {
  readonly store = inject(MovementsListStore, { skipSelf: true });

  readonly displayedColumns = computed(() => [...DEFAULT_COLUMNS]);

  pageIndex = signal(0);
  pageSize = signal(10);
  sortField = signal<string | undefined>(undefined);
  sortDirection = signal<'asc' | 'desc' | ''>('');
  stockId = '';

  constructor() {
    this.stockId = history.state.stockId;

    effect(() => {
      const page = this.pageIndex() + 1;
      const pageSize = this.pageSize();
      const sortDirection = this.sortDirection();
      const sortField = sortDirection ? this.sortField() : undefined;
      const stockId = this.stockId;

      this.store.search({ page, pageSize, sortDirection, sortField, stockId });
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onSort(event: Sort) {
    this.sortField.set(event.active);
    this.sortDirection.set(event.direction);
  }
}

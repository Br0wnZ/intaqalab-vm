import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

import { EventLogSeriesAndShootsStore } from '../../+state/series-and-shoots.store';
import { EventLogSeriesAndShootsFilterComponent } from './series-and-shoots-filter/series-and-shoots-filter.component';

@Component({
  selector: 'inta-event-log-series-and-shoots',
  imports: [TranslateModule, MatTableModule, MatPaginatorModule, MatSortModule, EventLogSeriesAndShootsFilterComponent],
  providers: [EventLogSeriesAndShootsStore],
  template: `
    <div class="overflow-x-auto">
      <inta-event-log-series-and-shoots-filter />
      @if (store.items() && !store.isLoading()) {
        <table mat-table matSort class="w-full" [dataSource]="store.items()" (matSortChange)="onSort($event)">
          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.LIST_LABELS.DATE' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.date }}
            </td>
          </ng-container>

          <!-- Action Column -->
          <ng-container matColumnDef="action">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.LIST_LABELS.ACTION' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ 'EVENT_LOG.SERIES_AND_SHOOTS.ACTIONS.' + data.action.toUpperCase() | translate }}
            </td>
          </ng-container>

          <!-- User Column -->
          <ng-container matColumnDef="user">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.LIST_LABELS.USER' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.user.label }}
            </td>
          </ng-container>

          <!-- Hardware ID Column -->
          <ng-container matColumnDef="hardwareId">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.LIST_LABELS.HARDWARE_ID' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.hardwareId }}
            </td>
          </ng-container>

          <!-- Element Column -->
          <ng-container matColumnDef="element">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.SERIES_AND_SHOOTS.LABELS.ELEMENT' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ 'EVENT_LOG.SERIES_AND_SHOOTS.ELEMENT.' + data.element.toUpperCase() | translate }}
            </td>
          </ng-container>

          <!-- Visible Number Column -->
          <ng-container matColumnDef="visibleNumber">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.SERIES_AND_SHOOTS.LABELS.VISIBLE_NUMBER' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.visibleNumber }}
            </td>
          </ng-container>

          <!-- ID Column -->
          <ng-container matColumnDef="internalId">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.SERIES_AND_SHOOTS.LABELS.INTERNAL_ID' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.internalId }}
            </td>
          </ng-container>

          <tr *matHeaderRowDef="displayedColumns" mat-header-row></tr>
          <tr *matRowDef="let row; columns: displayedColumns" mat-row class="hover:bg-gray-50 transition-colors"></tr>
        </table>

        <mat-paginator
          [length]="store.totalElements()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPage($event)"
          class="!bg-white"
        />
      }
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLogSeriesAndShootsComponent {
  readonly store = inject(EventLogSeriesAndShootsStore);

  readonly displayedColumns = ['date', 'action', 'user', 'hardwareId', 'element', 'visibleNumber', 'internalId'];

  pageIndex = signal(0);
  pageSize = signal(10);
  sortField = signal<string | undefined>(undefined);
  sortDirection = signal<'asc' | 'desc' | ''>('');

  constructor() {
    effect(() => {
      const page = this.pageIndex() + 1;
      const pageSize = this.pageSize();
      const sortField = this.sortField();
      const sortDirection = this.sortDirection();

      this.store.search({ page, pageSize, sortDirection, sortField });
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

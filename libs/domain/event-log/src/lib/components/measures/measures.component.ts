import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

import { EventLogMeasuresStore } from '../../+state/measures.store';
import { EventLogEventLogMeasuresFiltersComponent } from './measures-filters/measures-filters.component';

@Component({
  selector: 'inta-event-log-measures',
  imports: [
    TranslateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    EventLogEventLogMeasuresFiltersComponent,
  ],
  providers: [EventLogMeasuresStore],
  template: `
    <div class="overflow-x-auto">
      <inta-event-log-measures-filter />
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

          <!-- Instrument Column -->
          <ng-container matColumnDef="instrument">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.MEASURES.LABELS.INSTRUMENT' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.instrument.label }}
            </td>
          </ng-container>

          <!-- Value Column -->
          <ng-container matColumnDef="value">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.MEASURES.LABELS.VALUE' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.value }}
            </td>
          </ng-container>

          <!-- Measure Column -->
          <ng-container matColumnDef="measure">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.MEASURES.LABELS.MEASURE' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.measure.label }}
            </td>
          </ng-container>

          <!-- Shoot Column -->
          <ng-container matColumnDef="shoot">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.MEASURES.LABELS.SHOOT' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.shoot }}
            </td>
          </ng-container>

          <!-- Serie Column -->
          <ng-container matColumnDef="serie">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.MEASURES.LABELS.SERIE' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.serie }}
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
export class EventLogMeasuresComponent {
  readonly store = inject(EventLogMeasuresStore);

  readonly displayedColumns = [
    'date',
    'action',
    'user',
    'hardwareId',
    'instrument',
    'value',
    'measure',
    'shoot',
    'serie',
  ];

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

import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

import { EventLogDocumentsStore } from '../../+state/documents.store';
import { EventLogDocumentsFilterComponent } from './documents-filter/documents-filter.component';

@Component({
  selector: 'inta-event-log-documents',
  imports: [TranslateModule, MatTableModule, MatPaginatorModule, MatSortModule, EventLogDocumentsFilterComponent],
  providers: [EventLogDocumentsStore],
  template: `
    <div class="overflow-x-auto">
      <inta-event-log-documents-filter />
      @if (store.items() && !store.isLoading()) {
        <table mat-table matSort class="w-full" [dataSource]="store.items()" (matSortChange)="onSort($event)">
          <!-- Title Column -->
          <ng-container matColumnDef="title">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.DOCUMENTS.LABELS.TITLE' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.title }}
            </td>
          </ng-container>

          <!-- Type Column -->
          <ng-container matColumnDef="type">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.DOCUMENTS.LABELS.TYPE' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ 'EVENT_LOG.DOCUMENTS.TYPES.' + getDocumentTypeTranlationKey(data.type.id) | translate }}
            </td>
          </ng-container>

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
              {{ 'EVENT_LOG.DOCUMENTS.ACTIONS.' + data.action.toUpperCase() | translate }}
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

          <!-- Access Count Column -->
          <ng-container matColumnDef="accessCount">
            <th *matHeaderCellDef mat-sort-header mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'EVENT_LOG.DOCUMENTS.LABELS.ACCESS_COUNT' | translate }}
            </th>
            <td *matCellDef="let data" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              {{ data.accessCount }}
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
export class EventLogDocumentsComponent {
  readonly store = inject(EventLogDocumentsStore);

  readonly displayedColumns = ['title', 'type', 'date', 'action', 'user', 'hardwareId', 'accessCount'];

  protected getDocumentTypeTranlationKey(id: string) {
    const availableDocumentTypes = [
      { id: 'b1e1e7e0-1a2b-4c3d-8e9f-1a2b3c4d5e6f', key: 'AUTH' },
      { id: 'c2f2f8f1-2b3c-5d4e-9f0a-2b3c4d5e6f7a', key: 'CERT_CONF' },
      { id: 'd3g3g9g2-3c4d-6e5f-0a1b-3c4d5e6f7a8b', key: 'COMMUNICATIONS' },
      { id: 'e4h4h0h3-4d5e-7f6a-1b2c-4d5e6f7a8b9c', key: 'METEO_DATA' },
      { id: 'f5i5i1i4-5e6f-8a7b-2c3d-5e6f7a8b9c0d', key: 'REF_DOC' },
      { id: 'a6j6j2j5-6f7a-9b8c-3d4e-6f7a8b9c0d1e', key: 'TECH_ACT_REPORT' },
      { id: 'b7k7k3k6-7a8b-0c9d-4e5f-7a8b9c0d1e2f', key: 'EXT_REPORT' },
      { id: 'c8l8l4l7-8b9c-1d0e-5f6a-8b9c0d1e2f3a', key: 'OTHER' },
      { id: 'd9m9m5m8-9c0d-2e1f-6a7b-9c0d1e2f3a4b', key: 'TEST_PLAN' },
      { id: 'e0n0n6n9-0d1e-3f2a-7b8c-0d1e2f3a4b5c', key: 'BUDGET' },
      { id: 'f1o1o7o0-1e2f-4a3b-8c9d-1e2f3a4b5c6d', key: 'APPLICATION' },
      { id: 'a2p2p8p1-2f3a-5b4c-9d0e-2f3a4b5c6d7e', key: 'TEST_CATALOG' },
      { id: 'b3q3q9q2-3a4b-6c5d-0e1f-3a4b5c6d7e8f', key: 'NOTE_EXP' },
    ];

    return availableDocumentTypes.find((item) => item.id === id)?.key;
  }

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

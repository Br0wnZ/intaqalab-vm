import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntaIconComponent, UiDialogService } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MunitionsDumpsStoreType } from '../../../+state/munition-dumps.store';
import { MunitionsDumpsStore } from '../../../+state/munition-dumps.store';
import type { MunitionsDumpDialog, MunitionsDumpModel } from '../../../models/munitions-dumps.model';
import { MunitionsDumpsDialogComponent } from '../munitions-dumps-dialog/munitions-dumps-dialog.component';

const DEFAULT_COLUMNS = ['munitionDumpId', 'cellsCount', 'maxNeq', 'maxRiskGroupNeqPerCell', 'actions'] as const;
@Component({
  selector: 'inta-whare-house-munitions-dumps-list',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatSlideToggleModule,
    IntaIconComponent,
  ],
  template: `
    <h2 class="text-base font-semibold text-gray-900 my-6">
      {{ 'MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITIONS_DUMPS' | translate }}
    </h2>

    <div class="inta-bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="flex items-center justify-between p-6">
        <h3 class="text-sm font-medium text-gray-900">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.TITLE' | translate }}
        </h3>
        <button mat-flat-button color="primary" type="button" (click)="create()">
          <ui-inta-icon name="plus" size="xs" class="mr-1" />
          {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.CREATE' | translate }}
        </button>
      </div>
      <div class="overflow-x-auto">
        <table mat-table matSort class="w-full" [dataSource]="store.items()" (matSortChange)="onSort($event)">
          <ng-container matColumnDef="munitionDumpId">
            <th
              *matHeaderCellDef
              mat-sort-header
              mat-header-cell
              class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            >
              {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.NAME' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.munitionDumpId }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="cellsCount">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.CELLS_COUNT' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.cells.length }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="maxNeq">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.NEQMAX' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.maxNeq }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="maxRiskGroupNeqPerCell">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.NEQMAXCELL' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
              <span>{{ item.maxRiskGroupNeqPerCell }}</span>
            </td>
          </ng-container>

          <!-- Actions Column (Scheduler) -->
          <ng-container matColumnDef="actions">
            <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.COLUMNS.ACTIONS' | translate }}
            </th>
            <td *matCellDef="let item" mat-cell class="px-6 py-4 !bg-white">
              <div class="flex gap-2 items-center">
                <button mat-icon-button class="!text-gray-600 scale-90" (click)="edit(item)">
                  <ui-inta-icon name="edit" size="xxl" class="mb-2" />
                </button>
                <button mat-icon-button class="!text-gray-600 scale-90" (click)="delete(item)">
                  <ui-inta-icon name="remove" size="xxl" class="mb-2" />
                </button>
                <mat-slide-toggle
                  class="scale-90"
                  [(ngModel)]="item.active"
                  (change)="toogleActive(item, $event)"
                ></mat-slide-toggle>
              </div>
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
export class MunitionsDumpsListComponent {
  readonly store: MunitionsDumpsStoreType = inject(MunitionsDumpsStore);
  readonly #matDialog = inject(MatDialog);

  readonly displayedColumns = computed(() => [...DEFAULT_COLUMNS]);

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

  create() {
    const data: MunitionsDumpDialog = {
      item: null,
    };
    const dialogRef = this.#matDialog.open(MunitionsDumpsDialogComponent, {
      width: '600px',
      data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.createItem(result);
      }
    });
  }

  edit(item: MunitionsDumpModel) {
    const data: MunitionsDumpDialog = {
      item,
    };
    const dialogRef = this.#matDialog.open(MunitionsDumpsDialogComponent, {
      width: '600px',
      data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.updateItem(result);
      }
    });
  }

  uiDialogs = inject(UiDialogService);
  async delete(item: MunitionsDumpModel) {
    const ok = await this.uiDialogs.confirm({
      labelButtonConfirm: 'COMMONS.ACCEPT',
      title: 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL_DELETE.TITLE',
      htmlText: 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL_DELETE.CONTENT_HTML',
    });
    if (ok) {
      this.store.deleteItem(item);
    }
  }

  toogleActive(item: MunitionsDumpModel, change: MatSlideToggleChange) {
    const enabled = change.checked;
    this.store.toogleEnabledItem(item, enabled);
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

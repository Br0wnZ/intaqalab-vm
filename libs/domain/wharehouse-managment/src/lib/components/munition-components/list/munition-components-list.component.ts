import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import type { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSortModule } from '@angular/material/sort';
import type { Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BooleanStatusBadge, IntaIconComponent, UiDialogService } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MunitionComponentStoreType } from '../../../+state/munition-component.store';
import { MunitionComponentStore } from '../../../+state/munition-component.store';
import type {
  MunitionComponentsModel,
  MunitionDialog,
  MunitionDialogOutput,
} from '../../../models/munition-components.model';
import { MunitionComponentDialogComponent } from '../munition-component-dialog/munition-component-dialog.component';

const DEFAULT_COLUMNS = ['name', 'category', 'active', 'observations', 'actions'] as const;

@Component({
  imports: [
    TranslateModule,
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
    BooleanStatusBadge,
    IntaIconComponent,
  ],
  template: `
    <h2 class="text-base font-semibold text-gray-900 my-6">
      {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.TITLE' | translate }}
    </h2>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto mt-4">
      <div class="flex justify-between items-center p-4">
        <h3 class="text-md text-gray-700">{{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.TITLE' | translate }}</h3>
        <button mat-flat-button color="primary" type="button" (click)="create()">
          <ui-inta-icon name="plus" size="xs" class="mr-1" />
          {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.CREATE' | translate }}
        </button>
      </div>
      <div class="inta-bg-white overflow-hidden">
        <div class="overflow-x-auto">
          <table mat-table matSort class="w-full" [dataSource]="store.items()" (matSortChange)="onSort($event)">
            <!-- Number Column -->
            <ng-container matColumnDef="name">
              <th
                *matHeaderCellDef
                mat-sort-header
                mat-header-cell
                class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
              >
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.COMPONENT_TYPE' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.name.es }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th
                *matHeaderCellDef
                mat-sort-header
                mat-header-cell
                class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
              >
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.CATEGORY' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ 'WHAREHOUSE_MANAGMENT.' + item.category | translate }}</span>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="active">
              <th
                *matHeaderCellDef
                mat-sort-header
                mat-header-cell
                class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
              >
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.STATUS' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm !bg-white">
                <ui-boolean-status-badge [isActive]="item.active" />
              </td>
            </ng-container>

            <!-- Observations Column (Scheduler) -->
            <ng-container matColumnDef="observations">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.OBSERVATIONS' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-600 max-w-xs !bg-white">
                <div
                  matTooltipPosition="above"
                  matTooltipClass="tw-tooltip"
                  class="truncate"
                  [matTooltip]="item.observations"
                >
                  <span class="text-sm text-gray-900">{{ item.observations }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Actions Column (Scheduler) -->
            <ng-container matColumnDef="actions">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.ACTIONS' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 !bg-white">
                <div class="flex items-center gap-2">
                  <button mat-icon-button class="!text-gray-600 scale-90" (click)="delete(item)">
                    <ui-inta-icon name="remove" size="xxl" />
                  </button>
                  <button mat-icon-button class="!text-gray-600 scale-90" (click)="edit(item)">
                    <ui-inta-icon name="edit" size="xxl" />
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
            <tr
              *matRowDef="let row; columns: displayedColumns()"
              mat-row
              class="hover:bg-gray-50 transition-colors"
            ></tr>
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
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MunitionComponentsListComponent {
  readonly store: MunitionComponentStoreType = inject(MunitionComponentStore);
  readonly #matDialog = inject(MatDialog);

  pageIndex = signal(0);
  pageSize = signal(10);
  sortField = signal<string | undefined>(undefined);
  sortDirection = signal<'asc' | 'desc' | ''>('');

  constructor() {
    effect(() => {
      const page = this.pageIndex() + 1;
      const pageSize = this.pageSize();
      const sortDirection = this.sortDirection();
      const sortField = sortDirection ? this.sortField() : undefined;

      this.store.search({ page, pageSize, sortDirection, sortField });
    });
  }
  readonly displayedColumns = computed(() => [...DEFAULT_COLUMNS]);

  create() {
    const data: MunitionDialog = {
      item: null,
    };
    const dialogRef = this.#matDialog.open(MunitionComponentDialogComponent, {
      width: '600px',
      data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.createItem(result);
      }
    });
  }

  edit(item: MunitionComponentsModel) {
    const data: MunitionDialog = {
      item,
    };
    const dialogRef = this.#matDialog.open(MunitionComponentDialogComponent, {
      width: '600px',
      data,
    });

    dialogRef.afterClosed().subscribe((result: false | MunitionDialogOutput) => {
      if (result) {
        const itemToUpdate: MunitionComponentsModel = {
          ...item,
          ...result,
        };
        this.store.updateItem(itemToUpdate);
      }
    });
  }

  uiDialogs = inject(UiDialogService);
  async delete(item: MunitionComponentsModel) {
    const ok = await this.uiDialogs.confirm({
      labelButtonConfirm: 'COMMONS.ACCEPT',
      title: 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL_DELETE.TITLE',
      htmlText: 'WHAREHOUSE_MANAGMENT.MUNITION_COMPONENTS.MODAL_DELETE.CONTENT_HTML',
    });
    if (ok) {
      this.store.deleteItem(item);
    }
  }

  toogleActive(item: MunitionComponentsModel, change: MatSlideToggleChange) {
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

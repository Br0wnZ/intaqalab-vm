import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BooleanStatusBadge, IntaIconComponent, UiDialogService } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { DenominationsStoreType } from '../../../+state/denominations.store';
import { DenominationsStore } from '../../../+state/denominations.store';
import type {
  DenominationDialog,
  DenominationModel,
  DenominationUpSertModel,
} from '../../../models/denominations.model';
import { WharehouseFilterComponent } from '../../shared/filter/wharehouse-filter.component';
import { DenominationsDialogComponent } from '../denomination-dialog/denominations-dialog.component';

const DEFAULT_COLUMNS = [
  'name',
  'munitionTypeName',
  'neq',
  'unNumber',
  'compatibility',
  'weight',
  'riskGroup',
  'active',
  'actions',
] as const;
@Component({
  selector: 'inta-wharehouse-denominations-list',
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
    BooleanStatusBadge,
    WharehouseFilterComponent,
    FormField,
    IntaIconComponent,
  ],
  template: `
    <h2 class="text-base font-semibold text-gray-900 my-6">
      {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.TITLE' | translate }}
    </h2>
    <inta-wharehouse-filter
      [placeholdeTranslation]="'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.DENOMINATION'"
      (searchItems)="searchedName.set($event)"
    />

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto mt-4">
      <div class="flex justify-between items-center p-4">
        <h3 class="text-md text-gray-700">{{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.TITLE' | translate }}</h3>
        <button mat-flat-button color="primary" type="button" (click)="create()">
          <ui-inta-icon name="plus" size="xs" class="mr-1" />
          {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.CREATE' | translate }}
        </button>
      </div>

      <div class="inta-bg-white overflow-hidden">
        <div class="overflow-x-auto">
          <table mat-table matSort class="w-full" [dataSource]="store.items()" (matSortChange)="onSort($event)">
            <ng-container matColumnDef="name">
              <th
                *matHeaderCellDef
                mat-sort-header
                mat-header-cell
                class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
              >
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.DENOMINATION' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.name }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="munitionTypeName">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.MUNITION_TYPE' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.munitionType.name }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="neq">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.NEQ' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.neq }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="unNumber">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.ONU' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.unNumber }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="riskGroup">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.RISK_GROUP' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.riskGroups }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="compatibility">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.COMPATIBILITY' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.compatibility }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="weight">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.NOMINAL_WEIGHT' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.weight }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="active">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.COLUMNS.STATUS' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm !bg-white">
                <ui-boolean-status-badge [isActive]="item.active" />
              </td>
            </ng-container>

            <!-- Observations Column (Scheduler) -->
            <ng-container matColumnDef="observations">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.OBSERVATIONS' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-600 max-w-xs !bg-white">
                <div
                  matTooltipPosition="above"
                  matTooltipClass="tw-tooltip"
                  class="truncate"
                  [matTooltip]="item.observations"
                >
                  {{ item.observations }}
                </div>
              </td>
            </ng-container>

            <!-- Actions Column (Scheduler) -->
            <ng-container matColumnDef="actions">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.ACTIONS' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4">
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
export class DenominationsListComponent {
  readonly store: DenominationsStoreType = inject(DenominationsStore);
  readonly #matDialog = inject(MatDialog);

  readonly displayedColumns = computed(() => [...DEFAULT_COLUMNS]);

  pageIndex = signal(0);
  pageSize = signal(10);
  sortField = signal<string | undefined>(undefined);
  sortDirection = signal<'asc' | 'desc' | ''>('');

  searchedName = signal<{ name: string } | undefined>(undefined);

  constructor() {
    effect(() => {
      const page = this.pageIndex() + 1;
      const pageSize = this.pageSize();
      const sortField = this.sortField();
      const sortDirection = this.sortDirection();

      const name = this.searchedName()?.name;

      this.store.search({ name, page, pageSize, sortDirection, sortField });
    });
  }

  create() {
    const data: DenominationDialog = {
      item: null,
    };
    const dialogRef = this.#matDialog.open(DenominationsDialogComponent, {
      width: '600px',
      data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.createItem(result);
      }
    });
  }

  edit(item: DenominationModel) {
    const data: DenominationDialog = {
      item,
    };
    const dialogRef = this.#matDialog.open(DenominationsDialogComponent, {
      width: '600px',
      data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.updateItem({
          ...item,
          ...result,
        });
      }
    });
  }

  uiDialogs = inject(UiDialogService);
  async delete(item: DenominationModel) {
    const ok = await this.uiDialogs.confirm({
      labelButtonConfirm: 'COMMONS.ACCEPT',
      title: 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL_DELETE.TITLE',
      htmlText: 'WHAREHOUSE_MANAGMENT.DENOMINATIONS.MODAL_DELETE.CONTENT_HTML',
    });
    if (ok) {
      this.store.deleteItem(item);
    }
  }

  toogleActive(item: DenominationUpSertModel, event: { checked: boolean }) {
    const itemToSend = { ...item, active: event.checked, munitionTypeId: item.munitionType.id };
    this.store.toogleEnabledItem(itemToSend);
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

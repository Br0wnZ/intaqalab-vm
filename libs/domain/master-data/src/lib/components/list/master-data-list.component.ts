import type { Type } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { Sort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule, MatIconModule } from '@intaqalab/theme';
import { BooleanStatusBadge } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { MasterDataStore } from '../../+state/master-data.store';
import { MASTERS_ACTIONS, MASTER_LIST_COLUMN_TRANSFORM } from '../../data/master-data.constants';
import { MODAL_COMPONENT } from '../../modal.token';
import type { MasterDataRemoveDialog } from '../../models/master-data-remove-dialog.model';
import type { MasterDataSwitchStatusDialog } from '../../models/master-data-switch-status-dialog.model';
import type { MasterView, MasterViewColumnTransform } from '../../models/master-data-view.model';
import type { MasterDataResponseType } from '../../models/utils.model';
import { MasterDataRemoveDialogComponent } from '../dialogs/remove/remove-dialog.component';
import { MasterDataSwitchStatusDialogComponent } from '../dialogs/switch-status/switch-status-dialog.component';

@Component({
  selector: 'inta-master-data-list',
  imports: [
    TranslateModule,
    MatTableModule,
    FormsModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    BooleanStatusBadge,
  ],
  template: `
    <h1 class="text-2xl font-semibold text-gray-700 mb-6">{{ masterView().title | translate }}</h1>

    <div class="w-full flex justify-end mb-4">
      <button matButton="elevated" type="button" (click)="createRecord()">
        {{ 'MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE' | translate }}
      </button>
    </div>

    <table mat-table matSort class="w-full" [dataSource]="store.items()" (matSortChange)="onSort($event)">
      @for (column of masterView().columnList; track column.id) {
        <ng-container [matColumnDef]="column.id">
          <th
            *matHeaderCellDef
            mat-sort-header
            mat-header-cell
            class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
            [disabled]="column.id === 'actions'"
          >
            {{ column.name | translate }}
          </th>
          <td *matCellDef="let rowData" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
            <!-- SWITCH -->
            @if (column.id === 'actions') {
              @for (action of masterView().actions; track action) {
                @switch (action) {
                  @case (ACTIONS.EDIT) {
                    <button
                      type="button"
                      mat-icon-button
                      class="hover:bg-gray-100 -mr-2"
                      (click)="onClickEdit(rowData)"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                  }
                  @case (ACTIONS.DELETE) {
                    <button
                      type="button"
                      mat-icon-button
                      class="hover:bg-gray-100 -mr-2"
                      (click)="onClickDelete(rowData.id)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                  @case (ACTIONS.SWITCH_STATUS) {
                    <mat-slide-toggle
                      class="scale-90"
                      [(ngModel)]="rowData['active']"
                      (change)="onClickSwitchStatus(rowData)"
                    ></mat-slide-toggle>
                  }
                }
              }
            } @else if (column.status) {
              <ui-boolean-status-badge [isActive]="rowData[column.id]" />
            } @else {
              <span>{{ castValueToList(rowData[column.id], column.transform) }}</span>
            }
          </td>
        </ng-container>
      }

      <tr *matHeaderRowDef="columnsIds()" mat-header-row></tr>
      <tr *matRowDef="let row; columns: columnsIds()" mat-row class="hover:bg-gray-50 transition-colors"></tr>
    </table>

    <mat-paginator
      class="!bg-white"
      [length]="store.totalElements()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
      [pageSizeOptions]="[5, 10, 25, 50]"
      (page)="onPage($event)"
    />
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterDataListComponent {
  readonly store = inject(MasterDataStore);
  readonly #dialog = inject(MatDialog);
  readonly #translate = inject(TranslateService);

  readonly masterView = input.required<MasterView>();

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly sortField = signal<string | undefined>(undefined);
  readonly sortDirection = signal<'asc' | 'desc' | ''>('');

  readonly ACTIONS = MASTERS_ACTIONS;

  columnsIds = computed(() => {
    const masterViewData = this.masterView();
    return masterViewData.columnList.map((column) => column.id);
  });

  modalComponent: Type<unknown> = inject(MODAL_COMPONENT);
  readonly #dialogStylesConfig = { maxWidth: 600, width: '100vw', minHeight: 'fit-content' };

  constructor() {
    effect(() => {
      const page = this.pageIndex() + 1;
      const pageSize = this.pageSize();
      const sortDirection = this.sortDirection();
      const sortField = sortDirection ? this.sortField() : undefined;
      this.store.search({ page, pageSize, sortDirection, sortField });
    });
  }

  protected castValueToList(value: unknown, transform?: MasterViewColumnTransform) {
    if (!transform) return value;

    const callbacks = {
      [MASTER_LIST_COLUMN_TRANSFORM.TRANSLATION]: () => this.#translate.instant(`${transform.helper}.${value}`),
      [MASTER_LIST_COLUMN_TRANSFORM.ENUM]: () => (transform.helper as Record<string, string>)[value as string],
      [MASTER_LIST_COLUMN_TRANSFORM.LIST_TRANSLATION]: () =>
        (value as []).map((v) => this.#translate.instant(`${transform.helper}.${v}`)).join(', '),
      [MASTER_LIST_COLUMN_TRANSFORM.LIST_KEY]: () => (value as []).map((v) => v[transform.helper as string]).join(', '),
      [MASTER_LIST_COLUMN_TRANSFORM.KEY]: () => (value as Record<string, unknown>)[transform.helper as string],
    };
    return callbacks[transform.id]() || '';
  }

  protected async createRecord() {
    const dialogRef = this.#dialog.open(this.modalComponent, { ...this.#dialogStylesConfig, data: null });
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result) {
      const payloadContent = { ...result, active: true };
      this.store.createItem(payloadContent);
    }
  }

  protected async onClickEdit(itemToEdit: MasterDataResponseType) {
    const dialogRef = this.#dialog.open(this.modalComponent, { ...this.#dialogStylesConfig, data: itemToEdit });
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result) {
      this.store.updateItem(result);
    }
  }

  protected async onClickSwitchStatus(itemToEdit: MasterDataResponseType) {
    const switchStatusItem: MasterDataSwitchStatusDialog = {
      title: this.masterView().dialogs[this.ACTIONS.SWITCH_STATUS].title,
      description: this.masterView().dialogs[this.ACTIONS.SWITCH_STATUS].description,
      item: itemToEdit,
    };

    const dialogRef = this.#dialog.open(MasterDataSwitchStatusDialogComponent, {
      ...this.#dialogStylesConfig,
      data: switchStatusItem,
    });
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result) {
      const itemNew = {
        ...itemToEdit,
        active: itemToEdit.active,
      };
      this.store.updateItem(itemNew);
    }
  }

  protected async onClickDelete(id: string): Promise<void> {
    const deleteMasterItem: MasterDataRemoveDialog = {
      title: this.masterView().dialogs[this.ACTIONS.DELETE].title,
      description: this.masterView().dialogs[this.ACTIONS.DELETE].description,
      data: { id, masterServiceRef: this.store },
    };

    const dialogRef = this.#dialog.open(MasterDataRemoveDialogComponent, {
      ...this.#dialogStylesConfig,
      data: deleteMasterItem,
    });
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result) {
      this.store.deleteItem(id);
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
}

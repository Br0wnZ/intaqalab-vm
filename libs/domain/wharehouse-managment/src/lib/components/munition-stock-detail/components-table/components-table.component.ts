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
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntaIconComponent, UiDialogService } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { MunitionsStockDetailStore } from '../../../+state/munition-stock-detail.store';
import type { MunitionDetailResponseModel } from '../../../models/munition-stock-detail.model';
import type { UpdateAssociatedComponentsPayload } from '../../../services/munitions-stock-detail.service';
import type { EditFormResult } from './upsert-dialog/upsert-dialog.component';
import { UpsertDialogComponent } from './upsert-dialog/upsert-dialog.component';

const DISPLAYED_COLUMNS = ['munitionTypeId', 'denominationId', 'batch'];

@Component({
  selector: 'inta-components-table',
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatTooltipModule,
    IntaIconComponent,
  ],
  providers: [MunitionsStockDetailStore, MunitionComponentStore],
  template: `
    <div class="w-full mt-6">
      <h2 class="text-base font-semibold text-gray-900 my-6">
        {{ 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.HEADING' | translate }}
      </h2>

      <div class="w-full bg-white rounded-lg border border-gray-200">
        <div class="p-6 space-y-6">
          <div class="flex items-center justify-between m-0">
            <h3 class="text-sm font-medium text-gray-900">
              {{ 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.HEADING' | translate }}
            </h3>
            @if (munitionStockDetailStore.item()?.status !== 'RETIRED') {
              <div class="flex items-center gap-4">
                <button mat-flat-button (click)="itemToEdit.set({ value: -1 })">
                  <mat-icon>add</mat-icon>
                  {{ 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.ADD_COMPONENTS' | translate }}
                </button>
              </div>
            }
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4"></div>
        </div>
        <!-- Tabla -->
        <div class="overflow-x-auto">
          <table mat-table class="w-full" [dataSource]="munitionStockDetailStore.item()?.associatedComponents || []">
            <!-- Columna Type -->
            <ng-container matColumnDef="munitionTypeId">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider !bg-gray-100"
              >
                {{ 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.TYPE' | translate }}
              </th>
              <td *matCellDef="let row" mat-cell class="px-6 py-4 !bg-white">
                <span>{{ row.munitionType.name }}</span>
              </td>
            </ng-container>

            <!-- Columna Denomination -->
            <ng-container matColumnDef="denominationId">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider !bg-gray-100"
              >
                {{ 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.DENOMINATION' | translate }}
              </th>
              <td *matCellDef="let row" mat-cell class="px-6 py-4 !bg-white">
                <span>{{ row.denomination.name }}</span>
              </td>
            </ng-container>

            <!-- Columna Batch -->
            <ng-container matColumnDef="batch">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider !bg-gray-100"
              >
                {{ 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.BATCH' | translate }}
              </th>
              <td *matCellDef="let row" mat-cell class="px-6 py-4 !bg-white">
                <span>{{ row.batch }}</span>
              </td>
            </ng-container>

            <!-- Columna Actions -->
            <ng-container matColumnDef="actions">
              <th
                *matHeaderCellDef
                mat-header-cell
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider !bg-gray-100"
              >
                {{ 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.ACTIONS' | translate }}
              </th>
              <td *matCellDef="let row; let i = index" mat-cell class="px-6 py-4 !bg-white">
                <div class="flex items-center gap-2">
                  <button mat-icon-button class="!text-gray-600" (click)="itemToEdit.set({ value: i })">
                    <ui-inta-icon name="edit" size="xxl" />
                  </button>
                  <button mat-icon-button class="!text-gray-600 scale-90" (click)="deleteComponent(i)">
                    <ui-inta-icon name="remove" size="xxl" />
                  </button>
                </div>
              </td>
            </ng-container>

            <tr *matHeaderRowDef="displayedColumns()" mat-header-row class="bg-gray-50"></tr>
            <tr
              *matRowDef="let row; columns: displayedColumns()"
              mat-row
              class="hover:bg-gray-50 transition-colors border-b border-gray-100"
            ></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsTableComponent {
  readonly munitionStockDetailStore = inject(MunitionsStockDetailStore);
  readonly #munitionComponentStore = inject(MunitionComponentStore);

  readonly #uiDialogs = inject(UiDialogService);
  readonly #dialog = inject(MatDialog);

  munition = input.required<MunitionDetailResponseModel>();

  readonly displayedColumns = computed(() => {
    const hasRetiredStatus = this.munitionStockDetailStore.item()?.status === 'RETIRED';
    const columns = [...DISPLAYED_COLUMNS];

    if (!hasRetiredStatus) columns.push('actions');

    return columns;
  });

  itemToEdit = signal<{ value: number } | undefined>(undefined);

  constructor() {
    effect(() => {
      const munition = this.munition();
      const componentList = this.#munitionComponentStore.items();
      const itemToEdit = this.itemToEdit();

      if (!componentList.length) this.#munitionComponentStore.search({});

      if (!munition) return;

      if (itemToEdit !== undefined && componentList !== undefined) {
        const index = itemToEdit.value;
        const item = munition.associatedComponents[index];
        this.#dialog
          .open(UpsertDialogComponent, {
            data: {
              item,
              munitionTypeList: componentList,
            },
            width: '1024px',
          })
          .afterClosed()
          .subscribe((result: EditFormResult) => {
            if (result) {
              const data = this.#payload();
              if (index > -1) {
                data[index].batch = result.batch;
                data[index].denominationId = result.denominationId.id;
                data[index].munitionTypeId = result.munitionTypeId;
              } else {
                data.push({
                  batch: result.batch,
                  denominationId: result.denominationId.id,
                  munitionTypeId: result.munitionTypeId,
                });
              }
              this.munitionStockDetailStore.updateAssociatedComponents({ id: munition.id, data });
            }
            this.itemToEdit.set(undefined);
          });
      }
    });
  }

  async deleteComponent(index: number) {
    const munitionId = this.munition().id;
    const ok = await this.#uiDialogs.confirm({
      labelButtonConfirm: 'COMMONS.ACCEPT',
      title: 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.ACTION_DELETE_TITLE',
      htmlText: 'WHAREHOUSE_MANAGMENT.TABLE_COMPONENTS.ACTION_DELETE_HTML',
    });
    if (ok) {
      const data = this.#payload();
      data.splice(index, 1);
      this.munitionStockDetailStore.updateAssociatedComponents({ id: munitionId, data });
    }
  }

  #payload() {
    const { associatedComponents } = this.munition();
    const data: UpdateAssociatedComponentsPayload['data'] = [];
    for (const val of associatedComponents) {
      data.push({
        batch: val.batch,
        denominationId: val.denomination.id,
        munitionTypeId: val.munitionType.id,
      });
    }
    return data;
  }
}

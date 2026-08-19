import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, pattern, schema, validateHttp } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import type { Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import { ClientsDataService } from '@intaqalab/data-access';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { MunitionComponentStore } from '../../../+state/munition-component.store';
import { StockListStore } from '../../../+state/stock-list.store';
import type { MunitionDetailResponseModel } from '../../../models/munition-stock-detail.model';
import type { MunitionStockListResponse, MunitionStockListSearch } from '../../../models/munition-stock-list.model';
import { MunitionsStockCertificatesService } from '../../../services/munitions-stock-certificates.service';
import type { SearchByTrialNumberResponse } from '../../../utils/search-trial.utils';
import { PLANNED_TRIAL_PATTERN } from '../../../utils/search-trial.utils';

type LinkFilter = {
  clientId: string;
  plannedFireTrialId: string;
  plannedFireTrialView: string;
  munitionTypeId: string;
};

const DEFAULT_COLUMNS = ['denomination', 'batch', 'client', 'plannedFireTrial'] as const;

@Component({
  selector: 'inta-link-certificates-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    FormField,
    IntaSignalSelectComponent,
    IntaSignalSelectComponent,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    IntaIconComponent,
  ],
  providers: [StockListStore, MunitionComponentStore],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'WHAREHOUSE_MANAGMENT.LINK.TITLE' | translate }}
    </h2>

    <mat-dialog-content>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <ui-inta-signal-select
          appearance="outline"
          [id]="'trial-status'"
          [valueKey]="'id'"
          [labelKey]="'name'"
          [formField]="filterForm.clientId"
          [label]="'WHAREHOUSE_MANAGMENT.LINK.CLIENT_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.LINK.CLIENT_PLACEHOLDER' | translate"
          [options]="clientsService.clients()"
        />
        <ui-inta-signal-select
          appearance="outline"
          [id]="'munitionType'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="filterForm.munitionTypeId"
          [label]="'WHAREHOUSE_MANAGMENT.LINK.TYPE_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.LINK.TYPE_PLACEHOLDER' | translate"
          [options]="munitionTypeOptions()"
        />

        <div>
          <label for="plannedFireTrialView" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.LINK.TRIAL_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              id="plannedFireTrialView"
              matInput
              [formField]="filterForm.plannedFireTrialView"
              [placeholder]="'WHAREHOUSE_MANAGMENT.LINK.TRIAL_PLACEHOLDER' | translate"
            />
          </mat-form-field>
          @if (filterForm.plannedFireTrialView().touched() && filterForm.plannedFireTrialView().errors()) {
            @for (error of filterForm.plannedFireTrialView().errors(); track error) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
          <div class="flex justify-end mt-4 gap-2">
            <button mat-raised-button type="button" role="button" [disabled]="!filterForm().dirty()" (click)="search()">
              {{ 'COMMONS.SEARCH' | translate }}
            </button>
          </div>
        </div>
      </div>

      <div class="inta-bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table mat-table matSort class="w-full" [dataSource]="stockListStore.items()">
            <ng-container matColumnDef="denomination">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.LINK.DENOMINATION' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <mat-checkbox
                  [checked]="selection.isSelected(item)"
                  (click)="$event.stopPropagation()"
                  (change)="selection.toggle(item)"
                ></mat-checkbox>
                <span>{{ item.denomination.name }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="batch">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.LINK.BATCH' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.batch }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="client">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.LINK.CLIENT' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.client.name }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="plannedFireTrial">
              <th *matHeaderCellDef mat-header-cell class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100">
                {{ 'WHAREHOUSE_MANAGMENT.LINK.TRIAL' | translate }}
              </th>
              <td *matCellDef="let item" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                <span>{{ item.plannedFireTrial.name }}</span>
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
          [length]="stockListStore.totalElements()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPage($event)"
        />
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button
        mat-flat-button
        cdkFocusInitial
        class="disabled:!bg-gray-300 "
        [disabled]="selection.selected.length === 0"
        (click)="onConfirm()"
      >
        {{ 'MODIFY_DOC_DIALOG.SAVE' | translate }}
      </button>
      <button mat-stroked-button class="!border-gray-300 !text-gray-700 hover:!bg-gray-50" (click)="onCancel()">
        {{ 'MODIFY_DOC_DIALOG.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkCertificatesDialogComponent {
  readonly stockListStore = inject(StockListStore);
  readonly #munitionComponentStore = inject(MunitionComponentStore);
  protected readonly clientsService = inject(ClientsDataService);

  munitionTypeOptions = computed(() => {
    const munitionComponentList = this.#munitionComponentStore.items();

    return munitionComponentList || [];
  });

  readonly formModel = signal<LinkFilter>({
    clientId: '',
    munitionTypeId: '',
    plannedFireTrialId: '',
    plannedFireTrialView: '',
  });

  urlTrialSearch = injectFireTrialsEndpoint();
  schemaForm = schema<LinkFilter>((rootPath) => {
    return (
      pattern(rootPath.plannedFireTrialView, PLANNED_TRIAL_PATTERN),
      validateHttp(rootPath.plannedFireTrialView, {
        request: ({ value }) => {
          if (!value()) return undefined;
          return {
            url: this.urlTrialSearch,
            params: { trialNumber: value() },
          };
        },
        onSuccess: (response: SearchByTrialNumberResponse) => {
          if (response.items.length > 0) {
            this.filterForm.plannedFireTrialId().setControlValue(response.items[0].id);
            return null;
          }
          return {
            kind: 'trialNotFound',
            message: 'WHAREHOUSE_MANAGMENT.TRIAL_NOT_FOUND',
          };
        },
        onError: () => ({
          kind: 'networkError',
          message: 'WHAREHOUSE_MANAGMENT.TRIAL_NOT_FOUND_NETWORK',
        }),
      })
    );
  });

  readonly filterForm = form(this.formModel, this.schemaForm);

  readonly dialogRef = inject(MatDialogRef);
  readonly data = inject<{
    certId: string;
    stockDetail: MunitionDetailResponseModel;
  }>(MAT_DIALOG_DATA);

  pageIndex = signal(0);
  pageSize = signal(10);
  sortField = signal<string | undefined>(undefined);
  sortDirection = signal<'asc' | 'desc' | ''>('');

  constructor() {
    //  TODO: pre select info if general data

    // if (this.data.stockDetail.generalData.client) {
    //   this.filterForm.clientId().setControlValue(this.data.stockDetail.generalData.client.id);
    // }
    // if (this.data.stockDetail.generalData.plannedFireTrial) {
    //   this.filterForm.plannedFireTrialId().setControlValue(this.data.stockDetail.generalData.plannedFireTrial.id);
    // }
    // if (this.data.stockDetail.generalData.plannedFireTrial) {
    //   this.filterForm.plannedFireTrialId().setControlValue(this.data.stockDetail.generalData.plannedFireTrial.id);
    // }

    effect(() => {
      const page = this.pageIndex() + 1;
      const pageSize = this.pageSize();
      const sortDirection = this.sortDirection();
      const sortField = sortDirection ? this.sortField() : undefined;

      this.stockListStore.search({ page, pageSize, sortDirection, sortField });
    });
  }

  search() {
    const criteria: MunitionStockListSearch = {};
    const { clientId, munitionTypeId, plannedFireTrialId } = this.formModel();
    if (clientId !== '') {
      criteria.clientIds = [clientId];
    }
    if (munitionTypeId !== '') {
      criteria.munitionTypeIds = [munitionTypeId];
    }
    if (plannedFireTrialId !== '') {
      criteria.plannedFireTrialIds = [plannedFireTrialId];
    }
    this.stockListStore.search(criteria);
  }

  selection = new SelectionModel<MunitionStockListResponse>(true, []);

  readonly displayedColumns = computed(() => [...DEFAULT_COLUMNS]);

  actionService = inject(MunitionsStockCertificatesService);
  onConfirm() {
    const munitionIds: string[] = this.selection.selected.map((e) => e.id);
    this.actionService.link.set({
      certId: this.data.certId,
      munitionIds,
    });
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
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

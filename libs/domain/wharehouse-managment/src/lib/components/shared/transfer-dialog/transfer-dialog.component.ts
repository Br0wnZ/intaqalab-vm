import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, form, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { TransferMovementsPayload } from '../../../models/movements.model';
import type { MunitionDetailResponseModel } from '../../../models/munition-stock-detail.model';
import type { MunitionsDumpModel } from '../../../models/munitions-dumps.model';
import { MunitionsDumpsService } from '../../../services/munitions-dumps.service';
import { MunitionsStockDetailService } from '../../../services/munitions-stock-detail.service';

@Component({
  selector: 'inta-transfer-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    FormField,
    IntaSignalSelectComponent,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'WHAREHOUSE_MANAGMENT.DIALOG_TRANSFER.TITLE' | translate }}
    </h2>
    <mat-dialog-content>
      <div class="flex flex-col gap-4">
        <ui-inta-signal-select
          appearance="outline"
          [id]="'destination'"
          [valueKey]="'id'"
          [labelKey]="'munitionDumpId'"
          [formField]="form.munitionDumpId"
          [label]="'WHAREHOUSE_MANAGMENT.DIALOG_TRANSFER.DESTINATION_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.DIALOG_TRANSFER.DESTINATION_PLACEHOLDER' | translate"
          [options]="munitionsDumpList()"
        />

        <ui-inta-signal-select
          appearance="outline"
          [id]="'cell'"
          [valueKey]="'id'"
          [labelKey]="'id'"
          [formField]="form.cellName"
          [label]="'WHAREHOUSE_MANAGMENT.DIALOG_TRANSFER.CELL_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.DIALOG_TRANSFER.CELL_PLACEHOLDER' | translate"
          [options]="cellOptions()"
        />
        @if (data.items.length === 1) {
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'WHAREHOUSE_MANAGMENT.DIALOG_TRANSFER.QUANTITY_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input id="quantiy" type="number" matInput [formField]="form.quantity" />
            </mat-form-field>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button
        mat-flat-button
        cdkFocusInitial
        class="disabled:!bg-gray-300 "
        [disabled]="form().invalid()"
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
export class TransferDialogComponent {
  readonly dialogRef = inject(MatDialogRef);
  readonly data = inject<{
    items: MunitionDetailResponseModel[];
  }>(MAT_DIALOG_DATA);

  readonly #munitionsStockDetailService = inject(MunitionsStockDetailService);
  munitionDumpsDataService = inject(MunitionsDumpsService);
  munitionDumpsSearchResults = this.munitionDumpsDataService.paginatedResponse;

  munitionsDumpList = computed(() => {
    return (this.munitionDumpsDataService.paginatedResponse.value()?.items || []).filter((e) => !!e.active);
  });

  cellOptions = computed(() => {
    const result: { id: string }[] = [];
    const selected = this.form.munitionDumpId().controlValue();
    if (selected === '') {
      return result;
    }
    const records = this.munitionsDumpList() as MunitionsDumpModel[];
    const munitionDump = records.find((e) => e.id === selected);
    if (munitionDump === undefined) {
      return result;
    } else {
      return munitionDump.cells.map((e) => ({ id: e.name }));
    }
  });

  readonly formModel = signal<{ quantity: number; munitionDumpId: string; cellName: string }>({
    quantity: 0,
    munitionDumpId: '',
    cellName: '',
  });
  readonly form = form(this.formModel, (f) => {
    required(f.quantity, { when: () => this.data.items.length === 1 });
    min(f.quantity, 1);
    required(f.munitionDumpId);
    required(f.cellName);
  });

  onConfirm() {
    const formModelData = this.formModel();

    const dataToSend: TransferMovementsPayload = {
      munitionDumpId: formModelData.munitionDumpId,
      cellName: formModelData.cellName,
      items: this.data.items.map((item) => {
        return {
          quantity: this.data.items.length === 1 ? formModelData.quantity : item.quantity,
          stockId: item.id,
        };
      }),
    };

    this.#munitionsStockDetailService.transfer.set(dataToSend);
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

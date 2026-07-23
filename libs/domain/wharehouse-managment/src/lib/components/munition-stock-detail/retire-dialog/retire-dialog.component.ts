import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form, max, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { MunitionDetailResponseModel } from '../../../models/munition-stock-detail.model';
import { MunitionsStockDetailService } from '../../../services/munitions-stock-detail.service';

@Component({
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    FormField,
    IntaSignalSelectComponent,
    IntaIconComponent,
    NoNegativeValuesDirective,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="closeCircle" size="xxl" />
      {{ 'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.TITLE' | translate }}
    </h2>
    <mat-dialog-content>
      <p class="text-center text-sm font-medium mb-4">{{ 'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.INTRO' | translate }}</p>
      <div class="rounded-lg border border-gray-200 bg-white">
        <div class="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200">
          {{ 'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.TITLE_TABLE' | translate }}
        </div>
        <div class="grid grid-cols-3 text-xs font-medium text-gray-600 px-4 py-3 bg-gray-100">
          <span>{{ 'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.DENOMINATION' | translate }}</span>
          <span>{{ 'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.BATCH' | translate }}</span>
          <span class="text-right">
            {{ 'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.STOCK' | translate }}
          </span>
        </div>

        <div class="grid grid-cols-3 items-center px-4 py-3 text-sm text-gray-700">
          <div>
            <span>{{ data.item.denomination.name }}</span>
          </div>
          <div>{{ data.item.batch }}</div>
          <div class="text-right">
            <span>{{ data.item.quantity }}</span>
          </div>
        </div>
      </div>
      <div>
        <div class="my-4">
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.QUANTITY_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="quantiy"
              type="number"
              matInput
              libNoNegativeValues
              libNoLeadingZeros
              [formField]="form.quantity"
            />
          </mat-form-field>
        </div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'quantiy'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.reason"
          [label]="'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.REASON_LABEL' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.REASON_PLACEHOLDER' | translate"
          [options]="options"
        />
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="!mt-4">
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
export class RetireDialogComponent {
  readonly dialogRef = inject(MatDialogRef);
  readonly data = inject<{
    item: MunitionDetailResponseModel;
    category: 'MUNITION' | 'MUNITION_COMPONENT';
  }>(MAT_DIALOG_DATA);

  readonly #translate = inject(TranslateService);

  options = ['RETURN', 'DESTRUCTION', 'EXTERNAL'].map((id) => ({
    id,
    label: this.#translate.instant(`WHAREHOUSE_MANAGMENT.DIALOG_RETIRE.REASON_${id}`),
  }));

  readonly formModel = signal<{ quantity: number | null; reason: string }>({
    quantity: null,
    reason: '',
  });
  readonly form = form(this.formModel, (f) => {
    required(f.quantity);
    required(f.reason);
    max(f.quantity, this.data.item.quantity);
    min(f.quantity, 1);
  });

  retireService = inject(MunitionsStockDetailService);
  onConfirm() {
    this.retireService.retire.set({
      ...this.formModel(),
      quantity: this.formModel().quantity as number,
      category: this.data.category,
      stockId: this.data.item.id,
    });
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { FormField, disabled, form, min, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MunitionDumpForm, MunitionsDumpDialog, MunitionsDumpModel } from '../../../models/munitions-dumps.model';

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
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      @if (data.item === null) {
        {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.TITLE_CREATE' | translate }}
      } @else {
        {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.TITLE_EDIT' | translate }}
      }
    </h2>

    <mat-dialog-content>
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.ID' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="name"
            matInput
            [formField]="form.name"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.ID_PLACEHOLDER' | translate"
          />
        </mat-form-field>
      </div>

      <div class="mb-4">
        <ui-inta-signal-select
          appearance="outline"
          [id]="'cellcount'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="form.cellsCount"
          [label]="'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.CELLS_COUNT' | translate"
          [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.CELLS_COUNT_PLACEHOLDER' | translate"
          [options]="cellsCountOptions"
        />
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        @for (cell of formModel().cells; track $index; let idx = $index) {
          <div class="max-w-16">
            <label class="block text-sm font-medium text-gray-700 mb-2" [for]="'cell' + idx">
              {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.CELL_PREFIX' | translate }} {{ idx + 1 }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input
                matInput
                [id]="'cell' + idx"
                [value]="cell"
                (change)="updateCell(idx, $any($event.target).value)"
              />
            </mat-form-field>
          </div>
        }
        @if (form.cells().errors()) {
          @for (error of form.cells().errors(); track error.kind) {
            @if (error.kind === 'cell_value_required') {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        }
      </div>

      <div class="mb-4">
        <label for="neqmaxcell" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.NEQMAXCELL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="neqmaxcell"
            type="number"
            matInput
            [formField]="form.neqMaxCell"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.NEQMAXCELL_PLACEHOLDER' | translate"
          />
        </mat-form-field>
        @if (form.neqMaxCell().errors()) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            @for (error of form.neqMaxCell().errors(); track error) {
              <p>{{ error.message | translate }}</p>
            }
          </div>
        }
      </div>
      <div class="mb-4">
        <label for="neqmax" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.NEQMAXTOTAL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <input
            id="neqmax"
            type="number"
            matInput
            [formField]="form.neqMax"
            [placeholder]="'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.NEQMAXTOTAL_PLACEHOLDER' | translate"
          />
        </mat-form-field>
        @if (form.neqMax().touched() && form.neqMax().errors()) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            @for (error of form.neqMax().errors(); track error) {
              <p>{{ error.message | translate }}</p>
            }
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button
        mat-flat-button
        cdkFocusInitial
        class="disabled:!bg-gray-300 !mt-4"
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
export class MunitionsDumpsDialogComponent {
  readonly dialogRef = inject(MatDialogRef);
  readonly data = inject<MunitionsDumpDialog>(MAT_DIALOG_DATA);

  readonly formModel = signal<MunitionDumpForm>({
    name: '',
    cells: [],
    cellsCount: '',
    enabled: true,
    neqMax: null,
    neqMaxCell: null,
  });

  isEmailDisabled = signal(false);

  isDisabledCellsCount = signal(false);
  readonly form = form(this.formModel, (f) => {
    required(f.name);
    required(f.neqMax);
    required(f.neqMaxCell);
    validate(f.neqMaxCell, ({ value, valueOf }) => {
      const controlValue = value();
      if (controlValue !== null && controlValue <= 0) {
        return { kind: 'negativeOrZero', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' };
      }

      const neqMaxValue = valueOf(f.neqMax);

      if (neqMaxValue && controlValue && neqMaxValue < controlValue) {
        return {
          kind: 'cellGreaterThanMunitionDump',
          message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.CELL_GREATER_THAN_MUNITIONDUMP',
        };
      }

      return null;
    });
    validate(f.neqMax, ({ value }) => {
      const controlValue = value();
      if (controlValue !== null && controlValue <= 0) {
        return { kind: 'negativeOrZero', message: 'WHAREHOUSE_MANAGMENT.VALIDATIONS.GREATER_THAN_ZERO' };
      } else {
        return null;
      }
    });
    min(f.neqMax, 0);
    validate(f.cells, ({ value }) => {
      const controlValue = value();

      const hasSomeEmptyControl = controlValue.some((value) => !value);

      if (hasSomeEmptyControl)
        return {
          kind: 'cell_value_required',
          message: 'WHAREHOUSE_MANAGMENT.MUNITIONS_DUMPS.MODAL.CELL_VALUE_REQUIRED',
        };

      return null;
    });
    disabled(f.cellsCount, () => !!this.data.item);
  });

  cellsCountOptions = new Array(7).fill(null).map((_, i) => {
    if (i === 0) {
      return { id: '', label: '' };
    }
    return {
      id: `${i}`,
      label: `${i}`,
    };
  });

  constructor() {
    const item = this.data.item;
    if (item !== null) {
      const cells: string[] = [];
      for (const cell of item.cells) {
        cells.push(cell.name);
      }
      this.formModel.update((model) => {
        const newModel: MunitionDumpForm = {
          ...model,
          name: item.munitionDumpId,
          cells,
          cellsCount: `${item.cells.length}`,
          neqMax: item.maxNeq,
          neqMaxCell: item.maxRiskGroupNeqPerCell,
        };
        return newModel;
      });
      if (item.cells.length > 0) {
        this.isDisabledCellsCount.set(true);
      }
    }

    effect(() => {
      const countStr = this.formModel().cellsCount;
      if (countStr !== '') {
        const count = +countStr;
        this.formModel.update((model) => {
          const current = model.cells ?? [];

          if (count > current.length) {
            return {
              ...model,
              cells: [...current, ...Array(count - current.length).fill('')],
            };
          }
          if (count < current.length) {
            return {
              ...model,
              cells: current.slice(0, count),
            };
          }

          return model;
        });
      }
    });
  }

  updateCell(index: number, value: string) {
    this.formModel.update((model) => ({
      ...model,
      cells: model.cells.map((c, i) => (i === index ? value : c)),
    }));
  }

  onConfirm() {
    const formValue = this.formModel();
    const value: MunitionsDumpModel = {
      id: this.data.item?.id,
      active: true,
      maxRiskGroupNeqPerCell: formValue.neqMaxCell || 0,
      cells: formValue.cells.map((name) => ({ name })),
      maxNeq: formValue.neqMax || 0,
      munitionDumpId: formValue.name,
    };
    this.dialogRef.close(value);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

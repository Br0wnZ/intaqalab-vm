import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, disabled, form, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MasterDataDimension } from '../../../../models/master-data-dimension.model';

@Component({
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    FormField,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      @if (!data) {
        {{ 'MASTER_DATA.DIALOGS.UPSERT.CREATE_TITLE' | translate }}
      } @else {
        {{ 'MASTER_DATA.DIALOGS.UPSERT.EDIT_TITLE' | translate }}
      }
    </h2>

    <mat-dialog-content>
      <div>
        <label for="width" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.WIDTH' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="width"
            matInput
            type="number"
            [formField]="form.width"
            [placeholder]="'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.WIDTH' | translate"
          />
        </mat-form-field>
        @if (form.width().touched() && form.width().errors()) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            @for (error of form.width().errors(); track error) {
              <p>{{ error.message | translate }}</p>
            }
          </div>
        }
      </div>
      <div class="mt-4">
        <label for="height" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.HEIGHT' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="height"
            matInput
            type="number"
            [formField]="form.height"
            [placeholder]="'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.HEIGHT' | translate"
          />
        </mat-form-field>
        @if (form.height().touched() && form.height().errors()) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            @for (error of form.height().errors(); track error) {
              <p>{{ error.message | translate }}</p>
            }
          </div>
        }
      </div>
      <div class="mt-4">
        <label for="diameter" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.DIAMETER' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="diameter"
            matInput
            type="number"
            [formField]="form.diameter"
            [placeholder]="'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.DIAMETER' | translate"
          />
        </mat-form-field>
        @if (form.diameter().touched() && form.diameter().errors()) {
          <div class="text-sm text-[var(--mat-sys-error)] space-y-1">
            @for (error of form.diameter().errors(); track error) {
              <p>{{ error.message | translate }}</p>
            }
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-stroked-button class="!border-gray-300 !text-gray-700 hover:!bg-gray-50" [mat-dialog-close]="false">
        {{ 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.CANCEL' | translate }}
      </button>
      <button
        mat-flat-button
        cdkFocusInitial
        class="disabled:!bg-gray-300 "
        [disabled]="form().invalid()"
        (click)="onConfirm()"
      >
        {{ 'MASTER_DATA.DIALOGS.UPSERT.BUTTONS.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      min-width: 500px;
      max-width: 600px;
    }

    h2[mat-dialog-title] {
      margin: 0 !important;
      padding: 20px 24px !important;
    }

    mat-dialog-actions {
      background-color: #fafafa;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DimensionsUpsertDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DimensionsUpsertDialogComponent>);
  readonly data = inject<MasterDataDimension | null>(MAT_DIALOG_DATA);

  readonly formModel = signal<{
    width: number;
    height: number;
    diameter: number;
  }>({
    width: 0,
    height: 0,
    diameter: 0,
  });

  readonly form = form(this.formModel, (f) => {
    disabled(f.width, () => this.formModel().diameter > 0);
    disabled(f.height, () => this.formModel().diameter > 0);
    disabled(f.diameter, () => this.formModel().width > 0 || this.formModel().height > 0);
    validate(f.width, ({ value, valueOf }) => {
      const width = value();
      if (width < 0) return { kind: 'positive', message: 'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.ERROR.POSITIVE' };

      const height = valueOf(f.height) > 0;
      if (!width && height)
        return { kind: 'widthRequired', message: 'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.ERROR.WIDTH' };

      return null;
    });

    validate(f.height, ({ value, valueOf }) => {
      const height = value();
      if (height < 0) return { kind: 'positive', message: 'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.ERROR.POSITIVE' };

      const width = valueOf(f.width) > 0;
      if (!height && width)
        return { kind: 'heightRequired', message: 'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.ERROR.HEIGHT' };

      return null;
    });

    validate(f.diameter, ({ value, valueOf }) => {
      const diameter = value();
      if (diameter < 0) return { kind: 'positive', message: 'MASTER_DATA.DIMENSION.DIALOGS.UPSERT.ERROR.POSITIVE' };

      const height = valueOf(f.height);
      const width = valueOf(f.width);
      if (!diameter && !height && !width) return { kind: 'noData' };

      return null;
    });
  });

  constructor() {
    if (this.data !== null) {
      this.formModel.set({
        width: this.data.width || 0,
        height: this.data.height || 0,
        diameter: this.data.diameter || 0,
      });
    }
  }

  onConfirm() {
    const width = this.formModel().width || null;
    const height = this.formModel().height || null;
    const diameter = this.formModel().diameter || null;

    const dataToSend = this.form().touched() && this.form().dirty() ? { ...this.data, width, height, diameter } : null;

    this.dialogRef.close(dataToSend);
  }
}

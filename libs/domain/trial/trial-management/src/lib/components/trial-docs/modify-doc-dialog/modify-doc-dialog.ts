import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { TrialDocsService } from '../../../services/trial-docs-service';
import type { DocumentDetail } from '../../../utils-models/documents-service.model';

@Component({
  selector: 'inta-modify-doc-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    IntaSignalSelectComponent,
    FormField,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'MODIFY_DOC_DIALOG.TITLE' | translate }}
    </h2>

    <mat-dialog-content>
      <ui-inta-signal-select
        appearance="outline"
        [id]="'doc-type'"
        [valueKey]="'id'"
        [labelKey]="'label'"
        [formField]="form.typeId"
        [label]="'MODIFY_DOC_DIALOG.TYPE_LABEL' | translate"
        [placeholder]="'MODIFY_DOC_DIALOG.TYPE_PLACEHOLDER' | translate"
        [options]="documentTypes()"
      />

      <div>
        <label for="doc-name" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'MODIFY_DOC_DIALOG.NAME_LABEL' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full">
          <input
            id="doc-name"
            matInput
            [formField]="form.name"
            [placeholder]="'MODIFY_DOC_DIALOG.NAME_PLACEHOLDER' | translate"
          />
        </mat-form-field>
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
export class ModifyDocDialog {
  readonly dialogRef = inject(MatDialogRef<ModifyDocDialog>);
  readonly data = inject<{ document: DocumentDetail }>(MAT_DIALOG_DATA);
  readonly #docsService = inject(TrialDocsService);
  protected readonly updateDocumentInfoResource = this.#docsService.updateDocumentInfoResource;

  readonly documentTypes = computed(() => {
    return this.#docsService.documentTypesResource.value()?.items ?? [];
  });

  readonly formModel = signal<{
    typeId: string | null;
    name: string;
  }>({
    typeId: null,
    name: '',
  });

  readonly form = form(this.formModel, (f) => {
    required(f.typeId);
    required(f.name);
  });

  constructor() {
    effect(() => {
      const updateStatus = this.updateDocumentInfoResource.status();
      if (updateStatus === 'resolved') {
        this.#docsService.resetUpdateDocumentInfo();
        this.dialogRef.close(true);
      }
    });

    effect(() => {
      const data = this.data;
      if (data) {
        this.formModel.set({
          typeId: data.document.type.id,
          name: data.document.name,
        });
      }
    });
  }

  onConfirm() {
    const { typeId, name } = this.formModel();
    this.#docsService.updateDocumentInfo(this.data.document.id, name, this.data.document.category, typeId as string);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

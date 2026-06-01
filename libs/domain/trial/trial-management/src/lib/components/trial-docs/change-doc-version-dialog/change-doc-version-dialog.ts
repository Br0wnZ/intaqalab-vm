import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { TrialDocsService } from '../../../services/trial-docs-service';
import type { DocumentVersion } from '../../../utils-models/documents-service.model';

@Component({
  selector: 'inta-change-doc-version-dialog',
  imports: [TranslateModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="text-gray-700">warning</mat-icon>
      {{ 'TRIAL_DOCS.VERSIONS.CHANGE_VERSION_DIALOG.TITLE' | translate }}
    </h2>

    <mat-dialog-content class="text-center">
      <p class="text-sm text-gray-700 mb-3">
        {{ 'TRIAL_DOCS.VERSIONS.CHANGE_VERSION_DIALOG.DESCRIPTION' | translate }}
      </p>
      <p [innerHTML]="'TRIAL_DOCS.VERSIONS.CHANGE_VERSION_DIALOG.BODY' | translate"></p>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-stroked-button [mat-dialog-close]="false">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
      <button mat-flat-button type="button" (click)="onConfirm()">
        {{ 'COMMONS.CONFIRM' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeDocVersionDialog {
  readonly dialogRef = inject(MatDialogRef<ChangeDocVersionDialog>);
  readonly data = inject<{ version: DocumentVersion }>(MAT_DIALOG_DATA);
  readonly #docsService = inject(TrialDocsService);

  constructor() {
    effect(() => {
      const result = this.#docsService.setDocumentVersionActiveResource.statusCode();
      if (result === 200) {
        this.dialogRef.close(true);
      }
    });
  }

  onConfirm(): void {
    const { id, versionTag } = this.data.version;
    this.#docsService.setDocumentVersionActive(id, versionTag);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'inta-download-required-dialog',
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <mat-dialog-content>
      <p class="text-sm text-gray-700">{{ 'TRIAL_DOCS.DOWNLOAD_REQUIRED_DIALOG.MESSAGE' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button (click)="dialogRef.close()">
        {{ 'TRIAL_DOCS.DOWNLOAD_REQUIRED_DIALOG.ACCEPT' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadRequiredDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DownloadRequiredDialogComponent>);
}

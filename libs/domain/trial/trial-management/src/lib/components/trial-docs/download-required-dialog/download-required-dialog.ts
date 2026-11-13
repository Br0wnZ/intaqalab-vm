import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'inta-download-required-dialog',
  imports: [MatDialogModule, MatButtonModule, TranslatePipe],
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
})
export class DownloadRequiredDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DownloadRequiredDialogComponent>);
}

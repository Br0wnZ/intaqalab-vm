import { ChangeDetectionStrategy, Component, ViewEncapsulation, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../+state/execution.store';

export type PauseExecutionDialogData = {
  trialName: string;
  trialId: string;
};

export type PauseExecutionDialogResult = { action: 'pause' } | { action: 'back' };

@Component({
  selector: 'inta-pause-execution-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  providers: [ExecutionStore],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="flex items-center justify-center gap-2 text-lg font-bold text-gray-900 m-0">
      <mat-icon class="text-gray-600">pause</mat-icon>
      {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content class="flex flex-col gap-3 !px-0">
      <p class="text-sm text-gray-700 text-center m-0">
        {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.TRIAL_NAME_PREFIX' | translate }}
        <strong>{{ data.trialName }}</strong>
      </p>

      <p class="text-sm text-gray-700 text-center m-0">
        {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.DESCRIPTION' | translate }}
      </p>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="flex gap-2 !px-0 justify-end">
      <button mat-stroked-button aria-label="Cancelar pausa" [mat-dialog-close]="{ action: 'back' }">
        {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.CANCEL' | translate }}
      </button>

      <button mat-flat-button color="primary" aria-label="Pausar prueba" (click)="pause()">
        {{ 'TRIAL_EXECUTION.DIALOGS.PAUSE_EXECUTION.CONFIRM' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PauseExecutionDialog {
  readonly #dialogRef = inject<MatDialogRef<PauseExecutionDialog, PauseExecutionDialogResult>>(MatDialogRef);

  readonly data = inject<PauseExecutionDialogData>(MAT_DIALOG_DATA);
  readonly #store = inject(ExecutionStore);

  constructor() {
    effect(() => {
      const status = this.#store.pauseExecutionStatus();
      console.log('Pause status:', status);
      if (status === 'resolved') {
        this.#dialogRef.close({ action: 'pause' });
      }
    });
  }

  pause(): void {
    this.#store.pauseExecution(this.data.trialId);
  }
}

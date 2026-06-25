import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { FireTrial, TrialSearchFilters } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { TrialListComponent } from '@intaqalab/trial-management';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrialSelectorDialogResult = { action: 'select'; trial: FireTrial } | { action: 'cancel' };

// ─── Statuses available in execution context ───────────────────────────────────

const EXECUTION_SELECTOR_STATUSES: TrialStatus[] = [
  TrialStatus.PLANNED,
  TrialStatus.STARTED,
  TrialStatus.IN_PROGRESS,
  TrialStatus.INTERRUPTED,
];

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'inta-trial-selector-dialog',
  imports: [
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    IntaIconComponent,
    TrialListComponent,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <ui-inta-icon name="search" size="xxl" />
      {{ 'TRIAL_EXECUTION.DIALOGS.TRIAL_SELECTOR.TITLE' | translate }}
    </h2>

    <mat-dialog-content class="!pt-4 !pb-2">
      <!-- Trial list in execution-selector mode -->
      <inta-trial-list
        [filters]="defaultFilters()"
        [executionSelector]="true"
        (scheduleTrial)="onTrialSelected($event)"
      />
    </mat-dialog-content>

    <mat-dialog-actions class="!mt-4 justify-end">
      <button role="button" mat-stroked-button (click)="cancel()">
        {{ 'TRIAL_EXECUTION.DIALOGS.TRIAL_SELECTOR.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class TrialSelectorDialog {
  readonly #dialogRef = inject(MatDialogRef<TrialSelectorDialog>);

  protected search = '';

  readonly defaultFilters = signal<Partial<TrialSearchFilters>>({
    status: EXECUTION_SELECTOR_STATUSES,
  });

  onTrialSelected(trial: FireTrial): void {
    const result: TrialSelectorDialogResult = { action: 'select', trial };
    this.#dialogRef.close(result);
  }

  cancel(): void {
    const result: TrialSelectorDialogResult = { action: 'cancel' };
    this.#dialogRef.close(result);
  }
}

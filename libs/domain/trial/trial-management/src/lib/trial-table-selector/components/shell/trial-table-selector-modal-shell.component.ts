import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { FireTrial, TrialSearchFilters } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { TrialListComponent } from '../../../components/list/components/trial-list/trial-list.component';

@Component({
  selector: 'inta-trial-table-selector-modal-shell',
  imports: [
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatInputModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    TrialListComponent,
    MatDialogClose,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="calendar" size="xxl" />
      {{ 'TRIAL_TABLE_SELECTOR_MODAL.TITLE' | translate }}
    </h2>
    <mat-dialog-content>
      <span class="font-medium text-lg text-gray-900">
        {{ 'TRIAL_TABLE_SELECTOR_MODAL.PENDING_TRIALS' | translate }}
      </span>

      <inta-trial-list [filters]="defaultFilters()" [scheduler]="true" (scheduleTrial)="onTrialSelected($event)" />
    </mat-dialog-content>
    <mat-dialog-actions class="!mt-4">
      <button role="button" mat-stroked-button [mat-dialog-close]="false">
        {{ 'TRIAL_TABLE_SELECTOR_MODAL.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class TrialTableSelectorModalShellComponent {
  readonly #dialogRef = inject(MatDialogRef<TrialTableSelectorModalShellComponent>);

  readonly search = signal('');
  readonly defaultFilters = signal<Partial<TrialSearchFilters>>({
    status: [TrialStatus.UNDER_REVIEW, TrialStatus.PLANNED, TrialStatus.PREPARED],
  });

  onTrialSelected(trial: FireTrial) {
    this.#dialogRef.close(trial);
  }
}

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
import { MatFormField } from '@angular/material/form-field';
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
    MatFormField,
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
      <div class="flex justify-end mb-4">
        <mat-form-field
          appearance="outline"
          class="search-field !max-w-sm !min-w-sm !w-full"
          [subscriptSizing]="'dynamic'"
        >
          <ui-inta-icon matPrefix name="search" size="md" class="mx-2" />
          <input
            matInput
            class="text-gray-700"
            [placeholder]="'TRIAL_TABLE_SELECTOR_MODAL.SEARCH_PLACEHOLDER' | translate"
            [(ngModel)]="search"
            (ngModelChange)="updateFilters($event)"
          />
        </mat-form-field>
      </div>

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

  updateFilters(searchTerm: string) {
    this.defaultFilters.set({
      ...this.defaultFilters(),
      description: searchTerm ? searchTerm : undefined,
    });
  }

  onTrialSelected(trial: FireTrial) {
    this.#dialogRef.close(trial);
  }
}

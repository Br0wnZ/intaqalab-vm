import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, disabled, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ClientsDataService, TrialsDataService } from '@intaqalab/data-access';
import { IntaIconComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { AssociatedTrialForm } from '../../utils-models/associated-trial-form.model';

@Component({
  selector: 'inta-associated-trial-dialog',
  imports: [
    TranslateModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    IntaSignalSelectComponent,
    FormField,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="copy" size="xxl" />
      <span>{{ data?.title | translate }}</span>
    </h2>

    <mat-dialog-content data-testid="associated-trial-dialog-content">
      <div class="flex flex-col gap-4">
        <ui-inta-signal-select
          appearance="outline"
          [id]="'trial-status'"
          [valueKey]="'id'"
          [labelKey]="'label'"
          [formField]="associatedTrialForm.year"
          [label]="'ASSOCIATED_TRIAL_DIALOG.YEAR_LABEL' | translate"
          [placeholder]="'ASSOCIATED_TRIAL_DIALOG.YEAR_SEARCH_PLACEHOLDER' | translate"
          [options]="availableYears()"
        />
        <ui-inta-signal-select
          appearance="outline"
          [id]="'trial-status'"
          [valueKey]="'id'"
          [labelKey]="'name'"
          [formField]="associatedTrialForm.clientId"
          [label]="'ASSOCIATED_TRIAL_DIALOG.CLIENT_LABEL' | translate"
          [placeholder]="'ASSOCIATED_TRIAL_DIALOG.CLIENT_PLACEHOLDER' | translate"
          [options]="clientsService.clients()"
        />
        <div>
          <label for="search-input" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'ASSOCIATED_TRIAL_DIALOG.SEARCH_TERM_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              placeholder="{{ 'ASSOCIATED_TRIAL_DIALOG.SEARCH_TERM_PLACEHOLDER' | translate }}"
              id="search-input"
              matInput
              [formField]="associatedTrialForm.searchTerm"
            />
          </mat-form-field>
        </div>
        <ui-inta-signal-select
          appearance="outline"
          [id]="'trial-status'"
          [valueKey]="'trialNumber'"
          [labelKey]="'description'"
          [formField]="associatedTrialForm.trialId"
          [label]="'ASSOCIATED_TRIAL_DIALOG.TRIAL_LABEL' | translate"
          [placeholder]="'ASSOCIATED_TRIAL_DIALOG.TRIAL_PLACEHOLDER' | translate"
          [options]="noTrialsFound() ? [noTrialsFound()] : trialsResults()"
        />
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="!mt-6">
      <button
        mat-flat-button
        data-testid="confirm-button"
        [disabled]="associatedTrialForm.trialId().invalid()"
        [mat-dialog-close]="selectedOption()"
      >
        {{ 'ASSOCIATED_TRIAL_DIALOG.CONFIRM' | translate }}
      </button>
      <button mat-stroked-button data-testid="cancel-button" [mat-dialog-close]="null">
        {{ 'ASSOCIATED_TRIAL_DIALOG.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociatedTrialDialog {
  readonly data = inject(MAT_DIALOG_DATA);
  readonly #translate = inject(TranslateService);

  protected readonly clientsService = inject(ClientsDataService);

  protected readonly trialsService = inject(TrialsDataService);
  readonly trialsSource = this.trialsService.source;

  readonly trialsResults = computed(() => {
    const trials = this.trialsSource.value();
    if (!trials) return [];
    return (trials.items ?? []).map((trial) => ({
      ...trial,
      description: `${trial.trialNumber} - ${trial.description}`,
    }));
  });

  selectedOption = computed(() => {
    const selectedValue = this.formModel().trialId;
    const trials = this.trialsSource.value()?.items || [];
    if (selectedValue !== '' && trials.length) {
      return trials.find((e) => e.trialNumber === selectedValue);
    }
    return undefined;
  });

  protected readonly availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({ id: String(currentYear - i), label: currentYear - i }));
  });

  readonly noTrialsFound = computed(() => {
    const noTrials = this.trialsSource.hasValue() && (this.trialsSource.value().items?.length ?? 0) === 0;

    if (noTrials) {
      return {
        trialNumber: null,
        description: this.#translate.instant('ASSOCIATED_TRIAL_DIALOG.NO_TRIALS_FOUND'),
      };
    }
    return false;
  });

  readonly searchParams = computed(
    () => {
      return {
        year: this.associatedTrialForm.year().value(),
        clientId: this.associatedTrialForm.clientId().value(),
        content: this.associatedTrialForm.searchTerm().value(),
      };
    },
    {
      equal: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    },
  );

  readonly formModel = signal<AssociatedTrialForm>({
    year: null,
    clientId: '',
    searchTerm: '',
    trialId: '',
  });

  readonly associatedTrialForm = form(this.formModel, (f) => {
    required(f.trialId);
    disabled(f.trialId, ({ valueOf }) => !valueOf(f.year) && !valueOf(f.clientId) && !valueOf(f.searchTerm));
  });

  constructor() {
    effect(() => {
      const params = this.searchParams();
      if (params.year && (params.clientId || params.content)) {
        this.trialsService.search(params);
      }
    });
  }
}

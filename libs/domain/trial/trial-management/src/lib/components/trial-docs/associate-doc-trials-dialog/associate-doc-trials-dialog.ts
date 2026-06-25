import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { MatButtonModule, MatFormFieldModule, MatIconModule } from '@intaqalab/theme';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { TrialDocsService } from '../../../services/trial-docs-service';

@Component({
  selector: 'inta-associate-doc-trials-dialog',
  imports: [
    TranslateModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title class="!flex !items-center !justify-center !gap-3 !text-xl !font-semibold !mx-auto">
      <ui-inta-icon name="folder_plus" size="xxl" />
      {{ 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.TITLE' | translate }}
    </h2>

    <mat-dialog-content class="!h-[150px]">
      <div class="space-y-4">
        <label for="trialSelect" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.SELECT_TRIALS_LABEL' | translate }}
        </label>

        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <mat-select
            id="trialSelect"
            multiple
            [placeholder]="'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.SELECT_TRIALS_PLACEHOLDER' | translate"
            [value]="selectedTrials()"
            [compareWith]="compareTrials"
            (valueChange)="onSelectionChange($event)"
          >
            <!-- Buscador dentro del panel del select -->
            <div class="px-3 pt-2 pb-1">
              <input
                type="text"
                class="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
                [placeholder]="'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.SEARCH_PLACEHOLDER' | translate"
                [value]="searchTerm()"
                (click)="$event.stopPropagation()"
                (keydown)="$event.stopPropagation()"
                (input)="onSearchInput($event)"
              />
            </div>

            @if (searchTerm().length < 3) {
              <mat-option disabled>
                <span class="text-xs text-gray-400">
                  {{ 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.MIN_CHARS_HINT' | translate }}
                </span>
              </mat-option>
            } @else if (fireTrialsResource.isLoading()) {
              <mat-option disabled>{{ 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.SEARCHING' | translate }}</mat-option>
            } @else if (searchedTrials().length === 0) {
              <mat-option disabled>{{ 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.NO_RESULTS' | translate }}</mat-option>
            } @else {
              @for (trial of searchedTrials(); track trial.id) {
                <mat-option [value]="trial">{{ trial.trialNumber }}</mat-option>
              }
            }
          </mat-select>
        </mat-form-field>

        @if (selectedTrials().length > 0) {
          <div class="flex flex-wrap gap-2">
            <mat-chip-set>
              @for (trial of selectedTrials(); track trial.id) {
                <mat-chip [removable]="true" (removed)="removeTrial(trial.id)">
                  {{ trial.trialNumber }}
                  <button matChipRemove>
                    <ui-inta-icon name="close" size="xs" color="var(--color-purple-700)" />
                  </button>
                </mat-chip>
              }
            </mat-chip-set>
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="!mt-4">
      <button mat-flat-button [disabled]="!selectedTrials().length" (click)="onAssociate()">
        {{ 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.ASSOCIATE' | translate }}
      </button>
      <button mat-stroked-button [mat-dialog-close]="false">
        {{ 'TRIAL_DOCS.ASSOCIATE_DOC_TO_TRIAL_DIALOG.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-chip {
        background-color: var(--inta-tonal-button-bg) !important;
      }
      mat-chip .mdc-evolution-chip__text-label.mat-mdc-chip-action-label,
      mat-chip .mat-mdc-chip-remove {
        color: var(--inta-button) !important;
        font-size: 12px;
      }
      mat-chip:not(.mdc-evolution-chip--disabled) .mdc-evolution-chip__action--primary::before {
        border: 0 !important;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociateDocTrialsDialog {
  readonly #docsService = inject(TrialDocsService);
  readonly #associateDocResource = this.#docsService.associateDocResource;
  readonly #dialogRef = inject(MatDialogRef<AssociateDocTrialsDialog>);
  readonly #fireTrialsEndpoint = injectFireTrialsEndpoint();
  public data = inject<{ documentId: string; trialId: string }>(MAT_DIALOG_DATA);

  readonly searchTerm = signal('');
  readonly selectedTrials = signal<FireTrial[]>([]);

  readonly fireTrialsResource = httpResource<{ items: FireTrial[] }>(() => {
    const term = this.searchTerm();
    if (term.length < 3) return undefined;
    return {
      url: `${this.#fireTrialsEndpoint}?page=1&pageSize=100&trialNumber=${encodeURIComponent(term)}&status=${TrialStatus.UNDER_REVIEW}`,
    };
  });

  readonly searchedTrials = computed(() => this.fireTrialsResource.value()?.items ?? []);

  readonly previousAssociatedTrials = computed(
    () => this.#docsService.documentAssociatedTrialsResource.value()?.fireTrialIds ?? [],
  );

  constructor() {
    this.#docsService.resetAssociateDoc();
    this.#docsService.getDocumentAssociatedTrials(this.data.documentId);
    effect(() => {
      const status = this.#associateDocResource.status();
      if (status === 'resolved') {
        this.#dialogRef.close(true);
      }
    });
  }

  readonly compareTrials = (a: FireTrial, b: FireTrial): boolean => a.id === b.id;

  onSelectionChange(newValues: FireTrial[]): void {
    const currentSearchIds = new Set(this.searchedTrials().map((t) => t.id));
    this.selectedTrials.update((current) => {
      const previousNotInSearch = current.filter((t) => !currentSearchIds.has(t.id));
      return [...previousNotInSearch, ...newValues];
    });
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  removeTrial(trialId: string): void {
    this.selectedTrials.update((trials) => trials.filter((t) => t.id !== trialId));
  }

  onAssociate(): void {
    this.#docsService.associateDocToTrial({
      documentId: this.data.documentId,
      fireTrialIds: [...this.selectedTrials().map((trial) => trial.id), this.data.trialId],
    });
  }
}

import { Component, ViewEncapsulation, effect, inject, signal } from '@angular/core';
import { FormField, FormRoot, apply, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { FireTrial } from '@intaqalab/models';
import { IntaIconComponent, SaveButton } from '@intaqalab/ui';
import { NoNegativeValuesDirective, boundedNumberSchema } from '@intaqalab/utils';
import { TranslatePipe } from '@ngx-translate/core';

import { SeriesAndShotsStore } from '../../../+state/series-and-shots.store';
import type { AddNewSerieRequest } from '../../../utils-models/series-and-shots.model';
import type { UpsertTrialSerieRequest } from '../../../utils-models/upsert-trial-serie-info.model';

type Upsert = {
  trialId: FireTrial['id'];
  serieId?: string;
  name: string;
  numberOfShots?: number;
  observations?: string;
  isEditing: boolean;
};

@Component({
  selector: 'inta-new-serie-dialog',
  imports: [
    TranslatePipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormField,
    FormRoot,
    IntaIconComponent,
    SaveButton,
    NoNegativeValuesDirective,
  ],
  providers: [SeriesAndShotsStore],
  template: `
    <h2 mat-dialog-title>
      <ui-inta-icon name="checkSquare" size="xxl" />
      {{
        isEditMode()
          ? ('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.TITLE_EDIT' | translate)
          : ('TRIAL_PLANNING.UPSERT_SERIE_DIALOG.TITLE_NEW' | translate)
      }}
    </h2>

    <mat-dialog-content>
      <form class="flex flex-col gap-4" [formRoot]="serieForm">
        <div class="flex flex-col gap-1">
          <label for="nombre-input">
            {{ 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              id="nombre-input"
              matInput
              [formField]="serieForm.name"
              [placeholder]="'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SERIE_NAME_PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>

        @if (!isEditMode()) {
          <div class="flex flex-col gap-1">
            <label for="disparos-input">
              {{ 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.NUMBER_OF_SHOTS_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input
                id="disparos-input"
                matInput
                type="number"
                libNoNegativeValues
                [formField]="serieForm.numberOfShots"
                [placeholder]="'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.NUMBER_OF_SHOTS_PLACEHOLDER' | translate"
              />
            </mat-form-field>
          </div>
        }

        <div class="flex flex-col gap-1">
          <label for="observaciones-input">
            {{ 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.OBSERVATIONS_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <textarea
              id="observaciones-input"
              matInput
              rows="4"
              class="resize-none"
              [formField]="serieForm.observations"
              [placeholder]="'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.OBSERVATIONS_PLACEHOLDER' | translate"
            ></textarea>
          </mat-form-field>
        </div>

        <div class="flex justify-center gap-4 mt-4">
          <ui-save-button
            buttonType="submit"
            [label]="
              isEditMode() ? 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.UPDATE' : 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.SAVE'
            "
            [isSaving]="serieForm().submitting() || store.isAddingSerie() || store.isUpdatingSerie()"
            [isDisabled]="serieForm().invalid()"
          />

          <button type="button" mat-stroked-button [mat-dialog-close]="false">
            {{ 'TRIAL_PLANNING.UPSERT_SERIE_DIALOG.CANCEL' | translate }}
          </button>
        </div>
      </form>
    </mat-dialog-content>
  `,
  styles: `
    :host {
      display: block;
    }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class UpsertSerieDialog {
  readonly #dialogRef = inject(MatDialogRef);
  readonly data = inject<Upsert>(MAT_DIALOG_DATA);

  readonly isEditMode = signal<boolean>(this.data.isEditing);
  protected readonly store = inject(SeriesAndShotsStore);

  readonly serieModel = signal<{
    name: string;
    numberOfShots: number | null;
    observations: string;
  }>({
    name: this.data.name ?? '',
    numberOfShots: this.data.numberOfShots ?? null,
    observations: this.data.observations ?? '',
  });

  readonly serieForm = form(
    this.serieModel,
    (f) => {
      required(f.name);
      if (!this.data.isEditing) {
        required(f.numberOfShots);
        apply(f.numberOfShots, boundedNumberSchema(1, 20));
      }
    },
    {
      submission: {
        action: async (formTree) => {
          const value = formTree().value();
          if (this.isEditMode()) {
            const data: UpsertTrialSerieRequest = {
              id: this.data.serieId ?? '',
              name: value.name,
              observations: value.observations,
            };
            this.store.updateSerie(data);
          } else {
            const data: AddNewSerieRequest = {
              trialId: this.data.trialId,
              name: value.name,
              numberOfShots: value.numberOfShots ?? 0,
              observations: value.observations,
            };
            this.store.addSerie(data);
          }
        },
      },
    },
  );

  constructor() {
    effect(() => {
      const addStatus = this.store.addSerieStatus();
      const updateStatus = this.store.updateSerieStatus();
      if (addStatus === 'resolved' || updateStatus === 'resolved') {
        this.#dialogRef.close(this.serieForm().value());
        this.store.resetAddSerie();
        this.store.resetUpdateSerie();
      }
    });
  }
}

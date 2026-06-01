import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, max, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectFireTrialsEndpoint } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';

import type {
  ArmamentBulkUpdateRequest,
  UpdateArmamentDialogData,
  UpdateArmamentDialogResult,
} from '../../utils-models/armament.model';

@Component({
  selector: 'inta-update-armament-dialog',
  imports: [
    FormField,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title class="!m-0 !p-0 text-lg font-semibold">
      <mat-icon class="text-gray-700">edit</mat-icon>
      {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.TITLE' | translate: { shotNumber: data.shotNumber } }}
    </h2>

    <mat-dialog-content>
      <form class="flex flex-col gap-4">
        <!-- Denominación arma -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.WEAPON_LABEL' | translate }}
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <mat-select
              [formField]="armamentForm.weaponExternalId"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.WEAPON_PLACEHOLDER' | translate"
            >
              @for (weapon of data.weapons; track weapon.id) {
                <mat-option [value]="weapon.id">{{ weapon.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Denominación tubo -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.TUBE_LABEL' | translate }}
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <mat-select
              [formField]="armamentForm.tubeExternalId"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.TUBE_PLACEHOLDER' | translate"
            >
              @for (tube of data.tubes; track tube.id) {
                <mat-option [value]="tube.id">{{ tube.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Instrumentado -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.INSTRUMENTED_LABEL' | translate }}
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <mat-select
              [formField]="armamentForm.isInstrumented"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.INSTRUMENTED_PLACEHOLDER' | translate"
            >
              <mat-option [value]="true">{{ 'TRIAL_PLANNING.ARMAMENT.TABLE.YES' | translate }}</mat-option>
              <mat-option [value]="false">{{ 'TRIAL_PLANNING.ARMAMENT.TABLE.NO' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Vida útil -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.LIFE_LABEL' | translate }}
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              type="number"
              [formField]="armamentForm.tubeLifePercentage"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.LIFE_PLACEHOLDER' | translate"
            />
            <span matTextSuffix>%</span>
          </mat-form-field>
        </div>

        <!-- Observaciones -->
        <div>
          <div class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.OBSERVATIONS_LABEL' | translate }}
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <textarea
              matInput
              rows="4"
              class="resize-none"
              [formField]="armamentForm.observations"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.OBSERVATIONS_PLACEHOLDER' | translate"
            ></textarea>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-flat-button color="primary" [disabled]="armamentForm().invalid() || isUpdating()" (click)="onApply()">
        {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.APPLY_BUTTON' | translate }}
      </button>
      <button mat-stroked-button (click)="onCancel()">
        {{ 'COMMONS.CANCEL' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      ::ng-deep {
        .mat-mdc-dialog-container {
          .mdc-dialog__surface {
            border-radius: 12px !important;
          }
        }
      }

      mat-form-field {
        ::ng-deep {
          .mat-mdc-text-field-wrapper {
            background-color: white;
          }

          .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateArmamentDialog {
  readonly #fireTrialUrl = injectFireTrialsEndpoint();
  readonly dialogRef = inject(MatDialogRef<UpdateArmamentDialog>);
  readonly data = inject<UpdateArmamentDialogData>(MAT_DIALOG_DATA);

  readonly #updateParams = signal<{ trialId: string; body: ArmamentBulkUpdateRequest } | null>(null);

  readonly #updateResource = httpResource<void>(() => {
    const params = this.#updateParams();
    if (!params) return undefined;

    return {
      url: `${this.#fireTrialUrl}/${params.trialId}/planning/armament`,
      method: 'PUT',
      body: params.body,
    };
  });

  readonly updateStatus = computed(() => this.#updateResource.status());
  readonly isUpdating = computed(() => this.#updateResource.isLoading());

  readonly armamentModel = signal<UpdateArmamentDialogResult>({
    weaponExternalId: this.data.armament.weaponExternalId,
    tubeExternalId: this.data.armament.tubeExternalId,
    isInstrumented: this.data.armament.isInstrumented,
    tubeLifePercentage: this.data.armament.tubeLifePercentage,
    observations: this.data.armament.observations || '',
  });

  readonly armamentForm = form(this.armamentModel, (f) => {
    required(f.weaponExternalId);
    required(f.tubeExternalId);
    required(f.isInstrumented);
    required(f.tubeLifePercentage);
    min(f.tubeLifePercentage, 0);
    max(f.tubeLifePercentage, 100);
  });

  constructor() {
    effect(() => {
      const status = this.updateStatus();
      if (status === 'resolved') {
        this.dialogRef.close(true);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApply(): void {
    if (this.armamentForm().valid()) {
      const formData = this.armamentModel();

      this.#updateParams.set({
        trialId: this.data.trialId,
        body: {
          shots: [
            {
              shotId: this.data.shotId,
              weaponExternalId: formData.weaponExternalId,
              tubeExternalId: formData.tubeExternalId,
              isInstrumented: formData.isInstrumented,
              lifeUsefulPercentage: formData.tubeLifePercentage,
              observations: formData.observations,
            },
          ],
        },
      });
    }
  }
}

import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, apply, form, required, submit, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectClearable } from '@intaqalab/ui';
import { percentageSchema } from '@intaqalab/utils';
import { TranslatePipe } from '@ngx-translate/core';

import { ArmamentStore } from '../../+state/armament.store';
import type { UpdateArmamentDialogData, UpdateArmamentDialogResult } from '../../utils-models/armament.model';
import type { SpecimenItem } from '../../utils-models/catalog.model';
import { SpecimenType } from '../../utils-models/specimen.model';

@Component({
  selector: 'inta-update-armament-dialog',
  imports: [
    FormField,
    FormRoot,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSelectClearable,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    TranslatePipe,
  ],
  template: `
    <h2 mat-dialog-title class="!m-0 !p-0 text-lg font-semibold">
      <mat-icon class="text-gray-700">edit</mat-icon>
      {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.TITLE' | translate: { shotNumber: data.shotNumber } }}
    </h2>

    <form class="contents" [formRoot]="armamentForm">
      <mat-dialog-content>
        <div class="flex flex-col gap-4">
          <!-- Denominación arma -->
          <div>
            <div class="block text-sm font-medium text-gray-700 mb-2">
              {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.WEAPON_LABEL' | translate }}
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select
                clearable
                [formField]="armamentForm.weaponExternalId"
                [placeholder]="'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.WEAPON_PLACEHOLDER' | translate"
                (valueChange)="onWeaponChange($event)"
              >
                @for (weapon of data.weapons; track weapon.id) {
                  <mat-option [value]="weapon.id">{{ weapon.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Denominación tubo -->
          @if (data.armament.weaponType !== mortarSpecimenType) {
            <div>
              <div class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.TUBE_LABEL' | translate }}
              </div>
              <mat-form-field appearance="outline" class="w-full">
                <mat-select
                  clearable
                  [formField]="armamentForm.tubeExternalId"
                  [placeholder]="'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.TUBE_PLACEHOLDER' | translate"
                >
                  @for (tube of tubeOptions(); track tube.denominationId ?? tube.id) {
                    <mat-option [value]="(tube.denominationId ?? tube.id).toString()">
                      {{ tube.modelName ?? tube.name }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          }

          <!-- Instrumentado -->
          @if (data.armament.weaponType !== mortarSpecimenType) {
            <div>
              <div class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.INSTRUMENTED_LABEL' | translate }}
              </div>
              <mat-form-field appearance="outline" class="w-full">
                <mat-select
                  clearable
                  [formField]="armamentForm.isInstrumented"
                  [placeholder]="'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.INSTRUMENTED_PLACEHOLDER' | translate"
                >
                  <mat-option [value]="true">{{ 'TRIAL_PLANNING.ARMAMENT.TABLE.YES' | translate }}</mat-option>
                  <mat-option [value]="false">{{ 'TRIAL_PLANNING.ARMAMENT.TABLE.NO' | translate }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          }

          <!-- Vida útil -->
          @if (data.armament.weaponType !== mortarSpecimenType) {
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
          }

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
        </div>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button type="submit" mat-flat-button color="primary" [disabled]="armamentForm().invalid()">
          {{ 'TRIAL_PLANNING.ARMAMENT.UPDATE_SHOT_DIALOG.APPLY_BUTTON' | translate }}
        </button>
        <button type="button" mat-stroked-button (click)="onCancel()">
          {{ 'COMMONS.CANCEL' | translate }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class UpdateArmamentDialog {
  readonly dialogRef = inject(MatDialogRef<UpdateArmamentDialog, UpdateArmamentDialogResult>);
  readonly data = inject<UpdateArmamentDialogData>(MAT_DIALOG_DATA);
  readonly mortarSpecimenType = SpecimenType.Mortar;
  readonly #armamentStore = inject(ArmamentStore);

  readonly armamentModel = signal<UpdateArmamentDialogResult>({
    weaponExternalId: this.data.armament.weaponExternalId,
    tubeExternalId: this.data.armament.tubeExternalId,
    isInstrumented: this.data.armament.isInstrumented,
    tubeLifePercentage: this.data.armament.tubeLifePercentage,
    observations: this.data.armament.observations || '',
  });

  readonly selectedWeaponFamilyId = computed(() => {
    const weaponId = this.armamentModel().weaponExternalId;
    return this.data.weapons.find((weapon) => weapon.id === weaponId)?.familyId;
  });

  readonly tubeOptions = computed<SpecimenItem[]>(() => {
    const familyId = this.selectedWeaponFamilyId();
    const denominations = familyId === undefined ? [] : this.#armamentStore.tubeDenominationsForFamily(familyId);
    const selectedId = this.armamentModel().tubeExternalId;

    if (!selectedId || denominations.some((tube) => (tube.denominationId ?? tube.id).toString() === selectedId)) {
      return denominations;
    }

    const fallback = this.data.tubes.find((tube) => (tube.denominationId ?? tube.id).toString() === selectedId) ?? {
      id: selectedId,
      name: this.data.armament.tubeName || selectedId,
      type: 'TUBE' as const,
      active: true,
    };

    return [...denominations, fallback];
  });

  constructor() {
    const initialFamilyId = this.data.weapons.find(
      (weapon) => weapon.id === this.data.armament.weaponExternalId,
    )?.familyId;
    if (this.data.armament.weaponType !== this.mortarSpecimenType && initialFamilyId !== undefined) {
      this.#armamentStore.loadTubeDenominations(initialFamilyId);
    }
  }

  readonly armamentForm = form(
    this.armamentModel,
    (f) => {
      required(f.weaponExternalId);
      required(f.tubeExternalId, { when: () => this.data.armament.weaponType !== this.mortarSpecimenType });
      validate(f.isInstrumented, ({ value }) => {
        const instrument = value();
        const type = this.data.armament.weaponType.toLowerCase();

        if (type === SpecimenType.Mortar) return null;

        return instrument !== null ? null : { kind: 'required' };
      });
      required(f.tubeLifePercentage);
      apply(f.tubeLifePercentage, percentageSchema);
    },
    {
      submission: {
        action: async () => {
          this.dialogRef.close(this.armamentModel());
        },
      },
    },
  );

  onCancel(): void {
    this.dialogRef.close();
  }

  onWeaponChange(weaponId: string | null | undefined): void {
    this.armamentModel.update((current) => ({ ...current, tubeExternalId: '' }));

    if (!weaponId) {
      this.#armamentStore.clearTubeDenominations();
      return;
    }

    const familyId = this.data.weapons.find((weapon) => weapon.id === weaponId)?.familyId;
    if (familyId !== undefined) {
      this.#armamentStore.loadTubeDenominations(familyId);
    }
  }

  async onApply(): Promise<void> {
    await submit(this.armamentForm);
  }
}

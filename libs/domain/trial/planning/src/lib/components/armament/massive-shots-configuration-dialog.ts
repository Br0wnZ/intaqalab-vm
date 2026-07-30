import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent, MatSelectClearable } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MassiveConfigData, MassiveShotsConfigurationDialogData } from '../../utils-models/armament.model';
import { SpecimenType } from '../../utils-models/specimen.model';

@Component({
  selector: 'inta-massive-shots-configuration-dialog',
  imports: [
    FormField,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSelectClearable,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatChipsModule,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TITLE' | translate }}
    </h2>

    <mat-dialog-content>
      <div class="flex flex-col gap-4">
        <!-- Series -->
        <div>
          <label for="series" class="block text-sm font-medium text-gray-700">
            {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.SERIES_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              clearable
              id="series"
              multiple
              [formField]="configForm.series"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.SERIES_PLACEHOLDER' | translate"
            >
              @for (option of seriesOptions(); track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (selectedChips().length > 0) {
          <mat-chip-set aria-label="Selected items">
            @for (chip of selectedChips(); track chip.value) {
              <mat-chip [removable]="true" (removed)="removeChip(chip.value)">
                <span>
                  {{ chip.label }}
                </span>
                <button
                  matChipRemove
                  [attr.aria-label]="
                    ('TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.REMOVE_ARIA_LABEL' | translate) + ' ' + chip.label
                  "
                >
                  <ui-inta-icon name="close" size="xs" color="var(--color-purple-700)" />
                </button>
              </mat-chip>
            }
          </mat-chip-set>
        }

        <!-- Tipo -->
        <div>
          <label for="tipo" class="block text-sm font-medium text-gray-700">
            {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TYPE_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              clearable
              id="tipo"
              [formField]="configForm.tipo"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TYPE_PLACEHOLDER' | translate"
            >
              @for (option of typeOptions; track option.value) {
                <mat-option [value]="option.value">{{ option.label | translate }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Denominación arma -->
        <div>
          <label for="denominacionArma" class="block text-sm font-medium text-gray-700">
            {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.WEAPON_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              clearable
              id="denominacionArma"
              [formField]="configForm.denominacionArma"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.WEAPON_PLACEHOLDER' | translate"
            >
              @for (option of weaponsOptions(); track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Denominación tubo -->
        <div>
          <label for="denominacionTubo" class="block text-sm font-medium text-gray-700">
            {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TUBE_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              clearable
              id="denominacionTubo"
              [formField]="configForm.denominacionTubo"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TUBE_PLACEHOLDER' | translate"
            >
              @for (option of tubesOptions(); track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Instrumentado -->
        <div>
          <label for="instrumentado" class="block text-sm font-medium text-gray-700">
            {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.INSTRUMENTED_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              clearable
              id="instrumentado"
              [formField]="configForm.instrumentado"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.INSTRUMENTED_PLACEHOLDER' | translate"
            >
              <mat-option value="si">
                {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.INSTRUMENTED_YES' | translate }}
              </mat-option>
              <mat-option value="no">
                {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.INSTRUMENTED_NO' | translate }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Vida útil -->
        <div>
          <label for="vidaUtil" class="block text-sm font-medium text-gray-700">
            {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.LIFE_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              clearable
              id="vidaUtil"
              [formField]="configForm.vidaUtil"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.LIFE_PLACEHOLDER' | translate"
            >
              <mat-option value="10">10%</mat-option>
              <mat-option value="20">20%</mat-option>
              <mat-option value="33">33%</mat-option>
              <mat-option value="50">50%</mat-option>
              <mat-option value="75">75%</mat-option>
              <mat-option value="100">100%</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Observaciones -->
        <div>
          <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.OBSERVATIONS' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <textarea
              matInput
              rows="4"
              class="resize-none"
              [formField]="configForm.observaciones"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.OBSERVATIONS_PLACEHOLDER' | translate"
            ></textarea>
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions>
      <button mat-flat-button color="primary" (click)="onApply()">
        {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.APPLY_BUTTON' | translate }}
      </button>
      <button mat-stroked-button (click)="onCancel()">
        {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.CANCEL_BUTTON' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MassiveShotsConfigurationDialog {
  readonly dialogRef = inject(MatDialogRef<MassiveShotsConfigurationDialog>);
  readonly data = inject<MassiveShotsConfigurationDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  readonly seriesOptions = computed<{ value: string; label: string }[]>(() => {
    if (this.data?.series && this.data.series.length > 0) {
      return this.data.series.map((s) => ({ value: s.id, label: s.name }));
    }
    return [];
  });

  readonly weaponsOptions = computed<{ value: string; label: string }[]>(() => {
    if (this.data?.weapons && this.data.weapons.length > 0) {
      return this.data.weapons.map((w) => ({ value: w.id, label: w.name }));
    }
    return [];
  });

  readonly tubesOptions = computed<{ value: string; label: string }[]>(() => {
    if (this.data?.tubes && this.data.tubes.length > 0) {
      return this.data.tubes.map((t) => ({ value: t.id, label: t.name }));
    }
    return [];
  });

  readonly typeOptions = [
    { value: SpecimenType.Weapon, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_WEAPON' },
    { value: SpecimenType.Bundle, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_BUNDLE' },
    { value: SpecimenType.Mortar, label: 'SPECIMENS_MANAGMENT_DIALOG.TYPE_MORTAR' },
  ] as const;

  readonly configModel = signal<MassiveConfigData>({
    series: [],
    tipo: '',
    denominacionArma: '',
    denominacionTubo: '',
    instrumentado: '',
    vidaUtil: '',
    observaciones: '',
  });

  readonly configForm = form(this.configModel);

  readonly selectedChips = computed(() => {
    const selectedSeries = this.configModel().series ?? [];
    return this.seriesOptions().filter((opt) => selectedSeries.includes(opt.value));
  });

  removeChip(value: string): void {
    const current = this.configModel();
    this.configModel.set({
      ...current,
      series: (current.series ?? []).filter((s) => s !== value),
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApply(): void {
    this.dialogRef.close(this.configModel());
  }
}

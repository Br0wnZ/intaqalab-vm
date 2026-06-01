import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { MassiveConfigData } from '../../utils-models/armament.model';

@Component({
  selector: 'inta-massive-shots-configuration-dialog',
  imports: [
    FormField,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
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
              id="series"
              multiple
              [formField]="configForm.series"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.SERIES_PLACEHOLDER' | translate"
            >
              <mat-option value="serie1">Serie 1</mat-option>
              <mat-option value="serie2">Serie 2</mat-option>
              <mat-option value="serie3">Serie 3</mat-option>
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

        <!-- Denominación arma -->
        <div>
          <label for="denominacionArma" class="block text-sm font-medium text-gray-700">
            {{ 'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.WEAPON_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              id="denominacionArma"
              [formField]="configForm.denominacionArma"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.WEAPON_PLACEHOLDER' | translate"
            >
              <mat-option value="obus105">Obús 105/37 mm L118 Light Gun</mat-option>
              <mat-option value="obus155">Obús 155mm</mat-option>
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
              id="denominacionTubo"
              [formField]="configForm.denominacionTubo"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.TUBE_PLACEHOLDER' | translate"
            >
              <mat-option value="-">-</mat-option>
              <mat-option value="tubo1">Tubo 1</mat-option>
              <mat-option value="tubo2">Tubo 2</mat-option>
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

  readonly #seriesOptions: { value: string; label: string }[] = [
    { value: 'serie1', label: 'Serie 1' },
    { value: 'serie2', label: 'Serie 2' },
    { value: 'serie3', label: 'Serie 3' },
  ];

  readonly configModel = signal<MassiveConfigData>({
    series: [],
    denominacionArma: '',
    denominacionTubo: '',
    instrumentado: '',
    vidaUtil: '',
    observaciones: '',
  });

  readonly configForm = form(this.configModel);

  readonly selectedChips = computed(() => {
    const selectedSeries = this.configModel().series;
    return this.#seriesOptions.filter((opt) => selectedSeries.includes(opt.value));
  });

  removeChip(value: string): void {
    const current = this.configModel();
    this.configModel.set({
      ...current,
      series: current.series.filter((s) => s !== value),
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApply(): void {
    this.dialogRef.close(this.configModel());
  }
}

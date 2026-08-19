import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { CalibryTubeOption, CalibryWeaponOption } from '../../../+state/execution.store';
import type { ArmamentEquipmentItem } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

export interface ArmamentIntroductionMassConfigDialogData {
  serieOptions: { value: string; label: string }[];
  armaOptions: CalibryWeaponOption[];
  weaponItems: ArmamentEquipmentItem[];
  tuboOptions: CalibryTubeOption[];
  tubeItems: ArmamentEquipmentItem[];
  current: {
    arma: string | null;
    tubo: string | null;
    observations: string;
  };
}

export interface ArmamentIntroductionMassConfigDialogResult {
  assignedSeriesIds: string[];
  weaponId: number;
  tubeId: number;
  observations: string;
}

interface MassConfigForm {
  series: string[];
  arma: string | null;
  tubo: string | null;
  observations: string;
}

@Component({
  selector: 'inta-armament-introduction-mass-config-dialog',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title>
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content intaReadonlyContent>
      <div>
        <!-- Series (full-width multi-select) -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full mb-2 mt-2">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_SERIES_LABEL' | translate }}
          </mat-label>
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_SERIES_PLACEHOLDER' | translate"
            [formField]="massForm.series"
          >
            @for (opt of data.serieOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- 2-column grid for fields -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-4">
          <!-- Arma -->
          <div>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_LABEL' | translate }}</mat-label>
              <mat-select
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_PLACEHOLDER' | translate"
                [formField]="massForm.arma"
              >
                @for (opt of data.armaOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Nº serie del arma -->
          <div>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
              <mat-label>
                {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_ARMA_LABEL' | translate }}
              </mat-label>
              <input id="mass-armament-weapon-serial" matInput readonly [value]="selectedWeaponSerial()" />
            </mat-form-field>
          </div>

          <!-- Tubo -->
          <div>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_LABEL' | translate }}</mat-label>
              <mat-select
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_PLACEHOLDER' | translate"
                [formField]="massForm.tubo"
              >
                @for (opt of data.tuboOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Nº serie del tubo -->
          <div>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
              <mat-label>
                {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_TUBO_LABEL' | translate }}
              </mat-label>
              <input id="mass-armament-tube-serial" matInput readonly [value]="selectedTubeSerial()" />
            </mat-form-field>
          </div>

          <div class="col-span-2">
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
              <mat-label>
                {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.OBSERVATIONS_LABEL' | translate }}
              </mat-label>
              <textarea
                id="mass-armament-observations"
                matInput
                rows="2"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.OBSERVATIONS_PLACEHOLDER' | translate"
                [formField]="massForm.observations"
              ></textarea>
            </mat-form-field>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="!flex gap-2 !justify-center !pb-4">
      <button mat-flat-button color="primary" [disabled]="!canApply()" (click)="apply()">
        {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_APPLY_BTN' | translate }}
      </button>
      <button mat-stroked-button (click)="cancel()">
        {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_CANCEL_BTN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmamentIntroductionMassConfigDialog {
  readonly #dialogRef =
    inject<MatDialogRef<ArmamentIntroductionMassConfigDialog, ArmamentIntroductionMassConfigDialogResult>>(
      MatDialogRef,
    );
  readonly data = inject<ArmamentIntroductionMassConfigDialogData>(MAT_DIALOG_DATA);

  // ── Select form ──────────────────────────────────────────────────────────
  readonly formModel = signal<MassConfigForm>({
    series: [],
    arma: this.data.current.arma,
    tubo: this.data.current.tubo,
    observations: this.data.current.observations,
  });

  readonly massForm = form(this.formModel);
  readonly selectedWeaponSerial = computed(
    () => this.#selectedItem(this.data.weaponItems, this.formModel().arma)?.serialNumber ?? '',
  );
  readonly selectedTubeSerial = computed(
    () => this.#selectedItem(this.data.tubeItems, this.formModel().tubo)?.serialNumber ?? '',
  );
  readonly canApply = computed(() => {
    const { series, arma, tubo } = this.formModel();
    return series.length > 0 && this.#numericId(arma) !== null && this.#numericId(tubo) !== null;
  });

  apply(): void {
    const formValue = this.formModel();
    const weaponId = this.#numericId(formValue.arma);
    const tubeId = this.#numericId(formValue.tubo);
    if (!formValue.series.length || weaponId === null || tubeId === null) return;

    this.#dialogRef.close({
      assignedSeriesIds: formValue.series,
      weaponId,
      tubeId,
      observations: formValue.observations,
    });
  }

  cancel(): void {
    this.#dialogRef.close(undefined);
  }

  #selectedItem(items: ArmamentEquipmentItem[], selectedId: string | null): ArmamentEquipmentItem | undefined {
    return items.find((item) => String(item.id) === selectedId);
  }

  #numericId(value: string | null): number | null {
    if (!value) return null;
    const id = Number(value);
    return Number.isInteger(id) ? id : null;
  }
}

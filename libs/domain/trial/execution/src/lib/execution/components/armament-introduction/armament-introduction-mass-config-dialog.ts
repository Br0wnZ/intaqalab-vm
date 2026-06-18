import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import type {
  CalibryEquipmentOption,
  CalibryTubeOption,
  CalibryTubeSerialOption,
  CalibryWeaponOption,
  CalibryWeaponSerialOption,
} from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { IntaIconComponent } from "@intaqalab/ui";

export interface ArmamentIntroductionMassConfigDialogData {
  serieOptions: { value: string; label: string }[];
  armaOptions: CalibryWeaponOption[];
  serieArmaOptions: CalibryWeaponSerialOption[];
  tuboOptions: CalibryTubeOption[];
  serieTuboOptions: CalibryTubeSerialOption[];
  equipoAtacadoOptions: CalibryEquipmentOption[];
  equipoRetrocesoOptions: CalibryEquipmentOption[];
  current: {
    arma: string | null;
    serieArma: string | null;
    tubo: string | null;
    serieTubo: string | null;
    equipoAtacado: string | null;
    equipoRetroceso: string | null;
  };
}

export interface ArmamentIntroductionMassConfigDialogResult {
  action: 'apply' | 'cancel';
  series?: string[];
  arma?: string | null;
  serieArma?: string | null;
  tubo?: string | null;
  serieTubo?: string | null;
  equipoAtacado?: string | null;
  equipoRetroceso?: string | null;
}

interface MassConfigForm {
  series: string[];
  arma: string | null;
  serieArma: string | null;
  tubo: string | null;
  serieTubo: string | null;
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
    MatSelectModule,
    TranslateModule,
    IntaIconComponent
],
  template: `
    <!-- Header -->
    <h2 mat-dialog-title>
      <ui-inta-icon name="edit" size="xxl" />
      {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_TITLE' | translate }}
    </h2>

    <!-- Content -->
    <mat-dialog-content intaReadonlyContent>
      <!-- Series (full-width multi-select) -->
      <mat-label class="block text-sm font-medium text-gray-700 mb-2">
        {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_SERIES_LABEL' | translate }}
      </mat-label>
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full mb-2">
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
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <!-- Arma -->  
        <div>        
          <mat-label class="block text-sm font-medium text-gray-700 mb-2">{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_LABEL' | translate }}</mat-label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
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
          <mat-label class="block text-sm font-medium text-gray-700 mb-2">{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_ARMA_LABEL' | translate }}</mat-label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_ARMA_PLACEHOLDER' | translate"
              [formField]="massForm.serieArma"
            >
              @for (opt of data.serieArmaOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Tubo -->
        <div>
          <mat-label class="block text-sm font-medium text-gray-700 mb-2">{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_LABEL' | translate }}</mat-label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
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
          <mat-label class="block text-sm font-medium text-gray-700 mb-2">{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_TUBO_LABEL' | translate }}</mat-label>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_TUBO_PLACEHOLDER' | translate"
              [formField]="massForm.serieTubo"
            >
              @for (opt of data.serieTuboOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
     </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="!flex gap-2 !justify-center !pb-4">
      <button mat-flat-button color="primary" (click)="apply()">
        {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_APPLY_BTN' | translate }}
      </button>
      <button mat-stroked-button [mat-dialog-close]="{ action: 'cancel' }">
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
    arma: null,
    serieArma: null,
    tubo: null,
    serieTubo: null,
  });

  readonly massForm = form(this.formModel);

  apply(): void {
    const formValue = this.formModel();
    this.#dialogRef.close({
      action: 'apply',
      series: formValue.series,
      arma: formValue.arma,
      serieArma: formValue.serieArma,
      tubo: formValue.tubo,
      serieTubo: formValue.serieTubo,
    });
  }
}

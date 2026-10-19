import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormField, disabled, form, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent, SaveButton } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { type CalibryTubeOption, type CalibryWeaponOption, ExecutionStore } from '../../../+state/execution.store';
import {
  type ArmamentBulkConfigurationRequest,
  type ArmamentEquipmentItem,
  ExecutionService,
} from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

export interface ArmamentIntroductionMassConfigDialogData {
  fireTrialId: string;
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
    SaveButton,
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
                class="!resize-none"
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
      <ui-save-button
        label="TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_APPLY_BTN"
        [isSaving]="isSaving()"
        [isDisabled]="!canApply()"
        (save)="apply()"
      />
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
  readonly #executionService = inject(ExecutionService);
  readonly #store = inject(ExecutionStore, { optional: true });

  readonly #pendingResult = signal<ArmamentIntroductionMassConfigDialogResult | null>(null);
  readonly #requestStarted = signal(false);
  readonly isSaving = computed(
    () =>
      this.#store?.isApplyingArmamentBulkConfiguration() === true ||
      this.#executionService.applyArmamentBulkConfigurationResource.isLoading(),
  );

  // ── Modelo del formulario ────────────────────────────────────────────────
  readonly formModel = signal<MassConfigForm>({
    series: [],
    arma: this.data.current.arma,
    tubo: this.data.current.tubo,
    observations: this.data.current.observations,
  });

  // ── Schema declarativo: validación centralizada ─────────────────────────
  readonly massForm = form(this.formModel, (path) => {
    validate(path.series, ({ value }) =>
      value().length > 0
        ? null
        : { kind: 'required', message: 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_SERIES_REQUIRED' },
    );

    required(path.arma, { message: 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_REQUIRED' });
    required(path.tubo, { message: 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_REQUIRED' });

    disabled(path, () => this.isSaving());
  });

  readonly canApply = computed(() => this.massForm().valid());

  readonly selectedWeaponSerial = computed(
    () => this.#selectedItem(this.data.weaponItems, this.formModel().arma)?.serialNumber ?? '',
  );
  readonly selectedTubeSerial = computed(
    () => this.#selectedItem(this.data.tubeItems, this.formModel().tubo)?.serialNumber ?? '',
  );

  constructor() {
    effect(() => {
      const result = this.#pendingResult();
      const isLoading = this.#executionService.applyArmamentBulkConfigurationResource.isLoading();
      const status = this.#executionService.applyArmamentBulkConfigurationResource.status();
      if (result && isLoading) {
        this.#requestStarted.set(true);
        return;
      }
      if (result && this.#requestStarted() && status === 'resolved') {
        this.#dialogRef.close(result);
        return;
      }
      if (result && this.#requestStarted() && status === 'error') {
        this.#requestStarted.set(false);
        this.#pendingResult.set(null);
      }
    });
  }

  async apply(): Promise<void> {
    const formValue = this.formModel();
    const weaponId = this.#numericId(formValue.arma, this.data.weaponItems);
    const tubeId = this.#numericId(formValue.tubo, this.data.tubeItems);
    if (!formValue.series.length || weaponId === null || tubeId === null) return;

    const fireTrialId = this.data.fireTrialId || this.#store?.fireTrialId?.();
    if (!fireTrialId) return;

    const payload: ArmamentBulkConfigurationRequest = {
      assignedSeriesIds: formValue.series,
      weaponId,
      tubeId,
      observations: formValue.observations || null,
    };

    const result: ArmamentIntroductionMassConfigDialogResult = {
      assignedSeriesIds: formValue.series,
      weaponId,
      tubeId,
      observations: formValue.observations,
    };
    this.#pendingResult.set(result);
    if (this.#store) {
      this.#store.applyArmamentBulkConfiguration(fireTrialId, payload);
    } else {
      this.#executionService.applyArmamentBulkConfiguration(fireTrialId, payload);
    }
  }

  cancel(): void {
    this.#dialogRef.close(undefined);
  }

  #selectedItem(items: ArmamentEquipmentItem[], selectedId: string | null): ArmamentEquipmentItem | undefined {
    return (
      items.find((item) => String(item.denominationId) === selectedId) ??
      items.find((item) => String(item.id) === selectedId)
    );
  }

  #numericId(value: string | null, items?: ArmamentEquipmentItem[]): number | null {
    if (!value) return null;
    if (items) {
      const item = this.#selectedItem(items, value);
      if (item) {
        const itemIdNum = Number(item.id);
        if (Number.isInteger(itemIdNum)) return itemIdNum;
      }
    }
    const directNum = Number(value);
    if (Number.isInteger(directNum)) return directNum;
    return null;
  }
}

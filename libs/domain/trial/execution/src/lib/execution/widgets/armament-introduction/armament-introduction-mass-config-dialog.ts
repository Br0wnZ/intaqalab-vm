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
  type PlanningArmamentResponse,
} from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { getBulkCompatibleArmamentSeries } from './armament-bulk-compatibility';

export interface ArmamentIntroductionMassConfigDialogData {
  fireTrialId: string;
  serieOptions: { value: string; label: string }[];
  armaOptions: CalibryWeaponOption[];
  weaponItems: ArmamentEquipmentItem[];
  tuboOptions: CalibryTubeOption[];
  tubeItems: ArmamentEquipmentItem[];
  planningArmament: PlanningArmamentResponse | null;
  current: {
    arma: string | null;
    tubo: string | null;
    observations: string;
  };
}

export interface ArmamentIntroductionMassConfigDialogResult {
  assignedSeriesIds: string[];
  weaponId: number;
  tubeId: number | null;
  observations: string;
}

interface MassConfigForm {
  series: string[];
  arma: string | null;
  weaponItemId: string | null;
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
            (selectionChange)="onSeriesSelected($event.value)"
          >
            @for (opt of data.serieOptions; track opt.value) {
              <mat-option [value]="opt.value" [disabled]="disabledSeries().has(opt.value)">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- 2-column grid for fields -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-6 mt-2">
          <!-- Arma -->
          <div>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_LABEL' | translate }}</mat-label>
              <mat-select
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_PLACEHOLDER' | translate"
                [formField]="massForm.arma"
                (selectionChange)="onWeaponSelected($event.value)"
              >
                @for (opt of weaponOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Nº serie del arma -->
          <div>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
              <mat-label>
                {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.N_SERIE_ARMA_LABEL' | translate }}
              </mat-label>
              <mat-select
                id="mass-armament-weapon-serial"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.N_SERIE_ARMA_LABEL' | translate"
                [formField]="massForm.weaponItemId"
              >
                @for (opt of weaponSerialOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
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
                @for (opt of tubeOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Nº serie del tubo -->
          <div>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
              <mat-label>
                {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.N_SERIE_TUBO_LABEL' | translate }}
              </mat-label>
              <mat-select
                id="mass-armament-tube-serial"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.N_SERIE_TUBO_LABEL' | translate"
                [formField]="massForm.tubo"
              >
                @for (opt of tubeSerialOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
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
    arma: this.#selectedItem(this.data.weaponItems, this.data.current.arma)?.denominationId.toString() ?? null,
    weaponItemId: this.#selectedItem(this.data.weaponItems, this.data.current.arma)?.id.toString() ?? null,
    tubo: this.#selectedItem(this.data.tubeItems, this.data.current.tubo)?.id.toString() ?? null,
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

    disabled(path.tubo, () => this.tubeDisabled());
    disabled(path, () => this.isSaving());
  });

  readonly #compatibleSeries = getBulkCompatibleArmamentSeries(this.data.planningArmament);
  readonly disabledSeries = computed(() => {
    const selected = this.formModel().series;
    const selectedGroup = this.#compatibleSeries.get(selected[0] ?? '');
    return new Set(
      this.data.serieOptions
        .filter(({ value }) => {
          const group = this.#compatibleSeries.get(value);
          return group === undefined || (selected.length > 0 && group !== selectedGroup && !selected.includes(value));
        })
        .map(({ value }) => value),
    );
  });
  readonly canApply = computed(() => {
    const series = this.formModel().series;
    const group = this.#compatibleSeries.get(series[0] ?? '');
    return (
      this.massForm().valid() && group !== undefined && series.every((id) => this.#compatibleSeries.get(id) === group)
    );
  });
  readonly tubeDisabled = computed(() =>
    this.#selectedArmamentPlans().some((armament) => armament.tubeExternalId === null),
  );

  readonly weaponOptions = computed(() => {
    const selectedSeries = this.formModel().series;
    if (!selectedSeries.length) return [];

    const plannedDenominationIds = new Set(
      this.#selectedArmamentPlans().flatMap((armament) => {
        const equipmentItem = this.#plannedEquipmentItems(
          this.data.weaponItems,
          armament.weaponExternalId,
          armament.weaponName,
        )[0];
        if (equipmentItem) return [String(equipmentItem.denominationId)];

        const option = this.data.armaOptions.find(
          (candidate) =>
            candidate.value === String(armament.weaponExternalId ?? '') ||
            candidate.label.trim().toLowerCase() === armament.weaponName?.trim().toLowerCase(),
        );
        return option ? [option.value] : [];
      }),
    );
    return this.data.armaOptions.filter((option) => plannedDenominationIds.has(option.value));
  });

  readonly tubeOptions = computed(() => {
    const selectedSeries = this.formModel().series;
    if (!selectedSeries.length || this.tubeDisabled()) return [];

    const plannedTubeIds = new Set(
      this.#selectedArmamentPlans().flatMap((armament) => {
        const equipmentItems = this.#plannedEquipmentItems(
          this.data.tubeItems,
          armament.tubeExternalId,
          armament.tubeName,
        );
        if (equipmentItems.length) return equipmentItems.map((item) => String(item.id));

        const option = this.data.tuboOptions.find(
          (candidate) =>
            candidate.value === String(armament.tubeExternalId ?? '') ||
            candidate.label.trim().toLowerCase() === armament.tubeName?.trim().toLowerCase(),
        );
        return option ? [option.value] : [];
      }),
    );
    return this.data.tuboOptions.filter((option) => plannedTubeIds.has(option.value));
  });

  readonly weaponSerialOptions = computed(() => {
    const selected = this.#selectedItem(this.data.weaponItems, this.formModel().arma);
    const allowedDenominationIds = new Set(this.weaponOptions().map((option) => option.value));
    if (!selected || !allowedDenominationIds.has(String(selected.denominationId))) return [];
    return this.data.weaponItems
      .filter((item) => item.denominationId === selected.denominationId && item.serialNumber)
      .map((item) => ({ value: String(item.id), label: item.serialNumber }));
  });
  readonly selectedWeaponSerial = computed(() => {
    if (!this.formModel().series.length) return '';
    const selected = this.#selectedItem(this.data.weaponItems, this.formModel().arma);
    const selectedSerialItem = this.#selectedItem(this.data.weaponItems, this.formModel().weaponItemId);
    return (
      (selectedSerialItem?.denominationId === selected?.denominationId ? selectedSerialItem : selected)?.serialNumber ??
      ''
    );
  });
  readonly tubeSerialOptions = computed(() => {
    if (this.tubeDisabled()) return [];
    const selected = this.#selectedItem(this.data.tubeItems, this.formModel().tubo);
    if (!selected) return [];
    const allowedTubeIds = new Set(this.tubeOptions().map((option) => option.value));
    return this.data.tubeItems
      .filter(
        (item) =>
          item.denominationId === selected.denominationId && item.serialNumber && allowedTubeIds.has(String(item.id)),
      )
      .map((item) => ({ value: String(item.id), label: item.serialNumber }));
  });
  readonly selectedTubeSerial = computed(() =>
    this.formModel().series.length && !this.tubeDisabled()
      ? (this.#selectedItem(this.data.tubeItems, this.formModel().tubo)?.serialNumber ?? '')
      : '',
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
    if (!this.canApply() || this.isSaving()) return;
    const formValue = this.formModel();
    const weaponId = this.#numericId(formValue.weaponItemId ?? formValue.arma, this.data.weaponItems);
    const tubeId = this.tubeDisabled() ? null : this.#numericId(formValue.tubo, this.data.tubeItems);
    if (!formValue.series.length || weaponId === null || (!this.tubeDisabled() && tubeId === null)) return;

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

  onSeriesSelected(seriesIds: string[]): void {
    this.formModel.update((formValue) => ({ ...formValue, series: seriesIds }));
    const formValue = this.formModel();
    const selectedWeapon = this.#selectedItem(this.data.weaponItems, formValue.arma);
    const weaponOptionValue = selectedWeapon ? String(selectedWeapon.denominationId) : formValue.arma;
    const validWeapon = this.weaponOptions().some((option) => option.value === weaponOptionValue);
    const validTube = !this.tubeDisabled() && this.tubeOptions().some((option) => option.value === formValue.tubo);

    if (!validWeapon || !validTube) {
      this.formModel.update((current) => ({
        ...current,
        arma: validWeapon ? current.arma : null,
        weaponItemId: validWeapon ? current.weaponItemId : null,
        tubo: validTube ? current.tubo : null,
      }));
    }
  }

  onWeaponSelected(weaponId: string | null): void {
    const selected = this.#selectedItem(this.data.weaponItems, weaponId);
    const serialItem = selected
      ? this.data.weaponItems.find((item) => item.denominationId === selected.denominationId && item.serialNumber)
      : undefined;
    this.formModel.update((formValue) => ({
      ...formValue,
      arma: selected ? String(selected.denominationId) : weaponId,
      weaponItemId: serialItem ? String(serialItem.id) : selected ? String(selected.id) : null,
    }));
  }

  #selectedArmamentPlans() {
    const selectedSeries = new Set(this.formModel().series);
    return (this.data.planningArmament?.series ?? [])
      .filter((series) => selectedSeries.has(series.seriesId))
      .flatMap((series) => series.shots.flatMap((shot) => (shot.armament ? [shot.armament] : [])));
  }

  #plannedEquipmentItems(
    items: ArmamentEquipmentItem[],
    externalId: number | undefined,
    plannedName?: string,
  ): ArmamentEquipmentItem[] {
    const byExternalId = externalId === undefined ? undefined : this.#selectedItem(items, String(externalId));
    const normalizedName = plannedName?.trim().toLowerCase();
    const matchedItem =
      byExternalId ??
      (normalizedName
        ? items.find((item) => item.denominationName.trim().toLowerCase() === normalizedName)
        : undefined);
    return matchedItem ? items.filter((item) => item.denominationId === matchedItem.denominationId) : [];
  }

  #selectedItem(items: ArmamentEquipmentItem[], selectedId: string | null): ArmamentEquipmentItem | undefined {
    return (
      items.find((item) => String(item.id) === selectedId) ??
      items.find((item) => String(item.denominationId) === selectedId)
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

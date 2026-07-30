import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormField, disabled, form, max, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent, MatSelectClearable } from '@intaqalab/ui';
import { safeResourceValue } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { MassiveConfigData, MassiveShotsConfigurationDialogData } from '../../utils-models/armament.model';
import { ArmamentService } from '../../services/armament-service';
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
              (valueChange)="onTypeChange($event)"
            >
              @for (option of typeOptions; track option.value) {
                <mat-option [value]="option.value">{{ option.label | translate }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Denominación arma — se carga según el Tipo seleccionado -->
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
              (valueChange)="onWeaponChange($event)"
            >
              @if (isLoadingWeapons()) {
                <mat-option disabled>{{ 'COMMONS.LOADING' | translate }}</mat-option>
              } @else {
                @for (option of weaponsOptions(); track option.value) {
                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                }
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Denominación tubo — SOLO si se ha seleccionado un arma y no es mortero; filtrado por familyId del arma -->
        @if (!isMortar()) {
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
                @if (isLoadingTubes()) {
                  <mat-option disabled>{{ 'COMMONS.LOADING' | translate }}</mat-option>
                } @else {
                  @for (option of tubesOptions(); track option.value) {
                    <mat-option [value]="option.value">{{ option.label }}</mat-option>
                  }
                }
              </mat-select>
            </mat-form-field>
          </div>
        }

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
            <input
              matInput
              id="vidaUtil"
              type="number"
              step="1"
              [formField]="configForm.vidaUtil"
              [placeholder]="'TRIAL_PLANNING.ARMAMENT.MASSIVE_SHOTS_DIALOG.LIFE_PLACEHOLDER' | translate"
            />
            <span matSuffix class="pr-2 text-sm text-gray-500">%</span>
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

  readonly #armamentService = inject(ArmamentService);

  readonly seriesOptions = computed<{ value: string; label: string }[]>(() => {
    if (this.data?.series && this.data.series.length > 0) {
      return this.data.series.map((s) => ({ value: s.id, label: s.name }));
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

  /** ID del arma seleccionada actualmente — controla si el select de tubo está habilitado */
  readonly selectedWeaponId = signal<string | null>(null);

  /** familyId del arma seleccionada — dispara la carga reactiva de tubos */
  readonly #selectedWeaponFamilyId = signal<number | null>(null);

  // ── Resources locales reactivos (independientes del store padre) ──────────

  /**
   * Denominaciones de arma: reactivo al tipo seleccionado.
   * GET /centers/{centerId}/equipment/denominations?itemType={tipo}
   * El interceptor center-interceptor inyecta automáticamente /centers/{centerId}/.
   */
  readonly #weaponDenominationsResource = this.#armamentService.weaponDenominationsResource;

  /**
   * Denominaciones de tubo: reactivo al familyId del arma seleccionada.
   * GET /centers/{centerId}/equipment/denominations?itemType=TUBE&familyId={familyId}
   */
  readonly #tubeDenominationsResource = this.#armamentService.tubeDenominationsResource;

  readonly isLoadingWeapons = computed(() => this.#weaponDenominationsResource.isLoading());
  readonly isLoadingTubes = computed(() => this.#tubeDenominationsResource.isLoading());

  readonly isMortar = computed(() => this.configModel().tipo?.toLowerCase() === SpecimenType.Mortar);

  readonly configForm = form(this.configModel, (path) => {
    required(path.tipo);
    required(path.denominacionArma);
    required(path.denominacionTubo, {
      when: ({ valueOf }) => valueOf(path.tipo)?.toLowerCase() !== SpecimenType.Mortar,
    });

    disabled(path.denominacionArma, ({ valueOf }) => !valueOf(path.tipo) || this.isLoadingWeapons());
    disabled(path.denominacionTubo, ({ valueOf }) => !valueOf(path.denominacionArma) || this.isLoadingTubes());
    min(path.vidaUtil, 0);
    max(path.vidaUtil, 100);
  });

  readonly weaponsOptions = computed<{ value: string; label: string }[]>(() => {
    const response = safeResourceValue(this.#weaponDenominationsResource);
    return (response?.items ?? []).map((w) => ({ value: w.id, label: w.name }));
  });

  readonly tubesOptions = computed<{ value: string; label: string }[]>(() => {
    const response = safeResourceValue(this.#tubeDenominationsResource);
    return (response?.items ?? []).map((t) => ({ value: t.id, label: t.name }));
  });

  readonly selectedChips = computed(() => {
    const selectedSeries = this.configModel().series ?? [];
    return this.seriesOptions().filter((opt) => selectedSeries.includes(opt.value));
  });

  constructor() {
    // Al cambiar el arma seleccionada, dispara la carga de tubos por familyId
    effect(() => {
      const familyId = this.#selectedWeaponFamilyId();
      if (familyId !== null) {
        this.#armamentService.loadTubeDenominations(familyId);
      } else {
        this.#armamentService.clearTubeDenominations();
      }
    });
  }

  /**
   * Manejador para el cambio de Tipo.
   * Dispara carga de denominaciones de arma filtradas por itemType.
   * Limpia arma y tubo seleccionados previamente.
   */
  onTypeChange(itemType: string | null | undefined): void {
    // Reset campos dependientes
    const current = this.configModel();
    this.configModel.set({ ...current, denominacionArma: '', denominacionTubo: '' });
    this.selectedWeaponId.set(null);
    this.#selectedWeaponFamilyId.set(null);

    if (itemType) {
      this.#armamentService.loadWeaponDenominations(itemType.toUpperCase());
    } else {
      this.#armamentService.clearWeaponDenominations();
    }
  }

  /**
   * Manejador para el cambio de Denominación Arma.
   * Extrae familyId del arma seleccionada y dispara la carga de tubos.
   */
  onWeaponChange(weaponId: string | null | undefined): void {
    // Reset tubo seleccionado
    const current = this.configModel();
    this.configModel.set({ ...current, denominacionTubo: '' });

    if (!weaponId) {
      this.selectedWeaponId.set(null);
      this.#selectedWeaponFamilyId.set(null);
      return;
    }

    this.selectedWeaponId.set(weaponId);

    // Buscar familyId en los items del resource de denominaciones de arma
    const response = safeResourceValue(this.#weaponDenominationsResource);
    const weapon = response?.items.find((w) => w.id === weaponId);
    this.#selectedWeaponFamilyId.set(weapon?.familyId ?? null);
  }

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

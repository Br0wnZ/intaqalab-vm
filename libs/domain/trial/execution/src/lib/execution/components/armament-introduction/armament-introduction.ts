import type { Signal } from '@angular/core';
import {
    ChangeDetectionStrategy,
    Component,
    ViewEncapsulation,
    computed,
    effect,
    inject,
    input,
    signal,
    untracked,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ExecutionStore } from '../../../+state/execution.store';
import {
    type ArmamentEquipmentItem,
    ExecutionService,
    type PlanningArmamentResponse,
} from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { ArmamentIntroductionMassConfigDialog } from './armament-introduction-mass-config-dialog';

interface ArmamentIntroductionSelectForm {
  serie: string | null;
  disparo: string | null;
  arma: string | null;
  serieArma: string | null;
  tubo: string | null;
  serieTubo: string | null;
  observations: string;
}

@Component({
  selector: 'inta-armament-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white px-4 py-2 flex flex-col gap-3 overflow-hidden">
      <!-- Header: Filtros -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center gap-1.5 flex-1 self-start">
            <ui-inta-icon name="settings" color="var(--inta-button)" />
            <h3 class="text-sm font-semibold text-gray-700 leading-tight truncat">
              {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TITLE' | translate }}
            </h3>
          </div>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.SERIE_PLACEHOLDER' | translate"
            [formField]="selectForm.serie"
            (selectionChange)="onSerieSelected($event.value)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectForm.disparo"
            (selectionChange)="onShotSelected($event.value)"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Aplicar configuración masiva -->
        <button mat-flat-button color="primary" type="button" (click)="openMassConfig()">
          {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_BTN' | translate }}
        </button>
      </div>

      <div intaReadonlyContent class="grid grid-cols-4 gap-3 min-h-0 content-start">
        <!-- Arma -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_PLACEHOLDER' | translate"
            [formField]="selectForm.arma"
          >
            @for (opt of armaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Nº serie del arma -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_ARMA_LABEL' | translate }}</mat-label>
          <input matInput id="armament-weapon-serial" readonly [value]="selectedWeaponSerial()" />
        </mat-form-field>

        <!-- Tubo -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_PLACEHOLDER' | translate"
            [formField]="selectForm.tubo"
          >
            @for (opt of tuboOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Nº serie del tubo -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.NÑ_SERIE_TUBO_LABEL' | translate }}</mat-label>
          <input matInput id="armament-tube-serial" readonly [value]="selectedTubeSerial()" />
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.INSTRUMENTED_LABEL' | translate }}</mat-label>
          <input
            matInput
            id="armament-instrumented"
            readonly
            [value]="instrumentedLabel() | translate"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.USEFUL_LIFE_LABEL' | translate }}</mat-label>
          <input matInput id="armament-useful-life" readonly [value]="usefulLifeLabel()" />
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="col-span-2 w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.OBSERVATIONS_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            id="armament-observations"
            rows="1"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.OBSERVATIONS_PLACEHOLDER' | translate"
            [formField]="selectForm.observations"
          ></textarea>
        </mat-form-field>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmamentIntroductionComponent extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #dialog = inject(MatDialog);
  readonly #executionService = inject(ExecutionService);
  readonly #weaponItems = signal<ArmamentEquipmentItem[]>([]);
  readonly #tubeItems = signal<ArmamentEquipmentItem[]>([]);
  readonly #planningArmament = signal<PlanningArmamentResponse | null>(null);
  readonly #lastActiveSelection = signal<string | null>(null);

  // ── Signals de datos del store ────────────────────────────────────────
  protected readonly serieOptions = computed(() => {
    const planningSeries = this.#store.planningSeries();
    if (!planningSeries?.length) return this.#store.armamentIntroduction().serieOptions;
    return planningSeries.map((serie, index) => ({
      value: serie.id,
      label: serie.name?.trim() || `Serie ${index + 1}`,
    }));
  });
  protected readonly disparoOptions = computed(() => {
    const selectedSerieId = this.formModel().serie;
    const planningShots = this.#store.planningSeries()?.find((serie) => serie.id === selectedSerieId)?.shots;
    if (planningShots?.length) {
      return planningShots.map((shot, index) => ({
        value: shot.id,
        label: `Disparo #${String(shot.globalNumber ?? index + 1).padStart(2, '0')}`,
      }));
    }
    return this.#store.armamentIntroduction().disparoOptions;
  });
  protected readonly armaOptions = computed(() => this.#toEquipmentOptions(this.#weaponItems(), 'armaOptions'));
  protected readonly tuboOptions = computed(() => this.#toEquipmentOptions(this.#tubeItems(), 'tuboOptions'));

  // ── Signal Form ──────────────────────────────────────────────────────────
  protected readonly formModel = signal<ArmamentIntroductionSelectForm>({
    serie: this.#store.armamentIntroduction().serie,
    disparo: this.#store.armamentIntroduction().disparo,
    arma: this.#store.armamentIntroduction().arma,
    serieArma: this.#store.armamentIntroduction().serieArma,
    tubo: this.#store.armamentIntroduction().tubo,
    serieTubo: this.#store.armamentIntroduction().serieTubo,
    observations: this.#store.armamentIntroduction().observations,
  });

  protected readonly selectForm = form(this.formModel);
  readonly #savedSnapshot = signal(this.#editableValues());
  protected readonly isDirty = computed(() => {
    const current = this.#editableValues();
    const saved = this.#savedSnapshot();
    return (
      current.arma !== saved.arma ||
      current.tubo !== saved.tubo ||
      current.observations !== saved.observations
    );
  });
  protected readonly selectedWeaponSerial = computed(() => this.#findSelectedItem(this.#weaponItems(), this.formModel().arma)?.serialNumber ?? '');
  protected readonly selectedTubeSerial = computed(() => this.#findSelectedItem(this.#tubeItems(), this.formModel().tubo)?.serialNumber ?? '');
  protected readonly selectedPlanningArmament = computed(() => {
    const { serie, disparo } = this.formModel();
    return this.#planningArmament()
      ?.series.find((item) => item.seriesId === serie)
      ?.shots.find((item) => item.shotId === disparo)?.armament;
  });
  protected readonly instrumentedLabel = computed(() =>
    this.selectedPlanningArmament()?.isInstrumented
      ? 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.INSTRUMENTED_YES'
      : 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.INSTRUMENTED_NO',
  );
  protected readonly usefulLifeLabel = computed(() => {
    const percentage = this.selectedPlanningArmament()?.tubeLifePercentage;
    return percentage === undefined ? '' : `${percentage}%`;
  });

  // ── FormWidget implementation ────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  resetForm(): void {
    const stored = this.#store.armamentIntroduction();
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      arma: stored.arma,
      serieArma: stored.serieArma,
      tubo: stored.tubo,
      serieTubo: stored.serieTubo,
      observations: stored.observations,
    });
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const formValue = this.formModel();
    const serie = this.#store.activeSerieId() ?? formValue.serie;
    const disparo = this.#store.activeShotId() ?? formValue.disparo;
    const { arma, tubo, observations } = formValue;
    const serieArma = this.selectedWeaponSerial() || null;
    const serieTubo = this.selectedTubeSerial() || null;
    this.#store.updateArmamentIntroduction({
      serie,
      disparo,
      arma,
      serieArma,
      tubo,
      serieTubo,
      observations,
    });

    const fireTrialId = this.#store.fireTrialId();
    const weaponId = this.#numericEquipmentId(arma);
    const tubeId = this.#numericEquipmentId(tubo);
    if (fireTrialId && serie && disparo && weaponId !== null && tubeId !== null) {
      this.#executionService.setShotArmament(fireTrialId, serie, disparo, {
        weaponId,
        tubeId,
        observations: observations || null,
      });
      this.#syncSnapshot();
    }
  }

  // ── Methods ──────────────────────────────────────────────────────────────

  /** Establece el disparo actual seleccionado por el JLT */
  setCurrentShot(): void {
    const serie = this.#store.activeSerieId();
    const disparo = this.#store.activeShotId();
    if (!serie || !disparo) return;
    this.#setSelection(serie, disparo);
  }

  onSerieSelected(serie: string | null): void {
    this.formModel.update((formValue) => ({ ...formValue, serie, disparo: null }));
  }

  onShotSelected(disparo: string | null): void {
    this.formModel.update((formValue) => ({ ...formValue, disparo }));
    void this.loadSelectedShotData();
  }

  constructor() {
    super();

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const activeSerieId = this.#store.activeSerieId();
      const activeShotId = this.#store.activeShotId();
      if (!fireTrialId || !activeSerieId || !activeShotId) return;

      const selectionKey = `${activeSerieId}|${activeShotId}`;
      if (this.#lastActiveSelection() === selectionKey) return;

      untracked(() => {
        this.#lastActiveSelection.set(selectionKey);
        this.#setSelection(activeSerieId, activeShotId);
      });
    });

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      if (!fireTrialId) return;

      untracked(() => {
        void Promise.all([
          this.#executionService.loadArmamentEquipmentItems('WEAPON'),
          this.#executionService.loadArmamentEquipmentItems('TUBE'),
          this.#executionService.fetchPlanningArmament(fireTrialId),
        ]).then(([weapons, tubes, planningArmament]) => {
          this.#weaponItems.set(weapons);
          this.#tubeItems.set(tubes);
          this.#planningArmament.set(planningArmament);
          this.#applyPlanningSelection();
          void this.loadSelectedShotData();
        });
      });
    });
  }

  #setSelection(serie: string, disparo: string): void {
    this.formModel.update((formValue) => ({ ...formValue, serie, disparo }));
    this.#store.updateArmamentIntroduction({ serie, disparo });
    this.#applyPlanningSelection();
    void this.loadSelectedShotData();
  }

  protected async loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.formModel();
    if (!fireTrialId || !serie || !disparo) return;

    try {
      const response = await this.#executionService.fetchShotArmament(fireTrialId, serie, disparo);
      const armament = response.armamentData;
      this.formModel.update((formValue) => ({
        ...formValue,
        arma: armament?.weapon?.id ? String(armament.weapon.id) : formValue.arma,
        tubo: armament?.tube?.id ? String(armament.tube.id) : formValue.tubo,
        observations: armament?.observations ?? this.selectedPlanningArmament()?.observations ?? '',
      }));
      this.#syncSnapshot();
    } catch {
      this.formModel.update((formValue) => ({
        ...formValue,
        observations: this.selectedPlanningArmament()?.observations ?? formValue.observations,
      }));
      this.#syncSnapshot();
    }
  }

  #applyPlanningSelection(): void {
    const armament = this.selectedPlanningArmament();
    if (!armament) return;
    this.formModel.update((formValue) => ({
      ...formValue,
      arma: this.#resolveEquipmentItemId(this.#weaponItems(), armament.weaponExternalId) ?? formValue.arma,
      tubo: this.#resolveEquipmentItemId(this.#tubeItems(), armament.tubeExternalId) ?? formValue.tubo,
      observations: armament.observations ?? formValue.observations,
    }));
    this.#syncSnapshot();
  }

  #findSelectedItem(items: ArmamentEquipmentItem[], denominationId: string | null): ArmamentEquipmentItem | undefined {
    return items.find((item) => String(item.id) === denominationId);
  }

  #toEquipmentOptions(items: ArmamentEquipmentItem[], fallbackKey: 'armaOptions' | 'tuboOptions') {
    if (!items.length) return this.#store.armamentIntroduction()[fallbackKey];
    return items.map((item) => ({ value: String(item.id), label: item.denominationName }));
  }

  #resolveEquipmentItemId(items: ArmamentEquipmentItem[], externalId: number | undefined): string | null {
    if (externalId === undefined) return null;
    const item = items.find((candidate) => Number(candidate.id) === externalId || candidate.denominationId === externalId);
    return item ? String(item.id) : null;
  }

  #numericEquipmentId(value: string | null): number | null {
    if (!value) return null;
    const id = Number(value);
    return Number.isInteger(id) ? id : null;
  }

  #editableValues(): Pick<ArmamentIntroductionSelectForm, 'arma' | 'tubo' | 'observations'> {
    const { arma, tubo, observations } = this.formModel();
    return { arma, tubo, observations };
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set(this.#editableValues());
  }

  /** Abre el modal de configuración masiva */
  async openMassConfig(): Promise<void> {
    const state = this.#store.armamentIntroduction();
    const result = await firstValueFrom(
      this.#dialog
        .open(ArmamentIntroductionMassConfigDialog, {
        data: {
          serieOptions: state.serieOptions,
          armaOptions: this.armaOptions(),
          weaponItems: this.#weaponItems(),
          tuboOptions: this.tuboOptions(),
          tubeItems: this.#tubeItems(),
          current: {
            arma: state.arma,
            tubo: state.tubo,
            observations: state.observations,
          },
        },
        })
        .afterClosed(),
    );

    if (result) {
      this.#store.updateArmamentIntroduction({
        serie: result.assignedSeriesIds[0] ?? state.serie,
        disparo: state.disparo,
        arma: String(result.weaponId),
        serieArma: this.#findSelectedItem(this.#weaponItems(), String(result.weaponId))?.serialNumber ?? null,
        tubo: String(result.tubeId),
        serieTubo: this.#findSelectedItem(this.#tubeItems(), String(result.tubeId))?.serialNumber ?? null,
        observations: result.observations,
      });
      this.resetForm();
    }
  }
}

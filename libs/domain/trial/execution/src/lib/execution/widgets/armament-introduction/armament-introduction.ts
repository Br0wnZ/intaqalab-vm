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
  viewChild,
} from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getArmamentByShotId, injectTrialShots } from '@intaqalab/data-access-planning';
import { IntaIconComponent } from '@intaqalab/ui';
import { createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { ExecutionStore } from '../../../+state/execution.store';
import {
  type ArmamentEquipmentItem,
  ExecutionService,
  type PlanningArmamentResponse,
} from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { ArmamentEquipmentDenomination } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import {
  buildDisparoOptions,
  mapPlanningSeriesToOptions,
  resolveInitialShotSelection,
} from '../utils/selection-options';
import { getBulkCompatibleArmamentSeries } from './armament-bulk-compatibility';
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
    FormTouchDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
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
            <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
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
        <span
          class="inline-flex"
          [matTooltip]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_DISABLED_TOOLTIP' | translate"
          [matTooltipDisabled]="canMassConfigure()"
          [attr.tabindex]="canMassConfigure() ? null : 0"
        >
          <button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="!canMassConfigure()"
            (click)="openMassConfig()"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.MASS_CONFIG_BTN' | translate }}
          </button>
        </span>
      </div>

      <div
        intaReadonlyContent
        intaFormTouch
        class="grid grid-cols-4 gap-3 min-h-0 content-start"
        #touch="intaFormTouch"
      >
        <!-- Arma -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.ARMA_PLACEHOLDER' | translate"
            [value]="plannedArmaOptions()[0]?.value ?? null"
          >
            @for (opt of plannedArmaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Nº serie del arma -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.N_SERIE_ARMA_LABEL' | translate }}</mat-label>
          <mat-select
            id="armament-weapon-serial"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.N_SERIE_ARMA_LABEL' | translate"
            [formField]="selectForm.arma"
          >
            @for (opt of weaponSerialOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Tubo -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TUBO_PLACEHOLDER' | translate"
            [value]="plannedTuboOptions()[0]?.value ?? null"
            [disabled]="tubeDisabled()"
          >
            @for (opt of plannedTuboOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Nº serie del tubo -->
        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.N_SERIE_TUBO_LABEL' | translate }}</mat-label>
          <mat-select
            id="armament-tube-serial"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.N_SERIE_TUBO_LABEL' | translate"
            [formField]="selectForm.tubo"
          >
            @for (opt of tubeSerialOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.INSTRUMENTED_LABEL' | translate }}</mat-label>
          <input id="armament-instrumented" matInput readonly [value]="instrumentedLabel() | translate" />
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.USEFUL_LIFE_LABEL' | translate }}</mat-label>
          <input id="armament-useful-life" matInput readonly [value]="usefulLifeLabel()" />
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="col-span-2 w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.OBSERVATIONS_LABEL' | translate }}</mat-label>
          <textarea
            id="armament-observations"
            matInput
            rows="1"
            class="!resize-none"
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
  readonly #trialShots = injectTrialShots();
  readonly #weaponItems = signal<ArmamentEquipmentItem[]>([]);
  readonly #weaponDenominations = signal<ArmamentEquipmentDenomination[]>([]);
  readonly #mortarDenominations = signal<ArmamentEquipmentDenomination[]>([]);
  readonly #tubeDenominations = signal<ArmamentEquipmentDenomination[]>([]);
  readonly #tubeDenominationRequestKey = signal<string | null>(null);
  readonly #tubeItems = signal<ArmamentEquipmentItem[]>([]);
  readonly #planningArmament = signal<PlanningArmamentResponse | null>(null);
  protected readonly canMassConfigure = computed(() => {
    const compatible = getBulkCompatibleArmamentSeries(this.#planningArmament());
    return this.serieOptions().some((option) => compatible.has(option.value));
  });
  readonly #lastActiveSelection = signal<string | null>(null);
  readonly #selectorKey = computed(() => shotSelectionKey(this.formModel().serie, this.formModel().disparo));
  readonly #selectionGuard = createSelectionGuard(() => this.#selectorKey());

  // ── Signals de datos del store ────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#trialShots.series() ?? this.#store.planningSeries()),
  );
  protected readonly disparoOptions = computed(() =>
    buildDisparoOptions({
      selectedSerie: this.formModel().serie,
      executionProgress: this.#store.executionProgress(),
      planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
    }),
  );
  protected readonly armaOptions = computed(() =>
    this.#weaponDenominations().map((denomination) => ({ value: String(denomination.id), label: denomination.name })),
  );
  protected readonly tuboOptions = computed(() => this.#toEquipmentOptions(this.#tubeItems(), 'tuboOptions'));
  protected readonly plannedArmaOptions = computed(() => {
    const armament = this.selectedPlanningArmament();
    const options = this.#plannedDenominationOptions(
      this.#weaponDenominationsForSelection(),
      this.#weaponItems(),
      armament?.weaponExternalId,
      armament?.weaponName,
    );
    const selected = this.#findSelectedItem(this.#weaponItems(), this.formModel().arma);
    const planned = this.#findSelectedItem(this.#weaponItems(), options[0]?.value ?? null);
    return selected && planned && selected.denominationId === planned.denominationId
      ? options.map((option) => ({ ...option, value: String(selected.id) }))
      : options;
  });
  protected readonly plannedTuboOptions = computed(() => {
    if (this.tubeDisabled()) return [];
    const armament = this.selectedPlanningArmament();
    const options = this.#plannedDenominationOptions(
      this.#tubeDenominations(),
      this.#tubeItems(),
      armament?.tubeExternalId,
      armament?.tubeName,
    );
    const selected = this.#findSelectedItem(this.#tubeItems(), this.formModel().tubo);
    const planned = this.#findSelectedItem(this.#tubeItems(), options[0]?.value ?? null);
    return selected && planned && selected.denominationId === planned.denominationId
      ? options.map((option) => ({ ...option, value: String(selected.id) }))
      : options;
  });

  // ── Signal Form ──────────────────────────────────────────────────────────
  protected readonly formModel = signal<ArmamentIntroductionSelectForm>(this.#formFromStore());

  protected readonly selectForm = form(this.formModel, (path) => {
    disabled(path.tubo, () => this.tubeDisabled());
  });
  readonly #dirtyTracker = createDirtyTracker(() => this.#editableValues());
  protected readonly isDirty = this.#dirtyTracker.isDirty;
  protected readonly weaponSerialOptions = computed(() => {
    const selected = this.#findSelectedItem(this.#weaponItems(), this.formModel().arma);
    if (!selected) return [];
    return this.#weaponItems()
      .filter((item) => item.denominationId === selected.denominationId && item.serialNumber)
      .map((item) => ({ value: String(item.id), label: item.serialNumber }));
  });
  protected readonly selectedTubeSerial = computed(() =>
    this.tubeDisabled() ? '' : (this.#findSelectedItem(this.#tubeItems(), this.formModel().tubo)?.serialNumber ?? ''),
  );
  protected readonly tubeSerialOptions = computed(() => {
    if (this.tubeDisabled()) return [];
    const selected = this.#findSelectedItem(this.#tubeItems(), this.formModel().tubo);
    if (!selected) return [];
    return this.#tubeItems()
      .filter((item) => item.denominationId === selected.denominationId && item.serialNumber)
      .map((item) => ({ value: String(item.id), label: item.serialNumber }));
  });
  protected readonly selectedPlanningArmament = computed(() => {
    const { serie, disparo } = this.formModel();
    if (!serie || !disparo) return undefined;
    return getArmamentByShotId(this.#planningArmament(), serie, disparo)?.armament;
  });
  protected readonly tubeDisabled = computed(() => {
    const armament = this.selectedPlanningArmament();
    const itemType = (armament?.itemType ?? armament?.weaponType)?.toUpperCase();
    return itemType === 'MORTAR' || armament?.tubeExternalId === null;
  });
  readonly #weaponDenominationsForSelection = computed(() => {
    const armament = this.selectedPlanningArmament();
    const itemType = (armament?.itemType ?? armament?.weaponType ?? 'WEAPON').toUpperCase();
    return itemType === 'MORTAR' ? this.#mortarDenominations() : this.#weaponDenominations();
  });
  readonly #selectedWeaponDenomination = computed(() => {
    const armament = this.selectedPlanningArmament();
    return this.#findPlannedDenomination(
      this.#weaponDenominationsForSelection(),
      armament?.weaponExternalId,
      armament?.weaponName,
    );
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
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.touchRef()?.touched() ?? false,
    valid: this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  resetForm(): void {
    this.formModel.set(this.#formFromStore());
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const formValue = this.formModel();
    const serie = this.#store.activeSerieId() ?? formValue.serie;
    const disparo = this.#store.activeShotId() ?? formValue.disparo;
    const { arma, observations } = formValue;
    const tubo = this.tubeDisabled() ? null : formValue.tubo;
    const selectedWeaponItem = this.#findSelectedItem(this.#weaponItems(), arma);
    const serieArma = selectedWeaponItem?.serialNumber ?? null;
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
    const weaponId = selectedWeaponItem ? this.#numericEquipmentId(String(selectedWeaponItem.id)) : null;
    const tubeId = this.#numericEquipmentId(tubo);
    if (fireTrialId && serie && disparo && weaponId !== null && (this.tubeDisabled() || tubeId !== null)) {
      try {
        await this.#executionService.setShotArmament(fireTrialId, serie, disparo, {
          weaponId,
          tubeId,
          observations: observations || null,
        });
        this.#syncSnapshot();
      } catch (error) {
        console.error('Failed to save shot armament', error);
        throw error;
      }
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
    this.formModel.update((formValue) => ({
      ...formValue,
      serie,
      disparo: null,
      arma: null,
      tubo: null,
      observations: '',
    }));
    this.#tubeDenominations.set([]);
    this.#tubeDenominationRequestKey.set(this.#selectorKey());
    const nextShot = this.disparoOptions()[0]?.value ?? null;
    this.#store.updateArmamentIntroduction({ serie, disparo: nextShot });
    this.onShotSelected(nextShot);
  }

  onShotSelected(disparo: string | null): void {
    this.formModel.update((formValue) => ({ ...formValue, disparo }));
    this.#applyPlanningSelection();
    void this.#loadSelectedTubeDenominations();
    void this.loadSelectedShotData();
  }
  constructor() {
    super();

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const selection = resolveInitialShotSelection({
        seriesOptions: this.serieOptions(),
        activeSerieId: this.#store.activeSerieId(),
        activeShotId: this.#store.activeShotId(),
        getShotOptions: (serieId) =>
          buildDisparoOptions({
            selectedSerie: serieId,
            executionProgress: this.#store.executionProgress(),
            planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
          }),
      });
      const { serie: activeSerieId, disparo: activeShotId } = selection;
      if (!fireTrialId || !activeSerieId || !activeShotId) return;

      const selectionKey = `${activeSerieId}|${activeShotId}`;
      if (this.#lastActiveSelection() === selectionKey) return;

      untracked(async () => {
        this.#lastActiveSelection.set(selectionKey);
        this.#setSelection(activeSerieId, activeShotId);
      });
    });

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      if (!fireTrialId) return;

      untracked(() => {
        void this.#loadInitialData(fireTrialId);
      });
    });
  }

  async #loadInitialData(fireTrialId: string): Promise<void> {
    const weapons = await this.#executionService.loadArmamentEquipmentItems('WEAPON');
    const [tubes, planningArmament, weaponDenominations, mortarDenominations] = await Promise.all([
      this.#executionService.loadArmamentEquipmentItems('TUBE'),
      this.#executionService.fetchPlanningArmament(fireTrialId),
      this.#executionService.loadArmamentWeaponDenominations(),
      this.#executionService.loadArmamentDenominations('MORTAR'),
    ]);
    const hasMortars = planningArmament.series?.some((serie) =>
      serie.shots?.some((shot) => (shot.armament?.itemType ?? shot.armament?.weaponType)?.toUpperCase() === 'MORTAR'),
    );
    const mortars = hasMortars ? await this.#executionService.loadArmamentEquipmentItems('MORTAR') : [];
    this.#weaponItems.set([...weapons, ...mortars]);
    this.#weaponDenominations.set(weaponDenominations);
    this.#mortarDenominations.set(mortarDenominations);
    this.#tubeItems.set(tubes);
    this.#planningArmament.set(planningArmament);
    this.#applyPlanningSelection();
    await this.#loadSelectedTubeDenominations();
    await this.loadSelectedShotData();
  }

  #formFromStore(): ArmamentIntroductionSelectForm {
    const stored = this.#store.armamentIntroduction();
    return {
      serie: stored.serie,
      disparo: stored.disparo,
      arma: stored.arma,
      serieArma: stored.serieArma,
      tubo: stored.tubo,
      serieTubo: stored.serieTubo,
      observations: stored.observations,
    };
  }

  #setSelection(serie: string, disparo: string): void {
    this.formModel.update((formValue) => ({ ...formValue, serie, disparo }));
    this.#store.updateArmamentIntroduction({ serie, disparo });
    this.#applyPlanningSelection();
    void this.#loadSelectedTubeDenominations();
    void this.loadSelectedShotData();
  }

  protected async loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.formModel();
    if (!fireTrialId || !serie || !disparo) return;

    const selectionKey = this.#selectorKey();
    const ticket = this.#selectionGuard.begin();

    try {
      const response = await this.#executionService.fetchShotArmament(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) return;
      const armament = response.armamentData;
      this.formModel.update((formValue) => ({
        ...formValue,
        arma: armament?.weapon?.id
          ? (this.#weaponItemId(String(armament.weapon.id)) ?? formValue.arma)
          : formValue.arma,
        tubo: this.tubeDisabled() ? null : armament?.tube?.id ? String(armament.tube.id) : formValue.tubo,
        observations: armament?.observations ?? this.selectedPlanningArmament()?.observations ?? '',
      }));
      this.#syncSnapshot();
    } catch {
      if (!ticket.isFresh(selectionKey)) return;
      this.formModel.update((formValue) => ({
        ...formValue,
        observations: this.selectedPlanningArmament()?.observations ?? formValue.observations,
      }));
      this.#syncSnapshot();
    }
  }

  #applyPlanningSelection(): void {
    const armament = this.selectedPlanningArmament();
    this.formModel.update((formValue) => ({
      ...formValue,
      arma: this.#resolveEquipmentItemId(this.#weaponItems(), armament?.weaponExternalId, armament?.weaponName),
      tubo: this.tubeDisabled()
        ? null
        : this.#resolveEquipmentItemId(this.#tubeItems(), armament?.tubeExternalId, armament?.tubeName),
      observations: armament?.observations ?? '',
    }));
    this.#syncSnapshot();
  }

  #findSelectedItem(
    items: ArmamentEquipmentItem[],
    idOrDenomination: string | null,
  ): ArmamentEquipmentItem | undefined {
    if (!idOrDenomination) return undefined;
    return (
      items.find((item) => String(item.id) === idOrDenomination) ??
      items.find((item) => String(item.denominationId) === idOrDenomination)
    );
  }

  #toEquipmentOptions(items: ArmamentEquipmentItem[], fallbackKey: 'tuboOptions') {
    if (!items.length) return this.#store.armamentIntroduction()[fallbackKey];
    return items.map((item) => ({ value: String(item.id), label: item.denominationName }));
  }

  #findEquipmentItemByExternalId(
    items: ArmamentEquipmentItem[],
    externalId: number | string | undefined,
    plannedName?: string,
  ): ArmamentEquipmentItem | undefined {
    const externalIdText = externalId === undefined ? undefined : String(externalId);
    const byId = externalIdText
      ? (items.find((candidate) => String(candidate.denominationId) === externalIdText) ??
        items.find((candidate) => String(candidate.id) === externalIdText))
      : undefined;
    if (byId) return byId;

    const normalizedName = plannedName?.trim().toLowerCase();
    return normalizedName
      ? items.find((candidate) => candidate.denominationName.trim().toLowerCase() === normalizedName)
      : undefined;
  }

  #findPlannedDenomination(
    denominations: ArmamentEquipmentDenomination[],
    externalId: number | string | undefined,
    plannedName?: string,
  ): ArmamentEquipmentDenomination | undefined {
    const externalIdText = externalId === undefined ? undefined : String(externalId);
    const byId = externalIdText
      ? denominations.find((denomination) => String(denomination.id) === externalIdText)
      : undefined;
    if (byId) return byId;

    const normalizedName = plannedName?.trim().toLowerCase();
    return normalizedName
      ? denominations.find((denomination) => denomination.name.trim().toLowerCase() === normalizedName)
      : undefined;
  }

  #plannedDenominationOptions(
    denominations: ArmamentEquipmentDenomination[],
    equipmentItems: ArmamentEquipmentItem[],
    externalId: number | string | undefined,
    plannedName?: string,
  ): { value: string; label: string }[] {
    if (externalId === undefined && !plannedName) return [];
    const denomination = this.#findPlannedDenomination(denominations, externalId, plannedName);
    const equipmentItem = this.#findEquipmentItemByExternalId(
      equipmentItems,
      denomination?.id ?? externalId,
      denomination?.name ?? plannedName,
    );
    const value = equipmentItem
      ? String(equipmentItem.id)
      : denomination
        ? String(denomination.id)
        : externalId === undefined
          ? ''
          : String(externalId);
    const label = denomination?.name ?? equipmentItem?.denominationName ?? plannedName ?? '';
    return value && label ? [{ value, label }] : [];
  }

  async #loadSelectedTubeDenominations(): Promise<void> {
    const selectionKey = this.#selectorKey();
    const familyId = this.#selectedWeaponDenomination()?.familyId;
    const requestKey = `${selectionKey}|${familyId ?? ''}`;
    this.#tubeDenominationRequestKey.set(requestKey);
    this.#tubeDenominations.set([]);
    if (familyId === undefined || this.tubeDisabled()) return;

    try {
      const denominations = await this.#executionService.loadArmamentDenominations('TUBE', familyId);
      if (this.#tubeDenominationRequestKey() !== requestKey) return;
      this.#tubeDenominations.set(denominations);
    } catch {
      if (this.#tubeDenominationRequestKey() === requestKey) this.#tubeDenominations.set([]);
    }
  }

  #resolveEquipmentItemId(
    items: ArmamentEquipmentItem[],
    externalId: number | string | undefined,
    plannedName?: string,
  ): string | null {
    const item = this.#findEquipmentItemByExternalId(items, externalId, plannedName);
    if (item) return String(item.id);
    return externalId === undefined ? null : String(externalId);
  }

  #weaponItemId(itemId: string): string | null {
    const item = this.#weaponItems().find((candidate) => String(candidate.id) === itemId);
    if (!item) return null;

    const armament = this.selectedPlanningArmament();
    const plannedDenominationId =
      this.#selectedWeaponDenomination()?.id ??
      this.#findEquipmentItemByExternalId(this.#weaponItems(), armament?.weaponExternalId, armament?.weaponName)
        ?.denominationId;
    if (plannedDenominationId !== undefined && String(item.denominationId) !== String(plannedDenominationId)) {
      return null;
    }

    return String(item.id);
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
    this.#dirtyTracker.syncSnapshot();
  }

  /** Abre el modal de configuración masiva */
  async openMassConfig(): Promise<void> {
    if (!this.canMassConfigure()) return;
    const state = this.#store.armamentIntroduction();
    const result = await firstValueFrom(
      this.#dialog
        .open(ArmamentIntroductionMassConfigDialog, {
          data: {
            fireTrialId: this.#store.fireTrialId() ?? '',
            serieOptions: this.serieOptions(),
            armaOptions: this.armaOptions(),
            weaponItems: this.#weaponItems(),
            tuboOptions: this.tuboOptions(),
            tubeItems: this.#tubeItems(),
            planningArmament: this.#planningArmament(),
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
      const selectedWeapon = this.#findSelectedItem(this.#weaponItems(), String(result.weaponId));
      const selectedTube =
        result.tubeId === null ? undefined : this.#findSelectedItem(this.#tubeItems(), String(result.tubeId));
      this.#store.updateArmamentIntroduction({
        serie: result.assignedSeriesIds[0] ?? state.serie,
        disparo: state.disparo,
        arma: selectedWeapon ? String(selectedWeapon.denominationId) : String(result.weaponId),
        serieArma: selectedWeapon?.serialNumber ?? null,
        tubo: result.tubeId === null ? null : selectedTube ? String(selectedTube.id) : String(result.tubeId),
        serieTubo: selectedTube?.serialNumber ?? null,
        observations: result.observations,
      });
      this.resetForm();
    }
  }
}

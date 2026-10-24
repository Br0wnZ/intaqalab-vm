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
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectTrialShots } from '@intaqalab/data-access-planning';
import { IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective, NoNegativeValuesDirective, createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { EquipmentTypeEnum } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type {
  ShotManometerPressures,
  ShotManometerPressuresResponse,
} from '../../models/shot-manometer-pressures.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import {
  buildDisparoOptions,
  mapSelectedShotStatus,
  mapSelectedShotStatusClass,
  mapSelectedShotStatusLabel,
  resolveInitialShotSelection,
} from '../utils/selection-options';
import { injectManometerEquipments } from './inject-manometer-equipments';
import type { InputFieldValue } from './manometer-introduction.mapper';
import {
  buildManometerEquipmentValue,
  buildShotManometerPressureData,
  buildShotManometerPressuresRequest,
  extractManometerPressuresData,
  mapManometerEquipmentValueToSelection,
  mapManometerStateToEquipmentValue,
  mapPlanningSeriesToOptions,
  mapRemoteToManometerState,
  numToField,
  parseNum,
} from './manometer-introduction.mapper';

const MANOMETER_EQUIPMENT_CATEGORIES = [
  EquipmentTypeEnum.PRESSURE_GAUGE,
  EquipmentTypeEnum.CRUSHER,
  EquipmentTypeEnum.PROBE,
] as const;

export type { InputFieldValue };

export interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

export interface DataFormModel {
  manometro: string | null;
  crusher: string | null;
  micrometroPalpador: string | null;
}

@Component({
  selector: 'inta-manometer-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    FormTouchDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    NoNegativeValuesDirective,
    LocaleDecimalInputDirective,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-2 overflow-auto">
      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.SERIE_PLACEHOLDER' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.SERIE_PLACEHOLDER' | translate"
            [formField]="selectorForm.serie"
            (selectionChange)="onSerieSelected($event.value)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-30">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.DISPARO_PLACEHOLDER' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectorForm.disparo"
            (selectionChange)="onDisparoSelected($event.value)"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Body: flex container (data grid + observaciones) ──────────────── -->
      <div intaReadonlyContent intaFormTouch class="flex-1 flex-wrap flex gap-2 min-h-0" #touch="intaFormTouch">
        <!-- Data grid: two explicit rows inside a flex column -->
        <div class="flex-1 flex justify-evenly flex-col gap-4">
          <!-- Row 1: Manómetro | Crusher | Micrómetro | Presión (cols 1-4; 5-6 empty) -->
          <div class="grid grid-cols-2 lg:grid-cols-6 gap-2">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full col-span-2 lg:col-span-3">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.EQUIPMENT_LABEL' | translate }}</mat-label>
              <mat-select
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.EQUIPO_PLACEHOLDER' | translate"
                [value]="selectedEquipmentValue()"
                (selectionChange)="onEquipmentSelectionChanged($event.value)"
              >
                @for (opt of equipmentOptions(); track opt.value) {
                  <mat-option [value]="opt.value">
                    {{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.MANOMETRO_LABEL' | translate }}:
                    {{ opt.manometroLabel }} /
                    {{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.CRUSHER_LABEL' | translate }}:
                    {{ opt.crusherLabel }} /
                    {{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.MICROMETRO_LABEL' | translate }}:
                    {{ opt.micrometroPalpadorLabel }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Presión (read-only output) -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.PRESION_LABEL' | translate }}</mat-label>
              <input matInput readonly class="tabular-nums italic text-slate-400" [value]="presionDisplay()" />
              <span matSuffix class="pr-4 text-sm text-gray-700">{{ presionUnit() }}</span>
            </mat-form-field>

            <!-- Cols 5-6 intentionally empty -->
          </div>

          <!-- Row 2: H1 | H2 | H3 | H4 | H5 | Altura media -->
          <div class="grid grid-cols-2 lg:grid-cols-6 gap-2">
            <!-- H1 -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H1_LABEL' | translate }}</mat-label>
              <input
                matInput
                libNoNegativeValues
                libLocalDecimal
                inputmode="decimal"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H_PLACEHOLDER' | translate"
                [value]="h1Field()?.value ?? ''"
                (input)="onHeightInput('h1', $event)"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h1Field()?.unit ?? 'μm'"
                (selectionChange)="onHeightUnitChanged('h1', $event.value)"
              >
                @for (opt of mumOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- H2 -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H2_LABEL' | translate }}</mat-label>
              <input
                matInput
                libNoNegativeValues
                libLocalDecimal
                inputmode="decimal"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H_PLACEHOLDER' | translate"
                [value]="h2Field()?.value ?? ''"
                (input)="onHeightInput('h2', $event)"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h2Field()?.unit ?? 'μm'"
                (selectionChange)="onHeightUnitChanged('h2', $event.value)"
              >
                @for (opt of mumOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- H3 -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H3_LABEL' | translate }}</mat-label>
              <input
                matInput
                libNoNegativeValues
                libLocalDecimal
                inputmode="decimal"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H_PLACEHOLDER' | translate"
                [value]="h3Field()?.value ?? ''"
                (input)="onHeightInput('h3', $event)"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h3Field()?.unit ?? 'μm'"
                (selectionChange)="onHeightUnitChanged('h3', $event.value)"
              >
                @for (opt of mumOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- H4 -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H4_LABEL' | translate }}</mat-label>
              <input
                matInput
                libNoNegativeValues
                libLocalDecimal
                inputmode="decimal"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H_PLACEHOLDER' | translate"
                [value]="h4Field()?.value ?? ''"
                (input)="onHeightInput('h4', $event)"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h4Field()?.unit ?? 'μm'"
                (selectionChange)="onHeightUnitChanged('h4', $event.value)"
              >
                @for (opt of mumOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- H5 -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H5_LABEL' | translate }}</mat-label>
              <input
                matInput
                libNoNegativeValues
                libLocalDecimal
                inputmode="decimal"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.H_PLACEHOLDER' | translate"
                [value]="h5Field()?.value ?? ''"
                (input)="onHeightInput('h5', $event)"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h5Field()?.unit ?? 'μm'"
                (selectionChange)="onHeightUnitChanged('h5', $event.value)"
              >
                @for (opt of mumOptions; track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Altura media (read-only computed) -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>
                {{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.ALTURA_MEDIA_LABEL' | translate }}
              </mat-label>
              <input matInput readonly class="tabular-nums italic text-slate-400" [value]="alturaMediaDisplay()" />
              <span matSuffix class="pr-4 text-sm text-gray-700">μm</span>
            </mat-form-field>
          </div>
        </div>

        <!-- Observaciones (fixed width, full height) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-70 my-6">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="4"
            class="!resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="onObservacionesInput($event)"
          ></textarea>
        </mat-form-field>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManometerIntroduction extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);
  readonly #trialShots = injectTrialShots();

  // ── Unit options ───────────────────────────────────────────────────────────
  protected readonly mumOptions = [
    { value: 'μm', label: 'μm' },
    { value: 'mm', label: 'mm' },
  ];

  // ── Carga remota y catálogo ────────────────────────────────────────────────
  readonly #selectionKey = computed(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  readonly #manometerEquipments = injectManometerEquipments();

  // ── Options from store & API ───────────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(
      this.#trialShots.series() ?? this.#store.planningSeries(),
      this.#store.manometerIntroduction().serieOptions,
    ),
  );

  protected readonly disparoOptions = computed(() =>
    buildDisparoOptions({
      selectedSerie: this.selectorFormModel().serie,
      executionProgress: this.#store.executionProgress(),
      planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
      storedOptions: this.#store.manometerIntroduction().disparoOptions,
    }),
  );

  protected readonly equipmentOptions = computed(() => {
    const { serie, disparo } = this.selectorFormModel();
    if (!serie || !disparo) return [];

    const itemsByCategory = this.#manometerEquipments.itemsByCategory();
    const assignedIdsByCategory = new Map<EquipmentTypeEnum, Set<string>>(
      MANOMETER_EQUIPMENT_CATEGORIES.map((category) => [category, new Set<string>()]),
    );

    for (const selection of this.#manometerEquipments.selections()) {
      if (
        !MANOMETER_EQUIPMENT_CATEGORIES.some((category) => category === selection.categoryId) ||
        !selection.seriesIds?.includes(serie) ||
        !selection.shotIds?.includes(disparo)
      ) {
        continue;
      }

      assignedIdsByCategory.get(selection.categoryId)?.add(String(selection.equipmentItemId));
    }

    const itemsForCategory = (category: EquipmentTypeEnum) => {
      const assignedIds = assignedIdsByCategory.get(category);
      return (itemsByCategory[category] ?? []).filter((item) => assignedIds?.has(item.id));
    };
    const manometros = itemsForCategory(EquipmentTypeEnum.PRESSURE_GAUGE);
    const crushers = itemsForCategory(EquipmentTypeEnum.CRUSHER);
    const micrometros = itemsForCategory(EquipmentTypeEnum.PROBE);

    return manometros.flatMap((manometro) =>
      crushers.flatMap((crusher) =>
        micrometros.map((micrometroPalpador) => ({
          value: buildManometerEquipmentValue({
            manometro: manometro.id,
            crusher: crusher.id,
            micrometroPalpador: micrometroPalpador.id,
          }),
          manometroLabel: manometro.label,
          crusherLabel: crusher.label,
          micrometroPalpadorLabel: micrometroPalpador.label,
        })),
      ),
    );
  });

  protected readonly selectedEquipmentValue = computed(() => {
    const value = mapManometerStateToEquipmentValue(this.dataFormModel());
    return this.equipmentOptions().some((option) => option.value === value) ? value : null;
  });

  // ── Read-only outputs ──────────────────────────────────────────────────────
  protected readonly presionUnit = computed(() => this.#store.manometerIntroduction().presionUnit);
  protected readonly presionDisplay = computed(() => {
    const p = this.#store.manometerIntroduction().presion;
    return p !== null ? String(p) : '—';
  });

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoDisparo = computed(() =>
    mapSelectedShotStatus(
      this.#store.executionProgress(),
      this.selectorFormModel().serie,
      this.selectorFormModel().disparo,
      this.#store.activeSerieId(),
      this.#store.activeShotId(),
      this.#store.manometerIntroduction().estadoDisparo,
    ),
  );

  protected readonly estadoLabel = computed(() => mapSelectedShotStatusLabel(this.estadoDisparo()));
  protected readonly estadoClass = computed(() => mapSelectedShotStatusClass(this.estadoDisparo()));

  // ── Form models ────────────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.manometerIntroduction().serie,
    disparo: this.#store.manometerIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  protected readonly dataFormModel = signal<DataFormModel>({
    manometro: this.#store.manometerIntroduction().manometro,
    crusher: this.#store.manometerIntroduction().crusher,
    micrometroPalpador: this.#store.manometerIntroduction().micrometroPalpador,
  });
  protected readonly dataForm = form(this.dataFormModel);

  // ── H1–H5 plain signals (InputFieldValue) ─────────────────────────────────
  protected readonly h1Field = signal<InputFieldValue>(
    numToField(this.#store.manometerIntroduction().h1, this.#store.manometerIntroduction().h1Unit),
  );
  protected readonly h2Field = signal<InputFieldValue>(
    numToField(this.#store.manometerIntroduction().h2, this.#store.manometerIntroduction().h2Unit),
  );
  protected readonly h3Field = signal<InputFieldValue>(
    numToField(this.#store.manometerIntroduction().h3, this.#store.manometerIntroduction().h3Unit),
  );
  protected readonly h4Field = signal<InputFieldValue>(
    numToField(this.#store.manometerIntroduction().h4, this.#store.manometerIntroduction().h4Unit),
  );
  protected readonly h5Field = signal<InputFieldValue>(
    numToField(this.#store.manometerIntroduction().h5, this.#store.manometerIntroduction().h5Unit),
  );

  protected readonly observacionesField = signal<string | null>(this.#store.manometerIntroduction().observaciones);

  // ── Altura media (computed from H1–H5) ────────────────────────────────────
  protected readonly alturaMedia = computed<number | null>(() => {
    const vals = [this.h1Field(), this.h2Field(), this.h3Field(), this.h4Field(), this.h5Field()]
      .map((f) => parseNum(f))
      .filter((v): v is number => v !== null && !isNaN(v));
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  protected readonly alturaMediaDisplay = computed(() => {
    const v = this.alturaMedia();
    return v !== null ? String(v) : '—';
  });

  // ── Snapshot for dirty tracking (selectores serie/disparo excluidos) ────────
  readonly #dirtyTracker = createDirtyTracker(() => ({
    manometro: this.dataFormModel().manometro,
    crusher: this.dataFormModel().crusher,
    micrometroPalpador: this.dataFormModel().micrometroPalpador,
    h1: this.h1Field(),
    h2: this.h2Field(),
    h3: this.h3Field(),
    h4: this.h4Field(),
    h5: this.h5Field(),
    observaciones: this.observacionesField(),
  }));

  protected readonly isDirty = this.#dirtyTracker.isDirty;

  // ── FormWidget implementation ──────────────────────────────────────────────
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.touchRef()?.touched() ?? false,
    valid: this.selectorForm().valid() && this.dataForm().valid(),
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();

    // Sincronizar y cargar el disparo activo cuando el store lo proporcione o cambie
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
            storedOptions: this.#store.manometerIntroduction().disparoOptions,
          }),
      });
      const { serie: activeSerieId, disparo: activeShotId } = selection;

      if (!fireTrialId || !activeSerieId || !activeShotId) {
        return;
      }

      const selectionKey = `${activeSerieId}|${activeShotId}`;
      if (this.#lastLoadedActiveSelection() === selectionKey) {
        return;
      }

      untracked(() => {
        this.#lastLoadedActiveSelection.set(selectionKey);
        this.#setSelection(activeSerieId, activeShotId);
      });
    });
  }

  onSerieSelected(serie: string | null): void {
    this.selectorFormModel.update((current) => ({ ...current, serie }));
    this.#setSelection(serie, this.disparoOptions()[0]?.value ?? null);
  }

  onDisparoSelected(disparo: string | null): void {
    const current = this.selectorFormModel();
    this.selectorFormModel.set({
      ...current,
      disparo,
    });

    this.#syncSelectionToStore(current.serie, disparo);
    void this.#loadSelectedShotData();
  }

  onEquipmentSelectionChanged(value: string): void {
    const selection = mapManometerEquipmentValueToSelection(value);
    if (!selection) return;

    const previousManometro = this.dataFormModel().manometro;
    if (previousManometro !== selection.manometro) {
      this.#syncCurrentDraftToStore(previousManometro);
      const selectedData = this.#store
        .manometerIntroduction()
        .manometerPressures.find((entry) => entry.pressureGaugeId === selection.manometro);
      this.#applyDataToForm(selectedData, selection.manometro);
    }

    this.dataFormModel.set(selection);
    this.#syncCurrentDraftToStore();
  }

  onHeightInput(field: 'h1' | 'h2' | 'h3' | 'h4' | 'h5', event: Event): void {
    const value = event.target instanceof HTMLInputElement ? event.target.value : '';
    this.#updateHeightField(field, { value, unit: this.#getHeightField(field)?.unit ?? 'μm' });
  }

  onHeightUnitChanged(field: 'h1' | 'h2' | 'h3' | 'h4' | 'h5', unit: string): void {
    this.#updateHeightField(field, { value: this.#getHeightField(field)?.value ?? '', unit });
  }

  onObservacionesInput(event: Event): void {
    const value = event.target instanceof HTMLTextAreaElement ? event.target.value : '';
    this.observacionesField.set(value || null);
    this.#syncCurrentDraftToStore();
  }

  setCurrentShot(): void {
    const serie = this.#store.activeSerieId() ?? this.selectorFormModel().serie;
    const disparo = this.#store.activeShotId() ?? this.selectorFormModel().disparo;

    this.#setSelection(serie, disparo);
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.selectorFormModel.set({
      serie,
      disparo,
    });

    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  resetForm(): void {
    const stored = this.#store.manometerIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.dataFormModel.set({
      manometro: stored.manometro,
      crusher: stored.crusher,
      micrometroPalpador: stored.micrometroPalpador,
    });
    this.h1Field.set(numToField(stored.h1, stored.h1Unit));
    this.h2Field.set(numToField(stored.h2, stored.h2Unit));
    this.h3Field.set(numToField(stored.h3, stored.h3Unit));
    this.h4Field.set(numToField(stored.h4, stored.h4Unit));
    this.h5Field.set(numToField(stored.h5, stored.h5Unit));
    this.observacionesField.set(stored.observaciones);
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    this.#syncCurrentDraftToStore();
    const { serie, disparo } = this.selectorFormModel();
    const fireTrialId = this.#store.fireTrialId();

    this.#store.updateManometerIntroduction({
      serie,
      disparo,
    });

    if (fireTrialId && serie && disparo) {
      const payload = buildShotManometerPressuresRequest(this.#store.manometerIntroduction().manometerPressures);

      try {
        await this.#executionService.updateShotManometerPressures(fireTrialId, serie, disparo, payload);
        this.#syncSnapshot();
      } catch (error) {
        console.error('Failed to save shot manometer pressures', error);
        throw error;
      }
    } else {
      this.#syncSnapshot();
    }
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.selectorFormModel();
    const selectionKey = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();

    if (!fireTrialId || !serie || !disparo) {
      return;
    }

    try {
      const response = await this.#executionService.fetchShotManometerPressures(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData({ manometerPressuresData: null });
    }
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.updateManometerIntroductionSelector({
      serie,
      disparo,
    });
  }

  #applyRemoteShotData(response: ShotManometerPressuresResponse): void {
    const data = extractManometerPressuresData(response);
    this.#store.setManometerPressures(data);

    const selectedGauge = this.dataFormModel().manometro;
    const selectedData = data.find((entry) => entry.pressureGaugeId === selectedGauge) ?? data[0];
    this.#applyDataToForm(selectedData, selectedData?.pressureGaugeId ?? selectedGauge);
    this.#syncSnapshot();
  }

  #applyDataToForm(data: ShotManometerPressures | undefined, manometro: string | null): void {
    const mapped = mapRemoteToManometerState({ manometerPressuresData: data ? [data] : [] }, manometro);
    this.#store.updateManometerIntroduction(mapped);
    this.dataFormModel.set({
      manometro,
      crusher: mapped.crusher,
      micrometroPalpador: mapped.micrometroPalpador,
    });
    this.h1Field.set(numToField(mapped.h1, mapped.h1Unit));
    this.h2Field.set(numToField(mapped.h2, mapped.h2Unit));
    this.h3Field.set(numToField(mapped.h3, mapped.h3Unit));
    this.h4Field.set(numToField(mapped.h4, mapped.h4Unit));
    this.h5Field.set(numToField(mapped.h5, mapped.h5Unit));
    this.observacionesField.set(mapped.observaciones);
  }

  #syncCurrentDraftToStore(manometro = this.dataFormModel().manometro): void {
    const { crusher, micrometroPalpador } = this.dataFormModel();
    const entry = buildShotManometerPressureData({
      manometro,
      crusher,
      micrometroPalpador,
      h1Field: this.h1Field(),
      h2Field: this.h2Field(),
      h3Field: this.h3Field(),
      h4Field: this.h4Field(),
      h5Field: this.h5Field(),
      observaciones: this.observacionesField(),
    });
    this.#store.upsertManometerPressure(entry);
    this.#store.updateManometerIntroduction(mapRemoteToManometerState({ manometerPressuresData: [entry] }, manometro));
  }

  #getHeightField(field: 'h1' | 'h2' | 'h3' | 'h4' | 'h5'): InputFieldValue {
    switch (field) {
      case 'h1':
        return this.h1Field();
      case 'h2':
        return this.h2Field();
      case 'h3':
        return this.h3Field();
      case 'h4':
        return this.h4Field();
      case 'h5':
        return this.h5Field();
    }
  }

  #updateHeightField(field: 'h1' | 'h2' | 'h3' | 'h4' | 'h5', value: InputFieldValue): void {
    switch (field) {
      case 'h1':
        this.h1Field.set(value);
        break;
      case 'h2':
        this.h2Field.set(value);
        break;
      case 'h3':
        this.h3Field.set(value);
        break;
      case 'h4':
        this.h4Field.set(value);
        break;
      case 'h5':
        this.h5Field.set(value);
        break;
    }
    this.#syncCurrentDraftToStore();
  }

  #syncSnapshot(): void {
    this.#dirtyTracker.syncSnapshot();
  }
}

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
import { IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective, NoNegativeValuesDirective, createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { EquipmentTypeEnum } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type { ShotManometerPressuresResponse } from '../../models/shot-manometer-pressures.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import type { InputFieldValue } from './manometer-introduction.mapper';
import {
  buildShotManometerPressuresRequest,
  mapPlanningSeriesToOptions,
  mapRemoteToManometerState,
  mapShotsToDisparoOptions,
  numToField,
  parseNum,
} from './manometer-introduction.mapper';

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
        <div class="flex-1 flex justify-end flex-col gap-4">
          <!-- Row 1: Manómetro | Crusher | Micrómetro | Presión (cols 1-4; 5-6 empty) -->
          <div class="grid grid-cols-2 lg:grid-cols-6 gap-2">
            <!-- Manómetro -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.MANOMETRO_LABEL' | translate }}</mat-label>
              <mat-select
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.EQUIPO_PLACEHOLDER' | translate"
                [formField]="dataForm.manometro"
              >
                @for (opt of manometroOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Crusher -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.CRUSHER_LABEL' | translate }}</mat-label>
              <mat-select
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.EQUIPO_PLACEHOLDER' | translate"
                [formField]="dataForm.crusher"
              >
                @for (opt of crusherOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Micrómetro palpador -->
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.MICROMETRO_LABEL' | translate }}</mat-label>
              <mat-select
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.EQUIPO_PLACEHOLDER' | translate"
                [formField]="dataForm.micrometroPalpador"
              >
                @for (opt of micrometroPalpadorOptions(); track opt.value) {
                  <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
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
                (input)="h1Field.set({ value: $any($event.target).value, unit: h1Field()?.unit ?? 'μm' })"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h1Field()?.unit ?? 'μm'"
                (selectionChange)="h1Field.set({ value: h1Field()?.value ?? '', unit: $event.value })"
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
                (input)="h2Field.set({ value: $any($event.target).value, unit: h2Field()?.unit ?? 'μm' })"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h2Field()?.unit ?? 'μm'"
                (selectionChange)="h2Field.set({ value: h2Field()?.value ?? '', unit: $event.value })"
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
                (input)="h3Field.set({ value: $any($event.target).value, unit: h3Field()?.unit ?? 'μm' })"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h3Field()?.unit ?? 'μm'"
                (selectionChange)="h3Field.set({ value: h3Field()?.value ?? '', unit: $event.value })"
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
                (input)="h4Field.set({ value: $any($event.target).value, unit: h4Field()?.unit ?? 'μm' })"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h4Field()?.unit ?? 'μm'"
                (selectionChange)="h4Field.set({ value: h4Field()?.value ?? '', unit: $event.value })"
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
                (input)="h5Field.set({ value: $any($event.target).value, unit: h5Field()?.unit ?? 'μm' })"
              />
              <mat-select
                matSuffix
                class="pr-4"
                [value]="h5Field()?.unit ?? 'μm'"
                (selectionChange)="h5Field.set({ value: h5Field()?.value ?? '', unit: $event.value })"
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
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-70 h-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="4"
            class="resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="observacionesField.set($any($event.target).value || null)"
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
  readonly #itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  // ── Options from store & API ───────────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#store.planningSeries(), this.#store.manometerIntroduction().serieOptions),
  );

  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    const progressShots = this.#store
      .executionProgress()
      ?.series.find((serie) => serie.seriesId === selectedSerie)?.shots;
    if (progressShots?.length) {
      return mapShotsToDisparoOptions(progressShots, this.#store.manometerIntroduction().disparoOptions);
    }
    const planningShots = this.#store.planningSeries()?.find((serie) => serie.id === selectedSerie)?.shots;
    if (planningShots?.length) {
      return mapShotsToDisparoOptions(planningShots, this.#store.manometerIntroduction().disparoOptions);
    }
    return this.#store.manometerIntroduction().disparoOptions;
  });

  protected readonly manometroOptions = computed(() => {
    const apiItems = this.#itemsByCategory()[EquipmentTypeEnum.PRESSURE_GAUGE];
    if (apiItems?.length) {
      return apiItems.map((item) => ({ value: item.id, label: item.label }));
    }
    return this.#store.manometerIntroduction().manometroOptions;
  });

  protected readonly crusherOptions = computed(() => {
    const apiItems = this.#itemsByCategory()[EquipmentTypeEnum.CRUSHER];
    if (apiItems?.length) {
      return apiItems.map((item) => ({ value: item.id, label: item.label }));
    }
    return this.#store.manometerIntroduction().crusherOptions;
  });

  protected readonly micrometroPalpadorOptions = computed(() => {
    const apiItems = this.#itemsByCategory()[EquipmentTypeEnum.PROBE];
    if (apiItems?.length) {
      return apiItems.map((item) => ({ value: item.id, label: item.label }));
    }
    return this.#store.manometerIntroduction().micrometroPalpadorOptions;
  });

  // ── Read-only outputs ──────────────────────────────────────────────────────
  protected readonly presionUnit = computed(() => this.#store.manometerIntroduction().presionUnit);
  protected readonly presionDisplay = computed(() => {
    const p = this.#store.manometerIntroduction().presion;
    return p !== null ? p.toFixed(2) : '—';
  });

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.manometerIntroduction().estadoDisparo) {
      case 'EN_CURSO':
        return 'En curso';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EJECUTADA':
        return 'Ejecutada';
      default:
        return '—';
    }
  });

  protected readonly estadoClass = computed(() => {
    switch (this.#store.manometerIntroduction().estadoDisparo) {
      case 'EN_CURSO':
        return 'bg-green-100 text-green-700';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-700';
      case 'EJECUTADA':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  });

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
    return v !== null ? v.toFixed(2) : '—';
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

    // Cargar catálogo de equipos de manómetros
    this.#executionService
      ?.loadEquipmentItemsByCategories?.([
        EquipmentTypeEnum.PRESSURE_GAUGE,
        EquipmentTypeEnum.CRUSHER,
        EquipmentTypeEnum.PROBE,
      ])
      ?.then((result) => this.#itemsByCategory.set(result));

    // Sincronizar y cargar el disparo activo cuando el store lo proporcione o cambie
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const activeSerieId = this.#store.activeSerieId() ?? this.serieOptions()[0]?.value ?? null;
      const activeShotId = this.#store.activeShotId() ?? this.disparoOptions()[0]?.value ?? null;

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
    const current = this.selectorFormModel();
    const disparo = this.#isShotInSerie(current.disparo, serie) ? current.disparo : null;

    this.selectorFormModel.set({
      serie,
      disparo,
    });

    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
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
    const { serie, disparo } = this.selectorFormModel();
    const { manometro, crusher, micrometroPalpador } = this.dataFormModel();
    const fireTrialId = this.#store.fireTrialId();

    this.#store.updateManometerIntroduction({
      serie,
      disparo,
      manometro,
      crusher,
      micrometroPalpador,
      h1: parseNum(this.h1Field()),
      h1Unit: this.h1Field()?.unit ?? 'μm',
      h2: parseNum(this.h2Field()),
      h2Unit: this.h2Field()?.unit ?? 'μm',
      h3: parseNum(this.h3Field()),
      h3Unit: this.h3Field()?.unit ?? 'μm',
      h4: parseNum(this.h4Field()),
      h4Unit: this.h4Field()?.unit ?? 'μm',
      h5: parseNum(this.h5Field()),
      h5Unit: this.h5Field()?.unit ?? 'μm',
      observaciones: this.observacionesField(),
    });

    if (fireTrialId && serie && disparo) {
      const payload = buildShotManometerPressuresRequest({
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

  #isShotInSerie(disparo: string | null, serie: string | null): boolean {
    if (!disparo || !serie) {
      return false;
    }

    return (
      this.#store
        .executionProgress()
        ?.series.some((s) => s.seriesId === serie && s.shots.some((shot) => shot.shotId === disparo)) ?? false
    );
  }

  #applyRemoteShotData(response: ShotManometerPressuresResponse): void {
    const mapped = mapRemoteToManometerState(response);
    this.#store.updateManometerIntroduction(mapped);
    this.dataFormModel.set({
      manometro: mapped.manometro,
      crusher: mapped.crusher,
      micrometroPalpador: mapped.micrometroPalpador,
    });
    this.h1Field.set(numToField(mapped.h1, mapped.h1Unit));
    this.h2Field.set(numToField(mapped.h2, mapped.h2Unit));
    this.h3Field.set(numToField(mapped.h3, mapped.h3Unit));
    this.h4Field.set(numToField(mapped.h4, mapped.h4Unit));
    this.h5Field.set(numToField(mapped.h5, mapped.h5Unit));
    this.observacionesField.set(mapped.observaciones);
    this.#syncSnapshot();
  }

  #syncSnapshot(): void {
    this.#dirtyTracker.syncSnapshot();
  }
}

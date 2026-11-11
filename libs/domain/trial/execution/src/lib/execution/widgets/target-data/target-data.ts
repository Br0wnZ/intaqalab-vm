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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PlanningTargetConditionsService, injectTrialShots } from '@intaqalab/data-access-planning';
import {
  AngleUnitEnum,
  DistanceUnitEnum,
  MEASURE_UNIT_LABELS,
  MeasureUnitEnum,
  SHOT_CONDITIONS_UNIT_OPTIONS,
} from '@intaqalab/models';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import {
  buildDisparoOptions,
  mapPlanningSeriesToOptions,
  resolveInitialShotSelection,
} from '../utils/selection-options';

type InputFieldValue = { value: string; unit: string } | null;

interface TargetDataFormModel {
  blanco: string | null;
  material: string | null;
  dimensiones: string | null;
}

@Component({
  selector: 'inta-target-data',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-2">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="file" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncat">
            {{ 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        @if (!sameForAllSeries()) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
            <mat-select
              id="target-data-series-selector"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.SERIE_PLACEHOLDER' | translate"
              [value]="serieModel()"
              (selectionChange)="onSerieSelected($event.value)"
            >
              @for (opt of serieOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <!-- Disparo -->
        @if (!sameForAllShots()) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-32">
            <mat-select
              id="target-data-shot-selector"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DISPARO_PLACEHOLDER' | translate"
              [value]="disparoModel()"
              (selectionChange)="onDisparoSelected($event.value)"
            >
              @for (opt of disparoOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <div class="flex-1"></div>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Fields ───────────────────────────────────────────────────────── -->
      <div class="flex-1 grid grid-cols-3 gap-8 mt-4 min-h-0 content-start">
        <!-- Row 1 -->

        <!-- Blanco -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.BLANCO_LABEL' | translate }}</mat-label>
          <input
            matInput
            disabled
            [value]="blancoLabel()"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.BLANCO_PLACEHOLDER' | translate"
          />
        </mat-form-field>

        <!-- Material -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.MATERIAL_LABEL' | translate }}</mat-label>
          <input
            matInput
            disabled
            [value]="materialLabel()"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.MATERIAL_PLACEHOLDER' | translate"
          />
        </mat-form-field>

        <!-- Dimensiones -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DIMENSIONES_LABEL' | translate }}</mat-label>
          <input
            matInput
            disabled
            [value]="dimensionesLabel()"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DIMENSIONES_PLACEHOLDER' | translate"
          />
        </mat-form-field>

        <!-- Row 2 -->

        <!-- Espesor -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.ESPESOR_LABEL' | translate"
          [opciones]="mmOptions"
          [value]="espesorField()"
          [disabled]="true"
        />

        <!-- Distancia -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DISTANCIA_LABEL' | translate"
          [opciones]="mOptions()"
          [value]="distanciaField()"
          [disabled]="true"
        />

        <!-- Inclinación -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.INCLINACION_LABEL' | translate"
          [opciones]="degOptions()"
          [value]="inclinacionField()"
          [disabled]="true"
        />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetDataWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #trialShots = injectTrialShots();
  readonly #targetConditions = inject(PlanningTargetConditionsService);
  #hasManualSelection = false;

  protected readonly mmOptions = [{ value: MeasureUnitEnum.MM, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.MM] }];
  protected readonly mOptions = computed(() => {
    const unit = this.distanciaField()?.unit ?? MeasureUnitEnum.M;
    return SHOT_CONDITIONS_UNIT_OPTIONS.distance.filter((option) => option.value === unit);
  });
  protected readonly degOptions = computed(() => {
    const unit = this.inclinacionField()?.unit ?? MeasureUnitEnum.DEGREES;
    return SHOT_CONDITIONS_UNIT_OPTIONS.targetInclination.filter((option) => option.value === unit);
  });

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#trialShots.series() ?? this.#store.planningSeries()),
  );
  protected readonly disparoOptions = computed(() =>
    buildDisparoOptions({
      selectedSerie: this.serieModel(),
      executionProgress: this.#store.executionProgress(),
      planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
    }),
  );
  protected readonly sameForAllSeries = computed(() => {
    const resource = this.#targetConditions.targetConditionsResource;
    return resource.hasValue() ? (resource.value()?.sameForAllSeries ?? false) : false;
  });
  protected readonly sameForAllShots = computed(() => {
    const resource = this.#targetConditions.targetConditionsResource;
    if (!resource.hasValue()) return false;
    const response = resource.value();
    if (!response) return false;
    if (response.sameForAllSeries) return true;
    const selectedSeries = response.series.find((item) => item.seriesId === this.serieModel());
    return selectedSeries?.sameForAllShots ?? false;
  });
  protected readonly blancoOptions = computed(() => this.#store.targetData().blancoOptions);
  protected readonly materialOptions = computed(() => this.#store.targetData().materialOptions);
  protected readonly dimensionesOptions = computed(() => this.#store.targetData().dimensionesOptions);
  protected readonly blancoLabel = computed(
    () => this.blancoOptions().find((item) => item.value === this.formModel().blanco)?.label ?? '',
  );
  protected readonly materialLabel = computed(
    () => this.materialOptions().find((item) => item.value === this.formModel().material)?.label ?? '',
  );
  protected readonly dimensionesLabel = computed(
    () => this.dimensionesOptions().find((item) => item.value === this.formModel().dimensiones)?.label ?? '',
  );

  // ── Serie / Disparo selection signals ────────────────────────────────────
  protected readonly serieModel = signal<string | null>(this.#store.targetData().serie);
  protected readonly disparoModel = signal<string | null>(this.#store.targetData().disparo);

  // ── Planning values, shown as read-only output fields ─────────────────────
  protected readonly formModel = signal<TargetDataFormModel>({
    blanco: this.#store.targetData().blanco,
    material: this.#store.targetData().material,
    dimensiones: this.#store.targetData().dimensiones,
  });
  // ── Field signals ──────────────────────────────────────────────────────────
  protected readonly espesorField = signal<InputFieldValue>(
    this.#numToField(this.#store.targetData().espesor, this.#store.targetData().espesorUnit),
  );
  protected readonly distanciaField = signal<InputFieldValue>(
    this.#numToField(this.#store.targetData().distancia, this.#store.targetData().distanciaUnit),
  );
  protected readonly inclinacionField = signal<InputFieldValue>(
    this.#numToField(this.#store.targetData().inclinacion, this.#store.targetData().inclinacionUnit),
  );

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: false,
    touched: false,
    valid: true,
    hasChanges: false,
  }));

  constructor() {
    super();
    effect(() => {
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
      if (this.#hasManualSelection || !selection.serie || !selection.disparo) return;
      untracked(() => {
        this.serieModel.set(selection.serie);
        this.disparoModel.set(selection.disparo);
      });
    });
    effect(() => {
      const targetConditionsResource = this.#targetConditions.targetConditionsResource;
      if (!targetConditionsResource.hasValue()) return;
      const response = targetConditionsResource.value();
      const serie = this.serieModel();
      const disparo = this.disparoModel();
      if (!response) return;
      const selectedSeries = response.sameForAllSeries
        ? response.series[0]
        : response.series.find((item) => item.seriesId === serie);
      const selectedShot =
        response.sameForAllSeries || selectedSeries?.sameForAllShots
          ? selectedSeries?.shots[0]
          : selectedSeries?.shots.find((item) => item.shotId === disparo);
      if (!selectedSeries || !selectedShot) return;
      const selectedSerieId = selectedSeries.seriesId;
      const selectedShotId = selectedShot.shotId;
      const targetData = selectedShot.targetConditionsData;
      const espesorField = this.#parseThickness(targetData.targetThicknessName);
      const blancoOptions = [{ value: targetData.targetTypeId, label: targetData.targetTypeLabel }];
      const materialOptions =
        targetData.targetMaterialId !== null && targetData.targetMaterialLabel !== null
          ? [{ value: targetData.targetMaterialId, label: targetData.targetMaterialLabel }]
          : [];
      const dimensionesOptions =
        targetData.targetDimensionsId !== null && targetData.targetDimensionsLabel !== null
          ? [{ value: targetData.targetDimensionsId, label: targetData.targetDimensionsLabel }]
          : [];
      const distanceUnit = targetData.distanceUnit ?? DistanceUnitEnum.M;
      const targetInclinationUnit = targetData.targetInclinationUnit ?? AngleUnitEnum.DEGREES;
      untracked(() => {
        this.serieModel.set(selectedSerieId);
        this.disparoModel.set(selectedShotId);
        this.formModel.set({
          blanco: targetData.targetTypeId,
          material: targetData.targetMaterialId,
          dimensiones: targetData.targetDimensionsId,
        });
        this.espesorField.set(espesorField);
        this.distanciaField.set(
          targetData.distance === null ? null : { value: String(targetData.distance), unit: distanceUnit },
        );
        this.inclinacionField.set(
          targetData.targetInclination === null
            ? null
            : { value: String(targetData.targetInclination), unit: targetInclinationUnit },
        );
        this.#store.updateTargetData({
          serie: selectedSerieId,
          disparo: selectedShotId,
          blanco: targetData.targetTypeId,
          material: targetData.targetMaterialId,
          dimensiones: targetData.targetDimensionsId,
          espesor: espesorField ? Number(espesorField.value) : null,
          espesorUnit: espesorField?.unit ?? MeasureUnitEnum.MM,
          distancia: targetData.distance,
          distanciaUnit: distanceUnit,
          inclinacion: targetData.targetInclination,
          inclinacionUnit: targetInclinationUnit,
          blancoOptions,
          materialOptions,
          dimensionesOptions,
          sameDataAcrossDisparos: selectedSeries.sameForAllShots,
          sameDataAcrossSeries: response.sameForAllSeries,
        });
      });
    });
  }

  onSerieSelected(serie: string | null): void {
    this.#hasManualSelection = true;
    this.serieModel.set(serie);
    this.disparoModel.set(this.disparoOptions()[0]?.value ?? null);
  }

  onDisparoSelected(disparo: string | null): void {
    this.#hasManualSelection = true;
    this.disparoModel.set(disparo);
  }

  resetForm(): void {
    const stored = this.#store.targetData();
    this.serieModel.set(stored.serie);
    this.disparoModel.set(stored.disparo);
    this.formModel.set({
      blanco: stored.blanco,
      material: stored.material,
      dimensiones: stored.dimensiones,
    });
    this.espesorField.set(this.#numToField(stored.espesor, stored.espesorUnit));
    this.distanciaField.set(this.#numToField(stored.distancia, stored.distanciaUnit));
    this.inclinacionField.set(this.#numToField(stored.inclinacion, stored.inclinacionUnit));
  }

  saveForm(): Promise<void> {
    return Promise.resolve();
  }

  #numToField(num: number | null, unit: string): InputFieldValue {
    if (num === null) return null;
    return { value: num.toString(), unit };
  }

  #parseThickness(name: string | null): InputFieldValue {
    if (!name) return null;
    const match = name.trim().match(/^([+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+))\s*(.*)$/);
    if (!match) return { value: name, unit: MeasureUnitEnum.MM };
    return { value: match[1]?.replace(',', '.') ?? '', unit: MeasureUnitEnum.MM };
  }
}

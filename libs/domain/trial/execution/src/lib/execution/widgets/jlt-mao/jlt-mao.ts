import type { Signal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectTrialShots } from '@intaqalab/data-access-planning';
import { AngleUnitEnum, MEASURE_UNIT_LABELS } from '@intaqalab/models';
import { InputSelect, InputSelectInput, IntaIconComponent, ValueTooltip } from '@intaqalab/ui';
import { LocaleDecimalInputDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import type { JltMaoState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type { ShotJltMaoResponse } from '../../models/shot-jlt-mao.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import {
  buildDisparoOptions,
  mapPlanningSeriesToOptions,
  mapSelectedShotStatus,
  mapSelectedShotStatusClass,
  mapSelectedShotStatusLabel,
  resolveInitialShotSelection,
} from '../utils/selection-options';
import { ShotEditButton } from '../utils/shot-edit-button';
import { injectShotFormLock } from '../utils/shot-form-lock';
import type { JltMaoMassConfigDialogResult } from './jlt-mao-mass-config-dialog';
import { JltMaoMassConfigDialog } from './jlt-mao-mass-config-dialog';
import type { JltMaoMassConfigFields } from './jlt-mao-mass-config.mapper';
import { mapJltMaoMassConfigToRequest } from './jlt-mao-mass-config.mapper';

type InputFieldValue = { value: number | string | null; unit: string } | null;

interface JltMaoSelectForm {
  serie: string | null;
  disparo: string | null;
  piqueta: string | null;
}

@Component({
  selector: 'inta-jlt-mao',
  imports: [
    FormField,
    ReadonlyContentDirective,
    ShotEditButton,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    InputSelectInput,
    IntaIconComponent,
    LocaleDecimalInputDirective,
    ValueTooltip,
  ],
  template: `
    <div class="h-full rounded-2xl border border-purple-200 bg-white p-2 flex flex-col gap-1.5 overflow-auto">
      <!-- Header -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center justify-center shrink-0">
            <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          </div>
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncat">
            {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.SERIE_PLACEHOLDER' | translate"
            [formField]="selectForm.serie"
            (selectionChange)="onSerieSelected($event.value)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-30">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectForm.disparo"
            (selectionChange)="onDisparoSelected($event.value)"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Aplicar configuración masiva -->
        <button mat-flat-button color="primary" type="button" (click)="openMassConfig()">
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.MASS_CONFIG_BTN' | translate }}
        </button>

        <!-- TTN (Tabla de tiro numérica) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-16">
          <input
            matInput
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TTN_PLACEHOLDER' | translate"
            [value]="ttnField() ?? ''"
            (input)="ttnField.set($any($event.target).value || null)"
          />
        </mat-form-field>

        <!-- OLT: planificada, manual o calculada desde piqueta -->
        <ui-input-select
          uiValueTooltip
          uiValueTooltipPosition="above"
          label="OLT"
          floatLabel="always"
          class="w-40 shrink-0"
          [opciones]="angleOptions"
          [placeholder]="'0,000'"
          [value]="oltDisplayField()"
          [readOnly]="oltReadOnly()"
          [unitDisabled]="false"
          [variant]="oltReadOnly() ? 'computed' : 'default'"
          [uiValueTooltipValue]="oltDisplayField()?.value"
          (valueChange)="onOltChanged($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <inta-shot-edit-button [lock]="shotLock" />

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- Fields: 5 columns × 2 rows -->
      <div
        class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-3 gap-y-8 min-h-0 content-start mt-4"
        [intaReadonlyContent]="shotLock.readOnly()"
      >
        <!-- ── Row 1 ─────────────────────────────────────────────────────── -->

        <!-- Piqueta (selector) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_PLACEHOLDER' | translate"
            [formField]="selectForm.piqueta"
            (selectionChange)="onPiquetaSelected($event.value)"
          >
            <mat-option [value]="null">—</mat-option>
            @for (opt of piquetaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Velocidad inicial teórica -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.VELOCIDAD_INICIAL_LABEL' | translate"
          [opciones]="msOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.VELOCIDAD_INICIAL_PLACEHOLDER' | translate"
          [value]="velocidadInicialField()"
          (valueChange)="velocidadInicialField.set($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <!-- Distancia prevista pique -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_PIQUE_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_PIQUE_PLACEHOLDER' | translate"
          [value]="distanciaPiqueDisplayField()"
          [readOnly]="distanciaPiqueReadOnly()"
          [variant]="distanciaPiqueReadOnly() ? 'computed' : 'default'"
          (valueChange)="distanciaPiqueField.set($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <!-- Deriva tabular -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DERIVA_TABULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DERIVA_TABULAR_PLACEHOLDER' | translate"
          [value]="derivaTabularField()"
          (valueChange)="derivaTabularField.set($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <!-- Tiempo vuelo teórico -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TIEMPO_VUELO_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TIEMPO_VUELO_PLACEHOLDER' | translate"
          [value]="tiempoVueloField()"
          (valueChange)="tiempoVueloField.set($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <!-- ── Row 2 ─────────────────────────────────────────────────────── -->

        <!-- Diferencia angular -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_PLACEHOLDER' | translate"
          [value]="angularDifferenceDisplayField()"
          [readOnly]="angularDifferenceReadOnly()"
          [variant]="angularDifferenceReadOnly() ? 'computed' : 'default'"
          (valueChange)="onAngularDifferenceChanged($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <!-- Ángulo de tiro -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ANGULO_TIRO_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ANGULO_TIRO_PLACEHOLDER' | translate"
          [value]="anguloTiroDisplayField()"
          [readOnly]="anguloTiroReadOnly()"
          [variant]="anguloTiroReadOnly() ? 'computed' : 'default'"
          (valueChange)="onAnguloTiroChanged($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <!-- Graduación espoleta -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_PLACEHOLDER' | translate"
          [value]="graduacionEspoletaDisplayField()"
          [readOnly]="graduacionEspoletaReadOnly()"
          [variant]="graduacionEspoletaReadOnly() ? 'computed' : 'default'"
          (valueChange)="onGraduacionEspoletaChanged($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <!-- Altura de funcionamiento -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_FUNCIONAMIENTO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_FUNCIONAMIENTO_PLACEHOLDER' | translate"
          [value]="alturaFuncionamientoDisplayField()"
          [readOnly]="alturaFuncionamientoReadOnly()"
          [variant]="alturaFuncionamientoReadOnly() ? 'computed' : 'default'"
          (valueChange)="alturaFuncionamientoField.set($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>

        <!-- Distancia de funcionamiento -->
        <ui-input-select
          floatLabel="always"
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_FUNCIONAMIENTO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_FUNCIONAMIENTO_PLACEHOLDER' | translate"
          [value]="distanciaFuncionamientoField()"
          (valueChange)="distanciaFuncionamientoField.set($event)"
        >
          <input inputSelectInput libLocalDecimal [decimals]="2" />
        </ui-input-select>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JltMao extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);
  readonly #dialog = inject(MatDialog);
  readonly #trialShots = injectTrialShots();

  readonly #selectionKey = computed(() => shotSelectionKey(this.formModel().serie, this.formModel().disparo));
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  // ── Unit options ──────────────────────────────────────────────────────────
  protected readonly metersOptions = [{ value: 'm', label: 'm' }];
  protected readonly ooOptions = [{ value: 'oo', label: 'ºº' }];
  protected readonly angleOptions = [AngleUnitEnum.DEGREES, AngleUnitEnum.MILS, AngleUnitEnum.RAD].map((unit) => ({
    value: unit,
    label: MEASURE_UNIT_LABELS[unit],
  }));
  protected readonly secondsOptions = [{ value: 's', label: 's' }];
  protected readonly msOptions = [{ value: 'm/s', label: 'm/s' }];

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly piquetaOptions = computed(() => this.#store.jltMao().piquetaOptions);
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

  protected readonly plannedOltValue = computed(() => {
    const conditions = this.#store.planningConditions();
    const { serie, disparo } = this.formModel();
    if (!serie || !disparo) return null;
    const shot = conditions?.series
      .find((item) => item.seriesId === serie)
      ?.shots.find((item) => item.shotId === disparo);
    return shot?.orientation ?? null;
  });

  protected readonly plannedRange = computed(() => {
    const conditions = this.#store.planningConditions();
    const { serie, disparo } = this.formModel();
    return (
      conditions?.series.find((item) => item.seriesId === serie)?.shots.find((item) => item.shotId === disparo)
        ?.range ?? null
    );
  });

  protected readonly plannedFunctioningHeight = computed(() => {
    const conditions = this.#store.planningConditions();
    const { serie, disparo } = this.formModel();
    return (
      conditions?.series.find((item) => item.seriesId === serie)?.shots.find((item) => item.shotId === disparo)
        ?.functioningHeight ?? null
    );
  });

  protected readonly plannedOlt = computed(() => {
    const conditions = this.#store.planningConditions();
    const { serie, disparo } = this.formModel();
    if (!serie || !disparo) return this.#store.jltMaoPlannedOlt();
    const shot = conditions?.series
      .find((item) => item.seriesId === serie)
      ?.shots.find((item) => item.shotId === disparo);
    if (!shot || shot.orientation === undefined || shot.orientation === null) {
      return this.#store.jltMaoPlannedOlt();
    }

    const unit = shot.orientationUnit ?? conditions?.units?.orientation ?? AngleUnitEnum.MILS;
    return this.#angleToMils(shot.orientation, unit);
  });

  protected readonly plannedOltUnit = computed(() => {
    const conditions = this.#store.planningConditions();
    const { serie, disparo } = this.formModel();
    const shot = conditions?.series
      .find((item) => item.seriesId === serie)
      ?.shots.find((item) => item.shotId === disparo);
    return shot?.orientationUnit ?? conditions?.units?.orientation ?? AngleUnitEnum.MILS;
  });

  protected readonly oltDisplayUnit = linkedSignal({
    source: () => ({ selection: this.#selectionKey(), unit: this.plannedOltUnit() }),
    computation: ({ unit }) => unit,
  });

  protected readonly plannedShootingAngle = computed(() => {
    const conditions = this.#store.planningConditions();
    const { serie, disparo } = this.formModel();
    if (!serie || !disparo) return null;
    const shot = conditions?.series
      .find((item) => item.seriesId === serie)
      ?.shots.find((item) => item.shotId === disparo);
    if (!shot) return null;

    const rawAngle = shot.angle ?? shot.shootingAngle;
    if (rawAngle === undefined || rawAngle === null) return null;

    const unit =
      shot.angleUnit ??
      shot.shootingAngleUnit ??
      conditions?.units?.angle ??
      conditions?.units?.shootingAngle ??
      conditions?.units?.orientation ??
      AngleUnitEnum.MILS;
    return unit === AngleUnitEnum.DEGREES ? rawAngle * (6400 / 360) : rawAngle;
  });

  protected readonly plannedFuseGraduation = signal<number | null>(null);
  protected readonly remoteFuseGraduation = signal<number | null>(null);
  protected readonly conditionsFuseGraduation = computed(() => {
    const conditions = this.#store.planningConditions();
    const { serie, disparo } = this.formModel();
    return (
      conditions?.series.find((item) => item.seriesId === serie)?.shots.find((item) => item.shotId === disparo)
        ?.fuseGraduation ?? null
    );
  });

  protected readonly hasManualOlt = computed(() => this.#parseNum(this.oltField()) !== null);
  protected readonly distanciaPiqueReadOnly = computed(
    () => this.#store.isTrialReadOnly() || this.plannedRange() !== null,
  );
  protected readonly alturaFuncionamientoReadOnly = computed(
    () => this.#store.isTrialReadOnly() || this.plannedFunctioningHeight() !== null,
  );
  protected readonly oltReadOnly = computed(
    () => this.#store.isTrialReadOnly() || this.plannedOlt() !== null || this.formModel().piqueta !== null,
  );
  protected readonly piquetaDisabled = computed(
    () => this.#store.isTrialReadOnly() || this.plannedOlt() !== null || this.hasManualOlt(),
  );
  protected readonly angularDifferenceReadOnly = computed(
    () => this.#store.isTrialReadOnly() || this.plannedOlt() !== null || this.hasManualOlt(),
  );
  protected readonly anguloTiroReadOnly = computed(
    () => this.#store.isTrialReadOnly() || this.plannedShootingAngle() !== null,
  );
  protected readonly graduacionEspoletaReadOnly = computed(
    () =>
      this.#store.isTrialReadOnly() ||
      this.plannedFuseGraduation() !== null ||
      this.conditionsFuseGraduation() !== null ||
      this.remoteFuseGraduation() !== null,
  );

  protected readonly calculatedOlt = computed(() => {
    const piqueta = this.piquetaOptions().find((item) => item.value === this.formModel().piqueta);
    const maoTopography = this.#store.maoTopography();
    const angularDifference = this.#parseNum(this.diferenciaAngularField());
    if (!piqueta || maoTopography.xPieza === null || maoTopography.yPieza === null || angularDifference === null) {
      return null;
    }
    const bearing = Math.atan2(piqueta.y - maoTopography.yPieza, piqueta.x - maoTopography.xPieza);
    return angularDifference + bearing * (3200 / Math.PI);
  });
  protected readonly effectiveOlt = computed(
    () => this.plannedOlt() ?? (this.formModel().piqueta ? this.calculatedOlt() : this.#parseNum(this.oltField())),
  );
  protected readonly effectiveShootingAngle = computed(
    () => this.plannedShootingAngle() ?? this.#parseNum(this.anguloTiroField()),
  );
  protected readonly effectiveFuseGraduation = computed(
    () =>
      this.plannedFuseGraduation() ??
      this.conditionsFuseGraduation() ??
      this.remoteFuseGraduation() ??
      this.#parseNum(this.graduacionEspoletaField()),
  );
  protected readonly distanciaPiqueDisplayField = computed<InputFieldValue>(() =>
    this.#numToField(this.plannedRange() ?? this.#parseNum(this.distanciaPiqueField()), 'm'),
  );
  protected readonly alturaFuncionamientoDisplayField = computed<InputFieldValue>(() =>
    this.#numToField(this.plannedFunctioningHeight() ?? this.#parseNum(this.alturaFuncionamientoField()), 'm'),
  );
  protected readonly calculatedAngularDifference = computed(() => {
    const olt = this.plannedOlt() ?? (this.hasManualOlt() ? this.#parseNum(this.oltField()) : null);
    const referenceOlt = this.plannedOlt();
    return olt !== null && referenceOlt !== null ? olt - referenceOlt : null;
  });
  protected readonly oltDisplayField = computed<InputFieldValue>(() => {
    const value = this.effectiveOlt();
    const unit = this.oltDisplayUnit();
    const plannedValue = this.plannedOltValue();
    const displayValue =
      plannedValue !== null && unit === this.plannedOltUnit()
        ? plannedValue
        : value === null
          ? null
          : this.#milsToAngle(value, unit);
    return this.#numToField(displayValue, unit);
  });
  protected readonly anguloTiroDisplayField = computed<InputFieldValue>(() =>
    this.#numToField(this.effectiveShootingAngle(), 'oo'),
  );
  protected readonly graduacionEspoletaDisplayField = computed<InputFieldValue>(() =>
    this.#numToField(this.effectiveFuseGraduation(), 's'),
  );
  protected readonly angularDifferenceDisplayField = computed<InputFieldValue>(() =>
    this.angularDifferenceReadOnly()
      ? this.#numToField(this.calculatedAngularDifference(), 'oo')
      : this.diferenciaAngularField(),
  );

  // ── Estado del disparo ────────────────────────────────────────────────────
  protected readonly estadoDisparo = computed(() =>
    mapSelectedShotStatus(
      this.#store.executionProgress(),
      this.formModel().serie,
      this.formModel().disparo,
      this.#store.activeSerieId(),
      this.#store.activeShotId(),
      this.#store.jltMao().estadoDisparo,
    ),
  );

  protected readonly estadoLabel = computed(() => mapSelectedShotStatusLabel(this.estadoDisparo()));
  protected readonly estadoClass = computed(() => mapSelectedShotStatusClass(this.estadoDisparo()));

  // ── Numeric field signals (ui-input-select) ───────────────────────────────
  protected readonly velocidadInicialField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().velocidadInicialTeorica, 'm/s'),
  );
  protected readonly distanciaPiqueField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().distanciaPrevistaPique, 'm'),
  );
  protected readonly derivaTabularField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().derivaTabular, 'oo'),
  );
  protected readonly tiempoVueloField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().tiempoVueloTeorico, 's'),
  );
  protected readonly diferenciaAngularField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().diferenciaAngular, 'oo'),
  );
  protected readonly anguloTiroField = signal<InputFieldValue>(this.#numToField(this.#store.jltMao().anguloTiro, 'oo'));
  protected readonly graduacionEspoletaField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().graduacionEspoleta, 's'),
  );
  protected readonly alturaFuncionamientoField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().alturaFuncionamiento, 'm'),
  );
  protected readonly distanciaFuncionamientoField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltMao().distanciaFuncionamiento, 'm'),
  );

  // ── TTN plain signal (not part of Signal Form — matInput does not accept null) ──
  protected readonly ttnField = signal<string | null>(this.#store.jltMao().ttn);
  protected readonly oltField = signal<InputFieldValue>(this.#numToField(this.#store.jltMao().olt, AngleUnitEnum.MILS));

  // ── Select form ───────────────────────────────────────────────────────────
  protected readonly formModel = signal<JltMaoSelectForm>({
    serie: this.#store.jltMao().serie,
    disparo: this.#store.jltMao().disparo,
    piqueta: this.#store.jltMao().piqueta,
  });
  protected readonly selectForm = form(this.formModel, (path) => {
    disabled(path.piqueta, () => this.piquetaDisabled());
  });
  protected readonly shotLock = injectShotFormLock(() => ({
    serie: this.formModel().serie,
    disparo: this.formModel().disparo,
  }));

  // ── Dirty tracking includes TTN (separate signal) ─────────────────────────
  readonly #savedTtn = signal<string | null>(this.ttnField());

  // ── Snapshot for numeric dirty tracking ───────────────────────────────────
  readonly #savedSnapshot = signal({
    olt: this.oltField(),
    piqueta: this.formModel().piqueta,
    velocidadInicial: this.velocidadInicialField(),
    distanciaPique: this.distanciaPiqueField(),
    derivaTabular: this.derivaTabularField(),
    tiempoVuelo: this.tiempoVueloField(),
    diferenciaAngular: this.diferenciaAngularField(),
    anguloTiro: this.anguloTiroField(),
    graduacionEspoleta: this.graduacionEspoletaField(),
    alturaFuncionamiento: this.alturaFuncionamientoField(),
    distanciaFuncionamiento: this.distanciaFuncionamientoField(),
  });

  // ── Dirty tracking ────────────────────────────────────────────────────────
  // Nota: selectores serie/disparo son de consulta (solo disparan GET) — nunca cuentan en dirty.
  protected readonly isDirty = computed(() => {
    if (this.ttnField() !== this.#savedTtn()) return true;
    const snap = this.#savedSnapshot();
    return (
      JSON.stringify(this.oltField()) !== JSON.stringify(snap.olt) ||
      this.formModel().piqueta !== snap.piqueta ||
      JSON.stringify(this.velocidadInicialField()) !== JSON.stringify(snap.velocidadInicial) ||
      JSON.stringify(this.distanciaPiqueField()) !== JSON.stringify(snap.distanciaPique) ||
      JSON.stringify(this.derivaTabularField()) !== JSON.stringify(snap.derivaTabular) ||
      JSON.stringify(this.tiempoVueloField()) !== JSON.stringify(snap.tiempoVuelo) ||
      JSON.stringify(this.diferenciaAngularField()) !== JSON.stringify(snap.diferenciaAngular) ||
      JSON.stringify(this.anguloTiroField()) !== JSON.stringify(snap.anguloTiro) ||
      JSON.stringify(this.graduacionEspoletaField()) !== JSON.stringify(snap.graduacionEspoleta) ||
      JSON.stringify(this.alturaFuncionamientoField()) !== JSON.stringify(snap.alturaFuncionamiento) ||
      JSON.stringify(this.distanciaFuncionamientoField()) !== JSON.stringify(snap.distanciaFuncionamiento)
    );
  });

  // ── FormWidget implementation ─────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: true,
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();

    effect(() => {
      const plannedOlt = this.plannedOlt();
      if (plannedOlt === null || this.formModel().piqueta === null) return;
      untracked(() => this.formModel.update((model) => ({ ...model, piqueta: null })));
    });

    effect(() => {
      const piqueta = this.formModel().piqueta;
      if (piqueta === null) return;
      untracked(() => this.oltField.set(null));
    });

    effect(() => {
      const plannedShootingAngle = this.plannedShootingAngle();
      if (plannedShootingAngle === null) return;
      untracked(() => {
        this.anguloTiroField.set(this.#numToField(plannedShootingAngle, 'oo'));
        this.#store.updateJltMao({ anguloTiro: plannedShootingAngle });
        this.#syncSnapshot();
      });
    });

    effect(() => {
      const plannedOlt = this.plannedOlt();
      if (plannedOlt === null) return;
      untracked(() => {
        this.oltField.set(this.#numToField(plannedOlt, 'oo'));
        this.#store.updateJltMao({ olt: plannedOlt });
        this.#syncSnapshot();
      });
    });

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
    const nextDisparo = serie
      ? (buildDisparoOptions({
          selectedSerie: serie,
          executionProgress: this.#store.executionProgress(),
          planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
        })[0]?.value ?? null)
      : null;
    this.#setSelection(serie, nextDisparo);
  }

  onDisparoSelected(disparo: string | null): void {
    this.formModel.update((m) => ({ ...m, disparo }));
    this.#store.updateJltMao({ disparo });
    void this.#loadSelectedShotData();
  }

  onPiquetaSelected(piqueta: string | null): void {
    this.formModel.update((model) => ({ ...model, piqueta }));
    if (piqueta !== null) {
      this.oltField.set(null);
    }
  }

  onOltChanged(olt: InputFieldValue): void {
    const currentUnit = this.oltDisplayUnit();
    if (olt && olt.unit !== currentUnit) {
      this.oltDisplayUnit.set(olt.unit as AngleUnitEnum);
      return;
    }
    if (this.oltReadOnly()) return;

    const value = this.#parseNum(olt);
    this.oltField.set(
      value === null ? null : this.#numToField(this.#angleToMils(value, currentUnit), AngleUnitEnum.MILS),
    );
    if (value !== null) {
      this.formModel.update((model) => ({ ...model, piqueta: null }));
    }
  }

  onAngularDifferenceChanged(value: InputFieldValue): void {
    if (!this.angularDifferenceReadOnly()) {
      this.diferenciaAngularField.set(value);
    }
  }

  onAnguloTiroChanged(value: InputFieldValue): void {
    if (this.anguloTiroReadOnly()) return;
    this.anguloTiroField.set(value);
  }

  onGraduacionEspoletaChanged(value: InputFieldValue): void {
    if (this.graduacionEspoletaReadOnly()) return;
    this.graduacionEspoletaField.set(value);
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.formModel.update((m) => ({
      ...m,
      serie,
      disparo,
    }));
    this.#store.updateJltMao({ serie, disparo });
    void this.#loadSelectedShotData();
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.formModel();
    const selectionKey = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();

    if (!fireTrialId || !serie || !disparo) {
      return;
    }

    this.plannedFuseGraduation.set(null);
    this.remoteFuseGraduation.set(null);

    try {
      const response = await this.#executionService.fetchShotJltMao(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      let plannedFuseGraduation: number | null = null;
      try {
        plannedFuseGraduation = await this.#executionService.fetchPlanningFuseGraduation(fireTrialId, serie, disparo);
      } catch {
        plannedFuseGraduation = null;
      }
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.plannedFuseGraduation.set(plannedFuseGraduation);
      this.#applyRemoteShotData(response, plannedFuseGraduation);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
    }
  }

  #applyRemoteShotData(response: ShotJltMaoResponse, plannedFuseGraduation: number | null): void {
    const data = response?.jltMaoData;
    this.remoteFuseGraduation.set(data?.fuseGraduation ?? null);
    const plannedShootingAngle = this.plannedShootingAngle();
    const plannedOlt = this.plannedOlt();
    const shootingAngle = plannedShootingAngle ?? data?.shootingAngle ?? null;
    const fuseGraduation = plannedFuseGraduation ?? this.conditionsFuseGraduation() ?? data?.fuseGraduation ?? null;
    const remoteOlt = plannedOlt ?? data?.lineOfFireOrientation ?? null;
    const remotePiqueta = remoteOlt === null ? (data?.stakeId ?? null) : null;
    if (!data) {
      this.#store.updateJltMao({
        olt: remoteOlt,
        piqueta: remotePiqueta,
        anguloTiro: shootingAngle,
        graduacionEspoleta: fuseGraduation,
      });
      this.oltField.set(this.#numToField(remoteOlt, 'oo'));
      this.formModel.update((model) => ({ ...model, piqueta: remotePiqueta }));
      this.anguloTiroField.set(this.#numToField(shootingAngle, 'oo'));
      this.graduacionEspoletaField.set(this.#numToField(fuseGraduation, 's'));
      this.#syncSnapshot();
      return;
    }

    this.#store.updateJltMao({
      olt: remoteOlt,
      piqueta: remotePiqueta,
      ttn: data.numericFiringTable ?? null,
      velocidadInicialTeorica: data.theoreticalInitialVelocity ?? null,
      distanciaPrevistaPique: data.plannedImpactDistance ?? null,
      derivaTabular: data.tabularDrift ?? null,
      tiempoVueloTeorico: data.theoreticalFlightTime ?? null,
      diferenciaAngular: data.angularDifference ?? null,
      anguloTiro: shootingAngle,
      graduacionEspoleta: fuseGraduation,
      alturaFuncionamiento: data.functioningHeight ?? null,
      distanciaFuncionamiento: data.functioningDistance ?? null,
    });

    if (data.numericFiringTable !== undefined) this.ttnField.set(data.numericFiringTable ?? null);
    this.oltField.set(this.#numToField(remoteOlt, 'oo'));
    this.formModel.update((model) => ({ ...model, piqueta: remotePiqueta }));
    if (data.theoreticalInitialVelocity !== undefined)
      this.velocidadInicialField.set(this.#numToField(data.theoreticalInitialVelocity, 'm/s'));
    if (data.plannedImpactDistance !== undefined)
      this.distanciaPiqueField.set(this.#numToField(data.plannedImpactDistance, 'm'));
    if (data.tabularDrift !== undefined) this.derivaTabularField.set(this.#numToField(data.tabularDrift, 'oo'));
    if (data.theoreticalFlightTime !== undefined)
      this.tiempoVueloField.set(this.#numToField(data.theoreticalFlightTime, 's'));
    if (data.angularDifference !== undefined)
      this.diferenciaAngularField.set(this.#numToField(data.angularDifference, 'oo'));
    this.anguloTiroField.set(this.#numToField(shootingAngle, 'oo'));
    this.graduacionEspoletaField.set(this.#numToField(fuseGraduation, 's'));
    if (data.functioningHeight !== undefined)
      this.alturaFuncionamientoField.set(this.#numToField(data.functioningHeight, 'm'));
    if (data.functioningDistance !== undefined)
      this.distanciaFuncionamientoField.set(this.#numToField(data.functioningDistance, 'm'));

    this.#savedTtn.set(this.ttnField());
    this.shotLock.lock();
    this.#syncSnapshot();
  }

  resetForm(): void {
    const stored = this.#store.jltMao();
    this.ttnField.set(stored.ttn);
    this.oltField.set(this.#numToField(stored.olt, 'oo'));
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      piqueta: stored.piqueta,
    });
    this.velocidadInicialField.set(this.#numToField(stored.velocidadInicialTeorica, 'm/s'));
    this.distanciaPiqueField.set(this.#numToField(stored.distanciaPrevistaPique, 'm'));
    this.derivaTabularField.set(this.#numToField(stored.derivaTabular, 'oo'));
    this.tiempoVueloField.set(this.#numToField(stored.tiempoVueloTeorico, 's'));
    this.diferenciaAngularField.set(this.#numToField(stored.diferenciaAngular, 'oo'));
    this.anguloTiroField.set(this.#numToField(stored.anguloTiro, 'oo'));
    this.graduacionEspoletaField.set(this.#numToField(stored.graduacionEspoleta, 's'));
    this.alturaFuncionamientoField.set(this.#numToField(stored.alturaFuncionamiento, 'm'));
    this.distanciaFuncionamientoField.set(this.#numToField(stored.distanciaFuncionamiento, 'm'));
    this.shotLock.lock();
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    if (this.shotLock.readOnly()) return;
    const { serie, disparo, piqueta } = this.formModel();
    const ttn = this.ttnField();
    const velocidadInicialTeorica = this.#parseNum(this.velocidadInicialField());
    const distanciaPrevistaPique = this.plannedRange() ?? this.#parseNum(this.distanciaPiqueField());
    const derivaTabular = this.#parseNum(this.derivaTabularField());
    const tiempoVueloTeorico = this.#parseNum(this.tiempoVueloField());
    const diferenciaAngular = this.angularDifferenceReadOnly()
      ? this.calculatedAngularDifference()
      : this.#parseNum(this.diferenciaAngularField());
    const olt = this.effectiveOlt();
    const anguloTiro = this.effectiveShootingAngle();
    const graduacionEspoleta = this.effectiveFuseGraduation();
    const alturaFuncionamiento = this.plannedFunctioningHeight() ?? this.#parseNum(this.alturaFuncionamientoField());
    const distanciaFuncionamiento = this.#parseNum(this.distanciaFuncionamientoField());

    const updates: Partial<JltMaoState> = {
      serie,
      disparo,
      ttn,
      piqueta,
      olt,
      velocidadInicialTeorica,
      distanciaPrevistaPique,
      derivaTabular,
      tiempoVueloTeorico,
      diferenciaAngular,
      anguloTiro,
      graduacionEspoleta,
      alturaFuncionamiento,
      distanciaFuncionamiento,
    };

    this.#store.updateJltMao(updates);

    // Propagate JLT MAO data to radar trayectography widget
    this.#store.updateRadarTrayectographyMaoData({
      alcancePrevistoPique: distanciaPrevistaPique,
      velocidadInicialTeorica,
      tiempoVueloTeorico,
      graduacionEspoleta,
      anguloTiro,
      derivaTabular,
    });

    const fireTrialId = this.#store.fireTrialId();
    if (fireTrialId && serie && disparo) {
      await this.#executionService.updateShotJltMao(fireTrialId, serie, disparo, {
        numericFiringTable: ttn,
        lineOfFireOrientation: olt,
        stakeId: piqueta,
        theoreticalInitialVelocity: velocidadInicialTeorica,
        plannedImpactDistance: distanciaPrevistaPique,
        tabularDrift: derivaTabular,
        theoreticalFlightTime: tiempoVueloTeorico,
        angularDifference: diferenciaAngular,
        shootingAngle: anguloTiro,
        fuseGraduation: graduacionEspoleta,
        functioningHeight: alturaFuncionamiento,
        functioningDistance: distanciaFuncionamiento,
        observations: null,
      });
    }

    this.#savedTtn.set(this.ttnField());
    this.shotLock.lock();
    this.#syncSnapshot();
  }

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    const serie = activeSerieId() ?? this.formModel().serie;
    const disparo = activeShotId() ?? this.formModel().disparo;
    this.#setSelection(serie, disparo);
  }

  async openMassConfig(): Promise<void> {
    // Diálogo parte de un formulario limpio: baseline vacío para que solo se envíen los campos rellenados.
    const current: JltMaoMassConfigFields = {
      velocidadInicial: null,
      distanciaPique: null,
      derivaTabular: null,
      tiempoVuelo: null,
      diferenciaAngular: null,
      anguloTiro: null,
      graduacionEspoleta: null,
      alturaFuncionamiento: null,
      distanciaFuncionamiento: null,
    };
    const ref = this.#dialog.open<JltMaoMassConfigDialog, unknown, JltMaoMassConfigDialogResult>(
      JltMaoMassConfigDialog,
      {
        width: '800px',
        maxWidth: '800px',
        data: {
          serieOptions: this.serieOptions(),
          planningConditionsReady: Boolean(this.#store.planningConditions()),
          seriesOrientations: this.#getSeriesOrientations(),
          piquetaOptions: this.#store.jltMao().piquetaOptions,
          piecePosition: {
            x: this.#store.maoTopography().xPieza,
            y: this.#store.maoTopography().yPieza,
          },
          currentPiqueta: null,
          current,
        },
      },
    );

    const result = await firstValueFrom(ref.afterClosed());
    if (result?.action !== 'apply') return;

    const selectedSeries = result.series ?? [];
    const fireTrialId = this.#store.fireTrialId();
    if (!fireTrialId || selectedSeries.length === 0) return;

    const planningSeries = this.#trialShots.series() ?? this.#store.planningSeries() ?? [];
    const executionSeries = this.#store.executionProgress()?.series ?? [];
    const selectedShotGroups = selectedSeries.map((seriesId) => {
      const plannedShots = planningSeries.find((series) => series.id === seriesId)?.shots;
      const executedShots = executionSeries.find((series) => series.seriesId === seriesId)?.shots;
      const shotIds = plannedShots?.length
        ? plannedShots.map((shot) => shot.id)
        : (executedShots?.map((shot) => shot.shotId) ?? []);
      return shotIds;
    });
    if (selectedShotGroups.some((shotIds) => shotIds.length === 0)) return;

    const assignedShotIds = [...new Set(selectedShotGroups.flat())];
    const manualSeriesIds = result.orientation?.seriesIds ?? [];
    const manualShotIds = selectedSeries.flatMap((seriesId, index) =>
      manualSeriesIds.includes(seriesId) ? (selectedShotGroups[index] ?? []) : [],
    );
    const manualShotIdSet = new Set(manualShotIds);
    const shotGroups = [
      {
        shotIds: assignedShotIds.filter((shotId) => !manualShotIdSet.has(shotId)),
        orientation: undefined,
      },
      {
        shotIds: assignedShotIds.filter((shotId) => manualShotIdSet.has(shotId)),
        orientation: result.orientation,
      },
    ];
    for (const group of shotGroups) {
      if (group.shotIds.length === 0) continue;
      const values = {
        ...result,
        diferenciaAngular: group.orientation ? result.diferenciaAngular : undefined,
      };
      const request = mapJltMaoMassConfigToRequest(
        values,
        current,
        group.shotIds,
        group.orientation?.lineOfFireOrientation,
      );
      if (!request) continue;
      await this.#executionService.bulkConfigureJltMao(fireTrialId, request);
    }

    await this.#loadSelectedShotData();
  }

  #getSeriesOrientations(): {
    seriesId: string;
    orientations: (number | null)[];
    sourceOrientations: { value: number | null; unit: AngleUnitEnum }[];
  }[] {
    const planningSeries = this.#trialShots.series() ?? this.#store.planningSeries() ?? [];
    const executionSeries = this.#store.executionProgress()?.series ?? [];
    const conditions = this.#store.planningConditions();

    return this.serieOptions().map(({ value: seriesId }) => {
      const plannedShots = planningSeries.find((series) => series.id === seriesId)?.shots;
      const executedShots = executionSeries.find((series) => series.seriesId === seriesId)?.shots;
      const shotIds = plannedShots?.length
        ? plannedShots.map((shot) => shot.id)
        : (executedShots?.map((shot) => shot.shotId) ?? []);
      const conditionSeries = conditions?.series.find((series) => series.seriesId === seriesId);

      return {
        seriesId,
        orientations: shotIds.map((shotId) => {
          const shot = conditionSeries?.shots.find((conditionShot) => conditionShot.shotId === shotId);
          if (shot?.orientation === undefined || shot.orientation === null) return null;
          const unit = shot.orientationUnit ?? conditions?.units?.orientation ?? AngleUnitEnum.MILS;
          return this.#angleToMils(shot.orientation, unit);
        }),
        sourceOrientations: shotIds.map((shotId) => {
          const shot = conditionSeries?.shots.find((conditionShot) => conditionShot.shotId === shotId);
          const unit = shot?.orientationUnit ?? conditions?.units?.orientation ?? AngleUnitEnum.MILS;
          return { value: shot?.orientation ?? null, unit };
        }),
      };
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  #numToField(v: number | null, unit: string): InputFieldValue {
    return v !== null ? { value: String(v), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (field?.value === null || field?.value === undefined || field?.value === '') return null;
    if (typeof field.value === 'number') {
      return Number.isFinite(field.value) ? field.value : null;
    }
    const n = parseFloat(field.value.toString().replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  #angleToMils(value: number, unit: AngleUnitEnum): number {
    if (unit === AngleUnitEnum.DEGREES) return value * (6400 / 360);
    if (unit === AngleUnitEnum.RAD) return value * (3200 / Math.PI);
    return value;
  }

  #milsToAngle(value: number, unit: AngleUnitEnum): number {
    if (unit === AngleUnitEnum.DEGREES) return value * (360 / 6400);
    if (unit === AngleUnitEnum.RAD) return value * (Math.PI / 3200);
    return value;
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      olt: this.oltField(),
      piqueta: this.formModel().piqueta,
      velocidadInicial: this.velocidadInicialField(),
      distanciaPique: this.distanciaPiqueField(),
      derivaTabular: this.derivaTabularField(),
      tiempoVuelo: this.tiempoVueloField(),
      diferenciaAngular: this.diferenciaAngularField(),
      anguloTiro: this.anguloTiroField(),
      graduacionEspoleta: this.graduacionEspoletaField(),
      alturaFuncionamiento: this.alturaFuncionamientoField(),
      distanciaFuncionamiento: this.distanciaFuncionamientoField(),
    });
  }
}

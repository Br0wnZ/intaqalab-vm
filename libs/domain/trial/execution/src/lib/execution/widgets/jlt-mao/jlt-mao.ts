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
import { FormField, disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
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
import { mapPlanningSeriesToOptions, mapShotsToDisparoOptions } from '../utils/selection-options';
import type { JltMaoMassConfigDialogResult } from './jlt-mao-mass-config-dialog';
import { JltMaoMassConfigDialog } from './jlt-mao-mass-config-dialog';

type InputFieldValue = { value: string; unit: string } | null;

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
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    InputSelect,
    IntaIconComponent,
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
          label="OLT"
          class="w-32 shrink-0"
          [opciones]="ooOptions"
          [placeholder]="'0,000'"
          [value]="oltDisplayField()"
          [readOnly]="oltReadOnly()"
          [variant]="oltReadOnly() ? 'computed' : 'default'"
          (valueChange)="onOltChanged($event)"
        />

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- Fields: 5 columns × 2 rows -->
      <div
        intaReadonlyContent
        class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 min-h-0 content-start"
      >
        <!-- ── Row 1 ─────────────────────────────────────────────────────── -->

        <!-- Piqueta (selector) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.PIQUETA_PLACEHOLDER' | translate"
            [formField]="selectForm.piqueta"
          >
            <mat-option [value]="null">—</mat-option>
            @for (opt of piquetaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Velocidad inicial teórica -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.VELOCIDAD_INICIAL_LABEL' | translate"
          [opciones]="msOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.VELOCIDAD_INICIAL_PLACEHOLDER' | translate"
          [value]="velocidadInicialField()"
          (valueChange)="velocidadInicialField.set($event)"
        />

        <!-- Distancia prevista pique -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_PIQUE_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_PIQUE_PLACEHOLDER' | translate"
          [value]="distanciaPiqueField()"
          (valueChange)="distanciaPiqueField.set($event)"
        />

        <!-- Deriva tabular -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DERIVA_TABULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DERIVA_TABULAR_PLACEHOLDER' | translate"
          [value]="derivaTabularField()"
          (valueChange)="derivaTabularField.set($event)"
        />

        <!-- Tiempo vuelo teórico -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TIEMPO_VUELO_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TIEMPO_VUELO_PLACEHOLDER' | translate"
          [value]="tiempoVueloField()"
          (valueChange)="tiempoVueloField.set($event)"
        />

        <!-- ── Row 2 ─────────────────────────────────────────────────────── -->

        <!-- Diferencia angular -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DIFERENCIA_ANGULAR_PLACEHOLDER' | translate"
          [value]="angularDifferenceDisplayField()"
          [readOnly]="angularDifferenceReadOnly()"
          [variant]="angularDifferenceReadOnly() ? 'computed' : 'default'"
          (valueChange)="onAngularDifferenceChanged($event)"
        />

        <!-- Ángulo de tiro -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ANGULO_TIRO_LABEL' | translate"
          [opciones]="ooOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ANGULO_TIRO_PLACEHOLDER' | translate"
          [value]="anguloTiroField()"
          (valueChange)="anguloTiroField.set($event)"
        />

        <!-- Graduación espoleta -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_LABEL' | translate"
          [opciones]="secondsOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.GRADUACION_ESPOLETA_PLACEHOLDER' | translate"
          [value]="graduacionEspoletaField()"
          (valueChange)="graduacionEspoletaField.set($event)"
        />

        <!-- Altura de funcionamiento -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_FUNCIONAMIENTO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.ALTURA_FUNCIONAMIENTO_PLACEHOLDER' | translate"
          [value]="alturaFuncionamientoField()"
          (valueChange)="alturaFuncionamientoField.set($event)"
        />

        <!-- Distancia de funcionamiento -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_FUNCIONAMIENTO_LABEL' | translate"
          [opciones]="metersOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DISTANCIA_FUNCIONAMIENTO_PLACEHOLDER' | translate"
          [value]="distanciaFuncionamientoField()"
          (valueChange)="distanciaFuncionamientoField.set($event)"
        />
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

  readonly #selectionKey = computed(() => shotSelectionKey(this.formModel().serie, this.formModel().disparo));
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  // ── Unit options ──────────────────────────────────────────────────────────
  protected readonly metersOptions = [{ value: 'm', label: 'm' }];
  protected readonly ooOptions = [{ value: 'oo', label: 'ºº' }];
  protected readonly secondsOptions = [{ value: 's', label: 's' }];
  protected readonly msOptions = [{ value: 'm/s', label: 'm/s' }];

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly piquetaOptions = computed(() => this.#store.jltMao().piquetaOptions);
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#store.planningSeries(), this.#store.jltMao().serieOptions),
  );
  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.formModel().serie;
    const progressShots = this.#store
      .executionProgress()
      ?.series.find((serie) => serie.seriesId === selectedSerie)?.shots;
    if (progressShots?.length) {
      return mapShotsToDisparoOptions(progressShots, this.#store.jltMao().disparoOptions);
    }
    const planningShots = this.#store.planningSeries()?.find((serie) => serie.id === selectedSerie)?.shots;
    if (planningShots?.length) {
      return mapShotsToDisparoOptions(planningShots, this.#store.jltMao().disparoOptions);
    }
    return this.#store.jltMao().disparoOptions;
  });

  protected readonly plannedOlt = computed(() => this.#store.jltMaoPlannedOlt());
  protected readonly hasManualOlt = computed(() => this.#parseNum(this.oltField()) !== null);
  protected readonly oltReadOnly = computed(
    () => this.#store.isTrialReadOnly() || this.plannedOlt() !== null || this.formModel().piqueta !== null,
  );
  protected readonly piquetaDisabled = computed(
    () => this.#store.isTrialReadOnly() || this.plannedOlt() !== null || this.hasManualOlt(),
  );
  protected readonly angularDifferenceReadOnly = computed(
    () => this.#store.isTrialReadOnly() || this.plannedOlt() !== null || this.hasManualOlt(),
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
  protected readonly calculatedAngularDifference = computed(() => {
    const olt = this.plannedOlt() ?? (this.hasManualOlt() ? this.#parseNum(this.oltField()) : null);
    const referenceOlt = this.plannedOlt();
    return olt !== null && referenceOlt !== null ? olt - referenceOlt : null;
  });
  protected readonly oltDisplayField = computed<InputFieldValue>(() => this.#numToField(this.effectiveOlt(), 'oo', 3));
  protected readonly angularDifferenceDisplayField = computed<InputFieldValue>(() =>
    this.angularDifferenceReadOnly()
      ? this.#numToField(this.calculatedAngularDifference(), 'oo', 3)
      : this.diferenciaAngularField(),
  );

  // ── Estado del disparo ────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.jltMao().estadoDisparo) {
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
    switch (this.#store.jltMao().estadoDisparo) {
      case 'EN_CURSO':
        return 'bg-green-100 text-green-700';
      case 'PENDIENTE':
        return 'bg-blue-100 text-blue-700';
      case 'EJECUTADA':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  });

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
  protected readonly oltField = signal<InputFieldValue>(this.#numToField(this.#store.jltMao().olt, 'oo', 3));

  // ── Select form ───────────────────────────────────────────────────────────
  protected readonly formModel = signal<JltMaoSelectForm>({
    serie: this.#store.jltMao().serie,
    disparo: this.#store.jltMao().disparo,
    piqueta: this.#store.jltMao().piqueta,
  });
  protected readonly selectForm = form(this.formModel, (path) => {
    disabled(path.piqueta, () => this.piquetaDisabled());
  });

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
      const fireTrialId = this.#store.fireTrialId();
      const activeSerieId = this.#store.activeSerieId() ?? this.serieOptions()?.[0]?.value ?? null;
      const activeShotId = this.#store.activeShotId() ?? this.disparoOptions()?.[0]?.value ?? null;

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
    this.formModel.update((m) => ({ ...m, serie }));
    this.#store.updateJltMao({ serie });
    void this.#loadSelectedShotData();
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
    if (this.oltReadOnly()) return;
    this.oltField.set(olt);
    if (this.#parseNum(olt) !== null) {
      this.formModel.update((model) => ({ ...model, piqueta: null }));
    }
  }

  onAngularDifferenceChanged(value: InputFieldValue): void {
    if (!this.angularDifferenceReadOnly()) {
      this.diferenciaAngularField.set(value);
    }
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

    try {
      const response = await this.#executionService.fetchShotJltMao(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
    }
  }

  #applyRemoteShotData(response: ShotJltMaoResponse): void {
    const data = response?.jltMaoData;
    if (!data) return;

    const remoteOlt = data.lineOfFireOrientation ?? null;
    const remotePiqueta = remoteOlt === null ? (data.stakeId ?? null) : null;

    this.#store.updateJltMao({
      olt: remoteOlt,
      piqueta: remotePiqueta,
      ttn: data.numericFiringTable ?? null,
      velocidadInicialTeorica: data.theoreticalInitialVelocity ?? null,
      distanciaPrevistaPique: data.plannedImpactDistance ?? null,
      derivaTabular: data.tabularDrift ?? null,
      tiempoVueloTeorico: data.theoreticalFlightTime ?? null,
      diferenciaAngular: data.angularDifference ?? null,
      anguloTiro: data.shootingAngle ?? null,
      graduacionEspoleta: data.fuseGraduation ?? null,
      alturaFuncionamiento: data.functioningHeight ?? null,
      distanciaFuncionamiento: data.functioningDistance ?? null,
    });

    if (data.numericFiringTable !== undefined) this.ttnField.set(data.numericFiringTable ?? null);
    this.oltField.set(this.#numToField(remoteOlt, 'oo', 3));
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
    if (data.shootingAngle !== undefined) this.anguloTiroField.set(this.#numToField(data.shootingAngle, 'oo'));
    if (data.fuseGraduation !== undefined) this.graduacionEspoletaField.set(this.#numToField(data.fuseGraduation, 's'));
    if (data.functioningHeight !== undefined)
      this.alturaFuncionamientoField.set(this.#numToField(data.functioningHeight, 'm'));
    if (data.functioningDistance !== undefined)
      this.distanciaFuncionamientoField.set(this.#numToField(data.functioningDistance, 'm'));

    this.#savedTtn.set(this.ttnField());
    this.#syncSnapshot();
  }

  resetForm(): void {
    const stored = this.#store.jltMao();
    this.ttnField.set(stored.ttn);
    this.oltField.set(this.#numToField(stored.olt, 'oo', 3));
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
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, piqueta } = this.formModel();
    const ttn = this.ttnField();
    const velocidadInicialTeorica = this.#parseNum(this.velocidadInicialField());
    const distanciaPrevistaPique = this.#parseNum(this.distanciaPiqueField());
    const derivaTabular = this.#parseNum(this.derivaTabularField());
    const tiempoVueloTeorico = this.#parseNum(this.tiempoVueloField());
    const diferenciaAngular = this.angularDifferenceReadOnly()
      ? this.calculatedAngularDifference()
      : this.#parseNum(this.diferenciaAngularField());
    const olt = this.effectiveOlt();
    const anguloTiro = this.#parseNum(this.anguloTiroField());
    const graduacionEspoleta = this.#parseNum(this.graduacionEspoletaField());
    const alturaFuncionamiento = this.#parseNum(this.alturaFuncionamientoField());
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
    this.#syncSnapshot();
  }

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    const serie = activeSerieId() ?? this.formModel().serie;
    const disparo = activeShotId() ?? this.formModel().disparo;
    this.#setSelection(serie, disparo);
  }

  async openMassConfig(): Promise<void> {
    const ref = this.#dialog.open<JltMaoMassConfigDialog, unknown, JltMaoMassConfigDialogResult>(
      JltMaoMassConfigDialog,
      {
        width: '800px',
        maxWidth: '800px',
        data: {
          serieOptions: this.serieOptions(),
          piquetaOptions: this.piquetaOptions(),
          current: {
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
          },
        },
      },
    );

    const result = await firstValueFrom(ref.afterClosed());
    if (result?.action !== 'apply') return;
    if (result.piqueta !== undefined && this.plannedOlt() === null) {
      this.onPiquetaSelected(result.piqueta ?? null);
    }
    if (result.velocidadInicial !== undefined) this.velocidadInicialField.set(result.velocidadInicial);
    if (result.distanciaPique !== undefined) this.distanciaPiqueField.set(result.distanciaPique);
    if (result.derivaTabular !== undefined) this.derivaTabularField.set(result.derivaTabular);
    if (result.tiempoVuelo !== undefined) this.tiempoVueloField.set(result.tiempoVuelo);
    if (result.diferenciaAngular !== undefined) this.diferenciaAngularField.set(result.diferenciaAngular);
    if (result.anguloTiro !== undefined) this.anguloTiroField.set(result.anguloTiro);
    if (result.graduacionEspoleta !== undefined) this.graduacionEspoletaField.set(result.graduacionEspoleta);
    if (result.alturaFuncionamiento !== undefined) this.alturaFuncionamientoField.set(result.alturaFuncionamiento);
    if (result.distanciaFuncionamiento !== undefined)
      this.distanciaFuncionamientoField.set(result.distanciaFuncionamiento);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  #numToField(v: number | null, unit: string, decimals?: number): InputFieldValue {
    return v !== null ? { value: decimals === undefined ? String(v) : v.toFixed(decimals), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field?.value) return null;
    const n = parseFloat(field.value.replace(',', '.'));
    return isNaN(n) ? null : n;
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

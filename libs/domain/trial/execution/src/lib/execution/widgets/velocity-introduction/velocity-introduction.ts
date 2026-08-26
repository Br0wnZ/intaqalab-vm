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
import { CadenceUnitEnum, MEASURE_UNIT_LABELS, MeasureUnitEnum, SpeedUnitEnum } from '@intaqalab/models';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService, type ShotVelocitiesResponse } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { EquipmentTypeEnum } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import {
    type InputFieldValue,
    buildRadarAntenaCombinedValue,
    mapPlanningSeriesToOptions,
    mapRemoteToVelocityState,
    mapShotStatusToEstadoDisparo,
    mapShotsToDisparoOptions,
    mapVelocityFormToRequest,
    numToField,
    parseNum,
    splitRadarAntenaCombinedValue,
} from './velocity-introduction.mapper';

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

/** Valor compuesto "radarId|antennaId" para el selector único Radar / Antena */
interface DataFormModel {
  radarAntena: string | null;
}

@Component({
  selector: 'inta-velocity-introduction',
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
    InputSelect,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-3 flex flex-col gap-4 overflow-auto">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.SERIE_PLACEHOLDER' | translate }}</mat-label>
          <mat-select [formField]="selectorForm.serie" (selectionChange)="onSerieSelected($event.value)">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-30">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.DISPARO_PLACEHOLDER' | translate }}</mat-label>
          <mat-select [formField]="selectorForm.disparo" (selectionChange)="onDisparoSelected($event.value)">
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        @if (canEnableHistoricalEdit()) {
          <button
            mat-icon-button
            type="button"
            [attr.aria-label]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.ENABLE_EDIT' | translate"
            [attr.title]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.ENABLE_EDIT' | translate"
            (click)="enableHistoricalEdit()"
          >
            <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          </button>
        }

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Body ────────────────────────────────────────────────────────── -->
      <div
        intaReadonlyContent
        intaFormTouch
        #touch="intaFormTouch"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 min-h-0 items-end"
        [attr.inert]="readOnly() ? '' : null"
        [class.inta-readonly-content]="readOnly()"
      >
        <!-- Row 1 -->

        <!-- Radar / Antena (selector único con combinaciones del equipo seleccionado) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full col-span-2">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.RADAR_ANTENA_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.RADAR_ANTENA_PLACEHOLDER' | translate"
            [formField]="dataForm.radarAntena"
          >
            @for (opt of radarAntenaOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Velocidad -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.VELOCIDAD_LABEL' | translate"
          [opciones]="msOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.VELOCIDAD_PLACEHOLDER' | translate"
          [value]="velocidadField()"
          (valueChange)="velocidadField.set($event)"
        />

        <!-- Observaciones (spans 2 rows) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="4"
            class="resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="observacionesField.set($any($event.target).value || null)"
          ></textarea>
        </mat-form-field>

        <!-- Row 2 -->

        <!-- Incert. Software (read-only, procede del tarado) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.INCERT_SOFTWARE_LABEL' | translate }}</mat-label>
          <input matInput class="tabular-nums italic text-slate-400" [value]="incertidumbreSoftwareDisplay()" />
          <span matSuffix class="pr-4 text-sm text-gray-700">{{ softwareUncertaintyUnitLabel() }}</span>
        </mat-form-field>

        <!-- Pérdida -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.PERDIDA_LABEL' | translate"
          [opciones]="msOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.PERDIDA_PLACEHOLDER' | translate"
          [value]="perdidaField()"
          (valueChange)="perdidaField.set($event)"
        />

        <!-- Cadencia -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.CADENCIA_LABEL' | translate }}</mat-label>
          <input
            matInput
            type="number"
            class="tabular-nums"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.CADENCIA_PLACEHOLDER' | translate"
            [value]="cadenciaField()?.value ?? ''"
            (input)="onCadenciaChange($any($event.target).value)"
          />
          <span matSuffix class="pr-4 text-sm text-gray-700">{{ cadenceUnitLabel() }}</span>
        </mat-form-field>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VelocityIntroduction extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);
  readonly #selectionKey = computed(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  readonly #itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  constructor() {
    super();

    // Cargar items de radar y antena desde la API para construir las opciones combinadas
    this.#executionService
      ?.loadEquipmentItemsByCategories?.([EquipmentTypeEnum.DOPPLER_RADAR, EquipmentTypeEnum.ANTENNA])
      ?.then((result) => this.#itemsByCategory.set(result));

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const activeSerieId = this.#store.activeSerieId();
      const activeShotId = this.#store.activeShotId();

      if (!fireTrialId || !activeSerieId || !activeShotId) {
        return;
      }

      const selectionKey = `${activeSerieId}|${activeShotId}`;
      if (this.#lastLoadedActiveSelection() === selectionKey) {
        return;
      }

      untracked(() => {
        this.#setSelection(activeSerieId, activeShotId);
        this.#lastLoadedActiveSelection.set(selectionKey);
      });
    });

    effect(() => {
      this.#selectionKey();
      this.historicalEditEnabled.set(false);
    });
  }

  // ── Unit options ───────────────────────────────────────────────────────────
  protected readonly msOptions = [
    { value: MeasureUnitEnum.M_S, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.M_S] },
    { value: MeasureUnitEnum.KM_H, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.KM_H] },
  ];
  protected readonly cadenceUnitLabel = computed(
    () => MEASURE_UNIT_LABELS[this.#store.velocityIntroduction().cadenciaUnit || CadenceUnitEnum.SPM],
  );
  protected readonly softwareUncertaintyUnitLabel = computed(
    () => MEASURE_UNIT_LABELS[this.#store.velocityIntroduction().incertidumbreSoftwareUnit || SpeedUnitEnum.M_S],
  );

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#store.planningSeries(), this.#store.velocityIntroduction().serieOptions),
  );

  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    const series = this.#store.executionProgress()?.series;
    const shots = selectedSerie ? series?.find((serie) => serie.seriesId === selectedSerie)?.shots : undefined;

    return mapShotsToDisparoOptions(shots, this.#store.velocityIntroduction().disparoOptions);
  });

  /**
   * Opciones combinadas Radar / Antena: producto cartesiano de los items cargados desde la API.
   * Formato de valor: "radarId|antennaId"
   */
  protected readonly radarAntenaOptions = computed(() => {
    const radares = this.#itemsByCategory()[EquipmentTypeEnum.DOPPLER_RADAR] ?? [];
    const antenas = this.#itemsByCategory()[EquipmentTypeEnum.ANTENNA] ?? [];
    const result: Array<{ value: string; label: string }> = [];
    for (const radar of radares) {
      for (const antena of antenas) {
        // En el loop los IDs son siempre strings no-nulos provenientes de la API
        result.push({
          value: buildRadarAntenaCombinedValue(radar.id, antena.id) as string,
          label: `${radar.label} / ${antena.label}`,
        });
      }
    }
    return result;
  });

  protected readonly selectedSeriesProgress = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    return selectedSerie
      ? (this.#store.executionProgress()?.series.find((serie) => serie.seriesId === selectedSerie) ?? null)
      : null;
  });

  protected readonly selectedShotProgress = computed(() => {
    const selectedShot = this.selectorFormModel().disparo;
    const series = this.selectedSeriesProgress();
    return selectedShot ? (series?.shots.find((shot) => shot.shotId === selectedShot) ?? null) : null;
  });

  protected readonly isCurrentShot = computed(
    () =>
      this.selectorFormModel().serie === this.#store.activeSerieId() &&
      this.selectorFormModel().disparo === this.#store.activeShotId(),
  );

  protected readonly selectedShotOrder = computed(() =>
    this.#getShotOrder(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );

  protected readonly activeShotOrder = computed(() =>
    this.#getShotOrder(this.#store.activeSerieId(), this.#store.activeShotId()),
  );

  protected readonly isFutureShot = computed(() => {
    const selectedShotOrder = this.selectedShotOrder();
    const activeShotOrder = this.activeShotOrder();

    if (selectedShotOrder !== null && activeShotOrder !== null) {
      return selectedShotOrder > activeShotOrder;
    }

    return !this.isCurrentShot() && this.selectedShotProgress()?.status === 'PENDING';
  });

  protected readonly isHistoricalFiredShot = computed(
    () => !this.isCurrentShot() && this.selectedShotProgress()?.status === 'FIRED',
  );

  protected readonly historicalEditEnabled = signal(false);

  protected readonly canEnableHistoricalEdit = computed(
    () => !this.#store.isTrialReadOnly() && this.isHistoricalFiredShot() && !this.historicalEditEnabled(),
  );

  protected readonly readOnly = computed(() => {
    const { serie, disparo } = this.selectorFormModel();

    return (
      !serie ||
      !disparo ||
      this.#store.isTrialReadOnly() ||
      this.isFutureShot() ||
      (this.isHistoricalFiredShot() && !this.historicalEditEnabled())
    );
  });

  // ── Read-only: incertidumbre del software ─────────────────────────────────
  protected readonly incertidumbreSoftwareDisplay = computed(() => {
    const stored = this.#store.velocityIntroduction().incertidumbreSoftware;
    return stored !== null ? stored.toString() : '—';
  });

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoDisparo = computed(() =>
    mapShotStatusToEstadoDisparo(this.selectedShotProgress()?.status, this.#store.velocityIntroduction().estadoDisparo),
  );

  protected readonly estadoLabel = computed(() => {
    switch (this.estadoDisparo()) {
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
    switch (this.estadoDisparo()) {
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
    serie: this.#store.velocityIntroduction().serie,
    disparo: this.#store.velocityIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  protected readonly dataFormModel = signal<DataFormModel>({
    radarAntena: buildRadarAntenaCombinedValue(
      this.#store.velocityIntroduction().radarDoppler,
      this.#store.velocityIntroduction().antena,
    ),
  });
  protected readonly dataForm = form(this.dataFormModel);

  // ── Plain signals ──────────────────────────────────────────────────────────
  protected readonly velocidadField = signal<InputFieldValue>(
    numToField(this.#store.velocityIntroduction().velocidad, MeasureUnitEnum.M_S),
  );
  protected readonly perdidaField = signal<InputFieldValue>(
    numToField(this.#store.velocityIntroduction().perdida, MeasureUnitEnum.M_S),
  );
  protected readonly cadenciaField = signal<InputFieldValue>(
    numToField(this.#store.velocityIntroduction().cadencia, MeasureUnitEnum.SPM),
  );
  protected readonly observacionesField = signal<string | null>(this.#store.velocityIntroduction().observaciones);

  // ── Snapshot for dirty tracking (selectores serie/disparo excluidos) ───────
  // Solo comparación por valor contra el último snapshot guardado: el patch
  // del formulario tras el GET no debe marcar dirty, solo la interacción
  // del usuario que cambia valores.
  readonly #dirtyTracker = createDirtyTracker(() => ({
    radarAntena: this.dataFormModel().radarAntena,
    velocidad: this.velocidadField(),
    perdida: this.perdidaField(),
    cadencia: this.cadenciaField(),
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
    this.selectorFormModel.update((m) => ({
      ...m,
      serie,
      disparo,
    }));

    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  onCadenciaChange(value: string): void {
    const trimmed = value?.trim();
    this.cadenciaField.set(trimmed ? { value: trimmed, unit: CadenceUnitEnum.SPM } : null);
  }

  enableHistoricalEdit(): void {
    this.historicalEditEnabled.set(true);
  }

  resetForm(): void {
    const stored = this.#store.velocityIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.dataFormModel.set({
      radarAntena: buildRadarAntenaCombinedValue(stored.radarDoppler, stored.antena),
    });
    this.velocidadField.set(numToField(stored.velocidad, stored.velocidadUnit || SpeedUnitEnum.M_S));
    this.perdidaField.set(numToField(stored.perdida, stored.perdidaUnit || SpeedUnitEnum.M_S));
    this.cadenciaField.set(numToField(stored.cadencia, stored.cadenciaUnit || CadenceUnitEnum.SPM));
    this.observacionesField.set(stored.observaciones);
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    if (this.readOnly()) {
      return;
    }

    const { serie, disparo } = this.selectorFormModel();
    const { radarAntena } = this.dataFormModel();
    const { radarId, antennaId } = splitRadarAntenaCombinedValue(radarAntena);
    const fireTrialId = this.#store.fireTrialId();

    const initialVelocity = parseNum(this.velocidadField());
    const initialVelocityUnit = (this.velocidadField()?.unit as SpeedUnitEnum) || SpeedUnitEnum.M_S;
    const velocityLoss = parseNum(this.perdidaField());
    const velocityLossUnit = (this.perdidaField()?.unit as SpeedUnitEnum) || SpeedUnitEnum.M_S;
    const cadence = parseNum(this.cadenciaField());
    const cadenceUnit = (this.cadenciaField()?.unit as CadenceUnitEnum) || CadenceUnitEnum.SPM;
    const observaciones = this.observacionesField();

    this.#store.updateVelocityIntroduction({
      serie,
      disparo,
      radarDoppler: radarId,
      antena: antennaId,
      velocidad: initialVelocity,
      velocidadUnit: initialVelocityUnit,
      perdida: velocityLoss,
      perdidaUnit: velocityLossUnit,
      cadencia: cadence,
      cadenciaUnit: cadenceUnit,
      observaciones,
      estadoDisparo: this.estadoDisparo(),
    });

    if (fireTrialId && serie && disparo) {
      const payload = mapVelocityFormToRequest({
        radarAntena,
        initialVelocity,
        initialVelocityUnit,
        softwareUncertainty: this.#store.velocityIntroduction().incertidumbreSoftware,
        softwareUncertaintyUnit: SpeedUnitEnum.M_S,
        velocityLoss,
        velocityLossUnit,
        cadence,
        cadenceUnit,
        observations: observaciones,
      });
      try {
        await this.#executionService.setShotVelocity(fireTrialId, serie, disparo, payload);
        this.#syncSnapshot();
      } catch (error) {
        console.error('Failed to save shot velocity', error);
        throw error;
      }
    } else {
      this.#syncSnapshot();
    }
  }

  #syncSnapshot(): void {
    this.#dirtyTracker.syncSnapshot();
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
      const response = await this.#executionService.fetchShotVelocities(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData({ velocities: [] });
    }
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.updateVelocityIntroduction({
      serie,
      disparo,
      estadoDisparo: this.estadoDisparo(),
    });
  }

  #isShotInSerie(disparo: string | null, serie: string | null): boolean {
    if (!disparo || !serie) {
      return false;
    }

    return (
      this.#store
        .executionProgress()
        ?.series.some((series) => series.seriesId === serie && series.shots.some((shot) => shot.shotId === disparo)) ??
      false
    );
  }

  #getShotOrder(serie: string | null, disparo: string | null): number | null {
    if (!serie || !disparo) {
      return null;
    }

    let shotOrder = 0;
    for (const series of this.#store.executionProgress()?.series ?? []) {
      for (const shot of series.shots) {
        if (series.seriesId === serie && shot.shotId === disparo) {
          return shotOrder;
        }
        shotOrder += 1;
      }
    }

    return null;
  }

  #applyRemoteShotData(response: ShotVelocitiesResponse): void {
    const { serie, disparo } = this.selectorFormModel();
    const currentRadarAntena = this.dataFormModel().radarAntena;
    const currentSplit = splitRadarAntenaCombinedValue(currentRadarAntena);
    const nextState = mapRemoteToVelocityState(response, serie, disparo, this.estadoDisparo(), {
      radarDoppler: currentSplit.radarId,
      antena: currentSplit.antennaId,
    });

    this.#store.updateVelocityIntroduction(nextState);

    this.dataFormModel.set({
      radarAntena: buildRadarAntenaCombinedValue(nextState.radarDoppler ?? null, nextState.antena ?? null),
    });
    this.velocidadField.set(numToField(nextState.velocidad ?? null, nextState.velocidadUnit || SpeedUnitEnum.M_S));
    this.perdidaField.set(numToField(nextState.perdida ?? null, nextState.perdidaUnit || SpeedUnitEnum.M_S));
    this.cadenciaField.set(numToField(nextState.cadencia ?? null, nextState.cadenciaUnit || CadenceUnitEnum.SPM));
    this.observacionesField.set(nextState.observaciones ?? null);

    this.#syncSnapshot();
  }
}

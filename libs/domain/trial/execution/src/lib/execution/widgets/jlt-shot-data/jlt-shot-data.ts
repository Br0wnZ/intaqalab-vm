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
import { MEASURE_UNIT_LABELS, MeasureUnitEnum } from '@intaqalab/models';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { LOCALE_SIGNAL, createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { JltShotDataState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import type { JltShotDataRequest, JltShotDataResponse } from '../../../services/execution.service';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import { mapSelectedShotStatus, resolveInitialShotSelection } from '../utils/selection-options';
import { ShotEditButton } from '../utils/shot-edit-button';
import { injectShotFormLock } from '../utils/shot-form-lock';
import type { InputFieldValue, JltInheritedDefaults } from './jlt-shot-data.mapper';
import {
  calculateShotOrder,
  extractJltData,
  findLastShotId,
  mapEstadoDisparoToClass,
  mapEstadoDisparoToLabel,
  mapPlanningSeriesToOptions,
  mapPlanningShotsToDisparoOptions,
  mapRemoteToJltShotState,
  numToField,
  parseNum,
} from './jlt-shot-data.mapper';

interface JltShotDataSelectForm {
  serie: string | null;
  disparo: string | null;
}

@Component({
  selector: 'inta-jlt-shot-data',
  imports: [
    FormField,
    ReadonlyContentDirective,
    FormTouchDirective,
    ShotEditButton,
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
    <div intaFormTouch class="h-full rounded-2xl bg-white p-3 flex flex-col gap-2 overflow-auto" #touch="intaFormTouch">
      <!-- Header -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex items-center justify-center shrink-0">
            <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          </div>
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncat">
            {{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.SERIE_PLACEHOLDER' | translate"
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
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.DISPARO_PLACEHOLDER' | translate"
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
          {{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <inta-shot-edit-button [lock]="shotLock" />

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- Fields layout: 3 columns (Col 1: JET + Atacado/Retroceso, Col 2: Operador, Col 3: Observaciones) -->
      <div
        class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr] gap-x-3 gap-y-2 min-h-0 content-start"
        [intaReadonlyContent]="readOnly()"
      >
        <!-- ── Col 1: JET + Atacado / Retroceso ────────────────────────────── -->
        <div class="flex flex-col gap-2">
          <!-- JET -->
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-700 leading-tight">
              {{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.JET_LABEL' | translate }}
            </span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <input
                matInput
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.JET_PLACEHOLDER' | translate"
                [value]="jetDisplayValue()"
                (input)="jetField.set($any($event.target).value || null)"
              />
            </mat-form-field>
          </div>

          <!-- Atacado & Retroceso (2 columns) -->
          <div class="grid grid-cols-2 gap-2">
            <!-- Atacado -->
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold text-gray-700 leading-tight">
                {{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ATACADO_LABEL' | translate }}
              </span>
              <ui-input-select
                [showLabel]="false"
                [label]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ATACADO_LABEL' | translate"
                [opciones]="mmOptions"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ATACADO_PLACEHOLDER' | translate"
                [value]="atacadoField()"
                (valueChange)="atacadoField.set($event)"
              />
            </div>

            <!-- Retroceso -->
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold text-gray-700 leading-tight">
                {{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.RETROCESO_LABEL' | translate }}
              </span>
              <ui-input-select
                [showLabel]="false"
                [label]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.RETROCESO_LABEL' | translate"
                [opciones]="mmOptions"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.RETROCESO_PLACEHOLDER' | translate"
                [value]="retrocesoField()"
                (valueChange)="retrocesoField.set($event)"
              />
            </div>
          </div>
        </div>

        <!-- ── Col 2: Operador de la pieza ─────────────────────────────────── -->
        <div class="flex flex-col gap-2">
          <!-- Operador de la pieza -->
          <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold text-gray-700 leading-tight">
              {{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OPERADOR_PIEZA_LABEL' | translate }}
            </span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
              <input
                matInput
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OPERADOR_PIEZA_PLACEHOLDER' | translate"
                [value]="operadorPiezaDisplayValue()"
                (input)="operadorPiezaField.set($any($event.target).value || null)"
              />
            </mat-form-field>
          </div>
        </div>

        <!-- ── Col 3: Observaciones ────────────────────────────────────────── -->
        <div class="flex flex-col h-full col-span-1 md:col-span-2 lg:col-span-1">
          <!-- Spacer matching label height + gap so textarea aligns with inputs -->
          <div class="h-5 shrink-0"></div>
          <mat-form-field
            appearance="outline"
            subscriptSizing="dynamic"
            class="w-full flex-1 min-h-[116px] [&_.mat-mdc-text-field-wrapper]:!h-full [&_.mat-mdc-form-field-flex]:!h-full"
          >
            <textarea
              matInput
              rows="4"
              class="!resize-none !h-full"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OBSERVACIONES_PLACEHOLDER' | translate"
              [value]="observacionesField() ?? ''"
              (input)="observacionesField.set($any($event.target).value || null)"
            ></textarea>
          </mat-form-field>
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JltShotData extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);
  readonly #trialShots = injectTrialShots();
  readonly #locale = inject(LOCALE_SIGNAL);
  readonly #selectionKey = computed(() => shotSelectionKey(this.formModel().serie, this.formModel().disparo));
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  #hasManualSelection = false;

  constructor() {
    super();

    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const selection = resolveInitialShotSelection({
        seriesOptions: this.serieOptions(),
        activeSerieId: this.#store.activeSerieId(),
        activeShotId: this.#store.activeShotId(),
        getShotOptions: (serieId) => this.#shotOptionsForSerie(serieId),
      });
      const { serie: activeSerieId, disparo: activeShotId } = selection;

      if (!fireTrialId || !activeSerieId || !activeShotId) {
        return;
      }

      if (this.#hasManualSelection) {
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
  }

  // ── Unit options ───────────────────────────────────────────────────────────
  protected readonly mmOptions = [{ value: MeasureUnitEnum.MM, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.MM] }];

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#trialShots.series() ?? this.#store.planningSeries()),
  );

  protected readonly disparoOptions = computed(() => {
    return this.#shotOptionsForSerie(this.formModel().serie);
  });

  #shotOptionsForSerie(selectedSerie: string | null) {
    const series = this.#trialShots.series() ?? this.#store.planningSeries();
    const planningSerie = series?.find((serie) => serie.id === selectedSerie);
    const progressSerie = this.#store.executionProgress()?.series.find((serie) => serie.seriesId === selectedSerie);

    return mapPlanningShotsToDisparoOptions(planningSerie, progressSerie);
  }

  protected readonly selectedSeriesProgress = computed(() => {
    const selectedSerie = this.formModel().serie;
    return selectedSerie
      ? (this.#store.executionProgress()?.series.find((serie) => serie.seriesId === selectedSerie) ?? null)
      : null;
  });

  protected readonly selectedShotProgress = computed(() => {
    const selectedShot = this.formModel().disparo;
    const series = this.selectedSeriesProgress();
    return selectedShot ? (series?.shots.find((shot) => shot.shotId === selectedShot) ?? null) : null;
  });

  protected readonly isCurrentShot = computed(
    () =>
      this.formModel().serie === this.#store.activeSerieId() && this.formModel().disparo === this.#store.activeShotId(),
  );

  protected readonly selectedShotOrder = computed(() =>
    calculateShotOrder(this.#store.executionProgress()?.series, this.formModel().serie, this.formModel().disparo),
  );

  protected readonly activeShotOrder = computed(() =>
    calculateShotOrder(
      this.#store.executionProgress()?.series,
      this.#store.activeSerieId(),
      this.#store.activeShotId(),
    ),
  );

  protected readonly isFutureShot = computed(() => {
    const selectedShotOrder = this.selectedShotOrder();
    const activeShotOrder = this.activeShotOrder();

    if (selectedShotOrder !== null && activeShotOrder !== null) {
      return selectedShotOrder > activeShotOrder;
    }

    return !this.isCurrentShot() && this.selectedShotProgress()?.status === 'PENDING';
  });

  protected readonly shotLock = injectShotFormLock(() => ({
    serie: this.formModel().serie,
    disparo: this.formModel().disparo,
  }));

  protected readonly isHistoricalFiredShot = this.shotLock.isHistoricalFiredShot;
  protected readonly historicalEditEnabled = this.shotLock.historicalEditEnabled;
  protected readonly canEnableHistoricalEdit = this.shotLock.canEnableHistoricalEdit;

  protected readonly readOnly = computed(() => {
    return this.isFutureShot() || this.shotLock.readOnly();
  });

  protected readonly inheritedDefaults = signal<JltInheritedDefaults>({
    jet: null,
    pieceOperator: null,
  });

  protected readonly jetDisplayValue = computed(() => this.jetField() ?? this.inheritedDefaults().jet ?? '');

  protected readonly operadorPiezaDisplayValue = computed(
    () => this.operadorPiezaField() ?? this.inheritedDefaults().pieceOperator ?? '',
  );

  protected readonly estadoDisparo = computed(() =>
    mapSelectedShotStatus(
      this.#store.executionProgress(),
      this.formModel().serie,
      this.formModel().disparo,
      this.#store.activeSerieId(),
      this.#store.activeShotId(),
      this.#store.jltShotData().estadoDisparo,
    ),
  );

  // ── Estado del disparo (read-only output) ─────────────────────────────────
  protected readonly estadoLabel = computed(() => mapEstadoDisparoToLabel(this.estadoDisparo()));

  protected readonly estadoClass = computed(() => mapEstadoDisparoToClass(this.estadoDisparo()));

  // ── Numeric fields with units (ui-input-select) ────────────────────────────
  protected readonly atacadoField = signal<InputFieldValue>(
    numToField(this.#store.jltShotData().atacado, MeasureUnitEnum.MM, this.#locale()),
  );
  protected readonly retrocesoField = signal<InputFieldValue>(
    numToField(this.#store.jltShotData().retroceso, MeasureUnitEnum.MM, this.#locale()),
  );

  // ── Plain text signals ─────────────────────────────────────────────────────
  protected readonly jetField = signal<string | null>(this.#store.jltShotData().jet);
  protected readonly operadorPiezaField = signal<string | null>(this.#store.jltShotData().operadorPieza);
  protected readonly observacionesField = signal<string | null>(this.#store.jltShotData().observaciones);

  // ── Select form (FormField) ────────────────────────────────────────────────
  protected readonly formModel = signal<JltShotDataSelectForm>({
    serie: this.#store.jltShotData().serie,
    disparo: this.#store.jltShotData().disparo,
  });
  protected readonly selectForm = form(this.formModel);

  // ── Snapshot for dirty tracking (selectores serie/disparo excluidos) ────────
  // Solo comparación por valor: el patch tras el GET no marca dirty.
  readonly #dirtyTracker = createDirtyTracker(() => ({
    jet: this.jetField(),
    operadorPieza: this.operadorPiezaField(),
    observaciones: this.observacionesField(),
    atacado: this.atacadoField(),
    retroceso: this.retrocesoField(),
  }));

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  protected readonly isDirty = this.#dirtyTracker.isDirty;

  // ── FormWidget implementation ──────────────────────────────────────────────
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.touchRef()?.touched() ?? false,
    valid: this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  onSerieSelected(serie: string | null): void {
    this.#hasManualSelection = true;
    this.#setSelection(serie, this.#shotOptionsForSerie(serie)[0]?.value ?? null);
  }

  onDisparoSelected(disparo: string | null): void {
    this.#hasManualSelection = true;
    const current = this.formModel();
    this.formModel.set({
      ...current,
      disparo,
    });

    this.#syncSelectionToStore(current.serie, disparo);
    void this.#loadSelectedShotData();
  }

  setCurrentShot(): void {
    this.#hasManualSelection = false;
    const serie = this.#store.activeSerieId() ?? this.formModel().serie;
    const disparo = this.#store.activeShotId() ?? this.formModel().disparo;

    this.#setSelection(serie, disparo);
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.formModel.update((m) => ({
      ...m,
      serie,
      disparo,
    }));

    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  enableHistoricalEdit(): void {
    this.shotLock.enableHistoricalEdit();
  }

  resetForm(): void {
    const stored = this.#store.jltShotData();
    this.#hydrateLocalState(stored);
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    if (this.readOnly()) {
      return;
    }

    const { serie, disparo } = this.formModel();
    const jet = this.#resolvedJet();
    const operadorPieza = this.#resolvedPieceOperator();
    const updates: Partial<JltShotDataState> = {
      serie,
      disparo,
      jet,
      operadorPieza,
      observaciones: this.observacionesField(),
      atacado: parseNum(this.atacadoField()),
      retroceso: parseNum(this.retrocesoField()),
    };
    const fireTrialId = this.#store.fireTrialId();
    const request: JltShotDataRequest = {
      jet: updates.jet ?? '',
      pieceOperator: updates.operadorPieza ?? '',
      attackDistance: updates.atacado ?? null,
      attackDistanceUnit: MeasureUnitEnum.MM,
      recoilDistance: updates.retroceso ?? null,
      recoilDistanceUnit: MeasureUnitEnum.MM,
      observations: updates.observaciones ?? null,
    };

    this.#store.updateJltShotData(updates);
    if (fireTrialId && serie && disparo) {
      this.#executionService.setJltShotData(fireTrialId, serie, disparo, request);
    }
    this.#syncSnapshot();
    this.shotLock.lock();
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  #syncSnapshot(): void {
    this.#dirtyTracker.syncSnapshot();
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.formModel();
    const selectionKey = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();

    if (!fireTrialId || !serie || !disparo) {
      this.inheritedDefaults.set({ jet: null, pieceOperator: null });
      return;
    }

    const lastShotId = findLastShotId(this.#store.executionProgress()?.series, serie);
    const [currentShotResult] = await Promise.allSettled([
      this.#executionService.fetchJltShotData(fireTrialId, serie, disparo),
    ]);
    const [lastShotResult] = await Promise.allSettled([
      lastShotId ? this.#executionService.fetchJltShotData(fireTrialId, serie, lastShotId) : Promise.resolve(null),
    ]);

    if (!ticket.isFresh(selectionKey)) {
      return;
    }

    const lastShotPayload =
      lastShotResult.status === 'fulfilled' && lastShotResult.value ? extractJltData(lastShotResult.value) : null;

    const inheritedDefaults: JltInheritedDefaults = {
      jet: lastShotPayload?.jet || null,
      pieceOperator: lastShotPayload?.pieceOperator || null,
    };

    this.inheritedDefaults.set(inheritedDefaults);

    const remotePayload = currentShotResult.status === 'fulfilled' ? currentShotResult.value : null;
    this.#applyRemoteShotData(remotePayload, inheritedDefaults);
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.updateJltShotData({
      serie,
      disparo,
      estadoDisparo: this.estadoDisparo(),
    });
  }

  #resolvedJet(): string | null {
    return this.jetField() ?? this.inheritedDefaults().jet ?? null;
  }

  #resolvedPieceOperator(): string | null {
    return this.operadorPiezaField() ?? this.inheritedDefaults().pieceOperator ?? null;
  }

  #hydrateLocalState(
    stored: Pick<
      JltShotDataState,
      'serie' | 'disparo' | 'jet' | 'operadorPieza' | 'observaciones' | 'atacado' | 'retroceso'
    >,
  ): void {
    this.jetField.set(stored.jet);
    this.operadorPiezaField.set(stored.operadorPieza);
    this.observacionesField.set(stored.observaciones);
    this.atacadoField.set(numToField(stored.atacado, MeasureUnitEnum.MM, this.#locale()));
    this.retrocesoField.set(numToField(stored.retroceso, MeasureUnitEnum.MM, this.#locale()));
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
    });
  }

  #applyRemoteShotData(
    response: JltShotDataResponse | null | undefined,
    inheritedDefaults: JltInheritedDefaults = this.inheritedDefaults(),
  ): void {
    const { serie, disparo } = this.formModel();
    const nextState = mapRemoteToJltShotState(response, inheritedDefaults, {
      serie,
      disparo,
      estadoDisparo: this.estadoDisparo(),
    });

    this.#store.updateJltShotData(nextState);
    this.#hydrateLocalState({
      serie,
      disparo,
      jet: nextState.jet ?? null,
      operadorPieza: nextState.operadorPieza ?? null,
      observaciones: nextState.observaciones ?? null,
      atacado: nextState.atacado ?? null,
      retroceso: nextState.retroceso ?? null,
    });
    this.#syncSnapshot();
  }
}

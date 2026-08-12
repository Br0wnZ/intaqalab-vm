import type { Signal } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, input, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MEASURE_UNIT_LABELS, MeasureUnitEnum } from '@intaqalab/models';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { safeResourceValue } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { JltShotDataState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import type { JltShotDataResponse } from '../../../services/execution.service';
import { ExecutionService } from '../../../services/execution.service';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

type InputFieldValue = { value: string; unit: string } | null;

interface JltShotDataSelectForm {
  serie: string | null;
  disparo: string | null;
  equipoAtacado: string | null;
  equipoRetroceso: string | null;
}

@Component({
  selector: 'inta-jlt-shot-data',
  imports: [
    FormField,
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
    <div class="h-full rounded-2xl bg-white p-3 flex flex-col gap-2 overflow-auto">
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

        @if (canEnableHistoricalEdit()) {
          <button
            mat-icon-button
            type="button"
            [attr.aria-label]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ENABLE_EDIT' | translate"
            [attr.title]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ENABLE_EDIT' | translate"
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

      <!-- Fields grid: 4 cols, 2 rows (last col = Observaciones spanning 2 rows) -->
      <div
        [attr.inert]="readOnly() ? '' : null"
        [class.inta-readonly-content]="readOnly()"
        class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-1 min-h-0 content-start"
      >
        <!-- ── Row 1 ──────────────────────────────────────────────── -->

        <!-- JET -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.JET_LABEL' | translate }}</mat-label>
          <input
            matInput
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.JET_PLACEHOLDER' | translate"
            [value]="jetDisplayValue()"
            (input)="jetField.set($any($event.target).value || null)"
          />
        </mat-form-field>

        <!-- Equipo Atacado -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.EQUIPO_ATACADO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.EQUIPO_ATACADO_PLACEHOLDER' | translate"
            [formField]="selectForm.equipoAtacado"
          >
            @for (opt of equipoAtacadoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Atacado (numérico + unidad) -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ATACADO_LABEL' | translate"
          [opciones]="mmOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.ATACADO_PLACEHOLDER' | translate"
          [value]="atacadoField()"
          (valueChange)="atacadoField.set($event)"
        />

        <!-- Observaciones (spans 2 rows) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 h-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="4"
            class="resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="observacionesField.set($any($event.target).value || null)"
          ></textarea>
        </mat-form-field>

        <!-- ── Row 2 ──────────────────────────────────────────────── -->

        <!-- Operador de la pieza -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OPERADOR_PIEZA_LABEL' | translate }}</mat-label>
          <input
            matInput
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.OPERADOR_PIEZA_PLACEHOLDER' | translate"
            [value]="operadorPiezaDisplayValue()"
            (input)="operadorPiezaField.set($any($event.target).value || null)"
          />
        </mat-form-field>

        <!-- Equipo Retroceso -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.EQUIPO_RETROCESO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.EQUIPO_RETROCESO_PLACEHOLDER' | translate"
            [formField]="selectForm.equipoRetroceso"
          >
            @for (opt of equipoRetrocesoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Retroceso (numérico + unidad) -->
        <ui-input-select
          [label]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.RETROCESO_LABEL' | translate"
          [opciones]="mmOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.RETROCESO_PLACEHOLDER' | translate"
          [value]="retrocesoField()"
          (valueChange)="retrocesoField.set($event)"
        />
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
  readonly #selectionKey = computed(() => `${this.formModel().serie ?? ''}|${this.formModel().disparo ?? ''}`);

  constructor() {
    super();

    effect(() => {
      const response = safeResourceValue(this.#executionService.jltShotDataResource);
      if (response) {
        this.#applyRemoteShotData(response);
      }
    });

    effect(() => {
      const response = safeResourceValue(this.#executionService.updateJltShotDataResource);
      if (response) {
        this.#applyRemoteShotData(response);
      }
    });

    effect(() => {
      this.#selectionKey();
      this.historicalEditEnabled.set(false);
    });
  }

  // ── Unit options ───────────────────────────────────────────────────────────
  protected readonly mmOptions = [{ value: MeasureUnitEnum.MM, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.MM] }];

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => {
    const planningSeries = this.#store.planningSeries();
    if (planningSeries?.length) {
      return planningSeries.map((serie, index) => ({
        value: serie.id,
        label: serie.name?.trim() || `Serie ${index + 1}`,
      }));
    }

    return this.#store.jltShotData().serieOptions;
  });

  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.formModel().serie;
    const series = this.#store.executionProgress()?.series;
    const shots = selectedSerie ? series?.find((serie) => serie.seriesId === selectedSerie)?.shots : undefined;

    if (shots?.length) {
      return shots.map((shot, index) => ({
        value: shot.shotId,
        label: `Disparo ${index + 1}`,
      }));
    }

    return this.#store.jltShotData().disparoOptions;
  });
  protected readonly equipoAtacadoOptions = computed(() => this.#store.jltShotData().equipoAtacadoOptions);
  protected readonly equipoRetrocesoOptions = computed(() => this.#store.jltShotData().equipoRetrocesoOptions);
  protected readonly selectedSeriesProgress = computed(() => {
    const selectedSerie = this.formModel().serie;
    return selectedSerie
      ? this.#store.executionProgress()?.series.find((serie) => serie.seriesId === selectedSerie) ?? null
      : null;
  });

  protected readonly selectedShotProgress = computed(() => {
    const selectedShot = this.formModel().disparo;
    const series = this.selectedSeriesProgress();
    return selectedShot ? series?.shots.find((shot) => shot.shotId === selectedShot) ?? null : null;
  });

  protected readonly isCurrentShot = computed(
    () => this.formModel().serie === this.#store.activeSerieId() && this.formModel().disparo === this.#store.activeShotId(),
  );

  protected readonly isFutureShot = computed(() => !this.isCurrentShot() && this.selectedShotProgress()?.status === 'PENDING');

  protected readonly isHistoricalFiredShot = computed(
    () => !this.isCurrentShot() && this.selectedShotProgress()?.status === 'FIRED',
  );

  protected readonly historicalEditEnabled = signal(false);

  protected readonly canEnableHistoricalEdit = computed(
    () => !this.#store.isTrialReadOnly() && this.isHistoricalFiredShot() && !this.historicalEditEnabled(),
  );

  protected readonly readOnly = computed(
    () => this.#store.isTrialReadOnly() || this.isFutureShot() || (this.isHistoricalFiredShot() && !this.historicalEditEnabled()),
  );

  protected readonly inheritedDefaults = signal<{ jet: string | null; pieceOperator: string | null }>({
    jet: null,
    pieceOperator: null,
  });

  protected readonly jetDisplayValue = computed(() => this.jetField() ?? this.inheritedDefaults().jet ?? '');

  protected readonly operadorPiezaDisplayValue = computed(
    () => this.operadorPiezaField() ?? this.inheritedDefaults().pieceOperator ?? '',
  );

  protected readonly estadoDisparo = computed(() => {
    const shotStatus = this.selectedShotProgress()?.status ?? null;

    switch (shotStatus) {
      case 'ACTIVE':
        return 'EN_CURSO';
      case 'PENDING':
        return 'PENDIENTE';
      case 'FIRED':
        return 'EJECUTADA';
      default:
        return this.#store.jltShotData().estadoDisparo;
    }
  });

  // ── Estado del disparo (read-only output) ─────────────────────────────────
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
        return 'bg-blue-100 text-blue-700';
      case 'EJECUTADA':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  });

  // ── Numeric fields with units (ui-input-select) ────────────────────────────
  protected readonly atacadoField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltShotData().atacado, MeasureUnitEnum.MM),
  );
  protected readonly retrocesoField = signal<InputFieldValue>(
    this.#numToField(this.#store.jltShotData().retroceso, MeasureUnitEnum.MM),
  );

  // ── Plain text signals ─────────────────────────────────────────────────────
  protected readonly jetField = signal<string | null>(this.#store.jltShotData().jet);
  protected readonly operadorPiezaField = signal<string | null>(this.#store.jltShotData().operadorPieza);
  protected readonly observacionesField = signal<string | null>(this.#store.jltShotData().observaciones);

  // ── Select form (FormField) ────────────────────────────────────────────────
  protected readonly formModel = signal<JltShotDataSelectForm>({
    serie: this.#store.jltShotData().serie,
    disparo: this.#store.jltShotData().disparo,
    equipoAtacado: this.#store.jltShotData().equipoAtacado,
    equipoRetroceso: this.#store.jltShotData().equipoRetroceso,
  });
  protected readonly selectForm = form(this.formModel);

  // ── Snapshot for dirty tracking ────────────────────────────────────────────
  readonly #savedSnapshot = signal({
    jet: this.jetField(),
    operadorPieza: this.operadorPiezaField(),
    observaciones: this.observacionesField(),
    atacado: this.atacadoField(),
    retroceso: this.retrocesoField(),
  });

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  protected readonly isDirty = computed(() => {
    if (this.selectForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      this.jetField() !== snap.jet ||
      this.operadorPiezaField() !== snap.operadorPieza ||
      this.observacionesField() !== snap.observaciones ||
      JSON.stringify(this.atacadoField()) !== JSON.stringify(snap.atacado) ||
      JSON.stringify(this.retrocesoField()) !== JSON.stringify(snap.retroceso)
    );
  });

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectForm().valid(),
    hasChanges: this.isDirty(),
  }));

  override ngOnInit(): void {
    super.ngOnInit();
    void this.#loadSelectedShotData();
  }

  onSerieSelected(serie: string | null): void {
    const current = this.formModel();
    const disparo = this.#isShotInSerie(current.disparo, serie) ? current.disparo : null;

    this.formModel.set({
      ...current,
      serie,
      disparo,
    });

    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    const current = this.formModel();
    this.formModel.set({
      ...current,
      disparo,
    });

    this.#syncSelectionToStore(current.serie, disparo);
    void this.#loadSelectedShotData();
  }

  setCurrentShot(): void {
    const serie = this.#store.activeSerieId() ?? this.formModel().serie;
    const disparo = this.#store.activeShotId() ?? this.formModel().disparo;

    this.formModel.update((m) => ({
      ...m,
      serie,
      disparo,
    }));

    this.#syncSelectionToStore(serie, disparo);
    void this.#loadSelectedShotData();
  }

  enableHistoricalEdit(): void {
    this.historicalEditEnabled.set(true);
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

    const { serie, disparo, equipoAtacado, equipoRetroceso } = this.formModel();
    const jet = this.#resolvedJet();
    const operadorPieza = this.#resolvedPieceOperator();
    const updates: Partial<JltShotDataState> = {
      serie,
      disparo,
      equipoAtacado,
      equipoRetroceso,
      jet,
      operadorPieza,
      observaciones: this.observacionesField(),
      atacado: this.#parseNum(this.atacadoField()),
      retroceso: this.#parseNum(this.retrocesoField()),
    };

    this.#store.updateJltShotData(updates);

    const fireTrialId = this.#store.fireTrialId();
    if (fireTrialId && serie && disparo) {
      this.#executionService.setJltShotData(fireTrialId, serie, disparo, {
        jet: jet ?? '',
        pieceOperator: operadorPieza ?? '',
        attackDistance: updates.atacado ?? null,
        attackDistanceUnit: MeasureUnitEnum.MM,
        recoilDistance: updates.retroceso ?? null,
        recoilDistanceUnit: MeasureUnitEnum.MM,
        observations: this.observacionesField(),
      });
    }

    this.#syncSnapshot();
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  #numToField(value: number | null, unit: string): InputFieldValue {
    return value !== null ? { value: value.toString(), unit } : null;
  }

  #parseNum(field: InputFieldValue): number | null {
    if (!field) return null;
    const n = parseFloat(field.value);
    return isNaN(n) ? null : n;
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      jet: this.jetField(),
      operadorPieza: this.operadorPiezaField(),
      observaciones: this.observacionesField(),
      atacado: this.atacadoField(),
      retroceso: this.retrocesoField(),
    });
  }

  async #loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.formModel();
    if (!fireTrialId || !serie || !disparo) {
      this.inheritedDefaults.set({ jet: null, pieceOperator: null });
      return;
    }

    const selectionKey = `${serie}|${disparo}`;
    await this.#loadInheritedDefaults(fireTrialId, serie);

    if (this.#selectionKey() !== selectionKey) {
      return;
    }

    this.#executionService.getJltShotData(fireTrialId, serie, disparo);
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.updateJltShotData({
      serie,
      disparo,
      estadoDisparo: this.estadoDisparo(),
    });
  }

  #isShotInSerie(disparo: string | null, serie: string | null): boolean {
    if (!disparo || !serie) {
      return false;
    }

    return this.#store.executionProgress()?.series.some(
      (series) => series.seriesId === serie && series.shots.some((shot) => shot.shotId === disparo),
    ) ?? false;
  }

  async #loadInheritedDefaults(fireTrialId: string, serie: string): Promise<void> {
    const lastShotId = this.#findLastShotId(serie);
    if (!lastShotId) {
      this.inheritedDefaults.set({ jet: null, pieceOperator: null });
      return;
    }

    try {
      const response = await this.#executionService.fetchJltShotData(fireTrialId, serie, lastShotId);

      if (this.formModel().serie !== serie) {
        return;
      }

      this.inheritedDefaults.set({
        jet: response.jltData.jet || null,
        pieceOperator: response.jltData.pieceOperator || null,
      });
    } catch {
      this.inheritedDefaults.set({ jet: null, pieceOperator: null });
    }
  }

  #findLastShotId(serie: string): string | null {
    const shots = this.#store.executionProgress()?.series.find((item) => item.seriesId === serie)?.shots ?? [];
    return shots.length > 0 ? shots[shots.length - 1]?.shotId ?? null : null;
  }

  #resolvedJet(): string | null {
    return this.jetField() ?? this.inheritedDefaults().jet ?? null;
  }

  #resolvedPieceOperator(): string | null {
    return this.operadorPiezaField() ?? this.inheritedDefaults().pieceOperator ?? null;
  }

  #hydrateLocalState(stored: Pick<JltShotDataState, 'serie' | 'disparo' | 'equipoAtacado' | 'equipoRetroceso' | 'jet' | 'operadorPieza' | 'observaciones' | 'atacado' | 'retroceso'>): void {
    this.jetField.set(stored.jet);
    this.operadorPiezaField.set(stored.operadorPieza);
    this.observacionesField.set(stored.observaciones);
    this.atacadoField.set(this.#numToField(stored.atacado, MeasureUnitEnum.MM));
    this.retrocesoField.set(this.#numToField(stored.retroceso, MeasureUnitEnum.MM));
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      equipoAtacado: stored.equipoAtacado,
      equipoRetroceso: stored.equipoRetroceso,
    });
  }

  #applyRemoteShotData(response: JltShotDataResponse): void {
    const { serie, disparo, equipoAtacado, equipoRetroceso } = this.formModel();
    const data = response.jltData;
    const inheritedDefaults = this.inheritedDefaults();
    const nextState: Partial<JltShotDataState> = {
      serie,
      disparo,
      equipoAtacado,
      equipoRetroceso,
      jet: inheritedDefaults.jet ?? data.jet ?? null,
      operadorPieza: inheritedDefaults.pieceOperator ?? data.pieceOperator ?? null,
      observaciones: data.observations ?? null,
      atacado: data.attackDistance ?? null,
      retroceso: data.recoilDistance ?? null,
      estadoDisparo: this.estadoDisparo(),
    };

    this.#store.updateJltShotData(nextState);
    this.#hydrateLocalState({
      serie,
      disparo,
      equipoAtacado,
      equipoRetroceso,
      jet: nextState.jet ?? null,
      operadorPieza: nextState.operadorPieza ?? null,
      observaciones: nextState.observaciones ?? null,
      atacado: nextState.atacado ?? null,
      retroceso: nextState.retroceso ?? null,
    });
    this.#syncSnapshot();
  }
}

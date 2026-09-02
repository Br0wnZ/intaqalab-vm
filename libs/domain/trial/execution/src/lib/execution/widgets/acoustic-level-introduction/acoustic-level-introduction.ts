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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InputSelect, IntaIconComponent, SoundLevelMeterInput, type SoundLevelMeterValue } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type { ShotAcousticLevelResponse } from '../../models/shot-acoustic-level.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import { mapPlanningSeriesToOptions, mapShotsToDisparoOptions } from '../utils/selection-options';

type InputFieldValue = { value: string; unit: string } | null;

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

interface DataFormModel {
  equipo: string | null;
}

@Component({
  selector: 'inta-acoustic-level-introduction',
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
    SoundLevelMeterInput,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-3 flex flex-col gap-2">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-nowrap overflow-hidden pt-2">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight whitespace-nowrap">
            {{ 'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28 shrink-0">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.SERIE_PLACEHOLDER' | translate }}
          </mat-label>
          <mat-select [formField]="selectorForm.serie" (selectionChange)="onSerieSelected($event.value)">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-20 shrink-0">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.DISPARO_PLACEHOLDER' | translate }}
          </mat-label>
          <mat-select [formField]="selectorForm.disparo" (selectionChange)="onDisparoSelected($event.value)">
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" class="shrink-0 h-9 text-sm" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1 min-w-0"></div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- ── Body ────────────────────────────────────────────────────────── -->
      <div
        intaReadonlyContent
        class="flex-1 grid grid-cols-4 gap-x-3 gap-y-2 mt-2 items-start content-start min-h-0 overflow-hidden"
      >
        <!-- Row 1: Equipo, Distancia, Nivel, Observaciones (row-span-2) -->

        <!-- Equipo (Sonómetro) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full mt-2">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.EQUIPO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.EQUIPO_PLACEHOLDER' | translate"
            [formField]="dataForm.equipo"
          >
            @for (opt of equipoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Distancia sonómetro-boca -->
        <ui-input-select
          subscriptSizing="dynamic"
          class="mt-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.DISTANCIA_BOCA_LABEL' | translate"
          [opciones]="mOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.DISTANCIA_BOCA_PLACEHOLDER' | translate"
          [value]="distanciaBocaField()"
          (valueChange)="distanciaBocaField.set($event)"
        />

        <!-- Nivel acústico -->
        <ui-input-select
          class="mt-2"
          [label]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.NIVEL_ACUSTICO_LABEL' | translate"
          [opciones]="dbOptions"
          [placeholder]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.NIVEL_ACUSTICO_PLACEHOLDER' | translate"
          [value]="nivelAcusticoField()"
          (valueChange)="nivelAcusticoField.set($event)"
        />

        <!-- Observaciones (spans 2 rows) -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full row-span-2 mt-2">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.OBSERVACIONES_LABEL' | translate }}
          </mat-label>
          <textarea
            matInput
            rows="3"
            class="resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.OBSERVACIONES_PLACEHOLDER' | translate"
            [value]="observacionesField() ?? ''"
            (input)="observacionesField.set($any($event.target).value || null)"
          ></textarea>
        </mat-form-field>

        <!-- Row 2: Posición Sonómetro (X, Y, Z) - ocupa 3 columnas -->
        <ui-sound-level-meter-input
          class="col-span-3"
          [label]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.SONOMETRO_POSITION_LABEL' | translate"
          [xLabel]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.X_SONOMETRO_LABEL' | translate"
          [yLabel]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.Y_SONOMETRO_LABEL' | translate"
          [zLabel]="'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.Z_SONOMETRO_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="mOptions"
          [disabled]="readOnly()"
          [value]="sonometroPositionField()"
          (valueChange)="sonometroPositionField.set($event)"
        />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcousticLevelIntroduction extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);

  readonly #selectionKey = computed(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);

  // ── Unit options ───────────────────────────────────────────────────────────
  protected readonly mOptions = [{ value: 'm', label: 'm' }];
  protected readonly dbOptions = [{ value: 'db', label: 'db' }];

  // ── Options from store ─────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#store.planningSeries(), this.#store.acousticLevelIntroduction().serieOptions),
  );
  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    const progressShots = this.#store
      .executionProgress()
      ?.series.find((serie) => serie.seriesId === selectedSerie)?.shots;
    if (progressShots?.length) {
      return mapShotsToDisparoOptions(progressShots, this.#store.acousticLevelIntroduction().disparoOptions);
    }
    const planningShots = this.#store.planningSeries()?.find((serie) => serie.id === selectedSerie)?.shots;
    if (planningShots?.length) {
      return mapShotsToDisparoOptions(planningShots, this.#store.acousticLevelIntroduction().disparoOptions);
    }
    return this.#store.acousticLevelIntroduction().disparoOptions;
  });
  protected readonly equipoOptions = computed(() => this.#store.acousticLevelIntroduction().equipoOptions);

  // ── ReadOnly State ─────────────────────────────────────────────────────────
  protected readonly readOnly = computed(() => this.#store.isTrialReadOnly());

  // ── Estado del disparo ─────────────────────────────────────────────────────
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.acousticLevelIntroduction().estadoDisparo) {
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
    switch (this.#store.acousticLevelIntroduction().estadoDisparo) {
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

  // ── Form models ────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.acousticLevelIntroduction().serie,
    disparo: this.#store.acousticLevelIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  protected readonly dataFormModel = signal<DataFormModel>({
    equipo: this.#store.acousticLevelIntroduction().equipo,
  });
  protected readonly dataForm = form(this.dataFormModel);

  // ── Plain signals ──────────────────────────────────────────────────────────
  protected readonly distanciaBocaField = signal<InputFieldValue>(
    this.#numToField(this.#store.acousticLevelIntroduction().distanciaSonometroBoca, 'm'),
  );
  protected readonly nivelAcusticoField = signal<InputFieldValue>(
    this.#numToField(this.#store.acousticLevelIntroduction().nivelAcustico, 'db'),
  );
  protected readonly sonometroPositionField = signal<SoundLevelMeterValue | null>({
    x: this.#store.acousticLevelIntroduction().xSonometro,
    y: this.#store.acousticLevelIntroduction().ySonometro,
    z: this.#store.acousticLevelIntroduction().zSonometro,
    unit: 'm',
  });
  protected readonly observacionesField = signal<string | null>(this.#store.acousticLevelIntroduction().observaciones);

  // ── Snapshot for dirty tracking ────────────────────────────────────────────
  readonly #savedSnapshot = signal({
    distanciaBoca: this.distanciaBocaField(),
    nivelAcustico: this.nivelAcusticoField(),
    sonometroPosition: this.sonometroPositionField(),
    observaciones: this.observacionesField(),
  });

  protected readonly isDirty = computed(() => {
    if (this.selectorForm().dirty() || this.dataForm().dirty()) return true;
    const snap = this.#savedSnapshot();
    return (
      JSON.stringify(this.distanciaBocaField()) !== JSON.stringify(snap.distanciaBoca) ||
      JSON.stringify(this.nivelAcusticoField()) !== JSON.stringify(snap.nivelAcustico) ||
      JSON.stringify(this.sonometroPositionField()) !== JSON.stringify(snap.sonometroPosition) ||
      this.observacionesField() !== snap.observaciones
    );
  });

  // ── FormWidget implementation ──────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.selectorForm().valid() && this.dataForm().valid(),
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();

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
    this.selectorFormModel.update((m) => ({ ...m, serie }));
    this.#store.updateAcousticLevelIntroduction({ serie });
    void this.#loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    this.selectorFormModel.update((m) => ({ ...m, disparo }));
    this.#store.updateAcousticLevelIntroduction({ disparo });
    void this.#loadSelectedShotData();
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.selectorFormModel.update((m) => ({
      ...m,
      serie,
      disparo,
    }));
    this.#store.updateAcousticLevelIntroduction({ serie, disparo });
    void this.#loadSelectedShotData();
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
      const response = await this.#executionService.fetchShotAcousticLevel(fireTrialId, serie, disparo);
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

  #applyRemoteShotData(response: ShotAcousticLevelResponse): void {
    const data = response?.acousticLevelData;
    if (!data) return;

    this.#store.updateAcousticLevelIntroduction({
      equipo: data.soundLevelMeterId ?? null,
      xSonometro: data.soundLevelMeterX ?? null,
      ySonometro: data.soundLevelMeterY ?? null,
      zSonometro: data.soundLevelMeterZ ?? null,
      distanciaSonometroBoca: data.soundLevelMeterMuzzleDistance ?? null,
      nivelAcustico: data.acousticLevel ?? null,
      observaciones: data.observations ?? null,
    });

    if (data.soundLevelMeterId !== undefined) {
      this.dataFormModel.set({ equipo: data.soundLevelMeterId ?? null });
    }
    if (data.soundLevelMeterMuzzleDistance !== undefined) {
      this.distanciaBocaField.set(this.#numToField(data.soundLevelMeterMuzzleDistance, 'm'));
    }
    if (data.acousticLevel !== undefined) {
      this.nivelAcusticoField.set(this.#numToField(data.acousticLevel, 'db'));
    }
    this.sonometroPositionField.set({
      x: data.soundLevelMeterX ?? null,
      y: data.soundLevelMeterY ?? null,
      z: data.soundLevelMeterZ ?? null,
      unit: 'm',
    });
    if (data.observations !== undefined) {
      this.observacionesField.set(data.observations ?? null);
    }

    this.#syncSnapshot();
  }

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    const serie = activeSerieId() ?? this.selectorFormModel().serie;
    const disparo = activeShotId() ?? this.selectorFormModel().disparo;
    this.#setSelection(serie, disparo);
  }

  resetForm(): void {
    const stored = this.#store.acousticLevelIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.dataFormModel.set({ equipo: stored.equipo });
    this.distanciaBocaField.set(this.#numToField(stored.distanciaSonometroBoca, 'm'));
    this.nivelAcusticoField.set(this.#numToField(stored.nivelAcustico, 'db'));
    this.sonometroPositionField.set({
      x: stored.xSonometro,
      y: stored.ySonometro,
      z: stored.zSonometro,
      unit: 'm',
    });
    this.observacionesField.set(stored.observaciones);
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const { equipo } = this.dataFormModel();
    const position = this.sonometroPositionField();
    const updates = {
      serie,
      disparo,
      equipo,
      distanciaSonometroBoca: this.#parseNum(this.distanciaBocaField()),
      distanciaSonometroBocaUnit: this.distanciaBocaField()?.unit ?? 'm',
      nivelAcustico: this.#parseNum(this.nivelAcusticoField()),
      nivelAcusticoUnit: this.nivelAcusticoField()?.unit ?? 'db',
      xSonometro: position?.x ?? null,
      ySonometro: position?.y ?? null,
      zSonometro: position?.z ?? null,
      observaciones: this.observacionesField(),
    };
    this.#store.updateAcousticLevelIntroduction(updates);

    const fireTrialId = this.#store.fireTrialId();
    if (fireTrialId && serie && disparo) {
      await this.#executionService.updateShotAcousticLevel(fireTrialId, serie, disparo, {
        soundLevelMeterId: equipo,
        soundLevelMeterX: position?.x ?? null,
        soundLevelMeterY: position?.y ?? null,
        soundLevelMeterZ: position?.z ?? null,
        soundLevelMeterMuzzleDistance: this.#parseNum(this.distanciaBocaField()),
        acousticLevel: this.#parseNum(this.nivelAcusticoField()),
        observations: this.observacionesField(),
      });
    }

    this.#syncSnapshot();
  }

  // ── Public helper (used in template) ──────────────────────────────────────
  parseNum(raw: string): number | null {
    if (!raw || raw.trim() === '') return null;
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
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
      distanciaBoca: this.distanciaBocaField(),
      nivelAcustico: this.nivelAcusticoField(),
      sonometroPosition: this.sonometroPositionField(),
      observaciones: this.observacionesField(),
    });
  }
}

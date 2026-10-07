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
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent, SoundLevelMeterInput, type SoundLevelMeterValue } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import type { MaoTopographyState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type { ShotMaoTopographyResponse } from '../../models/shot-mao-topography.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import { mapPlanningSeriesToOptions, mapShotsToDisparoOptions } from '../utils/selection-options';
import type {
  MaoTopographyMassConfigDialogData,
  MaoTopographyMassConfigDialogResult,
} from './mao-topography-mass-config-dialog';
import { MaoTopographyMassConfigDialog } from './mao-topography-mass-config-dialog';
import {
  fromPosition,
  numToField,
  parseNum,
  toPosition,
} from './mao-topography.mapper';

interface MaoTopographySelectForm {
  serie: string | null;
  disparo: string | null;
  observador: string | null;
}

@Component({
  selector: 'inta-mao-topography',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    SoundLevelMeterInput,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-4 overflow-auto">
      <!-- Header -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-44">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.SERIE_PLACEHOLDER' | translate"
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
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.DISPARO_PLACEHOLDER' | translate"
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
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1"></div>

        <!-- Aplicar configuración masiva -->
        <button mat-flat-button color="primary" type="button" (click)="openMassConfig()">
          {{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.MASS_CONFIG_BTN' | translate }}
        </button>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start bg-blue-100 text-blue-700">
          En curso
        </span>
      </div>

      <!-- Fields: 4 columns layout -->
      <div
        intaReadonlyContent
        class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-8 items-end content-start min-h-0 pt-2.5 pb-2 overflow-y-auto"
      >
        <!-- Pieza Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-3"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.PIEZA_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="metersOptions"
          [disabled]="readOnly()"
          [value]="piezaPosition()"
          (valueChange)="piezaPosition.set($event)"
        />

        <!-- Blanco Position -->
        <ui-sound-level-meter-input
          size="small"
          class="col-span-1 md:col-span-3"
          [label]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.BLANCO_GROUP_LABEL' | translate"
          [placeholder]="'0'"
          [unitOptions]="metersOptions"
          [disabled]="readOnly() || !blancoEnabled()"
          [value]="blancoPosition()"
          (valueChange)="blancoPosition.set($event)"
        />

        <!-- Observador -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="col-span-1 md:col-span-1 w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OBSERVADOR_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.OBSERVADOR_PLACEHOLDER' | translate"
            [formField]="selectForm.observador"
          >
            @for (opt of observadorOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [
    `
      inta-mao-topography ui-sound-level-meter-input {
        width: 100%;
      }
      inta-mao-topography ui-sound-level-meter-input .flex {
        gap: 0.25rem !important;
        padding-left: 0.375rem !important;
        padding-right: 0.375rem !important;
      }
      inta-mao-topography ui-sound-level-meter-input input {
        max-width: 2rem;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaoTopography extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #executionService = inject(ExecutionService);
  readonly #dialog = inject(MatDialog);

  readonly #selectionKey = computed(() => shotSelectionKey(this.formModel().serie, this.formModel().disparo));
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());
  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  readonly #remoteObservations = signal<string | null>(null);

  // ── Unit options ──────────────────────────────────────────────────────────
  protected readonly metersOptions = [{ value: 'm', label: 'm' }];

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly observadorOptions = computed(() => this.#store.maoTopography().observadorOptions);
  protected readonly blancoEnabled = computed(() => this.#store.maoTopography().blancoEnabled);
  protected readonly serieOptions = computed(() => mapPlanningSeriesToOptions(this.#store.planningSeries(), []));
  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.formModel().serie;
    const planningShots = this.#store.planningSeries()?.find((serie) => serie.id === selectedSerie)?.shots;
    const progressShots = this.#store
      .executionProgress()
      ?.series.find((serie) => serie.seriesId === selectedSerie)?.shots;
    if (progressShots?.length) {
      return mapShotsToDisparoOptions(
        progressShots.map((shot) => ({
          ...shot,
          globalNumber: planningShots?.find((planningShot) => planningShot.id === shot.shotId)?.globalNumber,
        })),
        [],
      );
    }
    if (planningShots?.length) {
      return mapShotsToDisparoOptions(planningShots, []);
    }
    return [];
  });

  // ── ReadOnly State ─────────────────────────────────────────────────────────
  protected readonly readOnly = computed(() => this.#store.isTrialReadOnly());

  // ── Position signals ──────────────────────────────────────────────────────
  protected readonly piezaPosition = signal<SoundLevelMeterValue | null>(null);
  protected readonly blancoPosition = signal<SoundLevelMeterValue | null>(null);

  // ── Select form (Signal Forms for dirty tracking of selectors) ────────────
  protected readonly formModel = signal<MaoTopographySelectForm>({
    serie: this.#store.maoTopography().serie,
    disparo: this.#store.maoTopography().disparo,
    observador: this.#store.maoTopography().observador,
  });
  protected readonly selectForm = form(this.formModel);

  // ── Snapshot for numeric dirty tracking ───────────────────────────────────
  readonly #savedSnapshot = signal<{
    piezaPosition: SoundLevelMeterValue | null;
    blancoPosition: SoundLevelMeterValue | null;
  }>({
    piezaPosition: this.piezaPosition(),
    blancoPosition: this.blancoPosition(),
  });

  // ── Dirty: any numeric field differs from snapshot ─────────────────────────
  // Nota: selectores serie/disparo son de consulta (solo disparan GET) — nunca cuentan en dirty.
  protected readonly isDirty = computed(() => {
    const snap = this.#savedSnapshot();
    return (
      JSON.stringify(this.piezaPosition()) !== JSON.stringify(snap.piezaPosition) ||
      JSON.stringify(this.blancoPosition()) !== JSON.stringify(snap.blancoPosition)
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
    this.#applyFieldsFromStore();
    this.#syncSnapshot();

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
    this.#store.updateMaoTopography({ serie });
    void this.#loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    this.formModel.update((m) => ({ ...m, disparo }));
    this.#store.updateMaoTopography({ disparo });
    void this.#loadSelectedShotData();
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.formModel.update((m) => ({
      ...m,
      serie,
      disparo,
    }));
    this.#store.updateMaoTopography({ serie, disparo });
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
      const response = await this.#executionService.fetchShotMaoTopography(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.#clearShotData();
    }
  }

  #applyRemoteShotData(response: ShotMaoTopographyResponse): void {
    const data = response?.maoTopographyData ?? null;

    if (!data) {
      this.#clearShotData();
      return;
    }

    this.#remoteObservations.set(data?.observations ?? null);

    this.#store.updateMaoTopography({
      xPieza: data?.pieceX ?? null,
      yPieza: data?.pieceY ?? null,
      zPieza: data?.pieceZ ?? null,
      xBlanco: data?.targetX ?? null,
      yBlanco: data?.targetY ?? null,
      zBlanco: data?.targetZ ?? null,
    });

    this.#applyFieldsFromStore();
    this.#syncSnapshot();
  }

  #clearShotData(): void {
    this.#remoteObservations.set(null);
    this.formModel.update((model) => ({ ...model, observador: null }));
    this.#store.updateMaoTopography({
      observador: null,
      xPieza: null,
      yPieza: null,
      zPieza: null,
      xBlanco: null,
      yBlanco: null,
      zBlanco: null,
    });
    this.#applyFieldsFromStore();
    this.#syncSnapshot();
  }

  resetForm(): void {
    const stored = this.#store.maoTopography();
    this.formModel.set({
      serie: stored.serie,
      disparo: stored.disparo,
      observador: stored.observador,
    });
    this.#applyFieldsFromStore();
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo, observador } = this.formModel();
    const pieza = fromPosition(this.piezaPosition());
    const blanco = fromPosition(this.blancoPosition());

    const xPieza = parseNum(pieza.x);
    const yPieza = parseNum(pieza.y);
    const zPieza = parseNum(pieza.z);
    const xBlanco = parseNum(blanco.x);
    const yBlanco = parseNum(blanco.y);
    const zBlanco = parseNum(blanco.z);

    const updates: Partial<MaoTopographyState> = {
      serie,
      disparo,
      observador,
      xPieza,
      yPieza,
      zPieza,
      xBlanco,
      yBlanco,
      zBlanco,
    };

    this.#store.updateMaoTopography(updates);

    // Propagate to radar trayectography widget
    this.#store.updateRadarTrayectographyMaoData({
      xPieza,
      yPieza,
      zPieza,
    });

    const fireTrialId = this.#store.fireTrialId();
    if (fireTrialId && serie && disparo) {
      await this.#executionService.updateShotMaoTopography(fireTrialId, serie, disparo, {
        pieceX: xPieza,
        pieceY: yPieza,
        pieceZ: zPieza,
        targetX: xBlanco,
        targetY: yBlanco,
        targetZ: zBlanco,
        observations: this.#remoteObservations(),
      });
    }

    this.#syncSnapshot();
  }

  setCurrentShot(): void {
    const { activeSerieId, activeShotId } = this.#store;
    const serie = activeSerieId() ?? this.formModel().serie;
    const disparo = activeShotId() ?? this.formModel().disparo;
    this.#setSelection(serie, disparo);
  }

  async openMassConfig(): Promise<void> {
    const pieza = fromPosition(this.piezaPosition());
    const blanco = fromPosition(this.blancoPosition());
    const current = {
      xPieza: pieza.x,
      yPieza: pieza.y,
      zPieza: pieza.z,
      xBlanco: blanco.x,
      yBlanco: blanco.y,
      zBlanco: blanco.z,
    };

    const fireTrialId = this.#store.fireTrialId() ?? null;
    const planningSeries = this.#store.planningSeries() ?? [];
    const executionSeries = this.#store.executionProgress()?.series ?? [];
    const shotIdsBySeries = Object.fromEntries(
      this.serieOptions().map((option) => {
        const plannedShots = planningSeries.find((series) => series.id === option.value)?.shots;
        const executedShots = executionSeries.find((series) => series.seriesId === option.value)?.shots;
        const shotIds = plannedShots?.length
          ? plannedShots.map((shot) => shot.id)
          : (executedShots?.map((shot) => shot.shotId) ?? []);
        return [option.value, shotIds];
      }),
    );
    const data: MaoTopographyMassConfigDialogData = {
      fireTrialId,
      serieOptions: this.serieOptions(),
      shotIdsBySeries,
      observadorOptions: this.observadorOptions(),
      current: {
        ...current,
        observador: this.formModel().observador,
      },
    };

    const ref = this.#dialog.open<
      MaoTopographyMassConfigDialog,
      MaoTopographyMassConfigDialogData,
      MaoTopographyMassConfigDialogResult
    >(
      MaoTopographyMassConfigDialog,
      {
        width: '800px',
        maxWidth: '800px',
        data,
      },
    );

    const result = await firstValueFrom(ref.afterClosed());

    if (result?.action !== 'apply') return;
    if (result.observador !== undefined) {
      this.formModel.update((m) => ({ ...m, observador: result.observador ?? null }));
    }

    const { serie, disparo } = this.formModel();
    if (serie && disparo && result.updatedShotIds.includes(disparo)) {
      await this.#loadSelectedShotData();
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      piezaPosition: this.piezaPosition(),
      blancoPosition: this.blancoPosition(),
    });
  }

  #applyFieldsFromStore(): void {
    const stored = this.#store.maoTopography();
    this.piezaPosition.set(
      toPosition(
        numToField(stored.xPieza, 'm', 1),
        numToField(stored.yPieza, 'm', 1),
        numToField(stored.zPieza, 'm', 1),
      ),
    );
    this.blancoPosition.set(
      toPosition(
        numToField(stored.xBlanco, 'm', 1),
        numToField(stored.yBlanco, 'm', 1),
        numToField(stored.zBlanco, 'm', 1),
      ),
    );
  }
}

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
import { FormField, form, min } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { injectTrialShots } from '@intaqalab/data-access-planning';
import { MeasureUnitEnum } from '@intaqalab/models';
import { IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective, NoNegativeValuesDirective, createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ExecutionService } from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { EquipmentTypeEnum, type ShotIpgPressuresRequest, type WidgetFormState } from '../../models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import {
  buildDisparoOptions,
  mapPlanningSeriesToOptions,
  mapSelectedShotStatus,
  mapSelectedShotStatusClass,
  mapSelectedShotStatusLabel,
  resolveInitialShotSelection,
} from '../utils/selection-options';
import { injectInitialIpgPressureEquipments } from './inject-initial-ipg-pressure-equipments';

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

interface DataFormModel {
  sensorIpg: string | null;
  micromodulo: string | null;
  pmax: number | null;
  observaciones: string;
}

@Component({
  selector: 'inta-medidas-presion-ipg',
  imports: [
    FormField,
    ReadonlyContentDirective,
    FormTouchDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    NoNegativeValuesDirective,
    LocaleDecimalInputDirective,
  ],
  template: `
    <div class="h-full rounded-2xl bg-white p-3 flex flex-col gap-2 overflow-auto">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-nowrap pt-1">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon [name]="'edit_line'" [color]="'var(--inta-button)'" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight whitespace-nowrap">
            {{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-36 shrink-0">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.SERIE_PLACEHOLDER' | translate }}
          </mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.SERIE_PLACEHOLDER' | translate"
            [formField]="selectorForm.serie"
            (selectionChange)="onSerieSelected($event.value)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28 shrink-0">
          <mat-label>
            {{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.DISPARO_PLACEHOLDER' | translate }}
          </mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.DISPARO_PLACEHOLDER' | translate"
            [formField]="selectorForm.disparo"
            (selectionChange)="onDisparoSelected($event.value)"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo actual -->
        <button mat-flat-button color="primary" type="button" class="shrink-0 h-9 text-sm" (click)="setCurrentShot()">
          {{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.CURRENT_SHOT_BTN' | translate }}
        </button>

        <div class="flex-1 min-w-0"></div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- ── Body ────────────────────────────────────────────────────────── -->
      <div
        intaFormTouch
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start min-h-0 mt-4"
        #touch="intaFormTouch"
      >
        <!-- Sensor IPG -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.SENSOR_IPG_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.SENSOR_IPG_PLACEHOLDER' | translate"
            [formField]="dataForm.sensorIpg"
          >
            @for (opt of sensorIpgOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Micromódulo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.MICROMODULO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.MICROMODULO_PLACEHOLDER' | translate"
            [formField]="dataForm.micromodulo"
          >
            @for (opt of micromoduloOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Pmax -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.PMAX_LABEL' | translate }}</mat-label>
          <input
            matInput
            type="number"
            libNoNegativeValues
            libLocalDecimal
            class="tabular-nums"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.PMAX_PLACEHOLDER' | translate"
            [formField]="dataForm.pmax"
          />
          <span matSuffix class="pr-3 text-sm text-gray-500 font-medium">
            {{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.PMAX_UNIT' | translate }}
          </span>
        </mat-form-field>

        <!-- Observaciones -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.OBSERVACIONES_LABEL' | translate }}</mat-label>
          <textarea
            matInput
            rows="2"
            class="!resize-none"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.MEDIDAS_PRESION_IPG.OBSERVACIONES_PLACEHOLDER' | translate"
            [formField]="dataForm.observaciones"
          ></textarea>
        </mat-form-field>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpgPressureMeasurements extends BaseFormWidgetComponent {
  readonly widgetId = input<string>('medidas-presion-ipg');
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #executionService = inject(ExecutionService);
  readonly #trialShots = injectTrialShots();

  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  readonly #itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});
  readonly #initialIpgEquipments = injectInitialIpgPressureEquipments();

  readonly #selectionKey = computed(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #selectionGuard = createSelectionGuard(() => this.#selectionKey());

  // ── Options: Series y Disparos ─────────────────────────────────────────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(
      this.#trialShots.series() ?? this.#store.planningSeries(),
      this.#store.medidasPresionIpg().serieOptions,
    ),
  );

  protected readonly disparoOptions = computed(() =>
    buildDisparoOptions({
      selectedSerie: this.selectorFormModel().serie,
      executionProgress: this.#store.executionProgress(),
      planningSeries: this.#trialShots.series() ?? this.#store.planningSeries(),
      storedOptions: this.#store.medidasPresionIpg().disparoOptions,
    }),
  );

  // ── Selected shot status ───────────────────────────────────────────────────
  protected readonly selectedShotStatus = computed(() =>
    mapSelectedShotStatus(
      this.#store.executionProgress(),
      this.selectorFormModel().serie,
      this.selectorFormModel().disparo,
      this.#store.activeSerieId(),
      this.#store.activeShotId(),
      this.#store.medidasPresionIpg().estadoDisparo,
      this.#store.isExecutionStarted(),
    ),
  );

  protected readonly estadoLabel = computed(() => mapSelectedShotStatusLabel(this.selectedShotStatus()));
  protected readonly estadoClass = computed(() => {
    const raw = this.selectedShotStatus();
    if (raw === 'EN_CURSO') return 'bg-green-100 text-green-700';
    if (raw === 'PENDIENTE') return 'bg-amber-100 text-amber-700';
    if (raw === 'EJECUTADA') return 'bg-slate-100 text-slate-600';
    return mapSelectedShotStatusClass(raw);
  });

  // ── Equipment Options (Sensor IPG & Micromódulo) ───────────────────────────
  protected readonly sensorIpgOptions = computed(() => {
    const { serie, disparo } = this.selectorFormModel();
    const assigned = this.#initialIpgEquipments().filter(
      (s) =>
        s.categoryId === EquipmentTypeEnum.IPG_SENSOR &&
        (!s.seriesIds?.length || Boolean(serie && s.seriesIds.includes(serie))) &&
        (!s.shotIds?.length || Boolean(disparo && s.shotIds.includes(disparo))),
    );

    const catalogItems = this.#itemsByCategory()[EquipmentTypeEnum.IPG_SENSOR] ?? [];
    const fromAssigned = assigned.map((sel) => {
      const found = catalogItems.find((item) => item.id === String(sel.equipmentItemId));
      return {
        value: String(sel.equipmentItemId),
        label: found?.label ?? `Sensor IPG #${sel.equipmentItemId}`,
      };
    });

    if (fromAssigned.length > 0) return fromAssigned;
    return this.#store.medidasPresionIpg().sensorIpgOptions;
  });

  protected readonly micromoduloOptions = computed(() => {
    const { serie, disparo } = this.selectorFormModel();
    const assigned = this.#initialIpgEquipments().filter(
      (s) =>
        s.categoryId === EquipmentTypeEnum.MICROMODULE &&
        (!s.seriesIds?.length || Boolean(serie && s.seriesIds.includes(serie))) &&
        (!s.shotIds?.length || Boolean(disparo && s.shotIds.includes(disparo))),
    );

    const catalogItems = this.#itemsByCategory()[EquipmentTypeEnum.MICROMODULE] ?? [];
    const fromAssigned = assigned.map((sel) => {
      const found = catalogItems.find((item) => item.id === String(sel.equipmentItemId));
      return {
        value: String(sel.equipmentItemId),
        label: found?.label ?? `Micromódulo #${sel.equipmentItemId}`,
      };
    });

    if (fromAssigned.length > 0) return fromAssigned;
    return this.#store.medidasPresionIpg().micromoduloOptions;
  });

  // ── Form Models ────────────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.medidasPresionIpg().serie,
    disparo: this.#store.medidasPresionIpg().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  protected readonly dataFormModel = signal<DataFormModel>({
    sensorIpg: this.#store.medidasPresionIpg().sensorIpg,
    micromodulo: this.#store.medidasPresionIpg().micromodulo,
    pmax: this.#store.medidasPresionIpg().pmax,
    observaciones: this.#store.medidasPresionIpg().observaciones ?? '',
  });
  protected readonly dataForm = form(this.dataFormModel, (f) => {
    min(f.pmax, 0);
  });

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  readonly #dirtyTracker = createDirtyTracker(() => ({
    sensorIpg: this.dataFormModel().sensorIpg,
    micromodulo: this.dataFormModel().micromodulo,
    pmax: this.dataFormModel().pmax,
    observaciones: this.dataFormModel().observaciones,
  }));

  protected readonly isDirty = this.#dirtyTracker.isDirty;
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  // ── FormWidget Contract ────────────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.touchRef()?.touched() ?? false,
    valid: this.selectorForm().valid() && this.dataForm().valid(),
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();

    this.#executionService
      .loadEquipmentItemsByCategories([EquipmentTypeEnum.IPG_SENSOR, EquipmentTypeEnum.MICROMODULE])
      .then((items) => this.#itemsByCategory.set(items))
      .catch((error: unknown) => {
        console.warn('Failed to load equipment catalog', error);
      });

    // Initial idempotent selection
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      const selection = resolveInitialShotSelection({
        seriesOptions: this.serieOptions() ?? [],
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
    this.selectorFormModel.update((m) => ({ ...m, serie }));
    this.#setSelection(serie, this.disparoOptions()?.[0]?.value ?? null);
  }

  onDisparoSelected(disparo: string | null): void {
    this.selectorFormModel.update((m) => ({ ...m, disparo }));
    this.#store.updateMedidasPresionIpgSelector({ disparo });
    void this.#loadSelectedShotData();
  }

  setCurrentShot(): void {
    const serie = this.#store.activeSerieId() ?? this.selectorFormModel().serie;
    const disparo = this.#store.activeShotId() ?? this.selectorFormModel().disparo;
    if (serie && disparo) {
      this.#setSelection(serie, disparo);
    }
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.selectorFormModel.update((m) => ({ ...m, serie, disparo }));
    this.#store.updateMedidasPresionIpgSelector({ serie, disparo });
    void this.#loadSelectedShotData();
  }

  async #loadSelectedShotData(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const fireTrialId = this.#store.fireTrialId();
    if (!fireTrialId || !serie || !disparo) return;

    const key = this.#selectionKey();
    const ticket = this.#selectionGuard.begin();
    try {
      const response = await this.#executionService.fetchShotIpgPressures(fireTrialId, serie, disparo);
      if (!ticket.isFresh(key)) return;

      const item = response?.ipgPressuresData?.[0];
      if (item) {
        this.dataFormModel.set({
          sensorIpg: item.ipgSensorId !== null && item.ipgSensorId !== undefined ? String(item.ipgSensorId) : null,
          micromodulo:
            item.micromoduleId !== null && item.micromoduleId !== undefined ? String(item.micromoduleId) : null,
          pmax: item.maxPressure ?? null,
          observaciones: item.observations ?? '',
        });
      } else {
        this.dataFormModel.set({
          sensorIpg: null,
          micromodulo: null,
          pmax: null,
          observaciones: '',
        });
      }
      this.#dirtyTracker.syncSnapshot();
    } catch {
      if (ticket.isFresh(key)) {
        this.dataFormModel.set({
          sensorIpg: null,
          micromodulo: null,
          pmax: null,
          observaciones: '',
        });
        this.#dirtyTracker.syncSnapshot();
      }
    }
  }

  resetForm(): void {
    const stored = this.#store.medidasPresionIpg();
    this.dataFormModel.set({
      sensorIpg: stored.sensorIpg,
      micromodulo: stored.micromodulo,
      pmax: stored.pmax,
      observaciones: stored.observaciones ?? '',
    });
    this.#dirtyTracker.syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const fireTrialId = this.#store.fireTrialId();
    if (!fireTrialId || !serie || !disparo) return;

    const { sensorIpg, micromodulo, pmax, observaciones } = this.dataFormModel();
    const request: ShotIpgPressuresRequest = {
      ipgPressuresData: [
        {
          ipgSensorId: sensorIpg ? Number(sensorIpg) || null : null,
          micromoduleId: micromodulo ? Number(micromodulo) || null : null,
          maxPressure: pmax,
          maxPressureUnit: MeasureUnitEnum.BAR,
          observations: observaciones || null,
        },
      ],
    };

    await this.#executionService.updateShotIpgPressures(fireTrialId, serie, disparo, request);
    this.#store.updateMedidasPresionIpg({
      sensorIpg,
      micromodulo,
      pmax,
      observaciones: observaciones || null,
    });
    this.#dirtyTracker.syncSnapshot();
  }
}

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
import { MatSelectModule } from '@angular/material/select';
import { MEASURE_UNIT_LABELS, MeasureUnitEnum, TimeUnitEnum } from '@intaqalab/models';
import { IntaIconComponent } from '@intaqalab/ui';
import { createDirtyTracker } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import {
  ExecutionService,
  type ShotDifferentialPressureData,
  type ShotPiezoPressureItem,
  type ShotPressuresResponse,
  type ShotTimesData,
} from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { EquipmentTypeEnum } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { createSelectionGuard, shotSelectionKey } from '../utils/selection-guard';
import {
  mapSelectedShotStatus,
  mapSelectedShotStatusClass,
  mapSelectedShotStatusLabel,
} from '../utils/selection-options';
import {
  buildShotPressuresRequest,
  extractPressuresResponse,
  mapPlanningSeriesToOptions,
  mapShotsToDisparoOptions,
  normalizeDifferentialPressure,
  normalizePiezoPressures,
  normalizeTimesData,
} from './piezo-pressure-introduction.mapper';
import { PiezoPressureDifferentialTab } from './tabs/piezo-pressure-differential-tab';
import { PiezoPressureSensorTab } from './tabs/piezo-pressure-sensor-tab';
import { PiezoPressureTimesTab } from './tabs/piezo-pressure-times-tab';

export type PiezoTab = 'cierre' | 'intermedio' | 'culote' | 'otro' | 'diferencial' | 'tiempos';

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

@Component({
  selector: 'inta-piezo-pressure-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    FormTouchDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    PiezoPressureSensorTab,
    PiezoPressureDifferentialTab,
    PiezoPressureTimesTab,
  ],
  template: `
    <div class="h-full rounded-2xl border border-blue-200 bg-white p-3 flex flex-col gap-6 overflow-auto">
      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- Icon + Title -->
        <div class="flex items-center gap-1.5 shrink-0">
          <ui-inta-icon name="edit_line" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TITLE' | translate }}
          </h3>
        </div>

        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-40">
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.SERIE_PLACEHOLDER' | translate"
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
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.DISPARO_PLACEHOLDER' | translate"
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
          {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CURRENT_SHOT_BTN' | translate }}
        </button>

        <!-- Tab chips -->
        <div class="flex flex-wrap items-center gap-1.5 shrink-0">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="px-3.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
              [class]="
                activeTab() === tab.id
                  ? 'bg-[var(--inta-button)] text-white shadow-sm'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              "
              (click)="activeTab.set(tab.id)"
            >
              {{ tab.label | translate }}
            </button>
          }
        </div>

        <div class="flex-1"></div>

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div intaReadonlyContent intaFormTouch class="flex-1 min-h-0 flex flex-col" #touch="intaFormTouch">
        <!-- P. Cierre -->
        <inta-piezo-pressure-sensor-tab
          position="CLOSING"
          [class.hidden]="activeTab() !== 'cierre'"
          [model]="cierreItem()"
          [captadorOptions]="captadorOptions()"
          [registradorOptions]="registradorOptions()"
          [amplificadorOptions]="amplificadorOptions()"
          [pressureUnitOptions]="pressureUnitOptions"
          (modelChange)="onSensorModelChange('CLOSING', $event)"
        />

        <!-- P. Intermedio -->
        <inta-piezo-pressure-sensor-tab
          position="HALF"
          [class.hidden]="activeTab() !== 'intermedio'"
          [model]="intermedioItem()"
          [captadorOptions]="captadorOptions()"
          [registradorOptions]="registradorOptions()"
          [amplificadorOptions]="amplificadorOptions()"
          [pressureUnitOptions]="pressureUnitOptions"
          (modelChange)="onSensorModelChange('HALF', $event)"
        />

        <!-- P. Culote -->
        <inta-piezo-pressure-sensor-tab
          position="SHELL"
          [class.hidden]="activeTab() !== 'culote'"
          [model]="culoteItem()"
          [captadorOptions]="captadorOptions()"
          [registradorOptions]="registradorOptions()"
          [amplificadorOptions]="amplificadorOptions()"
          [pressureUnitOptions]="pressureUnitOptions"
          (modelChange)="onSensorModelChange('SHELL', $event)"
        />

        <!-- P. Otro -->
        <inta-piezo-pressure-sensor-tab
          position="OTHER"
          [class.hidden]="activeTab() !== 'otro'"
          [model]="otroItem()"
          [captadorOptions]="captadorOptions()"
          [registradorOptions]="registradorOptions()"
          [amplificadorOptions]="amplificadorOptions()"
          [pressureUnitOptions]="pressureUnitOptions"
          (modelChange)="onSensorModelChange('OTHER', $event)"
        />

        <!-- P. Diferencial -->
        <inta-piezo-pressure-differential-tab
          [class.hidden]="activeTab() !== 'diferencial'"
          [model]="differentialPressureData()"
          [pressureUnitOptions]="pressureUnitOptions"
          (modelChange)="onDifferentialModelChange($event)"
        />

        <!-- Tiempos -->
        <inta-piezo-pressure-times-tab
          [class.hidden]="activeTab() !== 'tiempos'"
          [model]="timesData()"
          [timeUnitOptions]="timeUnitOptions"
          (modelChange)="onTimesModelChange($event)"
        />
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PiezoPressureIntroduction extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });
  readonly #executionService = inject(ExecutionService);

  // ── Opciones de unidad ──────────────────────────────────────────────────────
  protected readonly pressureUnitOptions = [
    { value: MeasureUnitEnum.BAR, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.BAR] },
    { value: MeasureUnitEnum.MPA, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.MPA] },
    { value: MeasureUnitEnum.KG_CM2, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.KG_CM2] },
  ];

  protected readonly timeUnitOptions = [
    { value: TimeUnitEnum.MS, label: MEASURE_UNIT_LABELS[TimeUnitEnum.MS] },
    { value: TimeUnitEnum.S, label: MEASURE_UNIT_LABELS[TimeUnitEnum.S] },
  ];

  // ── Tabs ────────────────────────────────────────────────────────────────────
  protected readonly tabs: Array<{ id: PiezoTab; label: string }> = [
    { id: 'cierre', label: 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_CIERRE' },
    { id: 'intermedio', label: 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_INTERMEDIO' },
    { id: 'culote', label: 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_CULOTE' },
    { id: 'otro', label: 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_OTRO' },
    { id: 'diferencial', label: 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_DIFERENCIAL' },
    { id: 'tiempos', label: 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_TIEMPOS' },
  ];

  protected readonly activeTab = signal<PiezoTab>('cierre');

  // ── Carga remota ────────────────────────────────────────────────────────────
  readonly #selectionGuard = createSelectionGuard(() =>
    shotSelectionKey(this.selectorFormModel().serie, this.selectorFormModel().disparo),
  );
  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  readonly #itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  // ── Modelos locales editables ───────────────────────────────────────────────
  protected readonly piezoPressures = signal<ShotPiezoPressureItem[]>(
    normalizePiezoPressures(this.#store.piezoPressureIntroduction().piezoPressures),
  );
  protected readonly differentialPressureData = signal<ShotDifferentialPressureData>(
    normalizeDifferentialPressure(this.#store.piezoPressureIntroduction().differentialPressureData),
  );
  protected readonly timesData = signal<ShotTimesData>(
    normalizeTimesData(this.#store.piezoPressureIntroduction().timesData),
  );

  // ── Helpers por posición ───────────────────────────────────────────────────
  protected readonly cierreItem = computed(() => this.#getItemByPosition('CLOSING'));
  protected readonly intermedioItem = computed(() => this.#getItemByPosition('HALF'));
  protected readonly culoteItem = computed(() => this.#getItemByPosition('SHELL'));
  protected readonly otroItem = computed(() => this.#getItemByPosition('OTHER'));

  #getItemByPosition(position: string): ShotPiezoPressureItem {
    const list = this.piezoPressures();
    const item = list.find((entry) => entry.position?.toUpperCase() === position.toUpperCase());
    return (
      item ?? {
        position,
        piezoelectricSensorId: null,
        amplifierId: null,
        dataAcquisitionSystemId: null,
        maxPressure: null,
        maxPressureUnit: MeasureUnitEnum.BAR,
        observations: null,
      }
    );
  }

  // ── Options: Series y Disparos dinámicos desde planning y progress ───────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#store.planningSeries(), this.#store.piezoPressureIntroduction().serieOptions),
  );

  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    const series = this.#store.executionProgress()?.series;
    const progressShots = selectedSerie ? series?.find((serie) => serie.seriesId === selectedSerie)?.shots : undefined;
    const planningShots = this.#store.planningSeries()?.find((serie) => serie.id === selectedSerie)?.shots;
    const shots = progressShots?.map((shot) => ({
      ...shot,
      globalNumber: planningShots?.find((planningShot) => planningShot.id === shot.shotId)?.globalNumber,
    }));

    return mapShotsToDisparoOptions(shots, this.#store.piezoPressureIntroduction().disparoOptions);
  });

  // ── Options: Equipos desde API (con fallback a store) ────────────────────────
  protected readonly captadorOptions = computed(() => {
    const apiItems = this.#itemsByCategory()[EquipmentTypeEnum.PIEZOELECTRIC_SENSOR];
    if (apiItems?.length) {
      return apiItems.map((item) => ({ value: item.id, label: item.label }));
    }
    return this.#store.piezoPressureIntroduction().captadorOptions;
  });

  protected readonly amplificadorOptions = computed(() => {
    const apiItems = this.#itemsByCategory()[EquipmentTypeEnum.AMPLIFIER];
    if (apiItems?.length) {
      return apiItems.map((item) => ({ value: item.id, label: item.label }));
    }
    return this.#store.piezoPressureIntroduction().amplificadorOptions;
  });

  protected readonly registradorOptions = computed(() => {
    const apiItems =
      this.#itemsByCategory()[EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM] ??
      this.#itemsByCategory()[EquipmentTypeEnum.RECORDER];
    if (apiItems?.length) {
      return apiItems.map((item) => ({ value: item.id, label: item.label }));
    }
    return this.#store.piezoPressureIntroduction().registradorOptions;
  });

  // ── Estado del disparo ──────────────────────────────────────────────────────
  protected readonly estadoDisparo = computed(() =>
    mapSelectedShotStatus(
      this.#store.executionProgress(),
      this.selectorFormModel().serie,
      this.selectorFormModel().disparo,
      this.#store.activeSerieId(),
      this.#store.activeShotId(),
      this.#store.piezoPressureIntroduction().estadoDisparo,
    ),
  );

  protected readonly estadoLabel = computed(() => mapSelectedShotStatusLabel(this.estadoDisparo()));
  protected readonly estadoClass = computed(() => mapSelectedShotStatusClass(this.estadoDisparo()));

  // ── Selector form ────────────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.piezoPressureIntroduction().serie,
    disparo: this.#store.piezoPressureIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  // ── Snapshot para dirty tracking ─────────────────────────────────────────────
  readonly #dirtyTracker = createDirtyTracker(() => ({
    piezoPressures: this.piezoPressures(),
    differentialPressureData: this.differentialPressureData(),
    timesData: this.timesData(),
  }));

  protected readonly isDirty = this.#dirtyTracker.isDirty;

  // ── FormWidget implementation ────────────────────────────────────────────────
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.touchRef()?.touched() ?? false,
    valid: true,
    hasChanges: this.isDirty(),
  }));

  constructor() {
    super();

    // Cargar catálogo de equipos desde la API
    this.#executionService
      ?.loadEquipmentItemsByCategories?.([
        EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
        EquipmentTypeEnum.AMPLIFIER,
        EquipmentTypeEnum.DATA_ACQUISITION_SYSTEM,
        EquipmentTypeEnum.RECORDER,
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

  // ── Handlers de selección ────────────────────────────────────────────────────

  onSerieSelected(serie: string | null): void {
    const current = this.selectorFormModel();
    const shotsInSerie = this.#getShotsForSerie(serie);
    const disparo = this.#isShotInSerie(current.disparo, serie) ? current.disparo : (shotsInSerie[0] ?? null);

    this.selectorFormModel.set({
      serie,
      disparo,
    });

    this.#syncSelectionToStore(serie, disparo);
    void this.loadSelectedShotData();
  }

  onDisparoSelected(disparo: string | null): void {
    const current = this.selectorFormModel();
    this.selectorFormModel.set({ ...current, disparo });
    this.#syncSelectionToStore(current.serie, disparo);
    void this.loadSelectedShotData();
  }

  setCurrentShot(): void {
    const serie = this.#store.activeSerieId() ?? this.selectorFormModel().serie;
    const disparo = this.#store.activeShotId() ?? this.selectorFormModel().disparo;
    this.#setSelection(serie, disparo);
  }

  #setSelection(serie: string | null, disparo: string | null): void {
    this.selectorFormModel.set({ serie, disparo });
    this.#syncSelectionToStore(serie, disparo);
    void this.loadSelectedShotData();
  }

  #getShotsForSerie(serieId: string | null): string[] {
    if (!serieId) {
      return [];
    }
    const progressShots = this.#store.executionProgress()?.series?.find((s) => s.seriesId === serieId)?.shots;
    if (progressShots?.length) {
      return progressShots.map((s) => s.shotId);
    }
    const planningShots = this.#store.planningSeries()?.find((s) => s.id === serieId)?.shots;
    if (planningShots?.length) {
      return planningShots.map((s) => s.id);
    }
    return this.#store.piezoPressureIntroduction().disparoOptions.map((o) => o.value);
  }

  #isShotInSerie(disparo: string | null, serieId: string | null): boolean {
    if (!disparo || !serieId) {
      return false;
    }
    return this.#getShotsForSerie(serieId).includes(disparo);
  }

  // ── Handlers de cambios de modelos ───────────────────────────────────────────

  onSensorModelChange(position: string, updated: ShotPiezoPressureItem): void {
    this.piezoPressures.update((list) => {
      const idx = list.findIndex((item) => item.position?.toUpperCase() === position.toUpperCase());
      const next = [...list];
      if (idx === -1) {
        next.push(updated);
      } else {
        next[idx] = updated;
      }
      return next;
    });
  }

  onDifferentialModelChange(data: ShotDifferentialPressureData): void {
    this.differentialPressureData.set(data);
  }

  onTimesModelChange(data: ShotTimesData): void {
    this.timesData.set(data);
  }

  // ── Ciclo de vida del formulario ─────────────────────────────────────────────

  resetForm(): void {
    const stored = this.#store.piezoPressureIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.piezoPressures.set(structuredClone(stored.piezoPressures));
    this.differentialPressureData.set(structuredClone(stored.differentialPressureData));
    this.timesData.set(structuredClone(stored.timesData));
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const fireTrialId = this.#store.fireTrialId();
    const payload = buildShotPressuresRequest({
      piezoPressures: this.piezoPressures(),
      differentialPressureData: this.differentialPressureData(),
      timesData: this.timesData(),
    });

    // Actualizar store local
    this.#store.updatePiezoPressureIntroduction({
      serie,
      disparo,
      piezoPressures: payload.piezoPressures,
      differentialPressureData: payload.differentialPressureData ?? this.differentialPressureData(),
      timesData: payload.timesData ?? this.timesData(),
    });

    // PUT remoto si hay IDs válidos
    if (fireTrialId && serie && disparo) {
      const response = await this.#executionService.updateShotPressures(fireTrialId, serie, disparo, payload);
      this.applyRemoteShotData(response);
    }

    this.#syncSnapshot();
  }

  // ── Métodos internos ────────────────────────────────────────────────────────

  protected async loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.selectorFormModel();
    const selectionKey = shotSelectionKey(serie, disparo);
    const ticket = this.#selectionGuard.begin();

    if (!fireTrialId || !serie || !disparo) {
      return;
    }

    try {
      const response = await this.#executionService.fetchShotPressures(fireTrialId, serie, disparo);
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.applyRemoteShotData(response);
    } catch {
      if (!ticket.isFresh(selectionKey)) {
        return;
      }
      this.applyRemoteShotData(null);
    }
  }

  protected applyRemoteShotData(response: ShotPressuresResponse | ShotPiezoPressureItem[] | null | undefined): void {
    const normalized = extractPressuresResponse(
      response && !Array.isArray(response) && 'piezoPressures' in response
        ? response
        : {
            piezoPressures: Array.isArray(response) ? response : [],
          },
    );

    this.piezoPressures.set(normalized.piezoPressures);
    this.differentialPressureData.set(normalized.differentialPressureData);
    this.timesData.set(normalized.timesData);

    this.#store.updatePiezoPressureIntroduction({
      piezoPressures: normalized.piezoPressures,
      differentialPressureData: normalized.differentialPressureData,
      timesData: normalized.timesData,
    });

    this.#syncSnapshot();
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.updatePiezoPressureIntroduction({ serie, disparo });
  }

  #syncSnapshot(): void {
    this.#dirtyTracker.syncSnapshot();
  }
}

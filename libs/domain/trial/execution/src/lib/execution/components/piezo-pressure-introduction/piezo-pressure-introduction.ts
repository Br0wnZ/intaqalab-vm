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
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MEASURE_UNIT_LABELS, MeasureUnitEnum } from '@intaqalab/models';
import { InputSelect, IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective, NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import {
  ExecutionService,
  type ShotPressuresData,
  type ShotPressuresResponse,
} from '../../../services/execution.service';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import { EquipmentTypeEnum } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import {
  DEFAULT_PRESSURE_UNIT,
  type InputFieldValue,
  buildShotPressuresRequest,
  equipmentIdToString,
  extractPressuresData,
  mapPlanningSeriesToOptions,
  mapShotsToDisparoOptions,
  numToField,
  parseNum,
} from './piezo-pressure-introduction.mapper';

// type PiezoTab = 'cierre' | 'intermedio' | 'culote';

interface SelectorFormModel {
  serie: string | null;
  disparo: string | null;
}

/** Selectores de equipos compartidos entre las 3 posiciones */
interface EquiposFormModel {
  captador: string | null;
  amplificador: string | null;
  registrador: string | null;
}

@Component({
  selector: 'inta-piezo-pressure-introduction',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    InputSelect,
    NoNegativeValuesDirective,
    LocaleDecimalInputDirective,
  ],
  template: `
    <div class="h-full rounded-2xl border border-blue-200 bg-white p-3 flex flex-col gap-8 overflow-auto">
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

        <div class="flex-1"></div>

        <!-- Tab chips -->
        <!-- <div class="flex flex-wrap self-center gap-2 shrink-0">
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            [class]="
              activeTab() === 'cierre'
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
            "
            (click)="activeTab.set('cierre')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_CIERRE' | translate }}
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            [class]="
              activeTab() === 'intermedio'
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
            "
            (click)="activeTab.set('intermedio')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_INTERMEDIO' | translate }}
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            [class]="
              activeTab() === 'culote'
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
            "
            (click)="activeTab.set('culote')"
          >
            {{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TAB_CULOTE' | translate }}
          </button>
        </div> -->

        <!-- Estado del disparo -->
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 self-start" [class]="estadoClass()">
          {{ estadoLabel() }}
        </span>
      </div>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div intaReadonlyContent class="flex flex-col gap-3 min-h-0">
        <!-- Fila 1: Selectores de equipos (compartidos) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_LABEL' | translate }}</mat-label>
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.CAPTADOR_PLACEHOLDER' | translate"
              [formField]="equiposForm.captador"
            >
              @for (opt of captadorOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_LABEL' | translate }}</mat-label>
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.AMPLIFICADOR_PLACEHOLDER' | translate"
              [formField]="equiposForm.amplificador"
            >
              @for (opt of amplificadorOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_LABEL' | translate }}</mat-label>
            <mat-select
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.REGISTRADOR_PLACEHOLDER' | translate"
              [formField]="equiposForm.registrador"
            >
              @for (opt of registradorOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Fila 2: Presiones máximas (cierre / intermedio / culote) con ui-input-select -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ui-input-select
            subscriptSizing="dynamic"
            [label]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_CIERRE_LABEL' | translate"
            [opciones]="pressureUnitOptions"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_PLACEHOLDER' | translate"
            [value]="cierrePresionField()"
            (valueChange)="cierrePresionField.set($event)"
          />

          <ui-input-select
            subscriptSizing="dynamic"
            [label]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_INTERMEDIO_LABEL' | translate"
            [opciones]="pressureUnitOptions"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_PLACEHOLDER' | translate"
            [value]="intermedioPresionField()"
            (valueChange)="intermedioPresionField.set($event)"
          />

          <ui-input-select
            subscriptSizing="dynamic"
            [label]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_CULOTE_LABEL' | translate"
            [opciones]="pressureUnitOptions"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.PRESION_PLACEHOLDER' | translate"
            [value]="culotePresionField()"
            (valueChange)="culotePresionField.set($event)"
          />
        </div>
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

  // ── Opciones de unidad de presión ───────────────────────────────────────────
  protected readonly pressureUnitOptions = [
    { value: MeasureUnitEnum.BAR, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.BAR] },
    { value: MeasureUnitEnum.MPA, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.MPA] },
    { value: MeasureUnitEnum.KG_CM2, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.KG_CM2] },
  ];

  // ── Carga remota ────────────────────────────────────────────────────────────
  readonly #loadRequestVersion = signal(0);
  readonly #lastLoadedActiveSelection = signal<string | null>(null);
  readonly #itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  // ── UI state ────────────────────────────────────────────────────────────────
  // protected readonly activeTab = signal<PiezoTab>('cierre');

  // ── Options: Series y Disparos dinámicos desde planning y progress ───────────
  protected readonly serieOptions = computed(() =>
    mapPlanningSeriesToOptions(this.#store.planningSeries(), this.#store.piezoPressureIntroduction().serieOptions),
  );

  protected readonly disparoOptions = computed(() => {
    const selectedSerie = this.selectorFormModel().serie;
    const series = this.#store.executionProgress()?.series;
    const shots = selectedSerie ? series?.find((serie) => serie.seriesId === selectedSerie)?.shots : undefined;
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
  protected readonly estadoLabel = computed(() => {
    switch (this.#store.piezoPressureIntroduction().estadoDisparo) {
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
    switch (this.#store.piezoPressureIntroduction().estadoDisparo) {
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

  // ── Selector form ────────────────────────────────────────────────────────────
  protected readonly selectorFormModel = signal<SelectorFormModel>({
    serie: this.#store.piezoPressureIntroduction().serie,
    disparo: this.#store.piezoPressureIntroduction().disparo,
  });
  protected readonly selectorForm = form(this.selectorFormModel);

  // ── Equipos form (captador / amplificador / registrador compartidos) ─────────
  protected readonly equiposFormModel = signal<EquiposFormModel>({
    captador: this.#store.piezoPressureIntroduction().cierre.captador,
    amplificador: this.#store.piezoPressureIntroduction().cierre.amplificador,
    registrador: this.#store.piezoPressureIntroduction().cierre.registrador,
  });
  protected readonly equiposForm = form(this.equiposFormModel);

  // ── Presiones máximas con ui-input-select (valor + unidad) ─────────────────
  protected readonly cierrePresionField = signal<InputFieldValue>(
    numToField(this.#store.piezoPressureIntroduction().cierre.presionMaxima, MeasureUnitEnum.BAR),
  );
  protected readonly intermedioPresionField = signal<InputFieldValue>(
    numToField(this.#store.piezoPressureIntroduction().intermedio.presionMaxima, MeasureUnitEnum.BAR),
  );
  protected readonly culotePresionField = signal<InputFieldValue>(
    numToField(this.#store.piezoPressureIntroduction().culote.presionMaxima, MeasureUnitEnum.BAR),
  );

  // ── Snapshot para dirty tracking ─────────────────────────────────────────────
  readonly #savedSnapshot = signal({
    captador: this.equiposFormModel().captador,
    amplificador: this.equiposFormModel().amplificador,
    registrador: this.equiposFormModel().registrador,
    cierrePresion: this.cierrePresionField(),
    intermedioPresion: this.intermedioPresionField(),
    culotePresion: this.culotePresionField(),
  });

  protected readonly isDirty = computed(() => {
    const snap = this.#savedSnapshot();
    const eq = this.equiposFormModel();
    return (
      eq.captador !== snap.captador ||
      eq.amplificador !== snap.amplificador ||
      eq.registrador !== snap.registrador ||
      JSON.stringify(this.cierrePresionField()) !== JSON.stringify(snap.cierrePresion) ||
      JSON.stringify(this.intermedioPresionField()) !== JSON.stringify(snap.intermedioPresion) ||
      JSON.stringify(this.culotePresionField()) !== JSON.stringify(snap.culotePresion)
    );
  });

  // ── FormWidget implementation ────────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.isDirty(),
    touched: this.isDirty(),
    valid: this.equiposForm().valid(),
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
    this.selectorFormModel.set({ serie, disparo: null });
    this.#syncSelectionToStore(serie, null);
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

  // ── Ciclo de vida del formulario ─────────────────────────────────────────────

  resetForm(): void {
    const stored = this.#store.piezoPressureIntroduction();
    this.selectorFormModel.set({ serie: stored.serie, disparo: stored.disparo });
    this.equiposFormModel.set({
      captador: stored.cierre.captador,
      amplificador: stored.cierre.amplificador,
      registrador: stored.cierre.registrador,
    });
    this.cierrePresionField.set(numToField(stored.cierre.presionMaxima, MeasureUnitEnum.BAR));
    this.intermedioPresionField.set(numToField(stored.intermedio.presionMaxima, MeasureUnitEnum.BAR));
    this.culotePresionField.set(numToField(stored.culote.presionMaxima, MeasureUnitEnum.BAR));
    this.#syncSnapshot();
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.selectorFormModel();
    const { captador, amplificador, registrador } = this.equiposFormModel();
    const fireTrialId = this.#store.fireTrialId();

    const cierreNum = parseNum(this.cierrePresionField());
    const cierreUnit = this.cierrePresionField()?.unit || DEFAULT_PRESSURE_UNIT;
    const intermedioNum = parseNum(this.intermedioPresionField());
    const intermedioUnit = this.intermedioPresionField()?.unit || DEFAULT_PRESSURE_UNIT;
    const culoteNum = parseNum(this.culotePresionField());
    const culoteUnit = this.culotePresionField()?.unit || DEFAULT_PRESSURE_UNIT;

    // Actualizar store local
    this.#store.updatePiezoPressureIntroduction({
      serie,
      disparo,
      cierre: {
        captador,
        amplificador,
        registrador,
        presionMaxima: cierreNum,
        tiempoAccion: null,
        tiempoRetardo: null,
      },
      intermedio: {
        captador,
        amplificador,
        registrador,
        presionMaxima: intermedioNum,
        tiempoAccion: null,
        tiempoRetardo: null,
      },
      culote: {
        captador,
        amplificador,
        registrador,
        presionMaxima: culoteNum,
        tiempoAccion: null,
        tiempoRetardo: null,
      },
    });

    // PUT remoto si hay IDs válidos
    if (fireTrialId && serie && disparo) {
      const payload = buildShotPressuresRequest({
        captador,
        amplificador,
        registrador,
        cierrePresion: cierreNum,
        cierreUnit,
        intermedioPresion: intermedioNum,
        intermedioUnit,
        culotePresion: culoteNum,
        culoteUnit,
      });

      this.#executionService.setShotPressure(fireTrialId, serie, disparo, payload);
    }

    this.#syncSnapshot();
  }

  // ── Métodos internos ────────────────────────────────────────────────────────

  protected async loadSelectedShotData(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    const { serie, disparo } = this.selectorFormModel();
    const requestVersion = this.#loadRequestVersion() + 1;
    this.#loadRequestVersion.set(requestVersion);

    if (!fireTrialId || !serie || !disparo) {
      return;
    }

    const selectionKey = `${serie}|${disparo}`;
    try {
      const response = await this.#executionService.fetchShotPressures(fireTrialId, serie, disparo);
      if (this.#loadRequestVersion() !== requestVersion) {
        return;
      }
      this.applyRemoteShotData(response);
    } catch {
      if (this.#loadRequestVersion() !== requestVersion) {
        return;
      }
      // Sin datos remotos o error — mantener estado
    }
  }

  protected applyRemoteShotData(response: ShotPressuresResponse | ShotPressuresData): void {
    const data = extractPressuresData(response);
    if (!data) return;

    const { serie, disparo } = this.selectorFormModel();

    // Mapear IDs numéricos de la API a string para los mat-select (null si no vienen)
    const captadorStr = equipmentIdToString(data.piezoelectricSensorId);
    const amplificadorStr = equipmentIdToString(data.amplifierId);
    const registradorStr = equipmentIdToString(data.dataAcquisitionSystemId);

    this.equiposFormModel.set({
      captador: captadorStr,
      amplificador: amplificadorStr,
      registrador: registradorStr,
    });

    this.cierrePresionField.set(
      numToField(data.closingMaxPressure ?? null, data.closingMaxPressureUnit || MeasureUnitEnum.BAR),
    );
    this.intermedioPresionField.set(
      numToField(data.halfMaxPressure ?? null, data.halfMaxPressureUnit || MeasureUnitEnum.BAR),
    );
    this.culotePresionField.set(
      numToField(data.shellMaxPressure ?? null, data.shellMaxPressureUnit || MeasureUnitEnum.BAR),
    );

    // Sincronizar al store central
    this.#store.updatePiezoPressureIntroduction({
      serie,
      disparo,
      cierre: {
        captador: captadorStr,
        amplificador: amplificadorStr,
        registrador: registradorStr,
        presionMaxima: data.closingMaxPressure ?? null,
        tiempoAccion: null,
        tiempoRetardo: null,
      },
      intermedio: {
        captador: captadorStr,
        amplificador: amplificadorStr,
        registrador: registradorStr,
        presionMaxima: data.halfMaxPressure ?? null,
        tiempoAccion: null,
        tiempoRetardo: null,
      },
      culote: {
        captador: captadorStr,
        amplificador: amplificadorStr,
        registrador: registradorStr,
        presionMaxima: data.shellMaxPressure ?? null,
        tiempoAccion: null,
        tiempoRetardo: null,
      },
    });

    this.#syncSnapshot();
  }

  #syncSelectionToStore(serie: string | null, disparo: string | null): void {
    this.#store.updatePiezoPressureIntroduction({ serie, disparo });
  }

  #syncSnapshot(): void {
    this.#savedSnapshot.set({
      captador: this.equiposFormModel().captador,
      amplificador: this.equiposFormModel().amplificador,
      registrador: this.equiposFormModel().registrador,
      cierrePresion: this.cierrePresionField(),
      intermedioPresion: this.intermedioPresionField(),
      culotePresion: this.culotePresionField(),
    });
  }
}

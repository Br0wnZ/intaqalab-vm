import type { Signal } from '@angular/core';
import {
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { isDesEnvironment } from '@intaqalab/config';
import { Role, injectCurrentUserRole } from '@intaqalab/core';
import { PlanningMeasuresService, injectTrialShots } from '@intaqalab/data-access-planning';
import type { MeasureUnitEnum } from '@intaqalab/models';
import { MEASURE_UNIT_LABELS } from '@intaqalab/models';
import { ErrorState, IntaIconComponent, Skeleton, SkeletonTable, StopClick } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

import type { SeguimientoSerieData, SeguimientoShotRow, SeguimientoTab } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { CalibryCalculationStatus } from '../../models';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetId } from '../../models/widget-id.enum';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { getSeguimientoTabs, getSeguimientoUnits, mapShotMeasurements } from './seguimiento.mapper';

interface SeguimientoFormModel {
  presionVelocidadUnit: string;
  pesosUnit: string;
}

interface ColumnDef {
  key: string;
  label: string;
}

interface ComputedRow {
  disparo: number;
  cells: (number | null)[];
}

interface ComputedSerie {
  serieId: string;
  serieLabel: string;
  computedRows: ComputedRow[];
}

const CALIBRY_STATUS_LABEL_KEYS: Record<CalibryCalculationStatus, string> = {
  NO_DATA: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.NO_DATA',
  PENDING: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.CALIBRY_STATUS_PENDING',
  CALCULATING: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.CALIBRY_STATUS_CALCULATING',
  UP_TO_DATE: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.CALIBRY_STATUS_UP_TO_DATE',
  ERROR: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.CALIBRY_STATUS_ERROR',
};

const CALIBRY_STATUS_ICONS: Record<CalibryCalculationStatus, string> = {
  NO_DATA: 'cloud_off',
  PENDING: 'schedule',
  CALCULATING: 'sync',
  UP_TO_DATE: 'check_circle',
  ERROR: 'error',
};

const CALIBRY_STATUS_CLASSES: Record<CalibryCalculationStatus, string> = {
  NO_DATA: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-client-warning/10 text-client-warning',
  CALCULATING: 'bg-client-primary/10 text-client-primary',
  UP_TO_DATE: 'bg-client-success/10 text-client-success',
  ERROR: 'bg-client-error/10 text-client-error',
};

@Component({
  selector: 'inta-seguimiento',
  imports: [
    FormField,
    ReadonlyContentDirective,
    Skeleton,
    SkeletonTable,
    ErrorState,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    TranslatePipe,
    IntaIconComponent,
    StopClick,
  ],
  template: `
    @if (isLoading()) {
      <div
        aria-busy="true"
        class="h-full rounded-2xl border border-violet-200 bg-white p-4 flex flex-col gap-1.5 overflow-hidden"
      >
        <div class="flex items-center justify-between gap-1.5 shrink-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <ui-skeleton variant="circle" width="20px" height="20px" animation="wave" />
            <ui-skeleton variant="text" width="110px" height="1rem" animation="wave" />
          </div>
          <div class="flex items-center gap-1.5">
            <ui-skeleton variant="rectangle" width="76px" height="24px" animation="wave" />
            <ui-skeleton variant="button" width="28px" animation="wave" />
            <ui-skeleton variant="button" width="28px" animation="wave" />
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 my-1">
          <ui-skeleton variant="rectangle" width="144px" height="40px" animation="wave" />
          <ui-skeleton variant="rectangle" width="80px" height="40px" animation="wave" />
          <ui-skeleton variant="rectangle" width="64px" height="40px" animation="wave" />
        </div>
        <div class="flex-1 overflow-auto min-h-0">
          <ui-skeleton-table animation="wave" [rows]="5" [columns]="6" />
        </div>
      </div>
    } @else if (hasLoadError()) {
      <div
        class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col items-center justify-center overflow-auto"
      >
        <ui-error-state
          [title]="'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.LOAD_ERROR_TITLE' | translate"
          [message]="'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.LOAD_ERROR_DETAIL' | translate"
        >
          <button mat-stroked-button type="button" (click)="reload()">
            <mat-icon>refresh</mat-icon>
            {{ 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.RELOAD' | translate }}
          </button>
        </ui-error-state>
      </div>
    } @else {
      <div class="h-full rounded-2xl border border-violet-200 bg-white p-4 flex flex-col gap-1.5 overflow-hidden">
        <div class="flex items-center justify-between gap-1.5 shrink-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <ui-inta-icon name="file" color="var(--inta-button)" />
            <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
              {{ 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TITLE' | translate }}
            </h3>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            @if (canShowCalibryControls()) {
              @if (calibryStatus(); as status) {
                <span
                  role="status"
                  class="inline-flex max-w-24 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold leading-none"
                  [class]="calibryStatusClasses()"
                  [attr.aria-label]="calibryStatusLabelKey() | translate"
                  [matTooltip]="calibryErrorMessage()"
                >
                  <mat-icon
                    aria-hidden="true"
                    class="!h-3.5 !w-3.5 !text-sm"
                    [class.animate-spin]="status === 'CALCULATING'"
                  >
                    {{ calibryStatusIcon() }}
                  </mat-icon>
                  <span class="truncate">{{ calibryStatusLabelKey() | translate }}</span>
                </span>
              }

              <button
                uiStopClick
                mat-icon-button
                type="button"
                class="!w-7 !h-7 !p-0 flex items-center justify-center text-client-primary hover:text-client-primary/80"
                [attr.aria-label]="
                  (isRecalculatingCalibry()
                    ? 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.RECALCULATING_CALIBRY'
                    : 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.RECALCULATE_CALIBRY'
                  ) | translate
                "
                [matTooltip]="
                  (isRecalculatingCalibry()
                    ? 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.RECALCULATING_CALIBRY'
                    : 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.RECALCULATE_CALIBRY'
                  ) | translate
                "
                [disabled]="isRecalculatingCalibry() || !canRecalculateCalibry()"
                (click)="recalculateCalibryCalculation()"
              >
                <mat-icon class="!text-[18px] !w-[18px] !h-[18px]" [class.animate-spin]="isRecalculatingCalibry()">
                  sync
                </mat-icon>
              </button>
            }

            <button
              uiStopClick
              mat-icon-button
              type="button"
              class="!w-7 !h-7 !p-0 flex items-center justify-center text-slate-500 hover:text-slate-800"
              [attr.aria-label]="'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.RELOAD' | translate"
              [matTooltip]="'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.RELOAD' | translate"
              [disabled]="isRefreshing()"
              (click)="reload()"
            >
              <mat-icon class="!text-[18px] !w-[18px] !h-[18px]" [class.animate-spin]="isRefreshing()">
                refresh
              </mat-icon>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 my-1">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-36 small-select shrink-0">
            <mat-select [value]="activeTab()" (valueChange)="setActiveTab($event)">
              @for (tab of tabOptions(); track tab) {
                <mat-option [value]="tab">{{ tabLabelKey(tab) | translate }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-20 small-select shrink-0">
            <mat-select [formField]="seguimientoForm.presionVelocidadUnit">
              @for (unit of presionUnits(); track unit) {
                <mat-option [value]="unit">{{ unitLabels[unit] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-16 small-select shrink-0">
            <mat-select [formField]="seguimientoForm.pesosUnit">
              @for (unit of pesoUnits; track unit) {
                <mat-option [value]="unit">{{ unit }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div intaReadonlyContent class="flex-1 overflow-auto min-h-0">
          <mat-accordion multi class="flex flex-col gap-2">
            @for (serie of tableData(); track serie.serieId) {
              <mat-expansion-panel
                class="!shadow-none !rounded-xl border border-slate-200 !m-0 !bg-white"
                [expanded]="activeSerieId() === serie.serieId"
              >
                <mat-expansion-panel-header class="!px-3 !min-h-8 !h-8">
                  <mat-panel-title class="text-[11px] font-semibold text-slate-700">
                    {{ serie.serieLabel }}
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="overflow-x-auto -mx-11 px-5 pb-1">
                  <table class="text-[10px] border-collapse w-full">
                    <thead>
                      <tr class="text-slate-500 border-b border-slate-200 bg-gray-50">
                        <th class="text-left pb-1 pr-2 pl-2 font-medium whitespace-nowrap sticky left-0 z-10">
                          {{ 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.COL_DISP' | translate }}
                        </th>
                        @for (col of columns(); track col.key) {
                          <th class="text-right pb-1 px-1.5 font-medium whitespace-nowrap">{{ col.label }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of serie.computedRows; track row.disparo) {
                        <tr class="border-b border-slate-200 [&:hover>td]:bg-violet-50/30">
                          <td class="py-1 px-2 font-medium text-slate-700 sticky left-0 bg-white">{{ row.disparo }}</td>
                          @for (cell of row.cells; track $index) {
                            <td class="py-1 px-2 text-right text-slate-600 tabular-nums">
                              {{ cell !== null ? cell : '—' }}
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>
        </div>
      </div>
    }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class SeguimientoWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  protected override readonly autonomousWidgetType = WidgetId.SEGUIMIENTO;
  readonly #store = inject(ExecutionStore);
  readonly #trialShots = injectTrialShots();
  readonly #planningMeasuresService = inject(PlanningMeasuresService);
  readonly #userRoles = injectCurrentUserRole();
  readonly #isDesEnvironment = isDesEnvironment();

  protected readonly isLoading = computed(() => this.#store.shotMeasurementsLoading());
  protected readonly hasLoadError = computed(() => this.#store.shotMeasurementsError());
  protected readonly isRefreshing = computed(() => this.#store.shotMeasurementsRefreshing());
  protected readonly isRecalculatingCalibry = computed(() => this.#store.isRecalculatingCalibry());
  protected readonly canShowCalibryControls = computed(
    () => this.#isDesEnvironment && this.#userRoles().includes(Role.INTAQALAB_ADMIN),
  );
  protected readonly canRecalculateCalibry = computed(
    () => this.canShowCalibryControls() && Boolean(this.#store.fireTrialId()),
  );
  protected readonly calibryStatus = computed(() => this.#store.shotMeasurements()?.calibryCalculation.status ?? null);
  protected readonly calibryStatusLabelKey = computed(() => {
    const status = this.calibryStatus();
    return status ? CALIBRY_STATUS_LABEL_KEYS[status] : '';
  });
  protected readonly calibryStatusIcon = computed(() => {
    const status = this.calibryStatus();
    return status ? CALIBRY_STATUS_ICONS[status] : '';
  });
  protected readonly calibryStatusClasses = computed(() => {
    const status = this.calibryStatus();
    return status ? CALIBRY_STATUS_CLASSES[status] : 'bg-slate-100 text-slate-600';
  });
  protected readonly calibryErrorMessage = computed(
    () => this.#store.shotMeasurements()?.calibryCalculation.error?.message ?? '',
  );

  readonly #measures = computed(() => {
    const resource = this.#planningMeasuresService.measuresResource;
    return resource.hasValue() ? resource.value() : undefined;
  });
  readonly tabOptions = computed(() => getSeguimientoTabs(this.#measures()));
  readonly presionUnits = computed(() => getSeguimientoUnits(this.#measures(), this.activeTab()));
  protected readonly unitLabels = MEASURE_UNIT_LABELS;

  // Static unit options
  readonly pesoUnits = ['g', 'kg', 'mg'];

  // Read-only state from store
  protected readonly activeTabs = computed(() => this.#store.seguimiento().activeTabs);
  protected readonly activeSerieId = signal<string | null>(this.#store.activeSerieId());
  protected readonly series = computed(() => {
    const measurements = this.#store.shotMeasurements();
    if (!measurements) {
      return this.#store.seguimiento().series;
    }

    return mapShotMeasurements(measurements, this.#trialShots.series() ?? this.#store.planningSeries?.() ?? []);
  });

  // Local UI signal for active tab
  protected readonly activeTab = linkedSignal<SeguimientoTab[], SeguimientoTab>({
    source: this.tabOptions,
    computation: (tabs, previous) => {
      const selected = previous?.value ?? this.#store.seguimiento().activeTab;
      return tabs.includes(selected) ? selected : (tabs[0] ?? selected);
    },
  });

  // Signal Form — unit preferences
  protected readonly formModel = linkedSignal<MeasureUnitEnum[], SeguimientoFormModel>({
    source: this.presionUnits,
    computation: (units, previous) => {
      const model = previous?.value ?? {
        presionVelocidadUnit: this.#store.seguimiento().presionVelocidadUnit,
        pesosUnit: this.#store.seguimiento().pesosUnit,
      };
      return {
        ...model,
        presionVelocidadUnit:
          units.find((unit) => unit === model.presionVelocidadUnit) ?? units[0] ?? model.presionVelocidadUnit,
      };
    },
  });
  protected readonly seguimientoForm = form(this.formModel, (fields) => {
    disabled(fields.presionVelocidadUnit, () => this.presionUnits().length <= 1);
  });

  constructor() {
    super();
    this.#store.registerAutonomousWidget?.(WidgetId.SEGUIMIENTO);

    let lastLoadedTrialId: string | null = null;
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      if (!fireTrialId || fireTrialId === lastLoadedTrialId) {
        return;
      }
      lastLoadedTrialId = fireTrialId;
      this.#store.loadShotMeasurements(fireTrialId);
      this.#planningMeasuresService.load(fireTrialId);
    });

    effect(() => {
      const serieId = this.#store.activeSerieId();
      if (!serieId) {
        return;
      }
      if (
        untracked(() => this.#store.isWidgetAutonomous?.(WidgetId.SEGUIMIENTO) ?? true) &&
        untracked(() => this.activeSerieId()) !== null
      ) {
        return;
      }
      this.activeSerieId.set(serieId);
    });
  }

  // Computed column definitions based on active tab and equipment counts
  protected readonly columns = computed((): ColumnDef[] => {
    const state = this.#store.seguimiento();
    const tab = this.activeTab();
    const numWc = state.numWeightScales;
    const numWp = state.numWeightScales;
    const numRadars = state.numRadars;
    const numManom = state.numManometers;
    const numPiezo = state.numPiezoSensors;

    const wcCols: ColumnDef[] = Array.from({ length: numWc }, (_, i) => ({
      key: `wc_${i}`,
      label: i === 0 ? 'Wc/g' : `Wc${i}/g`,
    }));

    const wpCols: ColumnDef[] = Array.from({ length: numWp }, (_, i) => ({
      key: `wp_${i}`,
      label: i === 0 ? 'Wp/g' : `Wp${i}/g`,
    }));

    switch (tab) {
      case 'velocidades':
        return [
          ...wcCols,
          ...wpCols,
          ...Array.from({ length: numRadars }, (_, i): ColumnDef => ({ key: `v0_${i}`, label: `V0${i + 1}` })),
          { key: 'v0c', label: 'V0c' },
        ];

      case 'p-manom':
        return [
          ...wcCols,
          ...wpCols,
          ...Array.from({ length: numManom }, (_, i): ColumnDef => ({ key: `p_${i}`, label: `P${i + 1}` })),
          { key: 'p_mean', label: 'P̄' },
        ];

      case 'p-pz-cie':
        return [
          ...wcCols,
          ...wpCols,
          ...Array.from({ length: numPiezo }, (_, i): ColumnDef => ({
            key: `pmax_cie_${i}`,
            label: numPiezo === 1 ? 'Pmáx' : `Pmáx${i + 1}`,
          })),
        ];

      case 'p-pz-int':
        return [
          ...wcCols,
          ...wpCols,
          ...Array.from({ length: numPiezo }, (_, i): ColumnDef => ({
            key: `pmax_int_${i}`,
            label: numPiezo === 1 ? 'Pmáx' : `Pmáx${i + 1}`,
          })),
        ];

      case 'p-pz-cul':
        return [
          ...wcCols,
          ...wpCols,
          ...Array.from({ length: numPiezo }, (_, i): ColumnDef => ({
            key: `pmax_cul_${i}`,
            label: numPiezo === 1 ? 'Pmáx' : `Pmáx${i + 1}`,
          })),
        ];

      case 'p-otro':
      case 'p-ipg':
        return [
          ...wcCols,
          ...wpCols,
          ...Array.from({ length: numPiezo }, (_, i): ColumnDef => ({
            key: `pmax_other_${i}`,
            label: numPiezo === 1 ? 'Pmáx' : `Pmáx${i + 1}`,
          })),
        ];

      default:
        return [];
    }
  });

  // Precomputed table data (avoids calling methods per cell in template)
  protected readonly tableData = computed((): ComputedSerie[] => {
    const cols = this.columns();
    return this.series().map((serie: SeguimientoSerieData) => ({
      serieId: serie.serieId,
      serieLabel: serie.serieLabel,
      computedRows: serie.rows.map((row: SeguimientoShotRow) => ({
        disparo: row.disparo,
        cells: cols.map((col) => this.#getCellValue(row, col.key)),
      })),
    }));
  });

  // FormWidget implementation
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: false,
    touched: this.seguimientoForm().touched(),
    valid: this.seguimientoForm().valid(),
    hasChanges: false,
  }));

  resetForm(): void {
    const stored = this.#store.seguimiento();
    this.formModel.set({
      presionVelocidadUnit: stored.presionVelocidadUnit,
      pesosUnit: stored.pesosUnit,
    });
  }

  async saveForm(): Promise<void> {
    const { presionVelocidadUnit, pesosUnit } = this.formModel();
    this.#store.updateSeguimiento({ presionVelocidadUnit, pesosUnit, activeTab: this.activeTab() });
  }

  reload(): void {
    const fireTrialId = this.#store.fireTrialId();
    if (!fireTrialId) {
      return;
    }
    this.#store.reloadShotMeasurements();
  }

  protected recalculateCalibryCalculation(): void {
    const fireTrialId = this.#store.fireTrialId();
    if (!this.canShowCalibryControls() || !fireTrialId) {
      return;
    }
    void this.#store.recalculateCalibryCalculation(fireTrialId);
  }

  protected setActiveTab(tab: SeguimientoTab): void {
    this.activeTab.set(tab);
  }

  protected tabLabelKey(tab: SeguimientoTab): string {
    const keys: Record<SeguimientoTab, string> = {
      velocidades: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_VELOCIDADES',
      'p-manom': 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_MANOM',
      'p-pz-cie': 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_PZ_CIE',
      'p-pz-int': 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_PZ_INT',
      'p-pz-cul': 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_PZ_CUL',
      'p-otro': 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_OTRO',
      'p-ipg': 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TAB_P_IPG',
    };
    return keys[tab];
  }

  #getCellValue(row: SeguimientoShotRow, key: string): number | null {
    if (key.startsWith('wc_')) {
      const idx = parseInt(key.replace('wc_', ''), 10);
      return row.wcValues[idx] ?? null;
    }
    if (key.startsWith('wp_')) {
      const idx = parseInt(key.replace('wp_', ''), 10);
      return row.wpValues[idx] ?? null;
    }
    if (key.startsWith('v0_')) {
      const idx = parseInt(key.replace('v0_', ''), 10);
      return row.v0Values[idx] ?? null;
    }
    if (key === 'v0c') return row.v0c;
    if (key.startsWith('p_') && key !== 'p_mean') {
      const idx = parseInt(key.replace('p_', ''), 10);
      return row.pManomValues[idx] ?? null;
    }
    if (key === 'p_mean') return row.pManomMean;
    if (key.startsWith('pmax_cie_')) {
      const idx = parseInt(key.replace('pmax_cie_', ''), 10);
      return row.pMaxCierre[idx] ?? null;
    }
    if (key.startsWith('pmax_int_')) {
      const idx = parseInt(key.replace('pmax_int_', ''), 10);
      return row.pMaxIntermedio[idx] ?? null;
    }
    if (key.startsWith('pmax_cul_')) {
      const idx = parseInt(key.replace('pmax_cul_', ''), 10);
      return row.pMaxCulote[idx] ?? null;
    }
    if (key.startsWith('pmax_other_')) {
      const idx = parseInt(key.replace('pmax_other_', ''), 10);
      return row.pMaxOther[idx] ?? null;
    }
    return null;
  }
}

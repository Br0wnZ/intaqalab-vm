import { DecimalPipe } from '@angular/common';
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
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ChartDirective, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import type { ChartConfiguration } from 'chart.js';

import type { UniformidadChartState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { mapShotOptionsToPlanningNumbers } from '../utils/selection-options';

interface UniformidadForm {
  selectedConfig: string | null;
  selectedSerie: string | null;
  selectedDisparo: string[] | null;
}

@Component({
  selector: 'inta-uniformidad-chart',
  imports: [
    DecimalPipe,
    FormField,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    ChartDirective,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full overflow-auto rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2">
      <!-- Header: icon + title -->
      <div class="flex items-center gap-1.5 shrink-0 sticky -top-4 z-2 bg-white min-h-8">
        <ui-inta-icon name="chart" size="xl" color="var(--inta-button)" />
        <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.TITLE' | translate }}
        </h3>
      </div>

      <!-- Selectors row: Config | Serie | Disparo -->
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[1rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.CONFIG_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.CONFIG_PLACEHOLDER' | translate"
            [formField]="uniformidadForm.selectedConfig"
          >
            @for (opt of configOptions(); track opt.id) {
              <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[1rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.SERIE_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.SERIE_PLACEHOLDER' | translate"
            [formField]="uniformidadForm.selectedSerie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[1rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.DISPARO_LABEL' | translate }}</mat-label>
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.DISPARO_PLACEHOLDER' | translate"
            [formField]="uniformidadForm.selectedDisparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Chart: full width -->
      <div class="flex-1 relative min-h-40 w-full">
        <canvas
          uiChart
          role="img"
          [attr.aria-label]="'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.CHART_ARIA' | translate"
          [config]="chartConfig()"
        ></canvas>
      </div>

      <!-- Footer: legend (left) + stats (right) -->
      <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] items-start gap-2">
        <!-- Legend: 4 metrics -->
        <div class="border bg-gray-50 border-gray-50 rounded-xl p-2 flex flex-col gap-1 justify-between">
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-indigo-700 shrink-0"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.LEGEND_NOMINAL' | translate }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.LEGEND_MEDIA' | translate }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-indigo-300 shrink-0"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.LEGEND_MIN' | translate }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.LEGEND_MAX' | translate }}
            </span>
          </div>
        </div>

        <!-- Stats: Pendiente | Wc/g / Ordenada | Desviación -->
        @if (selectedConfigData(); as configData) {
          <div class="border bg-gray-50 border-gray-50  rounded-xl p-2 grid grid-cols-2 gap-x-4 gap-y-1 content-center">
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.PENDIENTE_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">
                {{ configData.pendiente !== null ? (configData.pendiente | number: '1.5-5') : '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.WC_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">
                {{ configData.wcTarado !== null ? (configData.wcTarado | number: '1.0-0') + ' g' : '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.ORDENADA_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">
                {{ ordenada() !== null ? (ordenada() | number: '1.5-5') : '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.DESVIACION_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">
                {{ desviacion() !== null ? (desviacion() | number: '1.2-2') + ' m/s' : '—' }}
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UniformidadChartWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #loadedFireTrialId = signal<string | null>(null);
  readonly #lastCalculationKey = signal<string | null>(null);

  constructor() {
    super();
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      if (!fireTrialId) return;

      if (this.#loadedFireTrialId() !== fireTrialId) {
        this.#loadedFireTrialId.set(fireTrialId);
        this.#store.loadUniformidadChart(fireTrialId);
        return;
      }

      const planningSeries = this.#store.planningSeries();
      const chart = this.#store.uniformidadChartView();
      const activeSerieId = this.#store.activeSerieId();
      const activeShotId = this.#store.activeShotId();
      const current = this.formModel();
      if (!planningSeries || chart.configOptions.length === 0) return;

      const activeSerie = planningSeries.find((serie) => serie.id === activeSerieId);
      const activeShot = activeSerie?.shots?.find((shot) => shot.id === activeShotId);
      const selectedConfig = current.selectedConfig ?? chart.configOptions[0]?.id ?? null;
      const selectedSerieFromShot = current.selectedDisparo?.length
        ? planningSeries.find((serie) =>
            (serie.shots ?? []).some(
              (shot, index) =>
                (current.selectedDisparo?.includes(shot.id) ?? false) ||
                (current.selectedDisparo?.includes(String(shot.globalNumber ?? index + 1)) ?? false),
            ),
          )?.id
        : null;
      const selectedSerie = current.selectedSerie ?? selectedSerieFromShot ?? activeSerieId ?? null;
      const selectedDisparo = current.selectedDisparo ?? (activeShot ? [activeShot.id] : null);

      if (
        current.selectedConfig !== selectedConfig ||
        current.selectedSerie !== selectedSerie ||
        current.selectedDisparo !== selectedDisparo
      ) {
        this.formModel.set({ selectedConfig, selectedSerie, selectedDisparo });
      }

      if (!selectedDisparo?.length || !selectedConfig) {
        this.#lastCalculationKey.set(null);
        this.#store.clearUniformidadChartCalculation();
        return;
      }
      const calculationKey = JSON.stringify([fireTrialId, selectedConfig, selectedSerie, [...selectedDisparo].sort()]);
      if (calculationKey === this.#lastCalculationKey()) return;

      this.#store.updateUniformidadChart({ selectedConfig, selectedSerie, selectedDisparo });
      this.#lastCalculationKey.set(calculationKey);
      this.#store.calculateUniformidadChart(fireTrialId);
    });
  }

  // Data from store (read-only)
  protected readonly configOptions = computed(() => this.#store.uniformidadChartView().configOptions);
  protected readonly serieOptions = computed(() => this.#store.uniformidadChartView().serieOptions);
  protected readonly disparoOptions = computed(() =>
    mapShotOptionsToPlanningNumbers(
      this.#store.uniformidadChartView().disparoOptions,
      this.#store.planningSeries()?.flatMap((serie) => serie.shots ?? []) ?? [],
    ),
  );

  protected readonly selectedConfigData = computed(() => {
    const state = this.#store.uniformidadChartView();
    return state.configOptions.find((c) => c.id === state.selectedConfig) ?? null;
  });

  protected readonly filteredPoints = computed(() => {
    const state = this.#store.uniformidadChartView();
    let pts = state.dataPoints;
    if (state.selectedSerie) pts = pts.filter((p) => p.serie === state.selectedSerie);
    if (state.selectedDisparo?.length) {
      pts = pts.filter((p) => state.selectedDisparo?.includes(p.shotId) ?? false);
    }
    return pts;
  });

  protected readonly velocidadMedia = computed((): number | null => {
    return this.#store.uniformidadChartView().response?.meanVelocity ?? null;
  });

  protected readonly velocidadMin = computed((): number | null => {
    return this.#store.uniformidadChartView().response?.minimumVelocity ?? null;
  });

  protected readonly velocidadMax = computed((): number | null => {
    return this.#store.uniformidadChartView().response?.maximumVelocity ?? null;
  });

  protected readonly desviacion = computed((): number | null => {
    return this.#store.uniformidadChartView().response?.standardDeviation ?? null;
  });

  protected readonly ordenada = computed((): number | null => {
    return this.#store.uniformidadChartView().response?.intercept ?? null;
  });

  // Signal Form
  protected readonly formModel = signal<UniformidadForm>({
    selectedConfig: this.#store.uniformidadChart().selectedConfig,
    selectedSerie: this.#store.uniformidadChart().selectedSerie,
    selectedDisparo: this.#store.uniformidadChart().selectedDisparo,
  });
  protected readonly uniformidadForm = form(this.formModel);

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.uniformidadForm().dirty(),
    touched: this.uniformidadForm().touched(),
    valid: this.uniformidadForm().valid(),
    hasChanges: this.uniformidadForm().dirty(),
  }));

  protected readonly chartConfig = computed<ChartConfiguration>(() => {
    const pts = this.filteredPoints();
    const config = this.selectedConfigData();
    const nominal = config?.velocidadNominal ?? null;
    const media = this.velocidadMedia();
    const min = this.velocidadMin();
    const max = this.velocidadMax();
    const wcX = config?.wcTarado ?? pts[0]?.wc ?? 0;

    const makePoint = (y: number | null, color: string, label: string) => ({
      label,
      type: 'scatter' as const,
      data: y !== null ? [{ x: wcX, y }] : [],
      backgroundColor: color,
      pointRadius: 6,
      pointHoverRadius: 8,
      order: 1,
    });

    return {
      type: 'scatter',
      data: {
        datasets: [
          makePoint(nominal, '#3730a3', 'Velocidad nominal'),
          makePoint(media, '#22d3ee', 'Velocidad media'),
          makePoint(min, '#a5b4fc', 'Mínimo'),
          makePoint(max, '#f97316', 'Máximo'),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(2)} m/s`,
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Wc/g (g)', font: { size: 11 }, color: '#64748b' },
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 10 }, color: '#94a3b8' },
          },
          y: {
            type: 'linear',
            title: { display: true, text: 'Velocidad (m/s)', font: { size: 11 }, color: '#64748b' },
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 10 }, color: '#94a3b8' },
          },
        },
      },
    };
  });

  resetForm(): void {
    const stored = this.#store.uniformidadChart();
    this.formModel.set({
      selectedConfig: stored.selectedConfig,
      selectedSerie: stored.selectedSerie,
      selectedDisparo: stored.selectedDisparo,
    });
  }

  async saveForm(): Promise<void> {
    const { selectedConfig, selectedSerie, selectedDisparo } = this.formModel();
    this.#store.updateUniformidadChart({
      selectedConfig,
      selectedSerie,
      selectedDisparo,
    } satisfies Partial<UniformidadChartState>);
  }
}

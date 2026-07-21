import type { Signal } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MEASURE_UNIT_LABELS, MeasureUnitEnum } from '@intaqalab/models';
import { ChartDirective, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import type { ChartConfiguration } from 'chart.js';

import type { OverpressureChartState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

type WeightUnit = MeasureUnitEnum.G | MeasureUnitEnum.KG;
type PressureUnit = MeasureUnitEnum.MPA | MeasureUnitEnum.BAR | MeasureUnitEnum.KG_CM2;

interface OverpressureChartForm {
  selectedSerie: string[] | null;
  selectedWeightUnit: WeightUnit;
  selectedPressureUnit: PressureUnit;
}

@Component({
  selector: 'inta-overpressure-chart',
  imports: [
    FormField,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    ChartDirective,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full overflow-auto rounded-2xl border border-orange-200 bg-white p-3 flex flex-col gap-4">
      <!-- Header: misma grid que el body para alinear selector con leyenda -->
      <div class="grid grid-cols-4 gap-2 items-center shrink-0 h-9 sticky -top-4 z-2 bg-white min-h-8">
        <div class="col-span-12 flex items-center gap-1.5 shrink-0">
          <div class="flex items-center gap-1.5 flex-1 self-start">
            <ui-inta-icon name="chart" size="xl" color="var(--inta-button)" />
            <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
              {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.TITLE' | translate }}
            </h3>
          </div>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mt-1 !w-28">
            <mat-label>Peso</mat-label>
            <mat-select [formField]="chartForm.selectedWeightUnit">
              @for (opt of weightUnitOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mt-1 !w-28">
            <mat-label>Presión</mat-label>
            <mat-select [formField]="chartForm.selectedPressureUnit">
              @for (opt of pressureUnitOptions; track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <!-- Serie multi-select (compact density) — col-span-1, alineado con la leyenda -->
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="mt-1 min-w-48">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.SERIE_LABEL' | translate }}</mat-label>
            <mat-select
              multiple
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.SERIE_PLACEHOLDER' | translate"
              [formField]="chartForm.selectedSerie"
            >
              @for (opt of serieOptions(); track opt.value) {
                <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Body: 3 columns (col-span-2 = chart, col-span-1 = selector + legend) -->
      <div intaReadonlyContent class="flex-1 flex flex-wrap gap-2 min-h-0">
        <!-- Chart canvas (2 of 3 columns) -->
        <div class="flex-[2_1_0%] min-w-[280px] relative h-full min-h-0">
          <canvas
            uiChart
            aria-label="Gráfica Sobrepresión"
            role="img"
            class="absolute inset-0 w-full h-full"
            [config]="chartConfig()"
          ></canvas>
        </div>

        <!-- Right panel: serie selector + legend (1 of 3 columns) -->
        <div
          class="flex-[1_1_12rem] max-w-48 min-w-40 border bg-gray-50 border-gray-50 rounded-xl p-2 flex flex-col gap-1 justify-between"
        >
          <!-- Custom legend -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-0.5 bg-[#f97316] shrink-0"></div>
              <span class="text-xs text-slate-600 flex-1">
                {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.LEGEND_SEGURIDAD' | translate }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-px border-t-2 border-dashed border-[#a78bfa] shrink-0"></div>
              <span class="text-xs text-slate-600 flex-1">
                {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.LEGEND_DESV_MAX' | translate }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-0.5 bg-[#22d3ee] shrink-0"></div>
              <span class="text-xs text-slate-600 flex-1">
                {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.LEGEND_PRES_MAX' | translate }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-0.5 bg-[#4ade80] shrink-0"></div>
              <span class="text-xs text-slate-600 flex-1">
                {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.LEGEND_RECTA' | translate }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-0.5 bg-[#1e3a5f] shrink-0"></div>
              <span class="text-xs text-slate-600 flex-1">
                {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.LEGEND_PRES_MIN' | translate }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-px border-t-2 border-dashed border-[#818cf8] shrink-0"></div>
              <span class="text-xs text-slate-600 flex-1">
                {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.LEGEND_DESV_MIN' | translate }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * ## Gráfica Sobrepresión
 *
 * Muestra la regresión lineal presión vs Wc/g con bandas de desviación y líneas
 * de referencia constantes (seguridad, máxima, mínima). Los puntos individuales
 * de cada disparo se muestran como marcadores de cruz sobre la recta de regresión.
 *
 * ### Roles
 * - JLT
 * - Ingeniero de ensayos
 *
 * ### Filtros
 * - **Serie** (múltiple)
 *
 * ### Datos de salida
 * - **Pres. Seguridad**: constante, procede de Calibry (tubo seleccionado)
 * - **Presión máxima / mínima**: constantes, proceden del widget Información Sobrepresión
 * - **Recta presión**: regresión lineal + puntos individuales
 * - **Desv. máxima / mínima**: bandas ±σ alrededor de la recta
 */
export class OverpressureChartWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);
  readonly #defaultWeightUnit: WeightUnit = MeasureUnitEnum.G;
  readonly #defaultPressureUnit: PressureUnit = MeasureUnitEnum.MPA;

  // Data from store (read-only)
  protected readonly serieOptions = computed(() => this.#store.overpressureChart().serieOptions);
  protected readonly weightUnitOptions: ReadonlyArray<{ value: WeightUnit; label: string }> = [
    { value: MeasureUnitEnum.G, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.G] },
    { value: MeasureUnitEnum.KG, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.KG] },
  ];
  protected readonly pressureUnitOptions: ReadonlyArray<{ value: PressureUnit; label: string }> = [
    { value: MeasureUnitEnum.MPA, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.MPA] },
    { value: MeasureUnitEnum.BAR, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.BAR] },
    { value: MeasureUnitEnum.KG_CM2, label: MEASURE_UNIT_LABELS[MeasureUnitEnum.KG_CM2] },
  ];

  // Signal Form — serie selector
  protected readonly formModel = signal<OverpressureChartForm>({
    selectedSerie: this.#store.overpressureChart().selectedSerie,
    selectedWeightUnit: this.#defaultWeightUnit,
    selectedPressureUnit: this.#defaultPressureUnit,
  });
  protected readonly chartForm = form(this.formModel);

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.chartForm().dirty(),
    touched: this.chartForm().touched(),
    valid: this.chartForm().valid(),
    hasChanges: this.chartForm().dirty(),
  }));

  /** Reactive chart config driven by store state + form selection */
  protected readonly chartConfig = computed<ChartConfiguration>(() => {
    const state = this.#store.overpressureChart();
    const { selectedSerie, selectedWeightUnit, selectedPressureUnit } = this.formModel();
    return this.#buildChartConfig({ ...state, selectedSerie }, selectedWeightUnit, selectedPressureUnit);
  });

  resetForm(): void {
    const stored = this.#store.overpressureChart();
    this.formModel.set({
      selectedSerie: stored.selectedSerie,
      selectedWeightUnit: this.#defaultWeightUnit,
      selectedPressureUnit: this.#defaultPressureUnit,
    });
  }

  async saveForm(): Promise<void> {
    const { selectedSerie } = this.formModel();
    this.#store.updateOverpressureChart({ selectedSerie });
  }

  #buildChartConfig(
    state: OverpressureChartState,
    selectedWeightUnit: WeightUnit,
    selectedPressureUnit: PressureUnit,
  ): ChartConfiguration {
    const { dataPoints, presionSeguridad, presionMaxima, presionMinima, selectedSerie } = state;

    const points = selectedSerie?.length ? dataPoints.filter((p) => selectedSerie.includes(p.serie)) : dataPoints;
    const convertedPoints = points.map((p) => ({
      ...p,
      wc: this.#convertWeightFromGrams(p.wc, selectedWeightUnit),
      rectaPresion: this.#convertPressureFromMpa(p.rectaPresion, selectedPressureUnit),
      desviacionMax: this.#convertPressureFromMpa(p.desviacionMax, selectedPressureUnit),
      desviacionMin: this.#convertPressureFromMpa(p.desviacionMin, selectedPressureUnit),
    }));
    const convertedPresionSeguridad =
      presionSeguridad !== null ? this.#convertPressureFromMpa(presionSeguridad, selectedPressureUnit) : null;
    const convertedPresionMaxima =
      presionMaxima !== null ? this.#convertPressureFromMpa(presionMaxima, selectedPressureUnit) : null;
    const convertedPresionMinima =
      presionMinima !== null ? this.#convertPressureFromMpa(presionMinima, selectedPressureUnit) : null;

    if (!convertedPoints.length) {
      return {
        type: 'scatter',
        data: { datasets: [] },
        options: { responsive: true, maintainAspectRatio: false },
      };
    }

    // Axis ranges
    const xArr = convertedPoints.map((p) => p.wc);
    const minX = Math.min(...xArr);
    const maxX = Math.max(...xArr);
    const xRange = maxX - minX || 10;
    const xPad = xRange * 0.08;

    const yArr: number[] = convertedPoints.flatMap((p) => [p.rectaPresion, p.desviacionMax, p.desviacionMin]);
    if (convertedPresionSeguridad !== null) yArr.push(convertedPresionSeguridad);
    if (convertedPresionMaxima !== null) yArr.push(convertedPresionMaxima);
    if (convertedPresionMinima !== null) yArr.push(convertedPresionMinima);
    const minY = Math.min(...yArr);
    const maxY = Math.max(...yArr);
    const yRange = maxY - minY || 10;
    const yPad = yRange * 0.08;

    // Desviaciones: group by wc, compute mean
    const desvMap = new Map<number, { maxSum: number; minSum: number; n: number }>();
    for (const p of convertedPoints) {
      const g = desvMap.get(p.wc) ?? { maxSum: 0, minSum: 0, n: 0 };
      g.maxSum += p.desviacionMax;
      g.minSum += p.desviacionMin;
      g.n++;
      desvMap.set(p.wc, g);
    }
    const sortedUniqueX = Array.from(desvMap.keys()).sort((a, b) => a - b);
    const desvMaxData = sortedUniqueX.map((x) => {
      const g = desvMap.get(x);
      return { x, y: g ? g.maxSum / g.n : 0 };
    });
    const desvMinData = sortedUniqueX.map((x) => {
      const g = desvMap.get(x);
      return { x, y: g ? g.minSum / g.n : 0 };
    });

    // Recta presión: line (mean per wc) + scatter (all individual points)
    const rectaMap = new Map<number, { sum: number; n: number }>();
    for (const p of convertedPoints) {
      const g = rectaMap.get(p.wc) ?? { sum: 0, n: 0 };
      g.sum += p.rectaPresion;
      g.n++;
      rectaMap.set(p.wc, g);
    }
    const rectaLine = sortedUniqueX.map((x) => {
      const g = rectaMap.get(x);
      return { x, y: g ? g.sum / g.n : 0 };
    });
    const rectaScatter = convertedPoints.map((p) => ({ x: p.wc, y: p.rectaPresion }));

    // Helper: constant horizontal line across padded x range
    const hLine = (y: number) => [
      { x: minX - xPad, y },
      { x: maxX + xPad, y },
    ];

    const solidLine = { borderWidth: 2, pointRadius: 0 as const, tension: 0 } as const;
    const dashedLine = { ...solidLine, borderDash: [6, 4] } as const;

    return {
      type: 'scatter',
      data: {
        datasets: [
          // 1. Pres. Seguridad — constant, orange
          ...(convertedPresionSeguridad !== null
            ? [
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  type: 'line' as any,
                  label: 'Pres. Seguridad',
                  data: hLine(convertedPresionSeguridad),
                  borderColor: '#f97316',
                  backgroundColor: '#f97316',
                  ...solidLine,
                },
              ]
            : []),

          // 2. Desv. máxima — dashed, violet
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'line' as any,
            label: 'Desv. máxima',
            data: desvMaxData,
            borderColor: '#a78bfa',
            backgroundColor: 'transparent',
            ...dashedLine,
          },

          // 3. Presión máxima — constant, cyan
          ...(convertedPresionMaxima !== null
            ? [
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  type: 'line' as any,
                  label: 'Presión máxima',
                  data: hLine(convertedPresionMaxima),
                  borderColor: '#22d3ee',
                  backgroundColor: '#22d3ee',
                  ...solidLine,
                },
              ]
            : []),

          // 4. Recta presión — regression line, green
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'line' as any,
            label: 'Recta presión',
            data: rectaLine,
            borderColor: '#4ade80',
            backgroundColor: 'transparent',
            ...solidLine,
          },

          // 5. Recta presión — individual cross markers
          {
            type: 'scatter' as const,
            label: 'Recta presión (puntos)',
            data: rectaScatter,
            borderColor: '#4ade80',
            backgroundColor: 'transparent',
            pointStyle: 'cross' as const,
            pointRadius: 7,
            pointBorderWidth: 2,
          },

          // 6. Presión mínima — constant, dark navy
          ...(convertedPresionMinima !== null
            ? [
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  type: 'line' as any,
                  label: 'Presión mínima',
                  data: hLine(convertedPresionMinima),
                  borderColor: '#1e3a5f',
                  backgroundColor: '#1e3a5f',
                  ...solidLine,
                },
              ]
            : []),

          // 7. Desv. mínima — dashed, blue
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'line' as any,
            label: 'Desv. mínima',
            data: desvMinData,
            borderColor: '#818cf8',
            backgroundColor: 'transparent',
            ...dashedLine,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            filter: (item) => item.dataset.label !== 'Recta presión (puntos)',
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(4)} ${MEASURE_UNIT_LABELS[selectedPressureUnit]}`,
            },
          },
        },
        scales: {
          x: {
            type: 'linear',
            min: minX - xPad,
            max: maxX + xPad,
            title: { display: true, text: `Wc/${MEASURE_UNIT_LABELS[selectedWeightUnit]}`, font: { size: 10 } },
            grid: { color: '#e5e7eb', borderDash: [4, 4] },
            ticks: { font: { size: 9 } },
          },
          y: {
            min: minY - yPad,
            max: maxY + yPad,
            title: {
              display: true,
              text: `Presión (${MEASURE_UNIT_LABELS[selectedPressureUnit]})`,
              font: { size: 10 },
            },
            grid: { color: '#e5e7eb', borderDash: [4, 4] },
            ticks: { font: { size: 9 } },
          },
        },
      },
    } as ChartConfiguration;
  }

  #convertWeightFromGrams(value: number, toUnit: WeightUnit): number {
    switch (toUnit) {
      case MeasureUnitEnum.KG:
        return value / 1000;
      case MeasureUnitEnum.G:
      default:
        return value;
    }
  }

  #convertPressureFromMpa(value: number, toUnit: PressureUnit): number {
    switch (toUnit) {
      case MeasureUnitEnum.BAR:
        return value * 10;
      case MeasureUnitEnum.KG_CM2:
        return value * 10.197162129779;
      case MeasureUnitEnum.MPA:
      default:
        return value;
    }
  }
}

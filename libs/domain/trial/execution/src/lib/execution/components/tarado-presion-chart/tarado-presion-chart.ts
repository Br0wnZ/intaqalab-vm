import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ChartDirective, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import type { ChartConfiguration } from 'chart.js';

import type { TaradoPresionChartState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

interface TaradoPresionForm {
  selectedSerie: string[] | null;
  selectedDisparo: string[] | null;
}

@Component({
  selector: 'inta-tarado-presion-chart',
  standalone: true,
  imports: [
    DecimalPipe,
    FormField,
    ReadonlyContentDirective,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    ChartDirective,
    IntaIconComponent
],
  template: `
    <div class="h-full overflow-auto rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2">

      <!-- Header: icon + title -->
      <div class="flex items-center gap-1.5 shrink-0 sticky -top-4 z-2 bg-white min-h-8">
        <ui-inta-icon name="chart" size="xl" color="var(--inta-button)" />
        <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.TITLE' | translate }}
        </h3>
      </div>

      <!-- Selectors row -->
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[2rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.SERIE_LABEL' | translate }}</mat-label>
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.SERIE_PLACEHOLDER' | translate"
            [formField]="presionForm.selectedSerie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[2rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.DISPARO_LABEL' | translate }}</mat-label>
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.DISPARO_PLACEHOLDER' | translate"
            [formField]="presionForm.selectedDisparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Chart: full width -->
      <div intaReadonlyContent class="flex-1 relative min-h-40 w-full">
        <canvas
          uiChart
          aria-label="Tarado Presión Chart"
          role="img"
          [config]="chartConfig()"
        ></canvas>
      </div>

      <!-- Footer: legend (left) + stats (right) -->
      <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] items-start gap-2">
        <!-- Legend + R² -->
        <div class="border bg-gray-50 border-gray-50 rounded-xl p-2 flex flex-col gap-1 justify-between">
          <div class="flex items-center gap-1.5">
            <div class="w-6 h-px bg-violet-600 shrink-0"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.LEGEND_LINE' | translate }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.LEGEND_RECTA' | translate }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.LEGEND_PUNTO' | translate }}
            </span>
          </div>
          @if (r2()) {
            <span class="text-xs font-semibold text-slate-700 mt-1">R² = {{ r2()! | number: '1.4-4' }}</span>
          }
        </div>

        <!-- Stats: Pendiente / Peso tarado / Ordenada / Wc/g -->
        @if (regression()) {
          <div class="border bg-gray-50 border-gray-50  rounded-xl p-2 grid grid-cols-2 gap-x-4 gap-y-1 content-center">
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.PENDIENTE_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">{{ regression()!.pendiente | number: '1.5-5' }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.PESO_TARADO_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">{{ regression()!.pesoTarado }} g</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.ORDENADA_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">{{ regression()!.ordenada | number: '1.5-5' }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.WC_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">{{ regression()!.wcTarado | number: '1.4-4' }} g</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * ## Gráfica Tarado - Presiones
 *
 * Muestra la regresión lineal Presión media (MPa) vs Wc/g (peso de pólvora)
 * para el tarado de pólvora por presión. Permite determinar el peso de carga (Wc)
 * necesario para alcanzar la presión buscada definida en el widget Información Sobrepresión.
 *
 * ### Roles
 * - JLT (Jefe de Línea de Tiro)
 * - Ingeniero de ensayos
 *
 * ### Filtros
 * - **Serie** (múltiple): filtra los disparos por serie de funcionamiento.
 * - **Disparo** (múltiple): filtra los disparos individuales dentro de la serie.
 *
 * ### Datos de salida
 * - **Puntos azules**: cada punto = un disparo seleccionado. X = Wc/g, Y = presión media calculada.
 * - **Recta**: regresión lineal sobre los puntos.
 * - **Punto naranja**: presión buscada (del widget Información Sobrepresión) sobre la recta.
 * - **Pendiente / Ordenada / R² / Wc/g / Peso tarado**: campos calculados de la regresión.
 */
export class TaradoPresionChartWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  // Data from store (read-only)
  protected readonly serieOptions = computed(() => this.#store.taradoPresionChart().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.taradoPresionChart().disparoOptions);
  protected readonly regression = computed(() => this.#store.taradoPresionChart().regression);
  protected readonly r2 = computed(() => {
    const reg = this.regression();
    return reg ? Math.pow(reg.correlacion, 2) : null;
  });

  // Signal Form — selector state
  protected readonly formModel = signal<TaradoPresionForm>({
    selectedSerie: this.#store.taradoPresionChart().selectedSerie,
    selectedDisparo: this.#store.taradoPresionChart().selectedDisparo,
  });
  protected readonly presionForm = form(this.formModel);

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.presionForm().dirty(),
    touched: this.presionForm().touched(),
    valid: this.presionForm().valid(),
    hasChanges: this.presionForm().dirty(),
  }));

  /** Reactive chart config — ChartDirective (uiChart) reacts automatically to signal changes */
  protected readonly chartConfig = computed<ChartConfiguration>(() => {
    const state = this.#store.taradoPresionChart();
    const { scatterData, regressionLine, puntoTarado } = this.#computeChartData(state);
    return {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Lineal (Recta de tarado)',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'line' as any,
            data: regressionLine,
            borderColor: '#7c3aed',
            backgroundColor: 'transparent',
            pointRadius: 0,
            tension: 0,
            order: 0,
          },
          {
            label: 'Recta tarado',
            data: scatterData,
            backgroundColor: '#22d3ee',
            pointRadius: 5,
            pointHoverRadius: 7,
            order: 1,
          },
          {
            label: 'Punto tarado',
            data: puntoTarado ? [puntoTarado] : [],
            backgroundColor: '#f97316',
            pointRadius: 6,
            pointHoverRadius: 8,
            order: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `(${ctx.parsed.x?.toFixed(2)} g, ${ctx.parsed.y?.toFixed(2)} MPa)`,
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
            title: { display: true, text: 'Presión (MPa)', font: { size: 11 }, color: '#64748b' },
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 10 }, color: '#94a3b8' },
          },
        },
      },
    };
  });

  resetForm(): void {
    const stored = this.#store.taradoPresionChart();
    this.formModel.set({
      selectedSerie: stored.selectedSerie,
      selectedDisparo: stored.selectedDisparo,
    });
  }

  async saveForm(): Promise<void> {
    const { selectedSerie, selectedDisparo } = this.formModel();
    this.#store.updateTaradoPresionChart({ selectedSerie, selectedDisparo } satisfies Partial<TaradoPresionChartState>);
  }

  #computeChartData(state: TaradoPresionChartState): {
    scatterData: { x: number; y: number }[];
    regressionLine: { x: number; y: number }[];
    puntoTarado: { x: number; y: number } | null;
  } {
    const filteredBySerie = state.selectedSerie?.length
      ? state.dataPoints.filter((p) => state.selectedSerie!.includes(p.serie))
      : state.dataPoints;

    const filtered = state.selectedDisparo?.length
      ? filteredBySerie.filter((p) => state.selectedDisparo!.includes(String(p.disparo)))
      : filteredBySerie;

    const sortedByDisparo = [...filtered].sort((a, b) => a.disparo - b.disparo);
    const scatterData = sortedByDisparo.map((p) => ({ x: p.wc, y: p.presion }));

    const reg = state.regression;
    if (!reg) return { scatterData, regressionLine: [], puntoTarado: null };

    const wcs = state.dataPoints.map((p) => p.wc);
    const minWc = Math.min(...wcs) - 10;
    const maxWc = Math.max(...wcs) + 10;
    const regressionLine = [
      { x: minWc, y: reg.pendiente * minWc + reg.ordenada },
      { x: maxWc, y: reg.pendiente * maxWc + reg.ordenada },
    ];

    const puntoTarado = state.presionBuscada !== null
      ? { x: reg.wcTarado, y: reg.pendiente * reg.wcTarado + reg.ordenada }
      : null;

    return { scatterData, regressionLine, puntoTarado };
  }
}

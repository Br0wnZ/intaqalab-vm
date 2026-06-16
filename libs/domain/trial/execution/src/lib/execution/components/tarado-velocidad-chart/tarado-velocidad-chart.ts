import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartDirective, IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';
import type { ChartConfiguration } from 'chart.js';

import type { TaradoVelocidadChartState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

interface TaradoVelocidadForm {
  selectedSerie: string[] | null;
  selectedDisparo: string[] | null;
  selectedVelocidadNominal: string | null;
  selectedConfiguracion: string | null;
}

@Component({
  selector: 'inta-tarado-velocidad-chart',
  imports: [
    DecimalPipe,
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    TranslateModule,
    ChartDirective,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full overflow-auto rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2">
      <!-- Header row 1: icon + title -->
      <div class="flex items-center gap-1.5 shrink-0 sticky -top-4 z-2 bg-white min-h-8">
        <ui-inta-icon name="chart" size="xl" color="var(--inta-button)" />
        <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.TITLE' | translate }}
        </h3>
      </div>

      <!-- Header row 2: Serie + Disparo + Velocidad nominal -->
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[4rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.SERIE_LABEL' | translate }}</mat-label>
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.SERIE_PLACEHOLDER' | translate"
            [formField]="taradoForm.selectedSerie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[4rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.DISPARO_LABEL' | translate }}</mat-label>
          <mat-select
            multiple
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.DISPARO_PLACEHOLDER' | translate"
            [formField]="taradoForm.selectedDisparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[8rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.VELOCIDAD_NOMINAL_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.VELOCIDAD_NOMINAL_PLACEHOLDER' | translate"
            [formField]="taradoForm.selectedVelocidadNominal"
          >
            @for (opt of velocidadNominalOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Header row 3: Configuracion select + save button -->
      <div class="flex flex-wrap items-center gap-1.5 shrink-0">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="basis-[12rem] grow">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.CONFIG_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.CONFIG_PLACEHOLDER' | translate"
            [formField]="taradoForm.selectedConfiguracion"
          >
            @for (opt of configuracionOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button mat-flat-button type="button" color="primary" class="grow basis-[10rem] max-w-lg" (click)="saveForm()">
          <ui-inta-icon name="save" class="mr-2" />
          {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.CONFIG_BTN' | translate }}
        </button>
      </div>

      <!-- Chart canvas -->
      <div intaReadonlyContent class="flex-1 relative min-h-40 w-full">
        <canvas uiChart aria-label="Tarado Velocidad Chart" role="img" [config]="chartConfig()"></canvas>
      </div>

      <!-- Bottom: legend + stats -->
      <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] items-start gap-2">
        <!-- Legend + R² -->
        <div class="border bg-gray-50 border-gray-50 rounded-xl p-2 flex flex-col gap-1 justify-between">
          <div class="flex items-center gap-1.5">
            <div class="w-6 h-px bg-violet-600"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.LEGEND_LINE' | translate }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-cyan-400"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.LEGEND_RECTA' | translate }}
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-orange-400"></div>
            <span class="text-xs text-slate-600 flex-1">
              {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.LEGEND_PUNTO' | translate }}
            </span>
          </div>
          @if (r2()) {
            <span class="text-xs font-semibold text-slate-700 mt-1">R² = {{ r2()! | number: '1.4-4' }}</span>
          }
        </div>

        <!-- Stats grid -->
        <div class="border bg-gray-50 border-gray-50  rounded-xl p-2 grid grid-cols-2 gap-x-4 gap-y-1 content-center">
          @if (regression()) {
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.PENDIENTE_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">{{ regression()!.pendiente | number: '1.5-5' }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.PESO_TARADO_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">{{ regression()!.pesoTarado }} g</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.ORDENADA_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">{{ regression()!.ordenada | number: '1.5-5' }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-600">
                {{ 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.WC_LABEL' | translate }}
              </p>
              <p class="text-xs font-regular text-gray-500">{{ regression()!.wcTarado | number: '1.4-4' }} g</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * ## Gráfica Tarado - Velocidad
 *
 * Muestra la regresión lineal V0c (velocidad inicial corregida) vs Wc/g (peso de pólvora)
 * para el tarado de pólvora. Permite determinar el peso de carga (Wc) necesario para
 * alcanzar la velocidad nominal seleccionada.
 *
 * ### Roles
 * - JLT (Jefe de Línea de Tiro)
 * - Ingeniero de ensayos
 *
 * ### Filtros (selectores de entrada)
 * - **Serie** (múltiple): filtra los disparos por serie de funcionamiento.
 * - **Disparo** (múltiple): filtra los disparos individuales dentro de la serie.
 * - **Velocidad nominal** (simple): velocidades nominales registradas en "Condiciones del
 *   disparo" durante la planificación. Determina el punto amarillo sobre la recta.
 * - **Configuración** (simple): configuraciones guardadas previamente (combinación de
 *   serie + disparo + velocidad nominal) mediante el botón "Guardar Configuración".
 *
 * ### Datos de salida
 * - **Puntos azules**: cada punto representa un disparo seleccionado. Eje X = peso de
 *   pólvora introducido por la unidad de municiones (Wc/g); Eje Y = velocidad inicial
 *   corregida calculada (V0c).
 * - **Recta**: regresión lineal sobre los puntos azules.
 * - **Pendiente**: pendiente de la recta de regresión (campo calculado).
 * - **Ordenada**: ordenada en el origen de la recta de regresión (campo calculado, numérico con decimales).
 * - **R²**: coeficiente de determinación de la regresión (campo calculado, numérico con decimales).
 * - **Punto amarillo/naranja**: punto sobre la recta que corresponde a la velocidad nominal seleccionada.
 * - **Wc/g**: peso de carga calculado a partir de la velocidad nominal sobre la recta (campo calculado, numérico con decimales).
 * - **Peso tarado**: Wc/g redondeado al entero más próximo (campo calculado, sin decimales).
 */
export class TaradoVelocidadChartWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  // Data from store
  protected readonly serieOptions = computed(() => this.#store.taradoVelocidadChart().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.taradoVelocidadChart().disparoOptions);
  protected readonly velocidadNominalOptions = computed(
    () => this.#store.taradoVelocidadChart().velocidadNominalOptions,
  );
  protected readonly configuracionOptions = computed(() => this.#store.taradoVelocidadChart().configuracionOptions);
  protected readonly regression = computed(() => this.#store.taradoVelocidadChart().regression);
  protected readonly r2 = computed(() => {
    const reg = this.regression();
    return reg ? Math.pow(reg.correlacion, 2) : null;
  });

  // Signal Form — selector state
  protected readonly formModel = signal<TaradoVelocidadForm>({
    selectedSerie: this.#store.taradoVelocidadChart().selectedSerie,
    selectedDisparo: this.#store.taradoVelocidadChart().selectedDisparo,
    selectedVelocidadNominal: this.#store.taradoVelocidadChart().selectedVelocidadNominal,
    selectedConfiguracion: this.#store.taradoVelocidadChart().selectedConfiguracion,
  });
  protected readonly taradoForm = form(this.formModel);

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.taradoForm().dirty(),
    touched: this.taradoForm().touched(),
    valid: this.taradoForm().valid(),
    hasChanges: this.taradoForm().dirty(),
  }));

  /** Configuración reactiva del gráfico — la directiva uiChart reacciona automáticamente a cambios */
  protected readonly chartConfig = computed<ChartConfiguration>(() => {
    const state = this.#store.taradoVelocidadChart();
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
              label: (ctx) => `(${ctx.parsed.x?.toFixed(2)}, ${ctx.parsed.y?.toFixed(2)} m/s)`,
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
    const stored = this.#store.taradoVelocidadChart();
    this.formModel.set({
      selectedSerie: stored.selectedSerie,
      selectedDisparo: stored.selectedDisparo,
      selectedVelocidadNominal: stored.selectedVelocidadNominal,
      selectedConfiguracion: stored.selectedConfiguracion,
    });
  }

  async saveForm(): Promise<void> {
    const { selectedSerie, selectedDisparo, selectedVelocidadNominal, selectedConfiguracion } = this.formModel();
    this.#store.updateTaradoVelocidadChart({
      selectedSerie,
      selectedDisparo,
      selectedVelocidadNominal,
      selectedConfiguracion,
    });
  }

  #computeChartData(state: TaradoVelocidadChartState): {
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
    const scatterData = sortedByDisparo.map((p) => ({ x: p.wc, y: p.v0c }));

    const reg = state.regression;
    if (!reg) return { scatterData, regressionLine: [], puntoTarado: null };

    const wcs = state.dataPoints.map((p) => p.wc);
    const minWc = Math.min(...wcs) - 10;
    const maxWc = Math.max(...wcs) + 10;
    const regressionLine = [
      { x: minWc, y: reg.pendiente * minWc + reg.ordenada },
      { x: maxWc, y: reg.pendiente * maxWc + reg.ordenada },
    ];

    const puntoTarado = {
      x: reg.wcTarado,
      y: reg.pendiente * reg.wcTarado + reg.ordenada,
    };

    return { scatterData, regressionLine, puntoTarado };
  }
}

import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type {
  SeguimientoSerieData,
  SeguimientoShotRow,
  SeguimientoState,
  SeguimientoTab,
} from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

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

@Component({
  selector: 'inta-seguimiento',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
  ],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-4 flex flex-col gap-1.5 overflow-hidden">
      <!-- Header: Icon + Title -->
      <div class="flex items-center gap-1.5 shrink-0">
        <ui-inta-icon name="file" color="var(--inta-button)" />
        <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TITLE' | translate }}
        </h3>
      </div>

      <!-- Tab chips row -->
      <div class="flex items-center gap-1 shrink-0 overflow-x-auto my-2">
        @for (tab of activeTabs(); track tab) {
          <button
            type="button"
            class="px-2.5 py-0.5 rounded-full text-[.6875rem] font-medium whitespace-nowrap transition-colors border shrink-0"
            [class]="
              activeTab() === tab
                ? 'bg-[var(--inta-button)] text-white'
                : 'bg-[var(--inta-button)]/50 text-white cursor-pointer'
            "
            (click)="setActiveTab(tab)"
          >
            {{ tabLabelKey(tab) | translate }}
          </button>
        }
      </div>

      <!-- Unit selectors row -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Unit: Presión/Velocidad -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-20 small-select">
          <mat-select [formField]="seguimientoForm.presionVelocidadUnit">
            @for (unit of presionUnits; track unit) {
              <mat-option [value]="unit">{{ unit }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Unit: Pesos -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-16 small-select shrink-0">
          <mat-select [formField]="seguimientoForm.pesosUnit">
            @for (unit of pesoUnits; track unit) {
              <mat-option [value]="unit">{{ unit }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Accordion with scrollable table per series -->
      <div intaReadonlyContent class="flex-1 overflow-auto min-h-0">
        <mat-accordion multi class="flex flex-col gap-2">
          @for (serie of tableData(); track serie.serieId) {
            <mat-expansion-panel
              class="!shadow-none !rounded-xl border border-slate-200 !m-0 !bg-white"
              [expanded]="true"
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
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeguimientoWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  // Static unit options
  readonly presionUnits = ['MPa', 'bar', 'PSI', 'kgf/cm²'];
  readonly pesoUnits = ['g', 'kg', 'mg'];

  // Read-only state from store
  protected readonly activeTabs = computed(() => this.#store.seguimiento().activeTabs);
  protected readonly series = computed(() => this.#store.seguimiento().series);

  // Local UI signal for active tab
  protected readonly activeTab = signal<SeguimientoTab>(this.#store.seguimiento().activeTab);

  // Signal Form — unit preferences
  protected readonly formModel = signal<SeguimientoFormModel>({
    presionVelocidadUnit: this.#store.seguimiento().presionVelocidadUnit,
    pesosUnit: this.#store.seguimiento().pesosUnit,
  });
  protected readonly seguimientoForm = form(this.formModel);

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
          ...Array.from(
            { length: numPiezo },
            (_, i): ColumnDef => ({
              key: `pmax_cie_${i}`,
              label: numPiezo === 1 ? 'Pmáx' : `Pmáx${i + 1}`,
            }),
          ),
        ];

      case 'p-pz-int':
        return [
          ...wcCols,
          ...wpCols,
          ...Array.from(
            { length: numPiezo },
            (_, i): ColumnDef => ({
              key: `pmax_int_${i}`,
              label: numPiezo === 1 ? 'Pmáx' : `Pmáx${i + 1}`,
            }),
          ),
        ];

      case 'p-pz-cul':
        return [
          ...wcCols,
          ...wpCols,
          ...Array.from(
            { length: numPiezo },
            (_, i): ColumnDef => ({
              key: `pmax_cul_${i}`,
              label: numPiezo === 1 ? 'Pmáx' : `Pmáx${i + 1}`,
            }),
          ),
        ];

      case 'p-ipg':
        return [...wcCols, ...wpCols];

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
    dirty: this.seguimientoForm().dirty(),
    touched: this.seguimientoForm().touched(),
    valid: this.seguimientoForm().valid(),
    hasChanges: this.seguimientoForm().dirty(),
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
    return null;
  }
}

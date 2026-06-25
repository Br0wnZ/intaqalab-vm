import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import type { VigilanciaRow, VigilanciaState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { IntaIconComponent } from "@intaqalab/ui";

/** Computes the qualification string from a VigilanciaRow */
function computeCalificacion(row: VigilanciaRow): string | null {
  const { util1min, util1max, inutilmin, inutilmax, value } = row;
  const hasCriteria = util1min !== null || util1max !== null || inutilmin !== null || inutilmax !== null;
  if (!hasCriteria || value === null) return null;

  const hasUtil1 = util1min !== null || util1max !== null;
  if (hasUtil1) {
    const inUtil1 = (util1min === null || value >= util1min) && (util1max === null || value <= util1max);
    if (inUtil1) return 'Útil-1';
  }

  const hasInutilBounds = inutilmin !== null || inutilmax !== null;
  if (hasInutilBounds) {
    const inInutilBounds = (inutilmin === null || value >= inutilmin) && (inutilmax === null || value <= inutilmax);
    if (!inInutilBounds) return 'Inútil';
    return 'Útil-2';
  }

  return 'Inútil';
}

interface VigilanciaTableRow {
  labelKey: string;
  util1min: number | null;
  util1max: number | null;
  inutilmin: number | null;
  inutilmax: number | null;
  value: number | null;
  calificacion: string | null;
}

@Component({
  selector: 'inta-vigilancia',
  imports: [DatePipe, MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, TranslateModule, IntaIconComponent],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center gap-1.5 shrink-0">
        <ui-inta-icon name="trello" size="xl" color="var(--inta-button)" />
        <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.TITLE' | translate }}
        </h3>
      </div>

      <!-- Controls row -->
      <div class="flex items-center gap-1.5 shrink-0 my-1">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1 min-w-0">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.SERIE_LABEL' | translate }}</mat-label>
          <mat-select
            [value]="serie()"
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.SERIE_PLACEHOLDER' | translate"
            (valueChange)="onSerieChange($event)"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-20 shrink-0">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.VELOCIDAD_UNIT_LABEL' | translate }}</mat-label>
          <mat-select [value]="velocidadUnit()" (valueChange)="onVelocidadUnitChange($event)">
            @for (opt of velocidadUnitOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-20 shrink-0">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.PRESION_UNIT_LABEL' | translate }}</mat-label>
          <mat-select [value]="presionUnit()" (valueChange)="onPresionUnitChange($event)">
            @for (opt of presionUnitOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button
          mat-flat-button color="primary" class="!px-2.5 !min-w-auto"
          [disabled]="refreshing()"
          [attr.aria-label]="'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ACTUALIZAR_BTN' | translate"
          (click)="onActualizar()"
        >
          @if (refreshing()) {
            <span class="block size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          } @else {
            <ui-inta-icon name="update" size="xl" />
          }
        </button>
      </div>

      <!-- Last checked -->
      @if (lastChecked()) {
        <p class="text-xs text-slate-400 shrink-0 truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.LAST_CHECKED' | translate }}:
          {{ lastChecked() | date: 'HH:mm:ss' }}
        </p>
      }

      <!-- Table -->
      <div intaReadonlyContent class="flex-1 overflow-auto min-h-0 border rounded-lg border-gray-200">
        <table class="w-full text-xs border-collapse table-fixed">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <th class="text-left font-medium text-gray-600 py-1.5 px-1.5 w-[22%]">
                {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.COL_PROPIEDAD' | translate }}
              </th>
              <th class="text-right font-medium text-gray-600 py-1.5 px-1 w-[14%]">
                {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.COL_UTIL1_MIN' | translate }}
              </th>
              <th class="text-right font-medium text-gray-600 py-1.5 px-1 w-[14%]">
                {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.COL_UTIL1_MAX' | translate }}
              </th>
              <th class="text-right font-medium text-gray-600 py-1.5 px-1 w-[14%]">
                {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.COL_INUTILMIN' | translate }}
              </th>
              <th class="text-right font-medium text-gray-600 py-1.5 px-1 w-[14%]">
                {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.COL_INUTILMAX' | translate }}
              </th>
              <th class="text-right font-medium text-gray-600 py-1.5 px-1 w-[22%]">
                {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.COL_CALIFICACION' | translate }}
              </th>
            </tr>
          </thead>
          <tbody>
            @for (row of tableRows(); track row.labelKey) {
              <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td class="py-1.5 px-1.5 font-normal text-gray-600 text-sm truncate">
                  {{ row.labelKey | translate }}
                </td>
                <td class="py-1.5 px-1 text-right text-gray-600">
                  {{ row.util1min !== null ? row.util1min : '–' }}
                </td>
                <td class="py-1.5 px-1 text-right text-gray-600">
                  {{ row.util1max !== null ? row.util1max : '–' }}
                </td>
                <td class="py-1.5 px-1 text-right text-gray-600">
                  {{ row.inutilmin !== null ? row.inutilmin : '–' }}
                </td>
                <td class="py-1.5 px-1 text-right text-gray-600">
                  {{ row.inutilmax !== null ? row.inutilmax : '–' }}
                </td>
                <td class="py-1.5 px-1 text-right">
                  @if (row.calificacion === 'Útil-1') {
                    <span class="inline-flex items-center justify-end gap-0.5 text-emerald-700 font-semibold">
                      <mat-icon class="!text-[10px] !w-[10px] !h-[10px]">check_circle</mat-icon>
                      {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.UTIL_1' | translate }}
                    </span>
                  } @else if (row.calificacion === 'Útil-2') {
                    <span class="inline-flex items-center justify-end gap-0.5 text-amber-600 font-semibold">
                      <mat-icon class="!text-[10px] !w-[10px] !h-[10px]">warning</mat-icon>
                      {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.UTIL_2' | translate }}
                    </span>
                  } @else if (row.calificacion === 'Inútil') {
                    <span class="inline-flex items-center justify-end gap-0.5 text-rose-600 font-semibold">
                      <mat-icon class="!text-[10px] !w-[10px] !h-[10px]">cancel</mat-icon>
                      {{ 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.INUTILIDAD' | translate }}
                    </span>
                  } @else {
                    <span class="text-slate-300">–</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VigilanciaWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  /** Transient loading state */
  protected readonly refreshing = signal(false);

  // ── Store accessors ──────────────────────────────────────────────────────
  protected readonly serie = computed(() => this.#store.vigilancia().serie);
  protected readonly serieOptions = computed(() => this.#store.vigilancia().serieOptions);
  protected readonly velocidadUnit = computed(() => this.#store.vigilancia().velocidadUnit);
  protected readonly presionUnit = computed(() => this.#store.vigilancia().presionUnit);
  protected readonly lastChecked = computed(() => this.#store.vigilancia().lastChecked);

  // ── Unit options (static) ────────────────────────────────────────────────
  protected readonly velocidadUnitOptions: { value: string; label: string }[] = [
    { value: 'm/s', label: 'm/s' },
    { value: 'ft/s', label: 'ft/s' },
  ];

  protected readonly presionUnitOptions: { value: string; label: string }[] = [
    { value: 'bar', label: 'bar' },
    { value: 'MPa', label: 'MPa' },
    { value: 'kPa', label: 'kPa' },
    { value: 'psi', label: 'psi' },
  ];

  // ── Table rows computed from store ───────────────────────────────────────
  protected readonly tableRows = computed<VigilanciaTableRow[]>(() => {
    const s = this.#store.vigilancia();
    const toRow = (labelKey: string, row: VigilanciaRow): VigilanciaTableRow => ({
      labelKey,
      util1min: row.util1min,
      util1max: row.util1max,
      inutilmin: row.inutilmin,
      inutilmax: row.inutilmax,
      value: row.value,
      calificacion: computeCalificacion(row),
    });
    return [
      toRow('TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ROW_V0C', s.v0c),
      toRow('TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ROW_V0C_MEDIA', s.v0cMedia),
      toRow('TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ROW_SIGMA_V0C', s.sigmaV0c),
      toRow('TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ROW_PRESION', s.presion),
      toRow('TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ROW_PRESION_MEDIA', s.presionMedia),
      toRow('TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ROW_PROYECTIL', s.proyectil),
      toRow('TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ROW_ESPOLETA', s.espoleta),
      toRow('TRIAL_EXECUTION.WIDGETS.VIGILANCIA.ROW_ESTOPIN', s.estopin),
    ];
  });

  // ── FormWidget — always clean (read-only display widget) ─────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: false,
    touched: false,
    valid: true,
    hasChanges: false,
  }));

  resetForm(): void {
    // No form fields to reset — read-only widget
  }

  async saveForm(): Promise<void> {
    await this.onActualizar();
  }

  // ── Event handlers ───────────────────────────────────────────────────────
  onSerieChange(serie: string | null): void {
    this.#store.updateVigilancia({ serie } satisfies Partial<VigilanciaState>);
  }

  onVelocidadUnitChange(velocidadUnit: string): void {
    this.#store.updateVigilancia({ velocidadUnit } satisfies Partial<VigilanciaState>);
  }

  onPresionUnitChange(presionUnit: string): void {
    this.#store.updateVigilancia({ presionUnit } satisfies Partial<VigilanciaState>);
  }

  async onActualizar(): Promise<void> {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    try {
      // Simulate async refresh against execution data.
      // In production: call a service that fetches the latest execution values
      // for the selected serie and recalculates qualifications.
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      this.#store.updateVigilancia({
        lastChecked: new Date().toISOString(),
      } satisfies Partial<VigilanciaState>);
    } finally {
      this.refreshing.set(false);
    }
  }
}

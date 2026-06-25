import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import type { OverpressureInfoState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { IntaIconComponent } from "@intaqalab/ui";

interface OverpressureFormModel {
  presionMaxima: string | null;
  presionMinima: string | null;
  presionRef: string | null;
  unidadPresion: string;
}

@Component({
  selector: 'inta-overpressure-info',
  imports: [MatFormFieldModule, MatIconModule, MatSelectModule, TranslateModule, IntaIconComponent],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-2.5 flex flex-col gap-2 overflow-hidden">
      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2">
          <ui-inta-icon name="trello" size="xl" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.TITLE' | translate }}
          </h3>
        </div>
        <!-- Global unit selector -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="!w-20 shrink-0">
          <mat-select [value]="formModel().unidadPresion" (selectionChange)="onUnitChange($event.value)">
            @for (opt of pressureUnitOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- ── Fields ─────────────────────────────────────────────────────── -->
      <div intaReadonlyContent class="flex-1 flex flex-col gap-2 min-h-0">
        <!-- Row 1: Editable input fields -->
        <div class="grid grid-cols-3 gap-1.5">
          <!-- Presión Máxima -->
           <div>
            <span class="text-xs font-medium text-gray-700 leading-none truncate mb-2 block">
            {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_MAXIMA_LABEL' | translate }}
            </span>
            <div class="flex flex-col justify-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 gap-0.5 min-h-11 items-center">
              <input
                type="text"
                inputmode="decimal"
                class="text-base text-gray-500 font-normal bg-transparent border-none outline-none w-full leading-tight"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.VALUE_PLACEHOLDER' | translate"
                [value]="formModel().presionMaxima ?? ''"
                (input)="onPresionMaximaInput($event)"
              />
            </div>
          </div>

          <!-- Presión Mínima -->
          <div>
            <span class="text-xs font-medium text-gray-700 leading-none truncate mb-2 block">
              {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_MINIMA_LABEL' | translate }}
            </span>
            <div class="flex flex-col justify-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 gap-0.5 min-h-11 items-center">
              <input
                type="text"
                inputmode="decimal"
                class="text-base text-gray-500 font-normal bg-transparent border-none outline-none w-full leading-tight"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.VALUE_PLACEHOLDER' | translate"
                [value]="formModel().presionMinima ?? ''"
                (input)="onPresionMinimaInput($event)"
              />
            </div>
          </div>

          <!-- Presión Ref. -->
          <div>
            <span class="text-xs font-medium text-gray-700 leading-none truncate mb-2 block">
              {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_REF_LABEL' | translate }}
            </span>
             <div class="flex flex-col justify-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 gap-0.5 min-h-11 items-center">
              <input
                type="text"
                inputmode="decimal"
                class="text-base text-gray-500 font-normal bg-transparent border-none outline-none w-full leading-tight"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.VALUE_PLACEHOLDER' | translate"
                [value]="formModel().presionRef ?? ''"
                (input)="onPresionRefInput($event)"
              />
            </div>
          </div>
        </div>

        <!-- Row 2: Read-only computed/Calibry outputs -->
        <div class="grid grid-cols-2 gap-1.5">
          <!-- Presión Seguridad (from Calibry) -->
          <div class="flex flex-col rounded-lg border border-gray-200 bg-gray-100 px-2 py-2 gap-2">
            <span class="text-xs text-gray-500 leading-none truncate">
              {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_SEGURIDAD_LABEL' | translate }}
            </span>
            <div class="flex items-baseline gap-1">
              <span class="text-base font-regular text-gray-500 leading-tight">
                {{ presionSeguridadDisplay() }}
              </span>
              @if (presionSeguridadDisplay() !== '—') {
                <span class="text-xs text-gray-500">{{ formModel().unidadPresion }}</span>
              }
            </div>
          </div>

          <!-- Presión Buscada (calculated) -->
          <div class="flex flex-col rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 gap-2">
            <span class="text-xs text-gray-500 leading-none truncate">
              {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_BUSCADA_LABEL' | translate }}
            </span>
            <div class="flex items-baseline gap-1">
              <span class="text-base font-regular text-gray-500 leading-tight">
                {{ presionBuscadaDisplay() }}
              </span>
              @if (presionBuscadaDisplay() !== '—') {
                <span class="text-xs text-gray-500">{{ formModel().unidadPresion }}</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverpressureInfoWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  protected readonly pressureUnitOptions = [
    { value: 'MPa', label: 'MPa' },
    { value: 'bar', label: 'bar' },
    { value: 'kPa', label: 'kPa' },
    { value: 'psi', label: 'psi' },
  ];

  protected readonly formModel = signal<OverpressureFormModel>({
    presionMaxima:
      this.#store.overpressureInfo().presionMaxima !== null
        ? String(this.#store.overpressureInfo().presionMaxima)
        : null,
    presionMinima:
      this.#store.overpressureInfo().presionMinima !== null
        ? String(this.#store.overpressureInfo().presionMinima)
        : null,
    presionRef:
      this.#store.overpressureInfo().presionRef !== null ? String(this.#store.overpressureInfo().presionRef) : null,
    unidadPresion: this.#store.overpressureInfo().unidadPresion,
  });

  /** Presión de seguridad para mostrar (desde el store, read-only) */
  protected readonly presionSeguridadDisplay = computed((): string => {
    const v = this.#store.overpressureInfo().presionSeguridad;
    return v !== null ? v.toFixed(2) : '—';
  });

  /** Presión buscada para mostrar (calculada en el store) */
  protected readonly presionBuscadaDisplay = computed((): string => {
    const v = this.#store.overpressurePresionBuscada();
    return v !== null ? v.toFixed(2) : '—';
  });

  readonly formState: Signal<WidgetFormState> = computed(() => {
    const m = this.formModel();
    const s = this.#store.overpressureInfo();
    const toNum = (v: string | null): number | null => {
      if (v === null || v.trim() === '') return null;
      const n = parseFloat(v.replace(',', '.'));
      return isNaN(n) ? null : n;
    };
    const dirty =
      toNum(m.presionMaxima) !== s.presionMaxima ||
      toNum(m.presionMinima) !== s.presionMinima ||
      toNum(m.presionRef) !== s.presionRef ||
      m.unidadPresion !== s.unidadPresion;
    return {
      widgetId: this.widgetId(),
      dirty,
      touched: dirty,
      valid: true,
      hasChanges: dirty,
    };
  });

  resetForm(): void {
    const s = this.#store.overpressureInfo();
    this.formModel.set({
      presionMaxima: s.presionMaxima !== null ? String(s.presionMaxima) : null,
      presionMinima: s.presionMinima !== null ? String(s.presionMinima) : null,
      presionRef: s.presionRef !== null ? String(s.presionRef) : null,
      unidadPresion: s.unidadPresion,
    });
  }

  async saveForm(): Promise<void> {
    const m = this.formModel();
    const toNum = (v: string | null): number | null => {
      if (v === null || v.trim() === '') return null;
      const n = parseFloat(v.replace(',', '.'));
      return isNaN(n) ? null : n;
    };
    this.#store.updateOverpressureInfo({
      presionMaxima: toNum(m.presionMaxima),
      presionMinima: toNum(m.presionMinima),
      presionRef: toNum(m.presionRef),
      unidadPresion: m.unidadPresion,
    } satisfies Partial<OverpressureInfoState>);
  }

  protected onUnitChange(unit: string): void {
    this.formModel.update((m) => ({ ...m, unidadPresion: unit }));
  }

  protected onPresionMaximaInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value || null;
    this.formModel.update((m) => ({ ...m, presionMaxima: value }));
  }

  protected onPresionMinimaInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value || null;
    this.formModel.update((m) => ({ ...m, presionMinima: value }));
  }

  protected onPresionRefInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value || null;
    this.formModel.update((m) => ({ ...m, presionRef: value }));
  }
}

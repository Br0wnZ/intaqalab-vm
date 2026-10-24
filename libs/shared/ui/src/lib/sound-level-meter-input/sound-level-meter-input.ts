import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { MatSelectModule } from '@angular/material/select';
import { LocaleDecimalInputDirective } from '@intaqalab/utils';

export interface SoundLevelMeterValue<T = number | null> {
  x: T;
  y: T;
  z: T;
  unit: string;
}

/**
 * Normaliza cualquier entrada numérica (number, string formateado o plano) a number | null.
 */
function parseToNumber(raw: number | string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const str = raw.trim();
  if (!str) return null;

  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // e.g. "1.234,56" (ES)
      const normalized = str.replace(/\./g, '').replace(',', '.');
      const num = Number(normalized);
      return Number.isFinite(num) ? num : null;
    } else {
      // e.g. "1,234.56" (EN)
      const normalized = str.replace(/,/g, '');
      const num = Number(normalized);
      return Number.isFinite(num) ? num : null;
    }
  }

  if (lastComma !== -1) {
    const normalized = str.replace(',', '.');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }

  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

@Component({
  selector: 'ui-sound-level-meter-input',
  imports: [MatSelectModule, LocaleDecimalInputDirective],
  template: `
    <div class="relative w-full">
      @if (label()) {
        <span
          class="absolute top-0 left-3 z-10 px-1 bg-white font-medium text-slate-500 leading-none select-none pointer-events-none -translate-y-1/2"
          [class.left-3]="size() !== 'small'"
          [class.text-xs]="size() !== 'small'"
          [class.left-2.5]="size() === 'small'"
          [class.text-[10px]]="size() === 'small'"
        >
          {{ label() }}
        </span>
      }
      <div
        class="flex items-center w-full bg-white border border-slate-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100/50 transition-all px-4 py-2 gap-3 h-12 rounded-xl"
        [class.h-9]="size() === 'small'"
        [class.px-3]="size() === 'small'"
        [class.py-1]="size() === 'small'"
        [class.gap-2]="size() === 'small'"
        [class.rounded-lg]="size() === 'small'"
      >
        <!-- Campo X -->
        <div class="flex-1 min-w-0 flex flex-col justify-center h-full">
          <label
            class="font-bold text-slate-400 tracking-wider uppercase select-none truncate"
            [class.text-[9px]]="size() !== 'small'"
            [class.mb-0.5]="size() !== 'small'"
            [class.text-[8px]]="size() === 'small'"
            [class.mb-0]="size() === 'small'"
            [for]="xInputId()"
          >
            {{ xLabel() }}
          </label>
          <div class="flex items-center gap-1 h-5 min-w-0">
            <input
              type="text"
              inputmode="decimal"
              libLocalDecimal
              class="w-full min-w-0 font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 truncate"
              [class.text-sm]="size() !== 'small'"
              [class.text-xs]="size() === 'small'"
              [id]="xInputId()"
              [placeholder]="placeholder()"
              [disabled]="disabled()"
              [numericSign]="numericSign()"
              [decimals]="decimals()"
              [minDecimals]="minDecimals()"
              [decimalValue]="numericXValue()"
              [attr.aria-label]="xLabel()"
              (decimalValueChange)="onXChange($event)"
            />
          </div>
        </div>

        <!-- Divisor -->
        <div
          class="w-px bg-slate-300 flex-shrink-0"
          [class.h-8]="size() !== 'small'"
          [class.h-6]="size() === 'small'"
        ></div>

        <!-- Campo Y -->
        <div class="flex-1 min-w-0 flex flex-col justify-center h-full">
          <label
            class="font-bold text-slate-400 tracking-wider uppercase select-none truncate"
            [class.text-[9px]]="size() !== 'small'"
            [class.mb-0.5]="size() !== 'small'"
            [class.text-[8px]]="size() === 'small'"
            [class.mb-0]="size() === 'small'"
            [for]="yInputId()"
          >
            {{ yLabel() }}
          </label>
          <div class="flex items-center gap-1 h-5 min-w-0">
            <input
              type="text"
              inputmode="decimal"
              libLocalDecimal
              class="w-full min-w-0 font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 truncate"
              [class.text-sm]="size() !== 'small'"
              [class.text-xs]="size() === 'small'"
              [id]="yInputId()"
              [placeholder]="placeholder()"
              [disabled]="disabled()"
              [numericSign]="numericSign()"
              [decimals]="decimals()"
              [minDecimals]="minDecimals()"
              [decimalValue]="numericYValue()"
              [attr.aria-label]="yLabel()"
              (decimalValueChange)="onYChange($event)"
            />
          </div>
        </div>

        <!-- Divisor -->
        <div
          class="w-px bg-slate-300 flex-shrink-0"
          [class.h-8]="size() !== 'small'"
          [class.h-6]="size() === 'small'"
        ></div>

        <!-- Campo Z -->
        <div class="flex-1 min-w-0 flex flex-col justify-center h-full">
          <label
            class="font-bold text-slate-400 tracking-wider uppercase select-none truncate"
            [class.text-[9px]]="size() !== 'small'"
            [class.mb-0.5]="size() !== 'small'"
            [class.text-[8px]]="size() === 'small'"
            [class.mb-0]="size() === 'small'"
            [for]="zInputId()"
          >
            {{ zLabel() }}
          </label>
          <div class="flex items-center gap-1 h-5 min-w-0">
            <input
              type="text"
              inputmode="decimal"
              libLocalDecimal
              class="w-full min-w-0 font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 truncate"
              [class.text-sm]="size() !== 'small'"
              [class.text-xs]="size() === 'small'"
              [id]="zInputId()"
              [placeholder]="placeholder()"
              [disabled]="disabled()"
              [numericSign]="numericSign()"
              [decimals]="decimals()"
              [minDecimals]="minDecimals()"
              [decimalValue]="numericZValue()"
              [attr.aria-label]="zLabel()"
              (decimalValueChange)="onZChange($event)"
            />
          </div>
        </div>

        <!-- Divisor -->
        <div
          class="w-px bg-slate-300 flex-shrink-0"
          [class.h-8]="size() !== 'small'"
          [class.h-6]="size() === 'small'"
        ></div>

        <!-- Selector de unidades -->
        <mat-select
          panelClass="sound-level-meter-unit-panel"
          disableRipple
          class="shrink-0 !w-max font-medium text-slate-600 bg-transparent"
          [class.text-sm]="size() !== 'small'"
          [class.text-xs]="size() === 'small'"
          [value]="unit()"
          [disabled]="disabled()"
          [attr.aria-label]="label() + ' unidad'"
          (selectionChange)="onUnitChange($event.value)"
        >
          @for (opt of unitOptions(); track opt.value) {
            <mat-option class="text-sm" [value]="opt.value">
              {{ opt.label }}
            </mat-option>
          }
        </mat-select>
      </div>
    </div>
  `,
  styles: [
    `
      /* Panel del selector de unidades */
      ::ng-deep .sound-level-meter-unit-panel {
        min-width: 100px !important;
      }
      ::ng-deep ui-sound-level-meter-input mat-select .mat-mdc-select-trigger {
        height: 100% !important;
        display: flex;
        align-items: center;
      }
      ::ng-deep ui-sound-level-meter-input mat-select .mat-mdc-select-value {
        overflow: visible !important;
        white-space: nowrap !important;
        min-width: unset !important;
        width: auto !important;
      }
      ::ng-deep ui-sound-level-meter-input .mat-mdc-select-arrow-wrapper {
        height: unset !important;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoundLevelMeterInput<
  T extends number | string | null = number | string | null,
> implements FormValueControl<SoundLevelMeterValue<T> | null> {
  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly size = input<'normal' | 'small'>('normal');
  readonly label = input<string | null>(null);
  readonly xLabel = input<string>('X');
  readonly yLabel = input<string>('Y');
  readonly zLabel = input<string>('Z');
  readonly placeholder = input<string>('0');
  readonly disabled = input<boolean>(false);
  readonly unitOptions = input<{ value: string; label: string }[]>([{ value: 'm', label: 'm' }]);
  readonly numericSign = input<'any' | 'non-negative' | 'non-positive'>('any');
  readonly decimals = input<number>(2);
  readonly minDecimals = input<number>(0);

  // ── Bidirectional Signal Model (FormValueControl) ────────────────────────
  readonly value = model<SoundLevelMeterValue<T> | null>(null);

  // ── Derived values for view ───────────────────────────────────────────────
  protected readonly numericXValue = computed(() => parseToNumber(this.value()?.x));
  protected readonly numericYValue = computed(() => parseToNumber(this.value()?.y));
  protected readonly numericZValue = computed(() => parseToNumber(this.value()?.z));
  protected readonly unit = computed(() => this.value()?.unit ?? this.unitOptions()[0]?.value ?? 'm');

  // ── Accessibility Unique IDs ──────────────────────────────────────────────
  readonly #uid = Math.random().toString(36).substring(2, 9);
  protected readonly xInputId = computed(() => `sound-level-meter-x-${this.#uid}`);
  protected readonly yInputId = computed(() => `sound-level-meter-y-${this.#uid}`);
  protected readonly zInputId = computed(() => `sound-level-meter-z-${this.#uid}`);

  // ── Event Handlers ────────────────────────────────────────────────────────
  onXChange(num: number | null): void {
    const current = this.value();
    const currentX = current?.x;
    let nextX: T;
    if (typeof currentX === 'string') {
      nextX = (num !== null ? String(num) : '') as T;
    } else {
      nextX = num as T;
    }

    this.value.set({
      x: nextX,
      y: current?.y ?? (null as T),
      z: current?.z ?? (null as T),
      unit: current?.unit ?? this.unitOptions()[0]?.value ?? 'm',
    });
  }

  onYChange(num: number | null): void {
    const current = this.value();
    const currentY = current?.y;
    let nextY: T;
    if (typeof currentY === 'string') {
      nextY = (num !== null ? String(num) : '') as T;
    } else {
      nextY = num as T;
    }

    this.value.set({
      x: current?.x ?? (null as T),
      y: nextY,
      z: current?.z ?? (null as T),
      unit: current?.unit ?? this.unitOptions()[0]?.value ?? 'm',
    });
  }

  onZChange(num: number | null): void {
    const current = this.value();
    const currentZ = current?.z;
    let nextZ: T;
    if (typeof currentZ === 'string') {
      nextZ = (num !== null ? String(num) : '') as T;
    } else {
      nextZ = num as T;
    }

    this.value.set({
      x: current?.x ?? (null as T),
      y: current?.y ?? (null as T),
      z: nextZ,
      unit: current?.unit ?? this.unitOptions()[0]?.value ?? 'm',
    });
  }

  onUnitChange(unit: string): void {
    const current = this.value();
    this.value.set({
      x: current?.x ?? (null as T),
      y: current?.y ?? (null as T),
      z: current?.z ?? (null as T),
      unit,
    });
  }
}

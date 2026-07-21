import { Component, ViewEncapsulation, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { MatSelectModule } from '@angular/material/select';

export interface SoundLevelMeterValue {
  x: number | null;
  y: number | null;
  z: number | null;
  unit: string;
}

@Component({
  selector: 'ui-sound-level-meter-input',
  imports: [MatSelectModule],
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
        <div class="flex-1 flex flex-col justify-center h-full">
          <label
            class="font-bold text-slate-400 tracking-wider uppercase select-none"
            [class.text-[9px]]="size() !== 'small'"
            [class.mb-0.5]="size() !== 'small'"
            [class.text-[8px]]="size() === 'small'"
            [class.mb-0]="size() === 'small'"
            [for]="xInputId()"
          >
            {{ xLabel() }}
          </label>
          <div class="flex items-center gap-1 h-5">
            <input
              type="number"
              class="w-full font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              [class.text-sm]="size() !== 'small'"
              [class.text-xs]="size() === 'small'"
              [id]="xInputId()"
              [placeholder]="placeholder()"
              [disabled]="disabled()"
              [value]="xValue() ?? ''"
              [attr.aria-label]="xLabel()"
              (input)="onXChange($event)"
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
        <div class="flex-1 flex flex-col justify-center h-full">
          <label
            class="font-bold text-slate-400 tracking-wider uppercase select-none"
            [class.text-[9px]]="size() !== 'small'"
            [class.mb-0.5]="size() !== 'small'"
            [class.text-[8px]]="size() === 'small'"
            [class.mb-0]="size() === 'small'"
            [for]="yInputId()"
          >
            {{ yLabel() }}
          </label>
          <div class="flex items-center gap-1 h-5">
            <input
              type="number"
              class="w-full font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              [class.text-sm]="size() !== 'small'"
              [class.text-xs]="size() === 'small'"
              [id]="yInputId()"
              [placeholder]="placeholder()"
              [disabled]="disabled()"
              [value]="yValue() ?? ''"
              [attr.aria-label]="yLabel()"
              (input)="onYChange($event)"
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
        <div class="flex-1 flex flex-col justify-center h-full">
          <label
            class="font-bold text-slate-400 tracking-wider uppercase select-none"
            [class.text-[9px]]="size() !== 'small'"
            [class.mb-0.5]="size() !== 'small'"
            [class.text-[8px]]="size() === 'small'"
            [class.mb-0]="size() === 'small'"
            [for]="zInputId()"
          >
            {{ zLabel() }}
          </label>
          <div class="flex items-center gap-1 h-5">
            <input
              type="number"
              class="w-full font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              [class.text-sm]="size() !== 'small'"
              [class.text-xs]="size() === 'small'"
              [id]="zInputId()"
              [placeholder]="placeholder()"
              [disabled]="disabled()"
              [value]="zValue() ?? ''"
              [attr.aria-label]="zLabel()"
              (input)="onZChange($event)"
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
})
export class SoundLevelMeterInput implements FormValueControl<SoundLevelMeterValue | null> {
  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly size = input<'normal' | 'small'>('normal');
  readonly label = input<string | null>(null);
  readonly xLabel = input<string>('X');
  readonly yLabel = input<string>('Y');
  readonly zLabel = input<string>('Z');
  readonly placeholder = input<string>('0');
  readonly disabled = input<boolean>(false);
  readonly unitOptions = input<{ value: string; label: string }[]>([{ value: 'm', label: 'm' }]);

  // ── Bidirectional Signal Model (FormValueControl) ────────────────────────
  readonly value = model<SoundLevelMeterValue | null>(null);

  // ── Derived values for view ───────────────────────────────────────────────
  protected readonly xValue = computed(() => this.value()?.x ?? null);
  protected readonly yValue = computed(() => this.value()?.y ?? null);
  protected readonly zValue = computed(() => this.value()?.z ?? null);
  protected readonly unit = computed(() => this.value()?.unit ?? this.unitOptions()[0]?.value ?? 'm');

  // ── Accessibility Unique IDs ──────────────────────────────────────────────
  readonly #uid = Math.random().toString(36).substring(2, 9);
  protected readonly xInputId = computed(() => `sound-level-meter-x-${this.#uid}`);
  protected readonly yInputId = computed(() => `sound-level-meter-y-${this.#uid}`);
  protected readonly zInputId = computed(() => `sound-level-meter-z-${this.#uid}`);

  // ── Event Handlers ────────────────────────────────────────────────────────
  onXChange(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const num = rawValue === '' ? null : Number(rawValue);
    const current = this.value();
    this.value.set({
      x: num,
      y: current?.y ?? null,
      z: current?.z ?? null,
      unit: current?.unit ?? this.unitOptions()[0]?.value ?? 'm',
    });
  }

  onYChange(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const num = rawValue === '' ? null : Number(rawValue);
    const current = this.value();
    this.value.set({
      x: current?.x ?? null,
      y: num,
      z: current?.z ?? null,
      unit: current?.unit ?? this.unitOptions()[0]?.value ?? 'm',
    });
  }

  onZChange(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const num = rawValue === '' ? null : Number(rawValue);
    const current = this.value();
    this.value.set({
      x: current?.x ?? null,
      y: current?.y ?? null,
      z: num,
      unit: current?.unit ?? this.unitOptions()[0]?.value ?? 'm',
    });
  }

  onUnitChange(unit: string): void {
    const current = this.value();
    this.value.set({
      x: current?.x ?? null,
      y: current?.y ?? null,
      z: current?.z ?? null,
      unit,
    });
  }
}

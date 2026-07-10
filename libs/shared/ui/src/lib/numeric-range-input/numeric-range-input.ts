import { Component, ViewEncapsulation, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'ui-numeric-range-input',
  imports: [],
  template: `
    <div class="flex flex-col gap-1.5 w-full">
      @if (label()) {
        <span class="text-sm font-medium text-slate-700 select-none">
          {{ label() }}
        </span>
      }
      <div
        class="flex items-center w-full bg-white rounded-xl border border-slate-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100/50 transition-all px-4 py-2 gap-4 h-[58px]"
      >
        <!-- Lado Mínimo -->
        <div class="flex-1 flex flex-col justify-center h-full">
          <label
            class="text-[9px] font-bold text-slate-400 tracking-wider uppercase select-none mb-0.5"
            [for]="minInputId()"
          >
            {{ minLabel() }}
          </label>
          <div class="flex items-center gap-1 h-5">
            @if (minPrefix()) {
              <span class="text-sm text-slate-400 select-none font-medium mb-[1px]">{{ minPrefix() }}</span>
            }
            <input
              type="number"
              class="w-full text-sm font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              [id]="minInputId()"
              [placeholder]="minPlaceholder()"
              [disabled]="disabled()"
              [value]="minValue() ?? ''"
              (input)="onMinChange($event)"
            />
          </div>
        </div>

        <!-- Divisor Central -->
        <div class="w-px h-8 bg-slate-300 flex-shrink-0"></div>

        <!-- Lado Máximo -->
        <div class="flex-1 flex flex-col justify-center h-full items-end">
          <label
            class="text-[9px] font-bold text-slate-400 tracking-wider uppercase select-none mb-0.5 text-right w-full"
            [for]="maxInputId()"
          >
            {{ maxLabel() }}
          </label>
          <div class="flex items-center justify-end gap-1 h-5 w-full">
            <input
              type="number"
              class="w-full text-sm font-semibold text-slate-800 bg-transparent border-none outline-none focus:ring-0 p-0 m-0 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              [id]="maxInputId()"
              [placeholder]="maxPlaceholder()"
              [disabled]="disabled()"
              [value]="maxValue() ?? ''"
              (input)="onMaxChange($event)"
            />
            @if (maxPrefix()) {
              <span class="text-sm text-slate-400 select-none font-medium mb-[1px]">{{ maxPrefix() }}</span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
})
export class NumericRangeInput implements FormValueControl<{ min: number | null; max: number | null } | null> {
  // Inputs
  readonly label = input<string | null>(null);
  readonly minLabel = input<string>('Min');
  readonly maxLabel = input<string>('Max');
  readonly minPlaceholder = input<string>('0');
  readonly maxPlaceholder = input<string>('0');
  readonly minPrefix = input<string>('');
  readonly maxPrefix = input<string>('');
  readonly disabled = input<boolean>(false);

  // Bidirectional Signal Model (FormValueControl)
  readonly value = model<{ min: number | null; max: number | null } | null>(null);

  // Derived values for view
  protected readonly minValue = computed(() => this.value()?.min ?? null);
  protected readonly maxValue = computed(() => this.value()?.max ?? null);

  // Accessibility Unique IDs
  readonly #uid = Math.random().toString(36).substring(2, 9);
  protected readonly minInputId = computed(() => `numeric-range-min-${this.#uid}`);
  protected readonly maxInputId = computed(() => `numeric-range-max-${this.#uid}`);

  onMinChange(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const num = rawValue === '' ? null : Number(rawValue);
    const current = this.value();
    this.value.set({
      min: num,
      max: current?.max ?? null,
    });
  }

  onMaxChange(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const num = rawValue === '' ? null : Number(rawValue);
    const current = this.value();
    this.value.set({
      min: current?.min ?? null,
      max: num,
    });
  }
}

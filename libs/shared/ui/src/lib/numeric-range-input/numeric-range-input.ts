import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input, model } from '@angular/core';
import type { FormValueControl, ValidationError, WithOptionalField } from '@angular/forms/signals';

export type NumericRangeValue = { min: number | null; max: number | null } | null;

/**
 * Input de rango numérico (min/max) integrable con Signal Forms.
 *
 * Implementa el contrato `FormValueControl`, por lo que puede enlazarse
 * directamente a un campo de `form()` mediante la directiva `FormField`:
 *
 * ```html
 * <ui-numeric-range-input [formField]="myForm.range" />
 * ```
 *
 * La directiva sincroniza automáticamente `value`, `disabled`, `readonly`,
 * `required`, `invalid`, `errors` y `touched`. También puede usarse standalone
 * con `[value]` / `(valueChange)`.
 */
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
        [class.!border-red-400]="showErrors()"
        [class.focus-within:!ring-red-100]="showErrors()"
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
              [readOnly]="readonly()"
              [value]="minValue() ?? ''"
              [attr.aria-required]="required() ? true : null"
              [attr.aria-invalid]="showErrors() ? true : null"
              [attr.aria-describedby]="showErrors() ? errorsId() : null"
              (input)="onMinChange($event)"
              (blur)="markTouched()"
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
              [readOnly]="readonly()"
              [value]="maxValue() ?? ''"
              [attr.aria-required]="required() ? true : null"
              [attr.aria-invalid]="showErrors() ? true : null"
              [attr.aria-describedby]="showErrors() ? errorsId() : null"
              (input)="onMaxChange($event)"
              (blur)="markTouched()"
            />
            @if (maxPrefix()) {
              <span class="text-sm text-slate-400 select-none font-medium mb-[1px]">{{ maxPrefix() }}</span>
            }
          </div>
        </div>
      </div>

      <!-- Errores de validación (sincronizados por la directiva FormField) -->
      @if (showErrors() && errors().length > 0) {
        <div role="alert" class="flex flex-col gap-0.5" [id]="errorsId()">
          @for (error of errors(); track $index) {
            <span class="text-xs text-red-500">{{ error.message ?? error.kind }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumericRangeInput implements FormValueControl<NumericRangeValue> {
  // Inputs de presentación (uso standalone)
  readonly label = input<string | null>(null);
  readonly minLabel = input<string>('Min');
  readonly maxLabel = input<string>('Max');
  readonly minPlaceholder = input<string>('0');
  readonly maxPlaceholder = input<string>('0');
  readonly minPrefix = input<string>('');
  readonly maxPrefix = input<string>('');

  // ── Contrato FormValueControl ────────────────────────────────────────────
  // La directiva FormField mantiene estas propiedades en sync con el campo.

  /** Valor del control. Única propiedad obligatoria del contrato. */
  readonly value = model<NumericRangeValue>(null);

  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly errors = input<readonly WithOptionalField<ValidationError>[]>([]);

  /** Se marca al hacer blur en cualquiera de los dos inputs; la directiva lo propaga al campo. */
  readonly touched = model<boolean>(false);

  // Derivados para la vista
  protected readonly minValue = computed(() => this.value()?.min ?? null);
  protected readonly maxValue = computed(() => this.value()?.max ?? null);

  /** Solo se muestran errores tras interacción, siguiendo la convención de touched. */
  protected readonly showErrors = computed(() => this.touched() && (this.invalid() || this.errors().length > 0));

  // Accessibility Unique IDs
  readonly #uid = Math.random().toString(36).substring(2, 9);
  protected readonly minInputId = computed(() => `numeric-range-min-${this.#uid}`);
  protected readonly maxInputId = computed(() => `numeric-range-max-${this.#uid}`);
  protected readonly errorsId = computed(() => `numeric-range-errors-${this.#uid}`);

  protected markTouched(): void {
    if (!this.touched()) {
      this.touched.set(true);
    }
  }

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

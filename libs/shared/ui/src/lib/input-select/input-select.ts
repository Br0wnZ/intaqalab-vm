import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  afterEveryRender,
  computed,
  contentChild,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
} from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { LOCALE_SIGNAL, LocaleDecimalInputDirective, formatPreciseNumber } from '@intaqalab/utils';

import { InputSelectInput } from './input-select-input.directive';

export interface InputSelectValue<T = number | string | null> {
  value: T;
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

/**
 * Formatea un valor numérico para display según el locale activo.
 */
function formatDisplayNumber(value: number | null, locale: string, minDec: number): string {
  if (value === null || !Number.isFinite(value)) return '';
  return formatPreciseNumber(value, locale, minDec);
}

@Component({
  selector: 'ui-input-select',
  imports: [MatSelectModule, LocaleDecimalInputDirective],
  template: `
    <div class="relative h-11">
      <!-- Label flotante: solo visible cuando showLabel=true -->
      @if (showLabel()) {
        <span
          class="absolute left-3 max-w-[calc(100%-1.5rem)] truncate bg-white px-1 pointer-events-none transition-all duration-200 z-10 leading-none select-none"
          [title]="label()"
          [class]="
            labelFloating()
              ? isComputed()
                ? 'top-0 -translate-y-1/2 text-[11px] text-violet-500'
                : 'top-0 -translate-y-1/2 text-[11px] text-violet-500'
              : 'top-1/2 -translate-y-1/2 text-sm text-gray-500'
          "
        >
          {{ label() }}
        </span>
      }

      <!-- Campo combinado: input + select -->
      <div
        class="flex items-center rounded-md transition-colors h-full border overflow-hidden"
        [class]="containerClass()"
        [class.border-red-500]="focused()"
      >
        <!-- Slot de proyección (padre inyecta su propio <input> con directivas) -->
        <ng-content select="[inputSelectInput]" />

        <!-- Input interno — solo activo cuando NO hay proyección -->
        @if (!projectedInput()) {
          <input
            type="text"
            libLocalDecimal
            inputmode="decimal"
            class="flex-1 min-w-0 truncate px-4 h-full text-md outline-none bg-transparent w-0 placeholder:text-gray-500"
            [numericSign]="numericSign()"
            [decimals]="decimals()"
            [minDecimals]="minDecimals()"
            [decimalValue]="numericValue()"
            [class]="isComputed() ? 'font-medium text-violet-800' : 'text-slate-700'"
            [style.color]="textColor() ?? null"
            [readonly]="readOnly()"
            [disabled]="readOnly()"
            [placeholder]="!showLabel() || labelFloating() ? placeholder() : ''"
            [attr.aria-label]="label()"
            (decimalValueChange)="onNumericChange($event)"
            (focus)="focused.set(true)"
            (blur)="focused.set(false)"
          />
        }

        <!-- Divider -->
        <span class="w-px h-4 flex-shrink-0" [class]="isComputed() ? 'bg-violet-500' : 'bg-slate-300'"></span>

        <!-- Select inline -->
        <mat-select
          panelClass="input-select-panel"
          disableRipple
          class="shrink-0 !w-max px-4 text-md bg-transparent"
          [class]="isComputed() ? 'text-violet-600' : 'text-slate-500'"
          [value]="selectedUnit()"
          [attr.aria-label]="label() + ' unidad'"
          [panelWidth]="panelWidth()"
          [disabled]="readOnly()"
          (selectionChange)="onUnitChange($event.value)"
        >
          @for (opt of opciones(); track opt.value) {
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
      /* Elimina el underline y wrapper visual de mat-select cuando es inline */
      ::ng-deep mat-select .mat-mdc-select-trigger {
        height: 100% !important;
        display: flex;
        align-items: center;
      }
      ::ng-deep mat-select .mat-mdc-select-value {
        overflow: visible !important;
        white-space: nowrap !important;
        min-width: unset !important;
        width: auto !important;
      }
      ::ng-deep .mat-mdc-select-arrow-wrapper {
        height: unset !important;
      }
      /* Panel del select alineado */
      ::ng-deep .input-select-panel {
        min-width: 30px !important;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputSelect<T extends number | string | null = number | string | null> {
  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly label = input.required<string>();
  readonly opciones = input.required<{ value: string; label: string }[]>();
  readonly textColor = input<string | null>(null);
  readonly placeholder = input<string>('0,00');
  readonly readOnly = input(false);
  readonly numericSign = input<'any' | 'non-negative' | 'non-positive'>('any');
  readonly decimals = input<number>(2);
  readonly minDecimals = input<number>(0);
  readonly variant = input<'default' | 'computed'>('default');
  /**
   * Muestra el label flotante sobre el borde del campo.
   * Ponlo a `false` cuando el input sea proyectado desde fuera o cuando
   * prefieras mostrar solo el placeholder.
   * @default true
   */
  readonly showLabel = input<boolean>(true);
  readonly floatLabel = input<'auto' | 'always'>('auto');

  // ── Two-way binding ───────────────────────────────────────────────────────
  readonly value = model<InputSelectValue<T> | null>(null);

  // ── Estado interno derivado del modelo ───────────────────────────────────
  readonly numericValue = computed<number | null>(() => {
    return parseToNumber(this.value()?.value);
  });
  readonly inputValue = computed<string>(() => {
    const val = this.value()?.value;
    return val !== null && val !== undefined ? String(val) : '';
  });
  readonly selectedUnit = linkedSignal(() => this.value()?.unit ?? this.opciones()[0]?.value ?? '');

  // ── Label flotante ────────────────────────────────────────────────────────
  readonly focused = signal(false);
  readonly labelFloating = computed(
    () => this.floatLabel() === 'always' || this.readOnly() || !!this.inputValue() || this.focused(),
  );
  readonly isComputed = computed(() => this.variant() === 'computed');
  readonly containerClass = computed(() => {
    if (this.readOnly()) return 'bg-gray-100 border-slate-200';
    if (this.isComputed()) return 'bg-violet-50/40 border-violet-200';
    return this.focused() ? 'border-[2px] bg-white border-violet-500' : 'bg-white border-slate-200';
  });

  // ── Panel width (full host element width for dropdown) ────────────────────
  readonly #elRef = inject(ElementRef);
  readonly #renderer = inject(Renderer2);
  readonly #destroyRef = inject(DestroyRef);
  readonly #localeSignal = inject(LOCALE_SIGNAL);
  readonly panelWidth = signal<number | null>(null);

  // ── Content projection ───────────────────────────────────────────────────
  /**
   * Input proyectado por el padre con `inputSelectInput`.
   * Si existe, `InputSelect` delega el campo de entrada en él y
   * conecta sus eventos (input/focus/blur) para mantener el estado interno.
   */
  readonly projectedInput = contentChild(InputSelectInput);

  /** Evita registrar los listeners más de una vez. */
  #projectedWired = false;
  readonly #unlisteners: (() => void)[] = [];

  constructor() {
    afterEveryRender(() => {
      this.panelWidth.set((this.#elRef.nativeElement as HTMLElement).offsetWidth);
      this.#wireProjectedInput();
    });

    effect(() => {
      const num = this.numericValue();
      const projected = this.projectedInput();
      if (!projected) return;

      const dir = projected.decimalDirective;
      if (dir) {
        untracked(() => {
          dir.writeValue(num);
        });
      } else if (!this.focused()) {
        const formatted = formatDisplayNumber(num, this.#localeSignal(), this.minDecimals());
        this.#renderer.setProperty(projected.el.nativeElement, 'value', formatted);
      }
    });

    this.#destroyRef.onDestroy(() => {
      this.#unlisteners.forEach((fn) => fn());
    });
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  onNumericChange(num: number | null): void {
    const current = this.value();
    const currentVal = current?.value;
    let nextVal: T;

    if (typeof currentVal === 'string') {
      nextVal = (num !== null ? String(num) : '') as T;
    } else {
      nextVal = num as T;
    }

    this.value.set({
      value: nextVal,
      unit: this.selectedUnit(),
    });
  }

  onUnitChange(unit: string): void {
    this.selectedUnit.set(unit);
    const current = this.value();
    const currentVal = current?.value;
    let nextVal: T;

    if (typeof currentVal === 'string') {
      const num = this.numericValue();
      nextVal = (num !== null ? String(num) : (currentVal ?? '')) as T;
    } else {
      nextVal = (this.numericValue() ?? null) as T;
    }

    this.value.set({
      value: nextVal,
      unit,
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /**
   * Conecta el `<input>` proyectado al estado interno del componente.
   * Solo se ejecuta una vez (guard `#projectedWired`).
   * Aplica estilos CSS y registra los listeners de input/focus/blur.
   */
  #wireProjectedInput(): void {
    const projected = this.projectedInput();
    if (!projected) return;

    const el = projected.el.nativeElement;
    this.#renderer.setProperty(el, 'readOnly', this.readOnly());
    this.#renderer.setProperty(el, 'disabled', this.readOnly());

    if (this.#projectedWired) return;
    this.#projectedWired = true;

    // Estilos del input interno replicados sobre el elemento proyectado
    this.#renderer.setAttribute(
      el,
      'class',
      'flex-1 min-w-0 truncate px-4 h-full text-md outline-none bg-transparent w-0 text-slate-700 placeholder:text-gray-500',
    );
    this.#renderer.setAttribute(el, 'type', 'text');
    this.#renderer.setAttribute(el, 'inputmode', 'decimal');
    this.#renderer.setAttribute(el, 'placeholder', this.placeholder());

    const dir = projected.decimalDirective;
    if (dir) {
      this.#unlisteners.push(
        this.#renderer.listen(el, 'input', (event: Event) => {
          const input = event.target as HTMLInputElement;
          const parsed = parseToNumber(input.value);
          this.onNumericChange(parsed);
        }),
        this.#renderer.listen(el, 'focus', () => this.focused.set(true)),
        this.#renderer.listen(el, 'blur', () => {
          this.focused.set(false);
          const parsed = parseToNumber(el.value);
          this.onNumericChange(parsed);
        }),
      );
    } else {
      this.#unlisteners.push(
        this.#renderer.listen(el, 'input', (event: Event) => {
          const input = event.target as HTMLInputElement;
          const parsed = parseToNumber(input.value);
          this.onNumericChange(parsed);
        }),
        this.#renderer.listen(el, 'focus', () => this.focused.set(true)),
        this.#renderer.listen(el, 'blur', () => {
          this.focused.set(false);
          const formatted = formatDisplayNumber(this.numericValue(), this.#localeSignal(), this.minDecimals());
          this.#renderer.setProperty(el, 'value', formatted);
        }),
      );
    }
  }
}

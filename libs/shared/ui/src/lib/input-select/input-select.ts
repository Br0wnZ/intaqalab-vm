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
  inject,
  input,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import { MatSelectModule } from '@angular/material/select';

import { InputSelectInput } from './input-select-input.directive';

@Component({
  selector: 'ui-input-select',
  imports: [MatSelectModule, InputSelectInput],
  template: `
    <div class="relative h-11">
      <!-- Label flotante: solo visible cuando showLabel=true -->
      @if (showLabel()) {
        <span
          class="absolute left-3 bg-white px-1 pointer-events-none transition-all duration-200 z-10 leading-none select-none"
          [class]="
            labelFloating()
              ? isComputed()
                ? 'top-0 -translate-y-1/2 text-[11px] text-violet-500'
                : 'top-0 -translate-y-1/2 text-[11px] text-violet-500'
              : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
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
            inputmode="decimal"
            class="flex-1 px-4 h-full text-md outline-none bg-transparent w-full"
            [class]="isComputed() ? 'font-medium text-violet-800' : 'text-slate-700'"
            [style.color]="textColor() ?? null"
            [value]="inputValue()"
            [readonly]="readOnly()"
            [placeholder]="!showLabel() || labelFloating() ? placeholder() : ''"
            [attr.aria-label]="label()"
            (input)="onInputChange($event)"
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
export class InputSelect {
  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly label = input.required<string>();
  readonly opciones = input.required<{ value: string; label: string }[]>();
  readonly textColor = input<string | null>(null);
  readonly placeholder = input<string>('0,00');
  readonly readOnly = input(false);
  readonly variant = input<'default' | 'computed'>('default');
  /**
   * Muestra el label flotante sobre el borde del campo.
   * Ponlo a `false` cuando el input sea proyectado desde fuera o cuando
   * prefieras mostrar solo el placeholder.
   * @default true
   */
  readonly showLabel = input<boolean>(true);

  // ── Two-way binding ───────────────────────────────────────────────────────
  readonly value = model<{ value: string; unit: string } | null>(null);

  // ── Estado interno derivado del modelo ───────────────────────────────────
  readonly inputValue = linkedSignal(() => this.value()?.value ?? '');
  readonly selectedUnit = linkedSignal(() => this.value()?.unit ?? this.opciones()[0]?.value ?? '');

  // ── Label flotante ────────────────────────────────────────────────────────
  readonly focused = signal(false);
  readonly labelFloating = computed(() => this.readOnly() || !!this.inputValue() || this.focused());
  readonly isComputed = computed(() => this.variant() === 'computed');
  readonly containerClass = computed(() => {
    if (this.isComputed()) return 'bg-violet-50/40 border-violet-200';
    return this.focused() ? 'border-[2px] bg-white border-violet-500' : 'bg-white border-slate-200';
  });

  // ── Panel width (full host element width for dropdown) ────────────────────
  readonly #elRef = inject(ElementRef);
  readonly #renderer = inject(Renderer2);
  readonly #destroyRef = inject(DestroyRef);
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

    this.#destroyRef.onDestroy(() => {
      this.#unlisteners.forEach((fn) => fn());
    });
  }

  // ── Handlers (input interno) ─────────────────────────────────────────────
  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.inputValue.set(raw);
    this.value.set({ value: raw, unit: this.selectedUnit() });
  }

  onUnitChange(unit: string): void {
    this.selectedUnit.set(unit);
    this.value.set({ value: this.inputValue(), unit });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /**
   * Conecta el `<input>` proyectado al estado interno del componente.
   * Solo se ejecuta una vez (guard `#projectedWired`).
   * Aplica estilos CSS y registra los listeners de input/focus/blur.
   */
  #wireProjectedInput(): void {
    const projected = this.projectedInput();
    if (!projected || this.#projectedWired) return;
    this.#projectedWired = true;

    const el = projected.el.nativeElement as HTMLInputElement;

    // Estilos del input interno replicados sobre el elemento proyectado
    this.#renderer.setAttribute(
      el,
      'class',
      'flex-1 px-4 h-full text-md outline-none bg-transparent w-full text-slate-700',
    );
    this.#renderer.setAttribute(el, 'type', 'text');
    this.#renderer.setAttribute(el, 'inputmode', 'decimal');
    this.#renderer.setAttribute(el, 'placeholder', this.placeholder());

    // Sincroniza el valor inicial
    el.value = this.inputValue();

    // Conecta eventos
    this.#unlisteners.push(
      this.#renderer.listen(el, 'input', (event: Event) => {
        const raw = (event.target as HTMLInputElement).value;
        this.inputValue.set(raw);
        this.value.set({ value: raw, unit: this.selectedUnit() });
      }),
      this.#renderer.listen(el, 'focus', () => this.focused.set(true)),
      this.#renderer.listen(el, 'blur', () => this.focused.set(false)),
    );
  }
}

import { afterEveryRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, linkedSignal, model, signal, ViewEncapsulation } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'ui-input-select',
  imports: [MatSelectModule],
  template: `
    <div class="relative h-11">
      <!-- Label flotante: placeholder cuando vacío, superpuesto al borde cuando hay valor -->
      <span
        class="absolute left-3 bg-white px-1 pointer-events-none transition-all duration-200 z-10 leading-none select-none"
        [class]="labelFloating()
          ? (isComputed() ? 'top-0 -translate-y-1/2 text-xs text-violet-500' : 'top-0 -translate-y-1/2 text-xs text-slate-500')
          : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'"
      >{{ label() }}</span>

      <!-- Campo combinado: input + select -->
      <div
        class="flex items-center rounded-md transition-colors h-full border overflow-hidden"
        [class]="containerClass()"
      >
        <!-- Input numérico -->
        <input
          type="text"
          inputmode="decimal"
          class="flex-1 px-1.5 h-full text-[11px] outline-none bg-transparent"
          [class]="isComputed() ? 'font-medium text-violet-800' : 'text-slate-700'"
          [style.color]="textColor() ?? null"
          [value]="inputValue()"
          [readonly]="readOnly()"
          [placeholder]="labelFloating() ? placeholder() : ''"
          [attr.aria-label]="label()"
          (input)="onInputChange($event)"
          (focus)="focused.set(true)"
          (blur)="focused.set(false)"
        />

        <!-- Divider -->
        <span class="w-px h-4 flex-shrink-0" [class]="isComputed() ? 'bg-violet-200' : 'bg-slate-200'"></span>

        <!-- Select inline -->
        <mat-select
          panelClass="input-select-panel"
          disableRipple
          class="shrink-0 !w-max px-2 text-[11px] bg-transparent"
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

  // ── Two-way binding ───────────────────────────────────────────────────────
  readonly value = model<{ value: string; unit: string } | null>(null);

  // ── Estado interno derivado del modelo ───────────────────────────────────
  readonly inputValue = linkedSignal(() => this.value()?.value ?? '');
  readonly selectedUnit = linkedSignal(
    () => this.value()?.unit ?? this.opciones()[0]?.value ?? '',
  );

  // ── Label flotante ────────────────────────────────────────────────────────
  readonly focused = signal(false);
  readonly labelFloating = computed(() => this.readOnly() || !!this.inputValue() || this.focused());
  readonly isComputed = computed(() => this.variant() === 'computed');
  readonly containerClass = computed(() => {
    if (this.isComputed()) return 'bg-violet-50/40 border-violet-200';
    return this.focused() ? 'bg-white border-slate-400' : 'bg-white border-slate-200';
  });

  // ── Panel width (full host element width for dropdown) ────────────────────
  readonly #elRef = inject(ElementRef);
  readonly panelWidth = signal<number | null>(null);

  constructor() {
    afterEveryRender(() => {
      this.panelWidth.set((this.#elRef.nativeElement as HTMLElement).offsetWidth);
    });
  }

  onInputChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.inputValue.set(raw);
    this.value.set({ value: raw, unit: this.selectedUnit() });
  }

  onUnitChange(unit: string): void {
    this.selectedUnit.set(unit);
    this.value.set({ value: this.inputValue(), unit });
  }
}

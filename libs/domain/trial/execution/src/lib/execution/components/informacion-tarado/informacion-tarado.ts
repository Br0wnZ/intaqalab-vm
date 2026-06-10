import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { ElementRef, Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import type { InformacionTaradoState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

interface InformacionTaradoForm {
  velocidadUnit: string;
}

@Component({
  selector: 'inta-informacion-tarado',
  standalone: true,
  imports: [FormField, ReadonlyContentDirective, MatFormFieldModule, MatIconModule, MatSelectModule, TranslateModule],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2 overflow-hidden">
      <!-- Header: Icon + Title + Velocity unit selector -->
      <div class="flex items-center gap-2 shrink-0">
        <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 shrink-0">
          <mat-icon class="text-violet-600 !text-[16px] !w-4 !h-4">speed</mat-icon>
        </div>
        <h3 class="text-sm font-semibold text-slate-800 leading-tight flex-1 truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.INFORMACION_TARADO.TITLE' | translate }}
        </h3>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="!w-20 shrink-0">
          <mat-select [formField]="taradoForm.velocidadUnit">
            @for (opt of velocidadUnitOptions; track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Body: carousel + dots -->
      <div intaReadonlyContent class="flex-1 flex flex-col gap-1.5 min-h-0">
        <!-- Scrollable series cards -->
        <div
          style="scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch;"
          class="flex gap-3 overflow-x-auto flex-1 min-h-0"
          (scroll)="onScroll($event)"
          #carouselEl
        >
          @for (serie of seriesData(); track serie.numero) {
            <div
              style="scroll-snap-align: start; min-width: 240px; max-width: 320px;"
              class="shrink-0 border border-slate-100 rounded-xl bg-slate-50 p-2.5 flex flex-col gap-1.5 justify-between"
            >
              <!-- Card title: numero – nombre -->
              <p class="text-[11px] font-semibold text-slate-700 truncate">
                {{ serie.numero }} &ndash; {{ serie.nombre ?? '&mdash;' }}
              </p>

              <!-- Data table: 4 columns -->
              <div class="grid grid-cols-4 gap-x-1 text-[10px]">
                <!-- Column headers -->
                <span class="text-slate-400 font-medium">
                  {{ 'TRIAL_EXECUTION.WIDGETS.INFORMACION_TARADO.COL_ZONA' | translate }}
                </span>
                <span class="text-slate-400 font-medium text-right">
                  {{ 'TRIAL_EXECUTION.WIDGETS.INFORMACION_TARADO.COL_VEL_NOM' | translate }}
                </span>
                <span class="text-slate-400 font-medium text-right">
                  {{ 'TRIAL_EXECUTION.WIDGETS.INFORMACION_TARADO.COL_SIGMA_V' | translate }}
                </span>
                <span class="text-slate-400 font-medium text-right">
                  {{ 'TRIAL_EXECUTION.WIDGETS.INFORMACION_TARADO.COL_WC' | translate }}
                </span>

                <!-- Data values -->
                <span class="text-slate-700 font-medium mt-0.5">{{ serie.zona ?? '&mdash;' }}</span>
                <span class="text-slate-700 font-medium mt-0.5 text-right">
                  {{
                    serie.velocidadNominal !== null
                      ? serie.velocidadNominal + ' ' + formModel().velocidadUnit
                      : '&mdash;'
                  }}
                </span>
                <span class="text-slate-700 font-medium mt-0.5 text-right">
                  {{
                    serie.desviacionVelocidadMax !== null
                      ? serie.desviacionVelocidadMax + ' ' + formModel().velocidadUnit
                      : '&mdash;'
                  }}
                </span>
                <span class="text-slate-700 font-medium mt-0.5 text-right">
                  {{ serie.pesoPolvora !== null ? serie.pesoPolvora + ' g' : '&mdash;' }}
                </span>
              </div>
            </div>
          }
        </div>

        <!-- Navigation dots -->
        @if (seriesData().length > 1) {
          <div class="flex justify-center items-center gap-1.5 shrink-0">
            @for (serie of seriesData(); track serie.numero; let i = $index) {
              <button
                type="button"
                class="rounded-full transition-all duration-200"
                [class]="
                  i === currentDotIndex() ? 'w-2 h-2 bg-violet-600' : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                "
                (click)="scrollToCard(i)"
              >
                ''
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformacionTaradoWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  readonly carouselEl = viewChild<ElementRef<HTMLDivElement>>('carouselEl');

  protected readonly currentDotIndex = signal(0);

  protected readonly velocidadUnitOptions = [
    { value: 'm/s', label: 'm/s' },
    { value: 'fps', label: 'fps' },
  ];

  /** Series data from the store (read-only, from Planning) */
  protected readonly seriesData = computed(() => this.#store.informacionTarado().series);

  protected readonly formModel = signal<InformacionTaradoForm>({
    velocidadUnit: this.#store.informacionTarado().velocidadUnit,
  });
  protected readonly taradoForm = form(this.formModel);

  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.taradoForm().dirty(),
    touched: this.taradoForm().touched(),
    valid: this.taradoForm().valid(),
    hasChanges: this.taradoForm().dirty(),
  }));

  resetForm(): void {
    const stored = this.#store.informacionTarado();
    this.formModel.set({ velocidadUnit: stored.velocidadUnit });
  }

  async saveForm(): Promise<void> {
    const { velocidadUnit } = this.formModel();
    this.#store.updateInformacionTarado({ velocidadUnit } satisfies Partial<InformacionTaradoState>);
  }

  protected onScroll(event: Event): void {
    const el = event.target as HTMLDivElement;
    const cards = el.children;
    if (!cards.length) return;
    const cardWidth = (cards[0] as HTMLElement).offsetWidth + 12; // 12px = gap-3
    const index = Math.round(el.scrollLeft / cardWidth);
    this.currentDotIndex.set(Math.max(0, Math.min(index, cards.length - 1)));
  }

  protected scrollToCard(index: number): void {
    const el = this.carouselEl()?.nativeElement;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (card) {
      el.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    }
    this.currentDotIndex.set(index);
  }
}

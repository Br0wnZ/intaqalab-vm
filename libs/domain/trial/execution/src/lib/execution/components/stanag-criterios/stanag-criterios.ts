import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import type { StanagCriteriosState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';

@Component({
  selector: 'inta-stanag-criterios',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    ReadonlyContentDirective,
    MatIconModule,
    TranslateModule,
  ],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2 overflow-hidden">

      <!-- Header: icon + title -->
      <div class="flex items-center gap-1.5 shrink-0">
        <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 shrink-0">
          <mat-icon class="text-violet-600 !text-[16px] !w-[16px] !h-[16px]">policy</mat-icon>
        </div>
        <h3 class="text-xs font-semibold text-slate-800 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.TITLE' | translate }}
        </h3>
      </div>

      <!-- Last checked + Actualizar button -->
      <div class="flex items-center gap-2 shrink-0">
        @if (lastChecked()) {
          <span class="text-[10px] text-slate-500 truncate flex-1">
            {{ 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.LAST_CHECKED' | translate }}:
            {{ lastChecked() | date: 'HH:mm:ss' }}
          </span>
        } @else {
          <span class="text-[10px] text-slate-400 flex-1">
            {{ 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.NOT_CHECKED' | translate }}
          </span>
        }
        <button
          mat-mini-fab
          class="!bg-purple-600 !text-white !shadow-none !rounded-xl !flex !items-center !justify-center shrink-0"
          [disabled]="checking()"
          (click)="onActualizar()"
          aria-label="Actualizar criterios"
        >
          @if (checking()) {
            <span class="block size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          } @else {
            <mat-icon>refresh</mat-icon>
          }
        </button>
      </div>

      <!-- Criteria list with vertical scroll -->
      <div intaReadonlyContent class="flex-1 overflow-y-auto flex flex-col gap-1.5 min-h-0 pr-0.5">
        @for (criterio of criterios(); track criterio.id) {
          <div
            class="flex items-start gap-2 rounded-lg border p-2 shrink-0"
            [class]="criterio.cumple === true
              ? 'bg-green-50 border-green-200'
              : criterio.cumple === false
                ? 'bg-red-50 border-red-200'
                : 'bg-slate-50 border-slate-200'"
          >
            <mat-icon
              class="shrink-0 !text-[16px] !w-[16px] !h-[16px] mt-0.5"
              [class]="criterio.cumple === true
                ? 'text-green-600'
                : criterio.cumple === false
                  ? 'text-red-500'
                  : 'text-slate-400'"
            >
              {{ criterio.cumple === true ? 'check_circle' : criterio.cumple === false ? 'cancel' : 'help_outline' }}
            </mat-icon>
            <p class="text-[11px] text-slate-700 leading-snug">{{ criterio.texto }}</p>
          </div>
        }
        @empty {
          <p class="text-[11px] text-slate-400 text-center py-4">
            {{ 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.NO_CRITERIOS' | translate }}
          </p>
        }
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StanagCriteriosWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  /** Transient loading state — not persisted to store */
  protected readonly checking = signal(false);

  protected readonly criterios = computed(() => this.#store.stanagCriterios().criterios);
  protected readonly lastChecked = computed(() => this.#store.stanagCriterios().lastChecked);

  // No editable form fields — formState is always clean
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: false,
    touched: false,
    valid: true,
    hasChanges: false,
  }));

  resetForm(): void {
    // No form fields to reset
  }

  async saveForm(): Promise<void> {
    await this.onActualizar();
  }

  async onActualizar(): Promise<void> {
    if (this.checking()) return;
    this.checking.set(true);
    try {
      // Simulate async check against the bulletin document attached to the trial.
      // In production: call a service that parses the bulletin and evaluates each criterion.
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      const updated = this.#store.stanagCriterios().criterios.map((c) => ({
        ...c,
        cumple: c.cumple, // keep existing status; real impl would recalculate
      }));
      this.#store.updateStanagCriterios({
        criterios: updated,
        lastChecked: new Date().toISOString(),
      } satisfies Partial<StanagCriteriosState>);
    } finally {
      this.checking.set(false);
    }
  }
}

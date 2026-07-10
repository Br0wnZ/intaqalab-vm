import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import type { StanagCriteriosState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

@Component({
  selector: 'inta-stanag-criterios',
  imports: [DatePipe, MatButtonModule, ReadonlyContentDirective, MatIconModule, TranslateModule, IntaIconComponent],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2 overflow-hidden">
      <!-- Header: icon + title -->
      <div class="flex items-center justify-between gap-4 shrink-0">
        <div class="flex gap-1.5">
          <ui-inta-icon name="trello" color="var(--inta-button)" size="xl" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
            {{ 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.TITLE' | translate }}
          </h3>
        </div>
        <button
          aria-label="Actualizar criterios"
          mat-flat-button
          color="primary"
          class="!px-2.5 !min-w-auto"
          [disabled]="checking()"
          (click)="onActualizar()"
        >
          @if (checking()) {
            <span class="block size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          } @else {
            <ui-inta-icon name="update" size="xl" />
          }
        </button>
      </div>

      <!-- Last checked + Actualizar button -->
      <div class="flex items-center gap-2 shrink-0 mb-4">
        @if (lastChecked()) {
          <span class="text-xs text-slate-500 truncate flex-1">
            {{ 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.LAST_CHECKED' | translate }}:
            {{ lastChecked() | date: 'HH:mm:ss' }}
          </span>
        } @else {
          <span class="text-xs text-slate-400 flex-1">
            {{ 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.NOT_CHECKED' | translate }}
          </span>
        }
      </div>

      <!-- Criteria list with vertical scroll -->
      <div intaReadonlyContent class="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0 pr-0.5">
        @for (criterio of criterios(); track criterio.id) {
          <div class="flex items-start gap-2 shrink-0">
            <ui-inta-icon
              [size]="criterio.cumple === true ? 'md' : criterio.cumple === false ? '18px' : 'md'"
              [color]="
                criterio.cumple === true
                  ? 'var(--inta-success)'
                  : criterio.cumple === false
                    ? 'var(--inta-error)'
                    : 'var(--inta-warning)'
              "
              [name]="criterio.cumple === true ? 'checkCircle' : criterio.cumple === false ? 'closeCircle' : 'info'"
            ></ui-inta-icon>
            <p class="text-xs text-gray-600 leading-snug">{{ criterio.texto }}</p>
          </div>
        } @empty {
          <p class="text-xs text-slate-400 text-center py-4">
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

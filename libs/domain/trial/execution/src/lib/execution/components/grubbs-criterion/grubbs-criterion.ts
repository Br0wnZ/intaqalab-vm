import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { IntaIconComponent } from "@intaqalab/ui";

interface GrubbsFilterForm {
  serie: string | null;
  variable: string | null;
}

@Component({
  selector: 'inta-grubbs-criterion',
  imports: [FormField, ReadonlyContentDirective, MatFormFieldModule, MatIconModule, MatSelectModule, TranslateModule, IntaIconComponent],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2">
      <!-- Header: icon + title -->
      <div class="flex items-center gap-2 shrink-0">
        <ui-inta-icon name="list" color="var(--inta-button)" />
        <h3 class="text-sm font-semibold text-gray-700 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.TITLE' | translate }}
        </h3>
      </div>

      <!-- Filters: serie + variable -->
      <div class="grid grid-cols-2 gap-2 shrink-0 my-2">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full small-select">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.SERIE_LABEL' | translate }}</mat-label>
          <mat-select [formField]="filterForm.serie">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full small-select">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.VARIABLE_LABEL' | translate }}</mat-label>
          <mat-select [formField]="filterForm.variable">
            @for (opt of variableOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Content area -->
      <div intaReadonlyContent class="flex-1 flex flex-col min-h-0 overflow-y-auto">
        @if (!hasSelection()) {
          <!-- State 2: no selection -->
          <div class="flex-1 flex items-center justify-center rounded-xl bg-slate-50 min-h-[80px]">
            <p class="text-sm text-slate-400 text-center px-4">
              {{ 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.EMPTY_STATE_MSG' | translate }}
            </p>
          </div>
        } @else if (!hasOutliers()) {
          <!-- State 3: no outliers detected -->
          <div class="flex-1 flex items-center justify-center rounded-xl bg-slate-50">
            <span
              class="inline-flex items-center gap-1.5 p-2 rounded-full bg-green-50 text-green-700 text-sm font-medium"
            >
              <ui-inta-icon name="checkCircle" />
              {{ 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.NO_OUTLIERS_MSG' | translate }}
            </span>
          </div>
        } @else {
          <!-- State 1: outliers list -->
          <div class="flex flex-col gap-2">
            @for (outlier of outliers(); track outlier.shotId) {
              <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <!-- Icon + label -->
                <div class="rounded-full p-1 flex justify-center items-center bg-red-100">
                  <ui-inta-icon name="closeCircle" size="md" color="var(--inta-error)" />
                </div>
                <span class="text-sm font-normal text-gray-600 flex-1 truncate">{{ outlier.label }}</span>
                <!-- Mantener -->
                <button
                  type="button"
                  class="rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                  [class.bg-[var(--inta-button)]]="!outlier.excluded"
                  [class.text-white]="!outlier.excluded"
                  [class.bg-white]="outlier.excluded"
                  [class.text-slate-600]="outlier.excluded"
                  [class.border]="outlier.excluded"
                  [class.border-slate-300]="outlier.excluded"
                  (click)="setOutlierExcluded(outlier.shotId, false)"
                >
                  {{ 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.MANTENER_BTN' | translate }}
                </button>
                <!-- Eliminar -->
                <button
                  type="button"
                  class="rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                  [class.bg-[var(--inta-button)]]="outlier.excluded"
                  [class.text-white]="outlier.excluded"
                  [class.bg-white]="!outlier.excluded"
                  [class.text-slate-600]="!outlier.excluded"
                  [class.border]="!outlier.excluded"
                  [class.border-slate-300]="!outlier.excluded"
                  (click)="setOutlierExcluded(outlier.shotId, true)"
                >
                  {{ 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.ELIMINAR_BTN' | translate }}
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrubbsCriterionWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.grubbsCriterion().serieOptions);
  protected readonly variableOptions = computed(() => this.#store.grubbsCriterion().variableOptions);

  // ── Outliers from store ───────────────────────────────────────────────────
  protected readonly outliers = computed(() => this.#store.grubbsCriterion().outliers);

  // ── Derived state ─────────────────────────────────────────────────────────
  protected readonly hasSelection = computed(() => {
    const { serie, variable } = this.formModel();
    return serie !== null && variable !== null;
  });
  protected readonly hasOutliers = computed(() => this.outliers().length > 0);

  // ── Signal Form ───────────────────────────────────────────────────────────
  protected readonly formModel = signal<GrubbsFilterForm>({
    serie: this.#store.grubbsCriterion().serie,
    variable: this.#store.grubbsCriterion().variable,
  });
  protected readonly filterForm = form(this.formModel);

  // ── Mock computation: simulate Grubbs when selection changes ──────────────
  constructor() {
    super();
    effect(() => {
      const { serie, variable } = this.formModel();
      untracked(() => {
        if (!serie || !variable) return;
        // Mock: 'velocidad' → 2 outliers; other variables → no outliers
        if (variable === 'velocidad') {
          this.#store.updateGrubbsCriterion({
            outliers: [
              { shotId: 'shot-2', label: 'XXXX - Disparo 2', excluded: false },
              { shotId: 'shot-4', label: 'XXXX - Disparo 4', excluded: false },
            ],
          });
        } else {
          this.#store.updateGrubbsCriterion({ outliers: [] });
        }
      });
    });
  }

  // ── FormWidget implementation ─────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.filterForm().dirty(),
    touched: this.filterForm().touched(),
    valid: this.filterForm().valid(),
    hasChanges: this.filterForm().dirty(),
  }));

  setOutlierExcluded(shotId: string, excluded: boolean): void {
    this.#store.setGrubbsOutlierExcluded(shotId, excluded);
  }

  resetForm(): void {
    const stored = this.#store.grubbsCriterion();
    this.formModel.set({ serie: stored.serie, variable: stored.variable });
  }

  async saveForm(): Promise<void> {
    const { serie, variable } = this.formModel();
    this.#store.updateGrubbsCriterion({ serie, variable });
  }
}

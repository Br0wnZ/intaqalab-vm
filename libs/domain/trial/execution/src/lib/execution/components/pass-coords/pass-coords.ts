import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
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

interface PassCoordsSelectForm {
  serie: string | null;
  disparo: string | null;
}

@Component({
  selector: 'inta-pass-coords',
  imports: [FormField, ReadonlyContentDirective, MatFormFieldModule, MatIconModule, MatSelectModule, TranslateModule],
  template: `
    <div class="h-full rounded-2xl bg-white p-4 flex flex-col gap-2">
      <!-- Header row 1: icon + title -->
      <div class="flex items-center gap-1.5 shrink-0">
        <div class="flex items-center justify-center size-7 rounded-lg bg-violet-100 shrink-0">
          <mat-icon class="text-violet-600 !text-[16px] !w-[16px] !h-[16px]">grid_on</mat-icon>
        </div>
        <h3 class="text-xs font-semibold text-slate-800 leading-tight">
          {{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.TITLE' | translate }}
        </h3>
      </div>

      <!-- Header row 2: selectors -->
      <div class="grid grid-cols-2 gap-2 shrink-0 mt-4">
        <!-- Serie -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.SERIE_PLACEHOLDER' | translate }}</mat-label>
          <mat-select [formField]="selectForm.serie">
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Disparo -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.DISPARO_PLACEHOLDER' | translate }}</mat-label>
          <mat-select [formField]="selectForm.disparo">
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Divider -->
      <div class=" my-4"></div>

      <!-- Output fields: 2 cols × 3 rows -->
      <div intaReadonlyContent class="flex-1 grid grid-cols-2 gap-x-2 gap-y-4 min-h-0 content-start">
        <!-- Altura boca-bola pieza -->
        <div class="flex flex-col gap-0.5">
          <span class="text-[10px] font-medium text-slate-500 leading-tight">
            {{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.ALTURA_BOCA_BOLA_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-9 px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700 tabular-nums">{{ formatValue(alturaBocaBolaPieza()) }}</span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>

        <!-- Distancia geométrica boca-bola -->
        <div class="flex flex-col gap-0.5">
          <span class="text-[10px] font-medium text-slate-500 leading-tight">
            {{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.DISTANCIA_GEOMETRICA_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-9 px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700 tabular-nums">{{ formatValue(distanciaGeometricaBocaBola()) }}</span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>

        <!-- Distancia cámara frontal bola -->
        <div class="flex flex-col gap-0.5">
          <span class="text-[10px] font-medium text-slate-500 leading-tight">
            {{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.DISTANCIA_CAMARA_FRONTAL_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-9 px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700 tabular-nums">{{ formatValue(distanciaCamaraFrontalBola()) }}</span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>

        <!-- Distancia cámara transversal bola -->
        <div class="flex flex-col gap-0.5">
          <span class="text-[10px] font-medium text-slate-500 leading-tight">
            {{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.DISTANCIA_CAMARA_TRANSVERSAL_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-9 px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700 tabular-nums">{{ formatValue(distanciaCamaraTransversalBola()) }}</span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>

        <!-- Incremento de cota cámara frontal bola -->
        <div class="flex flex-col gap-0.5">
          <span class="text-[10px] font-medium text-slate-500 leading-tight">
            {{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.INCREM_COTA_FRONTAL_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-9 px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700 tabular-nums">
              {{ formatValue(incrementoCotaCamaraFrontalBola()) }}
            </span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>

        <!-- Incremento de cota cámara transversal bola -->
        <div class="flex flex-col gap-0.5">
          <span class="text-[10px] font-medium text-slate-500 leading-tight">
            {{ 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.INCREM_COTA_TRANSVERSAL_LABEL' | translate }}
          </span>
          <div class="flex items-center justify-between h-9 px-3 rounded-lg border border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-700 tabular-nums">
              {{ formatValue(incrementoCotaCamaraTransversalBola()) }}
            </span>
            <span class="text-xs font-medium text-slate-400">m</span>
          </div>
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassCoordsWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore, { skipSelf: true });

  // ── Options from store ────────────────────────────────────────────────────
  protected readonly serieOptions = computed(() => this.#store.passCoords().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.passCoords().disparoOptions);

  // ── Calculated output fields (read-only from store) ───────────────────────
  protected readonly alturaBocaBolaPieza = computed(() => this.#store.passCoords().alturaBocaBolaPieza);
  protected readonly distanciaGeometricaBocaBola = computed(() => this.#store.passCoords().distanciaGeometricaBocaBola);
  protected readonly distanciaCamaraFrontalBola = computed(() => this.#store.passCoords().distanciaCamaraFrontalBola);
  protected readonly distanciaCamaraTransversalBola = computed(
    () => this.#store.passCoords().distanciaCamaraTransversalBola,
  );
  protected readonly incrementoCotaCamaraFrontalBola = computed(
    () => this.#store.passCoords().incrementoCotaCamaraFrontalBola,
  );
  protected readonly incrementoCotaCamaraTransversalBola = computed(
    () => this.#store.passCoords().incrementoCotaCamaraTransversalBola,
  );

  // ── Signal Form — serie/disparo selection only ────────────────────────────
  protected readonly formModel = signal<PassCoordsSelectForm>({
    serie: this.#store.passCoords().serie,
    disparo: this.#store.passCoords().disparo,
  });
  protected readonly selectForm = form(this.formModel);

  // ── FormWidget implementation ─────────────────────────────────────────────
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.selectForm().dirty(),
    touched: this.selectForm().touched(),
    valid: this.selectForm().valid(),
    hasChanges: this.selectForm().dirty(),
  }));

  resetForm(): void {
    const stored = this.#store.passCoords();
    this.formModel.set({ serie: stored.serie, disparo: stored.disparo });
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.formModel();
    this.#store.updatePassCoords({ serie, disparo });
  }

  protected formatValue(value: number | null): string {
    return value !== null ? value.toFixed(3) : '—';
  }
}

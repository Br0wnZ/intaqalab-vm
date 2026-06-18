import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import type { RadarMetcmqState } from '../../../+state/execution.store';
import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import { WidgetStateService } from '../../services/widget-state.service';
import { BaseFormWidgetComponent } from '../base-widget.component';

interface RadarMetcmqForm {
  serie: string | null;
  disparo: string | null;
}

@Component({
  selector: 'inta-radar-metcmq',
  imports: [
    FormField,
    ReadonlyContentDirective,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <div class="h-full rounded-2xl border border-violet-200 bg-white p-3 flex flex-col gap-2">
      <!-- Header: Icon + Title -->
      <div class="flex items-center gap-1.5 shrink-0">
        <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 shrink-0">
          <mat-icon class="text-violet-600 !text-[16px] !w-[16px] !h-[16px]">check_circle</mat-icon>
        </div>
        <h3 class="text-xs font-semibold text-slate-800 leading-tight truncate">
          {{ 'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.TITLE' | translate }}
        </h3>
      </div>

      <!-- Selectors row: Serie + Disparo -->
      <div class="flex items-center gap-1.5 shrink-0">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1 min-w-0">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.SERIE_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.SERIE_PLACEHOLDER' | translate"
            [formField]="metcmqForm.serie"
          >
            @for (opt of serieOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1 min-w-0">
          <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.DISPARO_LABEL' | translate }}</mat-label>
          <mat-select
            [placeholder]="'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.DISPARO_PLACEHOLDER' | translate"
            [formField]="metcmqForm.disparo"
          >
            @for (opt of disparoOptions(); track opt.value) {
              <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Divider -->
      <div class=""></div>

      <!-- Text output + Copy + Generar -->
      <div intaReadonlyContent class="flex-1 flex items-center gap-1.5 min-h-0">
        <div
          class="flex-1 flex items-center border border-slate-200 rounded-lg bg-slate-50 h-10 px-3 min-w-0 overflow-hidden"
        >
          <span class="flex-1 text-sm text-slate-700 truncate">
            @if (texto()) {
              {{ texto() }}
            } @else {
              <span class="text-slate-400 italic">
                {{ 'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.TEXTO_PLACEHOLDER' | translate }}
              </span>
            }
          </span>
          <button
            mat-icon-button
            type="button"
            class="!w-8 !h-8 shrink-0"
            [disabled]="!texto()"
            [matTooltip]="'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.COPY_TOOLTIP' | translate"
            (click)="copyTexto()"
          >
            <mat-icon class="!text-[16px] !w-[16px] !h-[16px] text-slate-500">content_copy</mat-icon>
          </button>
        </div>

        <button
          mat-flat-button
          type="button"
          class="!bg-violet-600 !text-white !rounded-xl !h-10 !px-4 shrink-0"
          (click)="generateBulletin()"
        >
          {{ 'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.GENERATE_BTN' | translate }}
        </button>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarMetcmq extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();

  override readonly widgetStateService = inject(WidgetStateService);
  readonly #store = inject(ExecutionStore);

  // Data from store
  protected readonly serieOptions = computed(() => this.#store.radarMetcmq().serieOptions);
  protected readonly disparoOptions = computed(() => this.#store.radarMetcmq().disparoOptions);
  protected readonly texto = computed(() => this.#store.radarMetcmq().texto);

  // Signal Form — initialized from store
  protected readonly formModel = signal<RadarMetcmqForm>({
    serie: this.#store.radarMetcmq().serie,
    disparo: this.#store.radarMetcmq().disparo,
  });
  protected readonly metcmqForm = form(this.formModel);

  // FormWidget implementation
  readonly formState: Signal<WidgetFormState> = computed(() => ({
    widgetId: this.widgetId(),
    dirty: this.metcmqForm().dirty(),
    touched: this.metcmqForm().touched(),
    valid: this.metcmqForm().valid(),
    hasChanges: this.metcmqForm().dirty(),
  }));

  resetForm(): void {
    const stored = this.#store.radarMetcmq();
    this.formModel.set({ serie: stored.serie, disparo: stored.disparo });
  }

  async saveForm(): Promise<void> {
    const { serie, disparo } = this.formModel();
    this.#store.updateRadarMetcmq({ serie, disparo });
  }

  generateBulletin(): void {
    const { serie, disparo } = this.formModel();
    this.#store.updateRadarMetcmq({ serie, disparo });

    // Generate mock bulletin text for the selected shot's time block
    const serieLabel = this.serieOptions().find((o) => o.value === serie)?.label ?? serie ?? '—';
    const disparoLabel = this.disparoOptions().find((o) => o.value === disparo)?.label ?? disparo ?? '—';
    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5);
    const mockTexto =
      serie && disparo
        ? `METCMQ ${hhmm}Z — ${serieLabel} / ${disparoLabel}: VIENTO 270/08KT, QNH 1013, T+22°C, VIS >10KM`
        : null;

    this.#store.updateRadarMetcmq({ texto: mockTexto });
  }

  copyTexto(): void {
    const t = this.texto();
    if (t) {
      navigator.clipboard.writeText(t).catch(() => undefined);
    }
  }
}

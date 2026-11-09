import type { Signal } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormField, disabled, form, min, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MEASURE_UNIT_LABELS, PressureUnitEnum } from '@intaqalab/models';
import { ErrorState, IntaIconComponent, Skeleton } from '@intaqalab/ui';
import { IntaDecimalPipe, LocaleDecimalInputDirective, deepEqual } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ExecutionStore } from '../../../+state/execution.store';
import { ReadonlyContentDirective } from '../../directives/readonly-content.directive';
import type { WidgetFormState } from '../../models/execution-grid.models';
import type { OverpressureFormModel } from '../../models/trial-overpressure-info.models';
import { BaseFormWidgetComponent } from '../base-widget.component';
import { FormTouchDirective } from '../directives/form-touch.directive';
import { mapOverpressureFormToRequest } from './overpressure-info.mapper';

@Component({
  selector: 'inta-overpressure-info',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    IntaIconComponent,
    LocaleDecimalInputDirective,
    IntaDecimalPipe,
    Skeleton,
    ErrorState,
    ReadonlyContentDirective,
    FormTouchDirective,
  ],
  template: `
    <section class="h-full rounded-2xl border border-violet-200 bg-white p-2.5 flex flex-col gap-2 overflow-auto">
      <header class="flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <ui-inta-icon name="trello" size="xl" color="var(--inta-button)" />
          <h3 class="text-sm font-semibold text-gray-700 leading-tight">
            {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.TITLE' | translate }}
          </h3>
        </div>
      </header>
      @if (isLoading()) {
        <div class="grid grid-cols-3 gap-1.5">
          <ui-skeleton variant="rectangle" height="60px" animation="wave" />
          <ui-skeleton variant="rectangle" height="60px" animation="wave" />
          <ui-skeleton variant="rectangle" height="60px" animation="wave" />
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <ui-skeleton variant="rectangle" height="60px" animation="wave" />
          <ui-skeleton variant="rectangle" height="60px" animation="wave" />
        </div>
      } @else if (loadError()) {
        <ui-error-state
          [title]="'TRIAL_EXECUTION.ERRORS.LOAD_FAILED_TITLE' | translate"
          [message]="'TRIAL_EXECUTION.ERRORS.LOAD_FAILED_DETAIL' | translate"
        />
      } @else {
        <div
          intaFormTouch
          class="flex-1 flex flex-col gap-2 min-h-0"
          [intaReadonlyContent]="false"
          #touch="intaFormTouch"
        >
          <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-28 self-end">
            <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.UNIT_LABEL' | translate }}</mat-label>
            <mat-select
              [id]="widgetId() + '-pressure-unit'"
              [formField]="pressureForm.unidadPresion"
              [placeholder]="'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.UNIT_LABEL' | translate"
            >
              @for (option of pressureUnitOptions; track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <div class="grid grid-cols-3 gap-1.5">
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="min-w-0">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_MAXIMA_LABEL' | translate }}</mat-label>
              <input
                matInput
                libLocalDecimal
                numericSign="non-negative"
                [id]="widgetId() + '-maximum'"
                [formField]="pressureForm.presionMaxima"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.VALUE_PLACEHOLDER' | translate"
              />
            </mat-form-field>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="min-w-0">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_MINIMA_LABEL' | translate }}</mat-label>
              <input
                matInput
                libLocalDecimal
                numericSign="non-negative"
                [id]="widgetId() + '-minimum'"
                [formField]="pressureForm.presionMinima"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.VALUE_PLACEHOLDER' | translate"
              />
            </mat-form-field>
            <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="min-w-0">
              <mat-label>{{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_REF_LABEL' | translate }}</mat-label>
              <input
                matInput
                libLocalDecimal
                numericSign="non-negative"
                [id]="widgetId() + '-reference'"
                [formField]="pressureForm.presionRef"
                [placeholder]="'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.VALUE_PLACEHOLDER' | translate"
              />
            </mat-form-field>
          </div>
          @if (!isValid()) {
            <p role="status" class="text-xs text-client-error">
              {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.INVALID_CONFIGURATION' | translate }}
            </p>
          }
          <div class="grid grid-cols-2 gap-1.5">
            <div class="flex flex-col rounded-lg border border-gray-200 bg-gray-100 px-2 py-2 gap-2 min-w-0">
              <span class="text-xs text-gray-500">
                {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_SEGURIDAD_LABEL' | translate }}
              </span>
              <span class="text-base text-gray-500 break-all">
                {{ safetyPressure() === null ? '-' : (safetyPressure() | intaDecimal) }}
                {{ safetyPressure() !== null ? unitLabel() : '' }}
              </span>
            </div>
            <div class="flex flex-col rounded-lg border border-gray-200 bg-gray-100 px-2 py-2 gap-2 min-w-0">
              <span class="text-xs text-gray-500">
                {{ 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.PRESION_BUSCADA_LABEL' | translate }}
              </span>
              <span class="text-base text-gray-500 break-all">
                {{ targetPressure() === null ? '-' : (targetPressure() | intaDecimal) }}
                {{ targetPressure() !== null ? unitLabel() : '' }}
              </span>
            </div>
          </div>
          @for (warning of warnings(); track warning.code) {
            <p role="status" class="text-xs text-client-warning">{{ warning.message }}</p>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverpressureInfoWidget extends BaseFormWidgetComponent {
  readonly widgetId = input.required<string>();
  readonly #store = inject(ExecutionStore);
  readonly #translate = inject(TranslateService);
  protected readonly isLoading = computed(() => this.#store.overpressureInfoLoading());
  protected readonly loadError = computed(() => this.#store.overpressureInfoError());
  protected readonly warnings = computed(() => {
    return this.#store.overpressureInfoWarnings().map(({ code }) => ({
      code,
      message: this.#translate.instant(`TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.WARNING_${code}`),
    }));
  });
  protected readonly pressureUnitOptions = Object.values(PressureUnitEnum).map((value) => ({
    value,
    label: MEASURE_UNIT_LABELS[value],
  }));
  readonly #savedModel = computed<OverpressureFormModel>(() => {
    const state = this.#store.overpressureInfo();
    return {
      presionMaxima: state.presionMaxima,
      presionMinima: state.presionMinima,
      presionRef: state.presionRef,
      unidadPresion: state.unidadPresion,
    };
  });
  protected readonly formModel = linkedSignal(() => this.#savedModel());
  protected readonly pressureForm = form(this.formModel, (fields) => {
    required(fields.presionMaxima);
    required(fields.presionMinima);
    required(fields.presionRef);
    min(fields.presionMaxima, 0);
    min(fields.presionMinima, 0);
    min(fields.presionRef, 0);
    disabled(fields, () => !this.#store.fireTrialId() || this.isLoading() || this.#store.overpressureInfoSaving());
  });
  protected readonly touchRef = viewChild('touch', { read: FormTouchDirective });
  protected readonly unitLabel = computed(() => MEASURE_UNIT_LABELS[this.formModel().unidadPresion]);
  protected readonly safetyPressure = computed(() =>
    this.formModel().unidadPresion === this.#savedModel().unidadPresion
      ? this.#store.overpressureInfo().presionSeguridad
      : null,
  );
  protected readonly targetPressure = computed(() => {
    const { presionMaxima, presionMinima } = this.formModel();
    return presionMaxima !== null && presionMinima !== null ? presionMaxima / 2 + presionMinima / 2 : null;
  });
  protected readonly isValid = computed(() => {
    try {
      mapOverpressureFormToRequest(this.formModel());
      return true;
    } catch {
      return false;
    }
  });
  readonly formState: Signal<WidgetFormState> = computed(() => {
    const dirty = !deepEqual(this.formModel(), this.#savedModel());
    return {
      widgetId: this.widgetId(),
      dirty,
      touched: this.touchRef()?.touched() ?? false,
      valid: this.isValid() && !!this.#store.fireTrialId() && !this.isLoading() && !this.loadError(),
      hasChanges: dirty,
    };
  });

  constructor() {
    super();
    effect(() => {
      const fireTrialId = this.#store.fireTrialId();
      untracked(() => {
        this.touchRef()?.reset();
        void this.#store.loadTrialOverpressureInfo(fireTrialId);
      });
    });
  }

  resetForm(): void {
    this.formModel.set(this.#savedModel());
    this.touchRef()?.reset();
  }

  async saveForm(): Promise<void> {
    const fireTrialId = this.#store.fireTrialId();
    if (!fireTrialId || !this.formState().valid) throw new Error('Overpressure configuration is not ready');
    await this.#store.saveTrialOverpressureInfo(fireTrialId, mapOverpressureFormToRequest(this.formModel()));
    this.touchRef()?.reset();
  }
}

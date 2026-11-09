import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MeasureUnitEnum } from '@intaqalab/models';
import { InputSelect, InputSelectInput, type InputSelectValue } from '@intaqalab/ui';
import { LocaleDecimalInputDirective } from '@intaqalab/utils';
import { TranslatePipe } from '@ngx-translate/core';

import type {
  MeasureLimitChange,
  MeasureSelectionData,
  MeasureUnitOptions,
} from '../../utils-models/measure-serie.model';

@Component({
  selector: 'inta-measure-limit-card',
  imports: [
    FormField,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    InputSelect,
    InputSelectInput,
    LocaleDecimalInputDirective,
  ],
  template: `
    @if (isQuantitative() && measure().expanded) {
      <!-- Expanded State with Purple Accent -->
      <div
        class="bg-white rounded-xl border border-purple-200 border-l-4 border-l-purple-600 shadow-xs overflow-hidden transition-all"
      >
        <div class="px-4 pt-3.5 pb-2 flex items-center justify-between">
          <span class="font-semibold text-sm text-gray-900">
            {{ measureName() }}
          </span>
          <div class="flex items-center gap-1">
            <button
              mat-icon-button
              type="button"
              class="!text-red-500 hover:!bg-red-50 !w-8 !h-8"
              [disabled]="readonly()"
              (click)="remove.emit()"
            >
              <mat-icon class="!text-xl !w-5 !h-5">delete</mat-icon>
            </button>
            <button mat-icon-button type="button" class="!text-purple-600 !w-8 !h-8" (click)="onToggleExpanded()">
              <mat-icon class="!text-xl !w-5 !h-5">expand_less</mat-icon>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 pb-4 pt-1">
          @for (field of limitFields; track field) {
            <div class="min-w-0">
              @if (unitOptions().length > 0) {
                <ui-input-select
                  floatLabel="always"
                  [label]="limitLabels[field] | translate"
                  [placeholder]="'TRIAL_PLANNING.MEASURES.LIMIT_CARD.ENTER_VALUE' | translate"
                  [opciones]="unitOptions()"
                  [readOnly]="readonly()"
                  [value]="{ value: measureForm()[field]().value(), unit: measure().measureUnit ?? measureUnit() }"
                  (valueChange)="onUnitValueChange(field, $event)"
                >
                  <input
                    matInput
                    inputSelectInput
                    libLocalDecimal
                    [attr.aria-label]="limitLabels[field] | translate"
                    [formField]="measureForm()[field]"
                  />
                </ui-input-select>
              } @else {
                <mat-form-field appearance="outline" floatLabel="always" subscriptSizing="dynamic" class="w-full">
                  <mat-label>{{ limitLabels[field] | translate }}</mat-label>
                  <input
                    matInput
                    type="number"
                    [placeholder]="'TRIAL_PLANNING.MEASURES.LIMIT_CARD.ENTER_VALUE' | translate"
                    [formField]="measureForm()[field]"
                    (input)="onInputChange(field, $event)"
                  />
                </mat-form-field>
              }
              @if (measureForm()[field]().touched()) {
                @for (error of measureForm()[field]().errors(); track error.kind) {
                  <mat-error role="alert" class="mt-1">{{ error.message | translate }}</mat-error>
                }
              }
            </div>
          }
        </div>
      </div>
    } @else {
      <!-- Collapsed / Qualitative State with Drag Handle -->
      <div
        class="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all"
      >
        <div class="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-gray-400 shrink-0 select-none">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
          <span class="font-medium text-sm text-gray-800">
            {{ measureName() }}
          </span>
        </div>
        <div class="flex items-center gap-1">
          <button
            mat-icon-button
            type="button"
            class="!text-red-500 hover:!bg-red-50 !w-8 !h-8"
            [disabled]="readonly()"
            (click)="remove.emit()"
          >
            <mat-icon class="!text-xl !w-5 !h-5">delete</mat-icon>
          </button>
          @if (isQuantitative()) {
            <button
              mat-icon-button
              type="button"
              class="!text-gray-400 hover:!text-purple-600 !w-8 !h-8"
              (click)="onToggleExpanded()"
            >
              <mat-icon class="!text-xl !w-5 !h-5">expand_more</mat-icon>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasureLimitCard {
  readonly measure = input.required<MeasureSelectionData>();
  readonly measureName = input.required<string>();
  readonly measureForm = input.required<FieldTree<MeasureSelectionData>>();
  readonly isQuantitative = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly unitOptions = input<MeasureUnitOptions[string]>([]);
  readonly measureUnit = input<string>('');

  protected readonly limitFields = ['minLimit', 'maxLimit', 'deviation'] as const;
  protected readonly limitLabels = {
    minLimit: 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.MIN_LIMIT',
    maxLimit: 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.MAX_LIMIT',
    deviation: 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.DEVIATION',
  };

  readonly remove = output<void>();
  readonly toggleExpanded = output<void>();
  readonly limitChange = output<MeasureLimitChange>();

  onInputChange(field: 'minLimit' | 'maxLimit' | 'deviation', event: Event): void {
    if (this.readonly()) return;
    const target = event.target as HTMLInputElement;
    const val = target.value === '' ? null : Number(target.value);
    this.onLimitChange(field, Number.isNaN(val) ? null : val);
  }

  onToggleExpanded(): void {
    if (this.readonly() || !this.isQuantitative()) return;
    this.toggleExpanded.emit();
  }

  onLimitChange(field: 'minLimit' | 'maxLimit' | 'deviation', value: number | null): void {
    if (this.readonly()) return;
    const measureUnit = Object.values(MeasureUnitEnum).find(
      (unit) => unit === (this.measure().measureUnit ?? this.measureUnit()),
    );
    this.limitChange.emit({ field, value, ...(measureUnit ? { measureUnit } : {}) });
  }

  onUnitValueChange(field: MeasureLimitChange['field'], selection: InputSelectValue<number | null> | null): void {
    if (this.readonly() || !selection) return;
    const measureUnit = Object.values(MeasureUnitEnum).find((unit) => unit === selection.unit);
    if (!measureUnit || !this.unitOptions().some((option) => option.value === measureUnit)) return;
    if (selection.value === this.measure()[field] && measureUnit === (this.measure().measureUnit ?? this.measureUnit()))
      return;
    this.limitChange.emit({ field, value: selection.value, measureUnit });
  }
}

import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { FieldTree } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

import type { MeasureSelectionData } from '../../utils-models/measure-serie.model';

@Component({
  selector: 'inta-measure-limit-card',
  imports: [FormField, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, TranslatePipe],
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

        <div class="grid grid-cols-3 gap-4 px-4 pb-4 pt-1">
          <div class="min-w-0">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>{{ 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.MIN_LIMIT' | translate }}</mat-label>
              <input
                matInput
                type="number"
                [placeholder]="'TRIAL_PLANNING.MEASURES.LIMIT_CARD.ENTER_VALUE' | translate"
                [formField]="measureForm().minLimit"
                [attr.aria-describedby]="
                  measureForm().minLimit().touched() && measureForm().minLimit().errors().length > 0
                    ? minLimitInput.id + '-error'
                    : null
                "
                (input)="onInputChange('minLimit', $event)"
                #minLimitInput="matInput"
              />
            </mat-form-field>
            @if (measureForm().minLimit().touched() && measureForm().minLimit().errors(); as errors) {
              @for (error of errors; track error.kind) {
                <mat-error class="mt-1" [id]="minLimitInput.id + '-error'">
                  {{ error.message | translate }}
                </mat-error>
              }
            }
          </div>
          <div class="min-w-0">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>{{ 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.MAX_LIMIT' | translate }}</mat-label>
              <input
                matInput
                type="number"
                [placeholder]="'TRIAL_PLANNING.MEASURES.LIMIT_CARD.ENTER_VALUE' | translate"
                [formField]="measureForm().maxLimit"
                [attr.aria-describedby]="
                  measureForm().maxLimit().touched() && measureForm().maxLimit().errors().length > 0
                    ? maxLimitInput.id + '-error'
                    : null
                "
                (input)="onInputChange('maxLimit', $event)"
                #maxLimitInput="matInput"
              />
            </mat-form-field>
            @if (measureForm().maxLimit().touched() && measureForm().maxLimit().errors(); as errors) {
              @for (error of errors; track error.kind) {
                <mat-error class="mt-1" [id]="maxLimitInput.id + '-error'">
                  {{ error.message | translate }}
                </mat-error>
              }
            }
          </div>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
            <mat-label>{{ 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.DEVIATION' | translate }}</mat-label>
            <input
              matInput
              type="number"
              [placeholder]="'TRIAL_PLANNING.MEASURES.LIMIT_CARD.ENTER_VALUE' | translate"
              [value]="measure().deviation ?? ''"
              [disabled]="readonly()"
              (input)="onInputChange('deviation', $event)"
            />
          </mat-form-field>
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

  readonly remove = output<void>();
  readonly toggleExpanded = output<void>();
  readonly limitChange = output<{ field: 'minLimit' | 'maxLimit' | 'deviation'; value: number | null }>();

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
    this.limitChange.emit({ field, value });
  }
}

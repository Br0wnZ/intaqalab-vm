import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import type { MasterDataMeasureItem, SelectOption } from '../../utils-models/catalog.model';
import type { MeasureCategoryDef, MeasureSelectionData } from '../../utils-models/measure-serie.model';
import { MeasureLimitCard } from './measure-limit-card';
import { MultiSelectSearchableComponent } from './multi-select-searchable';

@Component({
  selector: 'inta-measure-category-card',
  imports: [MatIconModule, MultiSelectSearchableComponent, MeasureLimitCard],
  template: `
    <div
      class="bg-white rounded-2xl shadow-xs transition-all duration-200 overflow-hidden"
      [class.border]="true"
      [class.border-purple-200]="isOpen()"
      [class.border-l-4]="isOpen()"
      [class.border-l-purple-600]="isOpen()"
      [class.border-slate-200]="!isOpen()"
      [class.hover:border-purple-200]="!isOpen()"
    >
      <!-- Category Card Header -->
      <div
        tabindex="0"
        role="button"
        class="flex items-center justify-between p-4 cursor-pointer select-none"
        (click)="toggleOpen.emit()"
        (keydown.enter)="toggleOpen.emit()"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50/70 border border-purple-100 text-purple-600 shrink-0"
          >
            @switch (category().key) {
              @case ('topografia') {
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-6 h-6"
                >
                  <path d="M2.5 19.5 9 8a1.5 1.5 0 0 1 2.6 0l4.4 7.5 1.8-3a1.5 1.5 0 0 1 2.6 0l2.6 7H2.5Z" />
                  <path d="m8 10 3 5" />
                </svg>
              }
              @case ('municiones') {
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-6 h-6"
                >
                  <path d="M5.5 10.5V7a2 2 0 0 1 4 0v3.5m-4 0V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-8.5m-4 0h4" />
                  <path d="M10 9.5V6a2 2 0 0 1 4 0v3.5m-4 0V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-9.5m-4 0h4" />
                  <path d="M14.5 10.5V7a2 2 0 0 1 4 0v3.5m-4 0V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-8.5m-4 0h4" />
                </svg>
              }
              @case ('armamento') {
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-6 h-6"
                >
                  <path
                    d="M3.5 17.5 5 15.5l2 .5 1.5-1.5-.5-1.5 5-2 5.5-2.5h3v-1h-3.5l-5.5 2-3 1-1.5-1L6 13l-3 2v2.5Z"
                  />
                  <path d="m10 12.5-1 3.5 2 .5.8-2.5" />
                  <path d="M19 7.5v-2" />
                </svg>
              }
              @case ('balistica') {
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="w-6 h-6"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                </svg>
              }
            }
          </div>
          <div class="flex flex-col text-left">
            <span class="text-sm font-semibold text-gray-900 leading-tight">
              {{ category().title }}
            </span>
            <span class="text-xs text-gray-500 font-normal mt-0.5">
              {{ category().subtitle }}
            </span>
          </div>
        </div>

        <div class="pr-2 flex items-center">
          <mat-icon [class.text-purple-600]="isOpen()" [class.text-gray-400]="!isOpen()">
            {{ isOpen() ? 'expand_less' : 'expand_more' }}
          </mat-icon>
        </div>
      </div>

      <!-- Category Card Body (Expanded) -->
      @if (isOpen()) {
        <div class="px-5 pb-5 pt-1 flex flex-col gap-4">
          <inta-multi-select-searchable
            [label]="''"
            [placeholder]="'Selecciona magnitudes y/o registros'"
            [options]="options()"
            [selectedValues]="selectedValues()"
            [disabled]="readonly()"
            (selectedValuesChange)="selectedValuesChange.emit($event)"
            (toggleFavorite)="toggleFavorite.emit($event)"
          />

          @for (measure of selectedValues(); track measure.id) {
            <inta-measure-limit-card
              [measure]="measure"
              [measureName]="getMeasureName(measure.id)"
              [isQuantitative]="isQuantitative(measure.id)"
              [readonly]="readonly()"
              (remove)="removeMeasure.emit(measure.id)"
              (toggleExpanded)="onToggleMeasureExpanded(measure.id)"
              (limitChange)="onLimitChange(measure.id, $event)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeasureCategoryCard {
  readonly category = input.required<MeasureCategoryDef>();
  readonly isOpen = input<boolean>(false);
  readonly options = input<SelectOption[]>([]);
  readonly selectedValues = input<MeasureSelectionData[]>([]);
  readonly readonly = input<boolean>(false);
  readonly measuresCatalog = input<MasterDataMeasureItem[]>([]);

  readonly toggleOpen = output<void>();
  readonly selectedValuesChange = output<MeasureSelectionData[]>();
  readonly toggleFavorite = output<{ id: string; isFavorite: boolean }>();
  readonly removeMeasure = output<string>();
  readonly toggleMeasureExpanded = output<string>();
  readonly updateLimit = output<{
    measureId: string;
    field: 'minLimit' | 'maxLimit' | 'deviation';
    value: number | null;
  }>();

  isQuantitative(measureId: string): boolean {
    const item = this.measuresCatalog().find((cat) => cat.id === measureId);
    return item?.qualificationType === 'QUANTITATIVE';
  }

  getMeasureName(measureId: string): string {
    return this.options().find((o) => o.id === measureId)?.name ?? measureId;
  }

  onToggleMeasureExpanded(measureId: string): void {
    if (!this.isQuantitative(measureId)) return;
    this.toggleMeasureExpanded.emit(measureId);
  }

  onLimitChange(
    measureId: string,
    event: { field: 'minLimit' | 'maxLimit' | 'deviation'; value: number | null },
  ): void {
    if (this.readonly()) return;
    this.updateLimit.emit({
      measureId,
      field: event.field,
      value: event.value,
    });
  }
}

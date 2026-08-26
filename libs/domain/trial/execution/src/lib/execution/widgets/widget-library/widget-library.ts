import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { Widget } from '../../models/execution-grid.models';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'inta-widget-library',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, TranslateModule, IntaIconComponent],
  template: `
    <div
      class="fixed top-0 right-0 w-full md:w-[400px] h-screen bg-white shadow-xl z-[1001] flex flex-col transition-transform duration-300 ease-in-out"
      [class.translate-x-full]="!isOpen()"
      [class.translate-x-0]="isOpen()"
    >
      <div class="flex flex-col gap-4 justify-between p-5 border-b border-gray-200 shrink-0">
        <div class="flex flex-column items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-gray-800">{{ 'TRIAL_EXECUTION.WIDGET_LIBRARY_TITLE' | translate }}</h2>
          <button mat-icon-button (click)="closed.emit()">
            <ui-inta-icon name="close" size="xxl" />
          </button>
        </div>
        <div class="flex items-center">
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <ui-inta-icon matPrefix name="search" size="md" color="var(--inta-button)" class="mx-3" />
            <input
              matInput
              type="text"
              class="flex-1 border-none outline-none bg-white text-sm text-gray-700 placeholder:text-gray-400"
              [placeholder]="'TRIAL_EXECUTION.SEARCH_WIDGET_PLACEHOLDER' | translate"
              [value]="searchTerm()"
              (input)="searchTerm.set($any($event.target).value)"
            />
          </mat-form-field>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div class="flex flex-col gap-6">
          @for (category of categories(); track category) {
            <div class="flex flex-col gap-3">
              <h3 class="text-xs font-semibold text-gray-600 tracking-wide mb-1">{{ category | translate }}</h3>
              @for (widget of groupedWidgets()[category]; track widget.id) {
                <div
                  class="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                >
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm text-gray-900 m-0 flex-1">{{ widget.title | translate }}</h4>
                    <div class="flex items-center gap-2">
                      @if (widget.badge) {
                        <span
                          class="inline-flex items-center justify-center w-6 h-6 rounded-md font-medium shrink-0"
                          [class]="getBadgeColorClass(widget.badgeColor)"
                        >
                          {{ widget.badge }}
                        </span>
                      }
                      <span class="text-[10px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase">
                        W: {{ widget.defaultWidth }}
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 leading-relaxed mb-4">{{ widget.description | translate }}</p>
                  <button mat-flat-button color="primary" class="w-full" (click)="selectWidget(widget.id)">
                    {{ 'TRIAL_EXECUTION.ADD' | translate }}
                  </button>
                </div>
              }
            </div>
          }

          @if (!filteredWidgets().length) {
            <div class="py-10 px-5">
              <p class="text-gray-500 text-center">{{ 'TRIAL_EXECUTION.NO_WIDGETS_FOUND' | translate }}</p>
            </div>
          }
        </div>
      </div>
    </div>

    <div
      tabindex="0"
      role="button"
      class="fixed inset-0 bg-black/50 z-[1000] transition-all duration-300 ease-in-out cursor-pointer"
      [attr.aria-label]="'TRIAL_EXECUTION.CLOSE_WIDGET_PANEL' | translate"
      [class.opacity-0]="!isOpen()"
      [class.invisible]="!isOpen()"
      [class.opacity-100]="isOpen()"
      [class.visible]="isOpen()"
      (click)="closed.emit()"
      (keydown.enter)="closed.emit()"
      (keydown.space)="closed.emit()"
    ></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetLibrary {
  readonly #translate = inject(TranslateService);

  readonly widgets = input.required<readonly Widget[]>();
  readonly isOpen = input.required<boolean>();
  readonly selected = output<string>();
  readonly closed = output<void>();
  readonly searchTerm = signal('');

  readonly filteredWidgets = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    if (!search) {
      return this.widgets();
    }

    return this.widgets().filter((widget) => {
      const title = this.#translate.instant(widget.title).toLowerCase();
      const description = this.#translate.instant(widget.description).toLowerCase();
      const category = this.#translate.instant(widget.category).toLowerCase();
      return title.includes(search) || description.includes(search) || category.includes(search);
    });
  });

  readonly groupedWidgets = computed(() => {
    const grouped: Record<string, Widget[]> = {};
    for (const widget of this.filteredWidgets()) {
      (grouped[widget.category] ??= []).push(widget);
    }
    return grouped;
  });

  readonly categories = computed(() => Object.keys(this.groupedWidgets()));

  selectWidget(widgetId: string): void {
    this.selected.emit(widgetId);
    this.closed.emit();
  }

  getBadgeColorClass(color?: string): string {
    return color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600';
  }
}

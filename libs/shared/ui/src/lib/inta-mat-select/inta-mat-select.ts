import { Component, computed, input, model, output } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import type { MatFormFieldAppearance } from '@angular/material/form-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import type { MatSelectChange } from '@angular/material/select';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'ui-inta-signal-select',
  imports: [MatFormFieldModule, MatIconModule, MatSelectModule],
  template: `
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2" [for]="id()">
        {{ label() }}
      </label>
      <mat-form-field class="w-full" [appearance]="appearance()" [subscriptSizing]="'dynamic'">
        @if (prefixIcon()) {
          <mat-icon matPrefix>
            {{ prefixIcon() }}
          </mat-icon>
        }

        <mat-select
          [id]="id()"
          [value]="value()"
          [multiple]="multiple()"
          [disabled]="isDisabled()"
          [placeholder]="placeholder()"
          (selectionChange)="value.set($event.value); selectionChange.emit($event)"
        >
          @if (searchable()) {
            <div
              role="search"
              class="search-container"
              (click)="$event.stopPropagation()"
              (keydown)="$event.stopPropagation()"
            >
              <mat-icon class="search-icon">search</mat-icon>
              <input
                placeholder="Buscar"
                class="search-input"
                [value]="searchTermValue"
                (input)="onSearchInput($event.target.value)"
                (click)="$event.stopPropagation()"
                (keydown)="$event.stopPropagation()"
              />
            </div>
          }
          @for (opt of filteredOptions(); track getOptionValue(opt)) {
            <mat-option [value]="getOptionValue(opt)">
              {{ getOptionLabel(opt) }}
            </mat-option>
          }
          @if (filteredOptions().length === 0) {
            <div class="no-results">No se encontraron resultados</div>
          }
        </mat-select>

        @if (suffixIcon()) {
          <mat-icon matSuffix>
            {{ suffixIcon() }}
          </mat-icon>
        }
      </mat-form-field>
    </div>
  `,
  styles: [
    `
      .search-container {
        display: flex;
        align-items: center;
        padding: 0 16px 0 16px;
        height: 48px;
        min-height: 48px;
        border-bottom: 1px solid #e5e7eb;
        background-color: white;
        position: sticky;
        top: 0;
        z-index: 10;
        margin: 0;
      }
      .search-container .search-icon {
        color: #9ca3af;
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .search-container .search-input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 14px;
        color: #374151;
        background: transparent;
        margin: 0;
        padding: 0;
        height: 100%;
      }
      .search-container .search-input::placeholder {
        color: #9ca3af;
      }
      ::ng-deep .custom-select-panel {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
      .no-results {
        padding: 16px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
      }
    `,
  ],
})
export class IntaSignalSelectComponent<T = string> implements FormValueControl<T | T[] | undefined> {
  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly placeholder = input<string>('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly options = input.required<any[]>();

  readonly valueKey = input<string>('id');

  readonly labelKey = input<string>('name');

  readonly appearance = input<MatFormFieldAppearance>('fill');
  readonly floatLabel = input<'auto' | 'always'>('auto');
  readonly prefixIcon = input<string>('');
  readonly suffixIcon = input<string>('');
  readonly id = input<string>('');

  readonly multiple = input<boolean>(false);

  readonly disabled = input<boolean>(false);

  readonly searchable = input<boolean>(false);

  readonly isDisabled = computed(() => this.disabled());

  readonly value = model<T | T[] | undefined>(undefined);

  // Search state
  readonly searchTerm = model<string>('');

  get searchTermValue(): string {
    return this.searchTerm();
  }
  onSearchInput(value: string) {
    this.searchTerm.set(value);
  }

  readonly filteredOptions = computed(() => {
    const search = this.searchable() ? this.searchTerm().toLowerCase() : '';
    const opts = this.options();
    if (!search) return opts;
    return opts.filter((opt) => this.getOptionLabel(opt).toLowerCase().includes(search));
  });

  protected getOptionValue(opt: unknown): T {
    return (opt as Record<string, unknown>)[this.valueKey()] as T;
  }

  protected getOptionLabel(opt: unknown): string {
    return String((opt as Record<string, unknown>)[this.labelKey()] ?? '');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectionChange = output<MatSelectChange<any>>();
}

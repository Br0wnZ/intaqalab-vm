import { Component, computed, effect, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import type { SelectOption } from '../../utils-models/catalog.model';
import type { MeasureSelectionData } from '../../utils-models/measure-serie.model';

export type { MeasureSelectionData, SelectOption };

@Component({
  selector: 'inta-multi-select-searchable',
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, MatIconModule, MatButtonModule, FormsModule],
  template: `
    <div class="multi-select-container">
      @if (label()) {
        <label for="multi-select-field" class="block text-sm font-medium text-gray-700 mb-2">
          {{ label() }}
        </label>
      }

      <mat-form-field id="multi-select-field" appearance="outline" class="w-full">
        <mat-select
          panelClass="custom-select-panel"
          multiple
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [ngModel]="_internalIds()"
          (ngModelChange)="onIdsChange($event)"
          (openedChange)="$event ? onPanelOpened() : null"
        >
          <mat-select-trigger>
            {{ getDisplayText() }}
          </mat-select-trigger>

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
              [(ngModel)]="searchTermValue"
              (click)="$event.stopPropagation()"
              (keydown)="$event.stopPropagation()"
            />
          </div>

          @for (option of filteredOptions(); track option.id) {
            <mat-option class="custom-option" [value]="option.id">
              <span class="option-label">{{ option.name }}</span>
              <button
                mat-icon-button
                type="button"
                tabindex="-1"
                class="star-button"
                (click)="toggleStar(option.id, $event)"
              >
                <mat-icon [class.starred]="isStarred(option.id)">
                  {{ isStarred(option.id) ? 'star' : 'star_outline' }}
                </mat-icon>
              </button>
            </mat-option>
          }
          @if (filteredOptions().length === 0) {
            <div class="no-results">No se encontraron resultados</div>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [
    `
      .multi-select-container {
        width: 100%;
      }

      .search-container {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        border-bottom: 1px solid #e5e7eb;
        background-color: white;
        position: sticky;
        top: 0;
        z-index: 10;

        .search-icon {
          color: #9ca3af;
          margin-right: 8px;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #374151;

          &::placeholder {
            color: #9ca3af;
          }
        }
      }

      .custom-option {
        min-height: 48px !important;
        padding: 0 48px 8px 8px !important;
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        background-color: white !important;

        &.mat-mdc-option-active,
        &:focus {
          background-color: white !important;
        }

        &:hover,
        &.mat-mdc-option-active:hover,
        &:focus:hover {
          background-color: #f9fafb !important;
        }
      }

      .option-label {
        flex: 1;
        font-size: 14px;
        color: #374151;
        display: block;
        padding-right: 8px;
        padding-left: 8px;
      }

      .star-button {
        position: absolute !important;
        right: 8px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: 32px !important;
        height: 32px !important;
        padding: 0 !important;
        z-index: 1 !important;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #d1d5db;
          transition: color 0.2s;

          &.starred {
            color: #a855f7;
          }
        }

        &:hover mat-icon {
          color: #9ca3af;

          &.starred {
            color: #9333ea;
          }
        }
      }

      .no-results {
        padding: 16px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
      }

      ::ng-deep {
        .custom-select-panel {
          max-height: 400px !important;

          .mat-mdc-option {
            padding: 0 !important;
            background-color: white !important;

            &.mat-mdc-option-active,
            &:focus {
              background-color: white !important;
            }

            &:hover,
            &.mat-mdc-option-active:hover,
            &:focus:hover {
              background-color: #f9fafb !important;
            }

            .mat-pseudo-checkbox {
              margin-left: 8px !important;
            }
          }
        }

        mat-form-field {
          .mat-mdc-text-field-wrapper {
            background-color: white;
          }

          .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }
        }
      }
    `,
  ],
})
export class MultiSelectSearchableComponent {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Selecciona opciones');
  readonly options = input<SelectOption[]>([]);
  readonly disabled = input<boolean>(false);

  readonly toggleFavorite = output<{ id: string; isFavorite: boolean }>();

  selectedValues = model<MeasureSelectionData[]>([]);

  readonly _internalIds = computed(() => this.selectedValues().map((v) => v.id));

  readonly searchTerm = signal<string>('');
  readonly starredItems = signal<string[]>([]);

  get searchTermValue(): string {
    return this.searchTerm();
  }
  set searchTermValue(value: string) {
    this.searchTerm.set(value);
  }

  readonly filteredOptions = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const opts = this.options();
    const starred = this.starredItems();

    let filtered = opts;
    if (search) {
      filtered = opts.filter((option) => option.name.toLowerCase().includes(search));
    }

    return filtered.sort((a, b) => {
      const aIsStarred = starred.includes(a.id);
      const bIsStarred = starred.includes(b.id);

      if (aIsStarred && !bIsStarred) return -1;
      if (!aIsStarred && bIsStarred) return 1;

      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });
  });

  constructor() {
    effect(() => {
      const starred = this.options()
        .filter((opt) => opt.favorite)
        .map((opt) => opt.id);
      this.starredItems.set(starred);
    });
  }

  getDisplayText(): string {
    const selected = this.selectedValues();
    if (selected.length === 0) {
      return '';
    }

    const selectedLabels = selected
      .map((item) => this.options().find((opt) => opt.id === item.id)?.name)
      .filter((label) => label !== undefined);

    return selectedLabels.join(', ');
  }

  onIdsChange(newIds: string[]): void {
    const current = this.selectedValues();
    const updated = newIds.map((id) => {
      const existing = current.find((v) => v.id === id);
      return existing ?? { id, minLimit: null, maxLimit: null, deviation: null, expanded: true };
    });
    this.selectedValues.set(updated);
  }

  toggleStar(value: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const current = this.starredItems();
    const isCurrentlyStarred = current.includes(value);

    // Instead of updating the local state, emit the event to the parent
    // to call the service. The local state will be updated via effect
    // when the new options come from the API correctly.
    this.toggleFavorite.emit({ id: value, isFavorite: !isCurrentlyStarred });
  }

  isStarred(value: string): boolean {
    return this.starredItems().includes(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  onPanelOpened(): void {
    this.clearSearch();
  }
}

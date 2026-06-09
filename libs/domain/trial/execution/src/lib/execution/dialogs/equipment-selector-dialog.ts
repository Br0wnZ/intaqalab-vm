import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { ReadonlyContentDirective } from '../directives/readonly-content.directive';

// ── Types ──────────────────────────────────────────────────────────────────────

export type EquipmentCategoryDef = {
  id: string;
  label: string;
  maxSelection: number;
};

export type EquipmentItemDef = {
  id: string;
  label: string;
  categoryId: string;
};

export type EquipmentItemSelectionEntry = {
  itemId: string;
  categoryId: string;
  series: string[];
  disparos: string[];
};

export type EquipmentSelectorDialogData = {
  categories: EquipmentCategoryDef[];
  items: EquipmentItemDef[];
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  initialSelections?: EquipmentItemSelectionEntry[];
};

export type EquipmentSelectorDialogResult =
  | { action: 'save'; selections: EquipmentItemSelectionEntry[] }
  | { action: 'back' };

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'inta-equipment-selector-dialog',
  standalone: true,
  imports: [
    NgClass,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    ReadonlyContentDirective,
    MatSelectModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Header -->
    <h2 mat-dialog-title class="text-xl font-bold text-gray-900 !m-0 !justify-start !align-items-start">
      {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.TITLE' | translate }}
    </h2>

    <mat-dialog-content intaReadonlyContent class="flex flex-col gap-4 !px-4 min-h-[420px]">
      <!-- Category tabs -->
      <div class="flex gap-2 my-2 flex-wrap">
        @for (cat of data.categories; track cat.id) {
          <button
            class="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer border-none"
            [ngClass]="
              activeCategoryId() === cat.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            (click)="setActiveCategory(cat.id)"
          >
            {{ cat.label }} {{ cat.maxSelection }}/{{ getCategoryTotalCount(cat.id) }}
          </button>
        }
      </div>

      <!-- Active category section -->
      <div class="flex flex-col gap-3 my-4">
        <!-- Section header -->
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-gray-900 !m-0 !p-0 !justify-start !align-items-start">
            {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.EQUIPMENT_HEADING' | translate }}
            {{ activeCategoryLabel() }}
          </h3>
          <span class="text-sm text-gray-400">
            {{
              'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SELECTION_LIMIT'
                | translate: { max: activeMaxSelection() }
            }}
          </span>
        </div>

        <!-- Selected chips -->
        <div class="flex flex-wrap my-2 gap-2 min-h-[32px]">
          @for (item of activeCategorySelectedItems(); track item.id) {
            <span
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium"
            >
              {{ item.label }}
              <button
                class="ml-0.5 text-purple-500 hover:text-purple-800 bg-transparent border-none cursor-pointer p-0 leading-none text-base font-bold"
                [attr.aria-label]="item.label"
                (click)="uncheckItem(item.id)"
              >
                ×
              </button>
            </span>
          }
        </div>

        <!-- Table -->
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <!-- Table header -->
          <div class="grid grid-cols-[40px_1fr_1fr_1fr] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <div></div>
            <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.COL_EQUIPMENT' | translate }}
            </span>
            <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.COL_SERIES' | translate }}
            </span>
            <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.COL_SHOTS' | translate }}
            </span>
          </div>

          <!-- Table rows -->
          <div class="max-h-[280px] overflow-y-auto divide-y divide-gray-50">
            @for (item of activeCategoryItems(); track item.id) {
              <div class="grid grid-cols-[40px_1fr_1fr_1fr] gap-4 px-4 py-2 items-center">
                <mat-checkbox
                  color="primary"
                  [checked]="isChecked(item.id)"
                  [disabled]="!isChecked(item.id) && isAtMax()"
                  (change)="toggleItem(item, $event.checked)"
                />
                <span class="text-sm text-gray-700 font-medium">{{ item.label }}</span>

                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                  <mat-select
                    multiple
                    [placeholder]="'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SERIES_PLACEHOLDER' | translate"
                    [value]="getRowSeries(item.id)"
                    (selectionChange)="updateRowSeries(item.id, $event.value)"
                  >
                    @for (opt of data.serieOptions; track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                  <mat-select
                    multiple
                    [placeholder]="'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SHOTS_PLACEHOLDER' | translate"
                    [value]="getRowDisparos(item.id)"
                    (selectionChange)="updateRowDisparos(item.id, $event.value)"
                  >
                    @for (opt of data.disparoOptions; track opt.value) {
                      <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            }
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <!-- Actions -->
    <mat-dialog-actions class="flex gap-2 !px-0 justify-end !pt-4">
      <button mat-stroked-button [mat-dialog-close]="{ action: 'back' }">
        {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.BACK' | translate }}
      </button>
      <button mat-flat-button class="!bg-purple-600 !text-white" (click)="save()">
        {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class EquipmentSelectorDialog {
  readonly #dialogRef = inject<MatDialogRef<EquipmentSelectorDialog, EquipmentSelectorDialogResult>>(MatDialogRef);
  readonly data = inject<EquipmentSelectorDialogData>(MAT_DIALOG_DATA);

  readonly #activeCategoryId = signal<string>(this.data.categories[0]?.id ?? '');
  readonly #checkedIds = signal<string[]>(this.data.initialSelections?.map((s) => s.itemId) ?? []);
  readonly #rowDropdowns = signal<Record<string, { series: string[]; disparos: string[] }>>(
    Object.fromEntries(
      (this.data.initialSelections ?? []).map((s) => [s.itemId, { series: s.series, disparos: s.disparos }]),
    ),
  );

  readonly activeCategoryId = this.#activeCategoryId.asReadonly();

  readonly activeCategoryLabel = computed(() => this.data.categories.find((c) => c.id === this.#activeCategoryId())?.label ?? '');

  readonly activeMaxSelection = computed(() => this.data.categories.find((c) => c.id === this.#activeCategoryId())?.maxSelection ?? 0);

  readonly activeCategoryItems = computed(() => this.data.items.filter((i) => i.categoryId === this.#activeCategoryId()));

  readonly activeCategorySelectedItems = computed(() => {
    const checkedIds = this.#checkedIds();
    return this.activeCategoryItems().filter((i) => checkedIds.includes(i.id));
  });

  readonly isAtMax = computed(() => {
    const catId = this.#activeCategoryId();
    const max = this.activeMaxSelection();
    const count = this.#checkedIds().filter((id) => {
      const item = this.data.items.find((i) => i.id === id);
      return item?.categoryId === catId;
    }).length;
    return count >= max;
  });

  getCategoryTotalCount(categoryId: string): number {
    return this.data.items.filter((i) => i.categoryId === categoryId).length;
  }

  setActiveCategory(categoryId: string): void {
    this.#activeCategoryId.set(categoryId);
  }

  isChecked(itemId: string): boolean {
    return this.#checkedIds().includes(itemId);
  }

  toggleItem(item: EquipmentItemDef, checked: boolean): void {
    if (checked) {
      if (this.isAtMax()) return;
      this.#checkedIds.set([...this.#checkedIds(), item.id]);
    } else {
      this.#checkedIds.set(this.#checkedIds().filter((id) => id !== item.id));
    }
  }

  uncheckItem(itemId: string): void {
    this.#checkedIds.set(this.#checkedIds().filter((id) => id !== itemId));
  }

  getRowSeries(itemId: string): string[] {
    return this.#rowDropdowns()[itemId]?.series ?? [];
  }

  getRowDisparos(itemId: string): string[] {
    return this.#rowDropdowns()[itemId]?.disparos ?? [];
  }

  updateRowSeries(itemId: string, series: string[]): void {
    const current = this.#rowDropdowns();
    this.#rowDropdowns.set({
      ...current,
      [itemId]: { ...(current[itemId] ?? { series: [], disparos: [] }), series },
    });
  }

  updateRowDisparos(itemId: string, disparos: string[]): void {
    const current = this.#rowDropdowns();
    this.#rowDropdowns.set({
      ...current,
      [itemId]: { ...(current[itemId] ?? { series: [], disparos: [] }), disparos },
    });
  }

  save(): void {
    const rowDropdowns = this.#rowDropdowns();
    const selections: EquipmentItemSelectionEntry[] = this.#checkedIds().flatMap((id) => {
      const item = this.data.items.find((i) => i.id === id);
      if (!item) return [];
      const dropdown = rowDropdowns[id] ?? { series: [], disparos: [] };
      return [{ itemId: id, categoryId: item.categoryId, series: dropdown.series, disparos: dropdown.disparos }];
    });
    this.#dialogRef.close({ action: 'save', selections });
  }
}

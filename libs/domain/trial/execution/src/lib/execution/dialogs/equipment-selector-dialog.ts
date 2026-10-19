import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { ErrorState, SaveButton, Skeleton } from '@intaqalab/ui';
import { RangePipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { EquipmentPlanningService } from '../../services/equipment-planning.service';
import { ExecutionService } from '../../services/execution.service';
import { ReadonlyContentDirective } from '../directives/readonly-content.directive';
import type {
  EquipmentItemSelection,
  EquipmentSelectorDialogData,
  EquipmentSelectorDialogResult,
  EquipmentTypeEnum,
} from '../models';
import { EquipmentMagnitudeTagEnum } from '../models';
import { SELECT_ALL_SERIES_VALUE } from './equipment-selector-dialog.mapper';
import { EquipmentSelectorStore } from './equipment-selector.store';

export type { EquipmentSelectorDialogData, EquipmentSelectorDialogResult } from '../models';

export type EquipmentItemSelectionEntry = EquipmentItemSelection;

@Component({
  selector: 'inta-equipment-selector-dialog',
  providers: [EquipmentPlanningService, EquipmentSelectorStore],
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReadonlyContentDirective,
    MatSelectModule,
    MatChipsModule,
    MatPaginatorModule,
    TranslateModule,
    Skeleton,
    ErrorState,
    SaveButton,
    RangePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Header -->
    <h2
      mat-dialog-title
      class="!text-sm !font-semibold !text-gray-700 !m-0 !mb-4 !justify-start !align-items-start [&:before]:!hidden"
    >
      {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.TITLE' | translate }}
    </h2>

    @if (isLoading()) {
      <!-- ===================================================================== -->
      <!-- ESTADO 1: LOADING (Skeletons auto-generados replicando la vista)      -->
      <!-- ===================================================================== -->
      <mat-dialog-content intaReadonlyContent class="flex flex-col gap-4 !px-5">
        <!-- Tag chips skeleton -->
        <div class="flex flex-wrap gap-2">
          @for (i of 8 | range; track i) {
            <ui-skeleton variant="rectangle" width="120px" height="32px" animation="wave" class="!rounded-full" />
          }
        </div>

        <!-- Heading & Add row button skeleton -->
        <div class="flex items-center justify-between mt-2">
          <ui-skeleton variant="text" width="100px" height="1.5rem" animation="wave" />
          <ui-skeleton variant="button" width="140px" height="36px" animation="wave" />
        </div>

        <!-- Table skeleton -->
        <div class="border border-gray-200 rounded-lg p-4 space-y-3">
          <div class="grid grid-cols-4 gap-3">
            @for (i of 4 | range; track i) {
              <ui-skeleton variant="text" width="80px" height="1rem" animation="wave" />
            }
          </div>
          <div class="grid grid-cols-4 gap-3 items-center">
            @for (i of 3 | range; track i) {
              <ui-skeleton variant="rectangle" width="100%" height="48px" animation="wave" />
            }
            <div class="flex items-center gap-2">
              <ui-skeleton variant="rectangle" width="100%" height="48px" animation="wave" />
              <ui-skeleton variant="circle" width="24px" height="24px" animation="wave" />
            </div>
          </div>
        </div>
      </mat-dialog-content>
    } @else if (error()) {
      <!-- ===================================================================== -->
      <!-- ESTADO 2: ERROR (Componente ui-error-state con i18n traducido)       -->
      <!-- ===================================================================== -->
      <mat-dialog-content intaReadonlyContent class="!px-5 py-6">
        <ui-error-state
          [title]="'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.ERRORS.LOAD_FAILED_TITLE' | translate"
          [message]="'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.ERRORS.LOAD_FAILED_DETAIL' | translate"
        />
      </mat-dialog-content>
    } @else {
      <!-- ===================================================================== -->
      <!-- ESTADO 3: ÉXITO / NORMAL (Componentes reales con datos)              -->
      <!-- ===================================================================== -->
      <mat-dialog-content intaReadonlyContent class="flex flex-col gap-4 !px-5">
        <!-- Tag chips (role-filtered) -->
        <div class="flex flex-col gap-2">
          <mat-chip-set [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.TAG_SELECTION_ARIA' | translate">
            @for (tag of visibleTags(); track tag.id) {
              <mat-chip-option
                class="cursor-pointer"
                [selected]="selectedTagId() === tag.id"
                (click)="selectTag(tag.id)"
              >
                {{ tag.label }}
              </mat-chip-option>
            }
          </mat-chip-set>
        </div>

        <!-- Table section -->
        @if (selectedTagId()) {
          <div class="flex flex-col gap-3">
            <!-- Header row: label + add button -->
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-gray-900 !m-0 !p-0">
                {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.EQUIPMENT_HEADING' | translate }}
              </h3>
              <button
                mat-flat-button
                [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.ADD_EQUIPMENT' | translate"
                (click)="addRow()"
              >
                <mat-icon>add</mat-icon>
                {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.ADD_EQUIPMENT' | translate }}
              </button>
            </div>

            <!-- Table -->
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <!-- Column headers -->
              <div
                class="grid gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200"
                [style.grid-template-columns]="gridCols()"
              >
                @for (field of activeTagFields(); track field.key) {
                  <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{{ field.label }}</span>
                }
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.COL_SERIES' | translate }}
                </span>
                <span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.COL_SHOTS' | translate }}
                </span>
                <div></div>
              </div>

              <!-- Rows -->
              <div class="divide-y divide-gray-50">
                @for (row of paginatedRows(); track row.rowId) {
                  <div class="grid gap-3 px-4 py-3 items-center" [style.grid-template-columns]="gridCols()">
                    @for (field of activeTagFields(); track field.key) {
                      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                        <mat-label>{{ field.label }}</mat-label>
                        @if (field.type === 'select') {
                          <mat-select
                            [id]="'equipment-' + selectedTagId() + '-' + row.rowId + '-' + field.key"
                            [disabled]="
                              field.sourceCategoryId === 'municion' ||
                              (field.sourceCategoryId === 'magnitud' && selectedTagId() !== lengthTagId)
                            "
                            [value]="getFieldValue(row.rowId, field.key)"
                            (selectionChange)="setFieldValue(row.rowId, field.key, $event.value)"
                          >
                            @for (opt of getItemsByCategory(field.sourceCategoryId); track opt.id) {
                              <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
                            }
                          </mat-select>
                          <!-- @if (
                            field.sourceCategoryId === 'municion' ||
                            (field.sourceCategoryId === 'magnitud' && selectedTagId() !== lengthTagId)
                          ) {
                            <mat-hint>
                              {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.UNSUPPORTED_SELECTION' | translate }}
                            </mat-hint>
                          } -->
                        } @else {
                          <input
                            matInput
                            type="number"
                            min="1"
                            step="1"
                            [id]="'equipment-' + selectedTagId() + '-' + row.rowId + '-' + field.key"
                            [attr.max]="field.maxValue"
                            [value]="getFieldValue(row.rowId, field.key)"
                            (change)="setFieldValue(row.rowId, field.key, $event.target.value)"
                          />
                        }
                      </mat-form-field>
                    }

                    <!-- Series -->
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                      <mat-label>
                        {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SERIES_PLACEHOLDER' | translate }}
                      </mat-label>
                      <mat-select
                        multiple
                        [id]="'equipment-' + selectedTagId() + '-' + row.rowId + '-series'"
                        [value]="row.series"
                        (selectionChange)="handleSeriesSelection(row.rowId, $event.value)"
                      >
                        <mat-option [value]="selectAllSeriesValue">
                          {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SELECT_ALL_SERIES' | translate }}
                        </mat-option>
                        @for (opt of activeSeriesOptions(); track opt.value) {
                          <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <!-- Disparos -->
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                      <mat-label>
                        {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SHOTS_PLACEHOLDER' | translate }}
                      </mat-label>
                      <mat-select
                        multiple
                        [id]="'equipment-' + selectedTagId() + '-' + row.rowId + '-shots'"
                        [value]="row.disparos"
                        (selectionChange)="setRowDisparos(row.rowId, $event.value)"
                      >
                        @for (opt of getShotOptions(row.series); track opt.value) {
                          <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <!-- Delete -->
                    <button
                      mat-icon-button
                      [attr.aria-label]="'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.DELETE' | translate"
                      (click)="removeRow(row.rowId)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Pagination -->
            @if (activeTagRows().length > 5) {
              <mat-paginator
                showFirstLastButtons
                [length]="activeTagRows().length"
                [pageSize]="5"
                [pageSizeOptions]="[5]"
                (page)="onPageChange($event)"
              ></mat-paginator>
            }
          </div>
        } @else {
          <p role="status" class="!m-0 py-6 text-center text-sm text-gray-600">
            {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.NO_PLANNED_MEASURES' | translate }}
          </p>
        }
      </mat-dialog-content>

      @if (isDirty() && !canSave()) {
        <p role="alert" class="!m-0 px-5 pt-2 text-sm text-client-error">
          {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.INCOMPLETE_ASSIGNMENTS' | translate }}
        </p>
      }

      <!-- Actions -->
      <mat-dialog-actions class="flex gap-2 !px-0 justify-end !pt-4">
        <button mat-stroked-button [mat-dialog-close]="{ action: 'back' }">
          {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.BACK' | translate }}
        </button>
        <ui-save-button
          label="TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SAVE"
          [isSaving]="isSaving()"
          [isDisabled]="!canSave()"
          (save)="save()"
        />
      </mat-dialog-actions>
    }
  `,
})
export class EquipmentSelectorDialog {
  readonly #dialogRef = inject<MatDialogRef<EquipmentSelectorDialog, EquipmentSelectorDialogResult>>(MatDialogRef);
  readonly data = inject<EquipmentSelectorDialogData>(MAT_DIALOG_DATA);
  readonly #executionService = inject(ExecutionService);
  readonly #store = inject(EquipmentSelectorStore);

  readonly selectAllSeriesValue = SELECT_ALL_SERIES_VALUE;
  readonly lengthTagId = EquipmentMagnitudeTagEnum.LONGITUD;

  // ── View State Signals ────────────────────────────────────────────────────────
  readonly isLoading = computed(() => this.#store.isLoading());
  readonly isSaving = computed(() => this.#executionService.updateEquipmentSelectorResource.isLoading());
  readonly error = computed(() => this.#store.error());

  readonly visibleTags = computed(() => this.#store.visibleTags());
  readonly enabledTagIds = computed(() => this.#store.enabledTagIds());
  readonly selectedTagId = computed(() => this.#store.selectedTagId());
  readonly activeSeriesOptions = computed(() => this.#store.activeSeriesOptions());
  readonly activeTagFields = computed(() => this.#store.activeTagFields());
  readonly activeTagRows = computed(() => this.#store.activeTagRows());
  readonly paginatedRows = computed(() => this.#store.paginatedRows());
  readonly isDirty = computed(() => this.#store.isDirty());
  readonly canSave = computed(() => this.#store.canSave());

  readonly gridCols = computed(() => {
    const numFields = this.activeTagFields().length;
    return `repeat(${numFields + 2}, 1fr) 50px`;
  });

  constructor() {
    this.#store.init(this.data);
  }

  getItemsByCategory(categoryId: EquipmentTypeEnum | string | ''): Array<{ id: string; label: string }> {
    return this.#store.getItemsByCategory(categoryId);
  }

  getShotOptions(series: readonly string[]): EquipmentSelectorDialogData['disparoOptions'] {
    return this.#store.getShotOptions(series);
  }

  handleSeriesSelection(rowId: string, selectedValues: readonly string[]): void {
    this.#store.handleSeriesSelection(rowId, selectedValues);
  }

  selectTag(tagId: string): void {
    this.#store.selectTag(tagId);
  }

  addRow(): void {
    this.#store.addRow();
  }

  removeRow(rowId: string): void {
    this.#store.removeRow(rowId);
  }

  getFieldValue(rowId: string, fieldKey: string): string {
    return this.activeTagRows().find((r) => r.rowId === rowId)?.fieldValues[fieldKey] ?? '';
  }

  setFieldValue(rowId: string, fieldKey: string, value: string): void {
    this.#store.setFieldValue(rowId, fieldKey, value);
  }

  setRowSeries(rowId: string, series: string[]): void {
    this.#store.setRowSeries(rowId, series);
  }

  setRowDisparos(rowId: string, disparos: string[]): void {
    this.#store.setRowDisparos(rowId, disparos);
  }

  onPageChange(event: PageEvent): void {
    this.#store.setPageIndex(event.pageIndex);
  }

  save(): void {
    if (!this.canSave()) return;
    this.#dialogRef.close({ action: 'save', equipments: this.#store.currentEquipments() });
  }
}

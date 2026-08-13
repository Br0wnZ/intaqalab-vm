import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import type { Role } from '@intaqalab/core';
import { injectCurrentUserRole } from '@intaqalab/core';
import { ErrorState, SaveButton, Skeleton } from '@intaqalab/ui';
import { RangePipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { ExecutionService } from '../../services/execution.service';
import { ReadonlyContentDirective } from '../directives/readonly-content.directive';
import type {
  EquipmentItemSelection,
  EquipmentMagnitudeSelectionGroup,
  EquipmentSelectorDialogData,
  EquipmentSelectorDialogResult,
  EquipmentTypeEnum,
  TagConfig,
  TagRow,
  TagTableState,
} from '../models';
import { isEquipmentTypeEnum } from '../models';
import {
  ADMIN_ROLES,
  INIT_STATE,
  MAGNITUDE_OPTIONS,
  SELECT_ALL_SERIES_VALUE,
  TAG_CONFIGS,
  apiToDialogFormat,
  dialogStatesToApiFormat,
  hydrateFromInitialEquipments,
} from './equipment-selector-dialog.mapper';

// ── Public Types ───────────────────────────────────────────────────────────────

export type EquipmentItemSelectionEntry = EquipmentItemSelection;

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'inta-equipment-selector-dialog',
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
          <mat-chip-set aria-label="Tag selection">
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
                            [value]="getFieldValue(row.rowId, field.key)"
                            (selectionChange)="setFieldValue(row.rowId, field.key, $event.value)"
                          >
                            @for (opt of getItemsByCategory(field.sourceCategoryId); track opt.id) {
                              <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
                            }
                          </mat-select>
                        } @else {
                          <input
                            matInput
                            type="number"
                            min="1"
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
                        [value]="row.series"
                        (selectionChange)="handleSeriesSelection(row.rowId, $event.value)"
                      >
                        <mat-option [value]="selectAllSeriesValue">Seleccionar todas las series</mat-option>
                        @for (opt of data.serieOptions; track opt.value) {
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
                        [value]="row.disparos"
                        (selectionChange)="setRowDisparos(row.rowId, $event.value)"
                      >
                        @for (opt of data.disparoOptions; track opt.value) {
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
        }
      </mat-dialog-content>

      <!-- Actions -->
      <mat-dialog-actions class="flex gap-2 !px-0 justify-end !pt-4">
        <button mat-stroked-button [mat-dialog-close]="{ action: 'back' }">
          {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.BACK' | translate }}
        </button>
        <ui-save-button
          label="TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SAVE"
          [isSaving]="isSaving()"
          [isDisabled]="!isDirty()"
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
  readonly #userRoles = injectCurrentUserRole();
  readonly selectAllSeriesValue = SELECT_ALL_SERIES_VALUE;

  // ── View State Signals ────────────────────────────────────────────────────────

  readonly isLoading = computed(() => this.#executionService.equipmentSelectorResource.isLoading());
  readonly isSaving = computed(() => this.#executionService.updateEquipmentSelectorResource.isLoading());
  readonly error = computed(() => {
    const res = this.#executionService.equipmentSelectorResource;
    const status = res.status();
    if (status === 'error') {
      const err = res.error?.();
      if (!err) return false;
      const httpErr = err as { status?: number };
      if (httpErr.status === 404) return false;
      return true;
    }
    return false;
  });

  // ── State: initial & current equipment selection state ────────────────────────

  readonly #initialEquipmentsJson = signal<string>('[]');
  readonly #selectedTagId = signal<string>('');
  readonly #tagStates = signal<Record<string, TagTableState>>({});
  readonly #isInitialized = signal(false);
  readonly #itemsByCategory = signal<Record<string, Array<{ id: string; label: string }>>>({});

  readonly currentEquipments = computed<EquipmentMagnitudeSelectionGroup[]>(() => {
    return dialogStatesToApiFormat(this.#tagStates());
  });

  readonly isDirty = computed(() => {
    if (!this.#isInitialized()) return false;
    return JSON.stringify(this.currentEquipments()) !== this.#initialEquipmentsJson();
  });

  // ── State: one entry per tag, lazily initialized ───────────────────────────

  constructor() {
    // Trigger GET for current equipment selection
    this.#executionService.getEquipmentSelector(this.data.fireTrialId);

    // Load items from API for all measurement equipment categories needed by visible tags
    this.#executionService
      .loadEquipmentItemsByCategories(this.#collectNeededCategories())
      .then((result) => this.#itemsByCategory.set(result));

    // Wait for GET to settle — only hydrate on success (not 404/error)
    effect(
      () => {
        if (this.#isInitialized()) return;

        const status = this.#executionService.equipmentSelectorResource.status();
        if (status !== 'resolved' && status !== 'error') return;

        if (status === 'resolved') {
          const apiData = this.#executionService.equipmentSelectorResource.value();
          if (apiData?.length) {
            this.#hydrateFromInitialEquipments(apiToDialogFormat(apiData));
          }
        }

        if (!this.#selectedTagId()) {
          const firstVisible = this.visibleTags()[0]?.id;
          if (firstVisible) this.selectTag(firstVisible);
        }

        this.#initialEquipmentsJson.set(JSON.stringify(this.currentEquipments()));
        this.#isInitialized.set(true);
      },
      { allowSignalWrites: true },
    );
  }

  // ── Computed ─────────────────────────────────────────────────────────────────

  readonly visibleTags = computed(() => {
    const roles = this.#userRoles();
    const isAdmin = roles.some((r: Role) => ADMIN_ROLES.includes(r));
    if (isAdmin) return TAG_CONFIGS;
    return TAG_CONFIGS.filter((t: TagConfig) => t.allowedRoles.some((r: Role) => roles.includes(r)));
  });

  readonly selectedTagId = this.#selectedTagId.asReadonly();

  readonly activeTagFields = computed(() => {
    const tag = TAG_CONFIGS.find((t) => t.id === this.#selectedTagId());
    return tag?.fields ?? [];
  });

  /** grid-template-columns: one per field + series + disparos + delete (50px) */
  readonly gridCols = computed(() => {
    const numFields = this.activeTagFields().length;
    return `repeat(${numFields + 2}, 1fr) 50px`;
  });

  readonly activeTagRows = computed(() => {
    const tagId = this.#selectedTagId();
    if (!tagId) return [] as TagRow[];
    return this.#tagStates()[tagId]?.rows ?? [];
  });

  readonly paginatedRows = computed(() => {
    const rows = this.activeTagRows();
    const pi = this.#tagStates()[this.#selectedTagId()]?.pageIndex ?? 0;
    return rows.slice(pi * 5, (pi + 1) * 5);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────

  #updateTag(tagId: string, updater: (s: TagTableState) => TagTableState): void {
    this.#tagStates.update((states: Record<string, TagTableState>) => ({
      ...states,
      [tagId]: updater(states[tagId] ?? INIT_STATE()),
    }));
  }

  // ── Methods ──────────────────────────────────────────────────────────────────

  getItemsByCategory(categoryId: EquipmentTypeEnum | string | ''): Array<{ id: string; label: string }> {
    if (!categoryId) return [];
    if (categoryId === 'magnitud') return MAGNITUDE_OPTIONS;
    return this.#itemsByCategory()[categoryId] ?? [];
  }

  #collectNeededCategories(): EquipmentTypeEnum[] {
    const seen = new Set<EquipmentTypeEnum>();
    for (const tag of TAG_CONFIGS) {
      for (const field of tag.fields) {
        if (field.type === 'select' && isEquipmentTypeEnum(field.sourceCategoryId as string)) {
          seen.add(field.sourceCategoryId as EquipmentTypeEnum);
        }
      }
    }
    return [...seen];
  }

  #getAllSeriesValues(): string[] {
    return this.data.serieOptions.map((serie) => serie.value);
  }

  #getDisparosBySeries(series: string[]): string[] {
    if (!series.length) return [];

    if (!this.data.serieDisparoMap) {
      return this.data.disparoOptions.map((disparo) => disparo.value);
    }

    const disparos = series.flatMap((serie) => this.data.serieDisparoMap?.[serie] ?? []);
    return [...new Set(disparos)];
  }

  #hydrateFromInitialEquipments(initialEquipments?: EquipmentMagnitudeSelectionGroup[]): void {
    if (!initialEquipments?.length) {
      const firstVisible = this.visibleTags()[0]?.id;
      if (firstVisible) this.selectTag(firstVisible);
      return;
    }

    const states = hydrateFromInitialEquipments(initialEquipments);

    if (Object.keys(states).length) {
      this.#tagStates.set(states);
      this.#selectedTagId.set(Object.keys(states)[0] ?? this.visibleTags()[0]?.id ?? '');
      return;
    }

    const firstVisible = this.visibleTags()[0]?.id;
    if (firstVisible) this.selectTag(firstVisible);
  }

  handleSeriesSelection(rowId: string, selectedValues: string[]): void {
    const series = selectedValues.includes(this.selectAllSeriesValue) ? this.#getAllSeriesValues() : selectedValues;
    const disparos = this.#getDisparosBySeries(series);

    const tagId = this.#selectedTagId();
    if (!tagId) return;

    this.#updateTag(tagId, (s: TagTableState) => ({
      ...s,
      rows: s.rows.map((r: TagRow) => (r.rowId === rowId ? { ...r, series, disparos } : r)),
    }));
  }

  /** Selects a tag. Preserves existing state; initializes with 1 empty row if first time. */
  selectTag(tagId: string): void {
    this.#selectedTagId.set(tagId);
    // Ensure state exists for this tag without resetting existing data
    this.#tagStates.update((states: Record<string, TagTableState>) => {
      if (states[tagId]) return states;
      return { ...states, [tagId]: INIT_STATE() };
    });
  }

  addRow(): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s: TagTableState) => {
      const rowId = `row-${s.nextId}`;
      return { ...s, rows: [...s.rows, { rowId, fieldValues: {}, series: [], disparos: [] }], nextId: s.nextId + 1 };
    });
  }

  removeRow(rowId: string): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s: TagTableState) => ({ ...s, rows: s.rows.filter((r: TagRow) => r.rowId !== rowId) }));
  }

  getFieldValue(rowId: string, fieldKey: string): string {
    return this.activeTagRows().find((r: TagRow) => r.rowId === rowId)?.fieldValues[fieldKey] ?? '';
  }

  setFieldValue(rowId: string, fieldKey: string, value: string): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s: TagTableState) => ({
      ...s,
      rows: s.rows.map((r: TagRow) =>
        r.rowId === rowId ? { ...r, fieldValues: { ...r.fieldValues, [fieldKey]: value } } : r,
      ),
    }));
  }

  setRowSeries(rowId: string, series: string[]): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s: TagTableState) => ({
      ...s,
      rows: s.rows.map((r: TagRow) => (r.rowId === rowId ? { ...r, series } : r)),
    }));
  }

  setRowDisparos(rowId: string, disparos: string[]): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s: TagTableState) => ({
      ...s,
      rows: s.rows.map((r: TagRow) => (r.rowId === rowId ? { ...r, disparos } : r)),
    }));
  }

  onPageChange(event: PageEvent): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s: TagTableState) => ({ ...s, pageIndex: event.pageIndex }));
  }

  /** Collects entries from ALL tags and closes the dialog. The store handles the API call. */
  save(): void {
    this.#dialogRef.close({ action: 'save', equipments: this.currentEquipments() });
  }
}

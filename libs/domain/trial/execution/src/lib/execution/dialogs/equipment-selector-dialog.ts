import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { Role, injectCurrentUserRole } from '@intaqalab/core';
import { TranslateModule } from '@ngx-translate/core';

import { ReadonlyContentDirective } from '../directives/readonly-content.directive';
import { EquipmentMagnitudeTagEnum, EquipmentTypeEnum, LEGACY_CATEGORY_TO_EQUIPMENT_TYPE } from '../models';
import type { EquipmentItemSelection, EquipmentMagnitudeSelectionGroup } from '../models';

// ── Public Types ───────────────────────────────────────────────────────────────

export type EquipmentItemSelectionEntry = EquipmentItemSelection;

export type EquipmentSelectorDialogData = {
  categories: Array<{ id: string; label: string; maxSelection: number }>;
  items: Array<{ id: string; label: string; categoryId?: string; equipmentType?: EquipmentTypeEnum }>;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  serieDisparoMap?: Record<string, string[]>;
  initialEquipments?: EquipmentMagnitudeSelectionGroup[];
};

export type EquipmentSelectorDialogResult =
  | { action: 'save'; equipments: EquipmentMagnitudeSelectionGroup[] }
  | { action: 'back' };

// ── Internal Tag Config ────────────────────────────────────────────────────────

type TagFieldConfig = {
  key: string;
  label: string;
  /** Maps to item.categoryId in data.items for options */
  sourceCategoryId: EquipmentTypeEnum | string | '';
  type: 'select' | 'number';
  maxValue?: number;
};

type TagConfig = {
  id: string;
  label: string;
  allowedRoles: Role[];
  fields: TagFieldConfig[];
};

// ── Role Groups ────────────────────────────────────────────────────────────────

const ADMIN_ROLES: Role[] = [Role.INTAQALAB_ADMIN, Role.INTAQALAB_PLANNING_ANALYSIS_HEAD, Role.HEAD_ARMAMENT_TRIALS];

const BALLISTICS_ROLES: Role[] = [Role.INTAQALAB_BALLISTICS_UNIT_HEAD, Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN];

const ARMAMENT_ROLES: Role[] = [Role.INTAQALAB_ARMAMENT_UNIT_HEAD, Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN];

const MUNITIONS_ROLES: Role[] = [Role.INTAQALAB_MUNITIONS_UNIT_HEAD, Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN];

const TOPOGRAPHY_ROLES: Role[] = [Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD, Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN];

const SELECT_ALL_SERIES_VALUE = '__ALL_SERIES__';

// LEGACY_CATEGORY_TO_EQUIPMENT_TYPE is imported from execution/models

// ── Canonical Tag Definitions ─────────────────────────────────────────────────

const TAG_CONFIGS: TagConfig[] = [
  {
    id: EquipmentMagnitudeTagEnum.VELOCIDAD_INICIAL,
    label: 'Velocidad Inicial',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'radar_doppler',
        label: 'Radar Doppler',
        sourceCategoryId: EquipmentTypeEnum.DOPPLER_RADAR,
        type: 'select',
      },
      { key: 'antena', label: 'Antena', sourceCategoryId: EquipmentTypeEnum.ANTENNA, type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.PRESION_PIEZOELECTRICOS,
    label: 'Presión Sensores Piezoeléctricos',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'sensor_piezoelectrico',
        label: 'Sensor piezoeléctrico',
        sourceCategoryId: EquipmentTypeEnum.PIEZOELECTRIC_SENSOR,
        type: 'select',
      },
      { key: 'amplificador', label: 'Amplificador', sourceCategoryId: EquipmentTypeEnum.AMPLIFIER, type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.TRAYECTOGRAFIA,
    label: 'Trayectografía',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'radar_trayectografia',
        label: 'Radar Trayectografía',
        sourceCategoryId: EquipmentTypeEnum.TRAJECTOGRAPHY_RADAR,
        type: 'select',
      },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.SONIDO,
    label: 'Sonido',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'sonometro',
        label: 'Sonómetro',
        sourceCategoryId: EquipmentTypeEnum.SOUND_LEVEL_METER,
        type: 'select',
      },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.VIDEO_AV,
    label: 'Vídeo AV',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'camara_av',
        label: 'Cámara AV',
        sourceCategoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA,
        type: 'select',
      },
      { key: 'grabador', label: 'Grabador', sourceCategoryId: EquipmentTypeEnum.HIGH_SPEED_CAMERA, type: 'select' },
      { key: 'canal', label: 'Canal (01 al 32)', sourceCategoryId: '', type: 'number', maxValue: 32 },
      { key: 'magnitud', label: 'Magnitud', sourceCategoryId: 'magnitud', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.VIDEO_C,
    label: 'Vídeo C',
    allowedRoles: [...ADMIN_ROLES, ...BALLISTICS_ROLES],
    fields: [
      {
        key: 'camara_c',
        label: 'Cámara C',
        sourceCategoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
        type: 'select',
      },
      {
        key: 'grabador',
        label: 'Grabador',
        sourceCategoryId: EquipmentTypeEnum.CONVENTIONAL_CAMERA,
        type: 'select',
      },
      { key: 'canal', label: 'Canal (01 al 32)', sourceCategoryId: '', type: 'number', maxValue: 32 },
      { key: 'magnitud', label: 'Magnitud', sourceCategoryId: 'magnitud', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.LONGITUD,
    label: 'Longitud',
    allowedRoles: [...ADMIN_ROLES, ...ARMAMENT_ROLES],
    fields: [
      {
        key: 'regla_trazos',
        label: 'Regla de Trazos',
        sourceCategoryId: EquipmentTypeEnum.TRACE_RULER,
        type: 'select',
      },
      { key: 'magnitud', label: 'Magnitud', sourceCategoryId: 'magnitud', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.PRESION_MANOMETROS,
    label: 'Presión Manómetros',
    allowedRoles: [...ADMIN_ROLES, ...MUNITIONS_ROLES],
    fields: [
      { key: 'manometro', label: 'Manómetro', sourceCategoryId: EquipmentTypeEnum.PRESSURE_GAUGE, type: 'select' },
      { key: 'crusher', label: 'Crusher', sourceCategoryId: EquipmentTypeEnum.CRUSHER, type: 'select' },
      { key: 'palpador', label: 'Palpador', sourceCategoryId: EquipmentTypeEnum.PROBE, type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.PRESION_IPG,
    label: 'Presión IPG',
    allowedRoles: [...ADMIN_ROLES, ...MUNITIONS_ROLES],
    fields: [
      { key: 'sensor_ipg', label: 'Sensor IPG', sourceCategoryId: EquipmentTypeEnum.IPG_SENSOR, type: 'select' },
      { key: 'micromodulo', label: 'Micromódulo', sourceCategoryId: EquipmentTypeEnum.MICROMDULE, type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.PESOS,
    label: 'Pesos',
    allowedRoles: [...ADMIN_ROLES, ...MUNITIONS_ROLES],
    fields: [
      { key: 'balanza', label: 'Balanza', sourceCategoryId: EquipmentTypeEnum.BALANCE, type: 'select' },
      { key: 'municion', label: 'Munición', sourceCategoryId: 'municion', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.ACONDICIONAMIENTO,
    label: 'Acondicionamiento',
    allowedRoles: [...ADMIN_ROLES, ...MUNITIONS_ROLES],
    fields: [
      { key: 'camara', label: 'Cámara', sourceCategoryId: EquipmentTypeEnum.CLIMATIC_CHAMBER, type: 'select' },
      { key: 'municion', label: 'Munición', sourceCategoryId: 'municion', type: 'select' },
    ],
  },
  {
    id: EquipmentMagnitudeTagEnum.TIEMPO,
    label: 'Tiempo',
    allowedRoles: [...ADMIN_ROLES, ...TOPOGRAPHY_ROLES],
    fields: [
      { key: 'cronometro', label: 'Cronómetro', sourceCategoryId: EquipmentTypeEnum.CHRONOMETER, type: 'select' },
    ],
  },
];

// ── Per-tag row state ──────────────────────────────────────────────────────────

type TagRow = {
  rowId: string;
  fieldValues: Record<string, string>;
  series: string[];
  disparos: string[];
};

type TagTableState = {
  rows: TagRow[];
  nextId: number;
  pageIndex: number;
};

const EMPTY_ROW = (): TagRow => ({ rowId: 'row-0', fieldValues: {}, series: [], disparos: [] });
const INIT_STATE = (): TagTableState => ({ rows: [EMPTY_ROW()], nextId: 1, pageIndex: 0 });

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

    <mat-dialog-content intaReadonlyContent class="flex flex-col gap-4 !px-5">
      <!-- Tag chips (role-filtered) -->
      <div class="flex flex-col gap-2">
        <mat-chip-set aria-label="Tag selection">
          @for (tag of visibleTags(); track tag.id) {
            <mat-chip-option class="cursor-pointer" [selected]="selectedTagId() === tag.id" (click)="selectTag(tag.id)">
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
      <button mat-flat-button (click)="save()">
        {{ 'TRIAL_EXECUTION.DIALOGS.EQUIPMENT_SELECTOR.SAVE' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class EquipmentSelectorDialog {
  readonly #dialogRef = inject<MatDialogRef<EquipmentSelectorDialog, EquipmentSelectorDialogResult>>(MatDialogRef);
  readonly data = inject<EquipmentSelectorDialogData>(MAT_DIALOG_DATA);
  readonly #userRoles = injectCurrentUserRole();
  readonly selectAllSeriesValue = SELECT_ALL_SERIES_VALUE;

  // ── State: one entry per tag, lazily initialized ───────────────────────────

  readonly #selectedTagId = signal<string>('');
  readonly #tagStates = signal<Record<string, TagTableState>>({});

  constructor() {
    this.#hydrateFromInitialEquipments();
  }

  // ── Computed ─────────────────────────────────────────────────────────────────

  readonly visibleTags = computed(() => {
    const roles = this.#userRoles();
    const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r));
    if (isAdmin) return TAG_CONFIGS;
    return TAG_CONFIGS.filter((t) => t.allowedRoles.some((r) => roles.includes(r)));
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
    this.#tagStates.update((states) => ({
      ...states,
      [tagId]: updater(states[tagId] ?? INIT_STATE()),
    }));
  }

  // ── Methods ──────────────────────────────────────────────────────────────────

  getItemsByCategory(
    categoryId: EquipmentTypeEnum | string | '',
  ): Array<{ id: string; label: string; categoryId?: string }> {
    if (!categoryId) return [];
    return this.data.items.filter((i) => {
      if (this.#resolveEquipmentType(i) === categoryId) return true;
      return i.categoryId === categoryId;
    });
  }

  #resolveEquipmentType(item: { categoryId?: string; equipmentType?: EquipmentTypeEnum }): EquipmentTypeEnum | null {
    if (item.equipmentType) return item.equipmentType;
    if (!item.categoryId) return null;
    return LEGACY_CATEGORY_TO_EQUIPMENT_TYPE[item.categoryId] ?? null;
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

  #hydrateFromInitialEquipments(): void {
    const initialEquipments = this.data.initialEquipments;
    if (!initialEquipments?.length) {
      const firstVisible = this.visibleTags()[0]?.id;
      if (firstVisible) this.selectTag(firstVisible);
      return;
    }

    const states: Record<string, TagTableState> = {};

    for (const group of initialEquipments) {
      const tag = TAG_CONFIGS.find((t) => t.id === group.id);
      if (!tag) continue;

      const rows: TagRow[] = [];

      for (const selection of group.selections) {
        const field = tag.fields.find(
          (f) => f.type === 'select' && f.sourceCategoryId && f.sourceCategoryId === selection.categoryId,
        );

        if (!field) continue;

        rows.push({
          rowId: `row-${rows.length}`,
          fieldValues: { [field.key]: selection.itemId },
          series: selection.series ?? [],
          disparos: selection.disparos ?? [],
        });
      }

      states[group.id] = {
        rows: rows.length ? rows : [EMPTY_ROW()],
        nextId: rows.length || 1,
        pageIndex: 0,
      };
    }

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

    this.#updateTag(tagId, (s) => ({
      ...s,
      rows: s.rows.map((r) => (r.rowId === rowId ? { ...r, series, disparos } : r)),
    }));
  }

  /** Selects a tag. Preserves existing state; initializes with 1 empty row if first time. */
  selectTag(tagId: string): void {
    this.#selectedTagId.set(tagId);
    // Ensure state exists for this tag without resetting existing data
    this.#tagStates.update((states) => {
      if (states[tagId]) return states;
      return { ...states, [tagId]: INIT_STATE() };
    });
  }

  addRow(): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s) => {
      const rowId = `row-${s.nextId}`;
      return { ...s, rows: [...s.rows, { rowId, fieldValues: {}, series: [], disparos: [] }], nextId: s.nextId + 1 };
    });
  }

  removeRow(rowId: string): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s) => ({ ...s, rows: s.rows.filter((r) => r.rowId !== rowId) }));
  }

  getFieldValue(rowId: string, fieldKey: string): string {
    return this.activeTagRows().find((r) => r.rowId === rowId)?.fieldValues[fieldKey] ?? '';
  }

  setFieldValue(rowId: string, fieldKey: string, value: string): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s) => ({
      ...s,
      rows: s.rows.map((r) => (r.rowId === rowId ? { ...r, fieldValues: { ...r.fieldValues, [fieldKey]: value } } : r)),
    }));
  }

  setRowSeries(rowId: string, series: string[]): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s) => ({
      ...s,
      rows: s.rows.map((r) => (r.rowId === rowId ? { ...r, series } : r)),
    }));
  }

  setRowDisparos(rowId: string, disparos: string[]): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s) => ({
      ...s,
      rows: s.rows.map((r) => (r.rowId === rowId ? { ...r, disparos } : r)),
    }));
  }

  onPageChange(event: PageEvent): void {
    const tagId = this.#selectedTagId();
    if (!tagId) return;
    this.#updateTag(tagId, (s) => ({ ...s, pageIndex: event.pageIndex }));
  }

  /** Collects entries from ALL tags that have at least one filled field. */
  save(): void {
    const equipments: EquipmentMagnitudeSelectionGroup[] = [];

    for (const [tagId, state] of Object.entries(this.#tagStates())) {
      const tag = TAG_CONFIGS.find((t) => t.id === tagId);
      if (!tag) continue;

      const selections: EquipmentItemSelectionEntry[] = [];

      for (const row of state.rows) {
        for (const field of tag.fields) {
          if (field.type === 'select' && field.sourceCategoryId && row.fieldValues[field.key]) {
            selections.push({
              itemId: row.fieldValues[field.key],
              categoryId: field.sourceCategoryId,
              series: row.series,
              disparos: row.disparos,
            });
          }
        }
      }

      if (selections.length) {
        equipments.push({
          id: tagId,
          selections,
        });
      }
    }

    this.#dialogRef.close({ action: 'save', equipments });
  }
}

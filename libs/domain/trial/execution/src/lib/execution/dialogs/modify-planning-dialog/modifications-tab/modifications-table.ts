import { Component, computed, inject, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { PlanningSeriesShotItem } from '@intaqalab/data-access-planning';
import type { PlanningValueReferences } from '@intaqalab/planning';
import { StopClick } from '@intaqalab/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import type {
  PlanningChange as LegacyPlanningChange,
  ModificationClassification,
  PlanningModification,
} from '../../../../data-access/planning-modifications';
import { formatPlanningChangeValue } from '../../../../data-access/planning-modifications/planning-change-value.mapper';
import type {
  PlanningChange as ApiPlanningChange,
  PlanningChangeRow,
  PlanningDetectedChange,
} from '../../../models/planning-changes.models';
import type { ModificationClassificationChangeEvent } from '../modify-planning-dialog.models';
import type { PlanningChangeInclusionChangeEvent } from '../modify-planning-dialog.models';

export type PlanningModificationRow =
  PlanningModification | LegacyPlanningChange | ApiPlanningChange | PlanningChangeRow | PlanningDetectedChange;

const DISPLAYED_COLUMNS: ReadonlyArray<string> = [
  'section',
  'parameter',
  'action',
  'previousValue',
  'newValue',
  'affectedShots',
  'status',
  'include',
  'accept',
  'request',
];

const FIELD_LABEL_MAP: Record<string, string> = {
  goal: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.GOAL',
  temperature: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.TEMPERATURE',
  minTime: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.TIME_MIN',
  maxTime: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.TIME_MAX',
  elevation: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.ELEVATION',
  orientation: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.ORIENTATION',
  distance: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.DISTANCE',
  powderWeight: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.POWDER_WEIGHT',
  projectileLot: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.BATCH',
  batch: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.BATCH',
  observations: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.OBSERVATIONS',
  maxEmissionDates: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.MAX_EMISSION_DATES',
  stanagCriteriaIds: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.STANAG_CRITERIA',
  hypochelometricReviewBefore: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.HYPOCHELOMETRIC_REVIEW_BEFORE_LABEL',
  hypochelometricReviewAfter: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.HYPOCHELOMETRIC_REVIEW_AFTER_LABEL',
  requirements: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.REQUERIMENTS_LABEL',
  requeriments: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.REQUERIMENTS_LABEL',
  additionalInfo: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.ADDITIONAL_INFO_LABEL',
  percentageTechnicalUnits: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.UNITS_PERCENTAGE_LABEL',
  percentageEndTrial: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.END_PERCENTAGE_LABEL',
  daysSignReport: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.DAYS_SIGN_REPORT_LABEL',
  date: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.DATE',
  targetTypeId: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET',
  targetMaterialId: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_MATERIAL',
  targetDimensionsId: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_DIMENSIONS',
  targetThicknessId: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_THICKNESS',
  targetInclination: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.INCLINATION',
  angle: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.ANGLE',
  range: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.RANGE',
  impactZoneId: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.IMPACT_ZONE',
  loadingZoneId: 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.ZONE_MODULES',
  functioningHeight: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.FUNCTIONING_HEIGHT',
  nominalSpeed: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.NOMINAL_VELOCITY',
  projectileWeight: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.PROJECTILE_WEIGHT',
  denominationId: 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.DENOMINATION_LABEL',
  maxAllowedErrors: 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MAX_FAILURES_LABEL',
  'reconditioning.temperature': 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TEMPERATURE_LABEL',
  'reconditioning.tolerance': 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.TOLERANCE_LABEL',
  'reconditioning.timeMin': 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MIN_TIME_LABEL',
  'reconditioning.timeMax': 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.MAX_TIME_LABEL',
  'reconditioning.observations': 'TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.OBSERVATIONS_LABEL',
  typeId: 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.TYPE',
  loadingZoneValue: 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.ZONE_MODULES',
  quantity: 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.HEADERS.QUANTITY',
  clientNumber: 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.CLIENT_NUMBER_LABEL',
  fuseWorkingModeId: 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.FUZE_MODE_LABEL',
  fuseMeasurement: 'TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.FUZE_GRADUATION_LABEL',
  assignedShotIds: 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.ASSOCIATED_SHOTS_LABEL',
  selectedComponents: 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.COMPONENT_SELECTOR_LABEL',
  munitionTypeId: 'TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MUNITION_TYPE_LABEL',
  itemType: 'TRIAL_PLANNING.ARMAMENT.TABLE.TYPE',
  weaponExternalId: 'TRIAL_PLANNING.ARMAMENT.TABLE.WEAPON',
  tubeExternalId: 'TRIAL_PLANNING.ARMAMENT.TABLE.TUBE',
  isInstrumented: 'TRIAL_PLANNING.ARMAMENT.TABLE.INSTRUMENTED',
  lifeUsefulPercentage: 'TRIAL_PLANNING.ARMAMENT.TABLE.LIFE',
  measureUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.MEASURE_UNIT',
  minLimit: 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.MIN_LIMIT',
  maxLimit: 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.MAX_LIMIT',
  deviation: 'TRIAL_PLANNING.MEASURES.LIMIT_CARD.DEVIATION',
  seriesConfiguration: 'TRIAL_PLANNING.MEASURES.SERIE_CONFIG',
  name: 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_TABLE.SERIE_NAME',
  shotQuantity: 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_TABLE.SHOTS_QUANTITY',
  executionOrder: 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_TABLE.EXECUTION_ORDER',
  globalNumber: 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SHOTS_TABLE.SHOT_NUMBER',
  observation: 'COMMONS.OBSERVATIONS',
  Disparo: 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.SHOT',
  Serie: 'TRIAL_PLANNING.ARMAMENT.TABLE.SERIE',
  Medida: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.MEASURE',
  'Configuración de munición': 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.MUNITION_CONFIGURATION',
  'Componente de munición': 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.MUNITION_COMPONENT',
  speedUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.SPEED_UNIT',
  pressureUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.PRESSURE_UNIT',
  distanceUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.DISTANCE_UNIT',
  orientationUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.ORIENTATION_UNIT',
  targetInclinationUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.TARGET_INCLINATION_UNIT',
  elevationUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.ELEVATION_UNIT',
  angleUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.ANGLE_UNIT',
  rangeUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.RANGE_UNIT',
  functioningHeightUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.FUNCTIONING_HEIGHT_UNIT',
  nominalSpeedUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.SPEED_UNIT',
  powderWeightUnit: 'TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.POWDER_WEIGHT_UNIT',
};

const RATING_PROPERTY_LABELS: Record<string, string> = {
  v0c: 'V0C',
  v0cMean: 'V0C_MEAN',
  v0cStdDev: 'V0C_STD_DEV',
  p: 'P',
  pMean: 'P_MEAN',
  projectile: 'PROJECTILE',
  fuse: 'FUSE',
  primer: 'PRIMER',
};

const RATING_LIMIT_LABELS: Record<string, string> = {
  useful1Min: 'USEFUL_MIN',
  useful1Max: 'USEFUL_MAX',
  uselessMin: 'USELESS_MIN',
  uselessMax: 'USELESS_MAX',
};

@Component({
  selector: 'inta-modifications-table',
  imports: [
    MatTableModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    StopClick,
    TranslatePipe,
  ],
  styles: [
    `
      .planning-slide-toggle {
        --mdc-switch-selected-track-color: #7c3aed;
        --mdc-switch-selected-handle-color: #ffffff;
        --mdc-switch-selected-hover-track-color: #6d28d9;
        --mdc-switch-selected-hover-handle-color: #ffffff;
        --mdc-switch-selected-focus-track-color: #7c3aed;
        --mdc-switch-selected-focus-handle-color: #ffffff;
        --mdc-switch-selected-pressed-track-color: #6d28d9;
        --mdc-switch-selected-pressed-handle-color: #ffffff;
      }
    `,
  ],
  template: `
    @if (modifications().length === 0) {
      <div
        class="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50"
      >
        <mat-icon class="text-gray-400 !w-10 !h-10 !text-[40px] mb-2">playlist_add_check</mat-icon>
        <p class="text-sm m-0">
          {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.EMPTY_STATE' | translate }}
        </p>
      </div>
    } @else {
      <div class="overflow-x-auto border border-gray-200/80 rounded-xl bg-white shadow-xs">
        <table mat-table class="w-full" [dataSource]="modifications()">
          <ng-container matColumnDef="section">
            <th *matHeaderCellDef mat-header-cell class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.SECTION' | translate }}
            </th>
            <td *matCellDef="let row" mat-cell class="text-sm text-gray-700 font-normal py-4 px-6">
              {{ getSectionLabel(row) | translate }}
            </td>
          </ng-container>

          <ng-container matColumnDef="parameter">
            <th *matHeaderCellDef mat-header-cell class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.PARAMETER' | translate }}
            </th>
            <td *matCellDef="let row" mat-cell class="text-sm text-gray-700 font-normal py-4 px-6">
              {{ getParameter(row) | translate }}
              @if (getRatingProperty(row); as property) {
                · {{ property | translate }}
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th *matHeaderCellDef mat-header-cell class="font-normal text-gray-500 text-sm py-3.5 px-6">
              <span class="inline-flex items-center gap-1">
                <span>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACTION' | translate }}</span>
                <span class="text-xs text-gray-400">↓</span>
              </span>
            </th>
            <td *matCellDef="let row" mat-cell class="py-4 px-6">
              <span
                class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium"
                [class]="getActionBadgeClass(row)"
              >
                {{ getActionLabel(row) | translate }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="previousValue">
            <th *matHeaderCellDef mat-header-cell class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.PREVIOUS_VALUE' | translate }}
            </th>
            <td *matCellDef="let row" mat-cell class="text-sm text-gray-400 font-normal py-4 px-6">
              {{ getPreviousValue(row) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="newValue">
            <th *matHeaderCellDef mat-header-cell class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.NEW_VALUE' | translate }}
            </th>
            <td *matCellDef="let row" mat-cell class="text-sm text-gray-600 font-normal py-4 px-6">
              {{ getNewValue(row) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="affectedShots">
            <th *matHeaderCellDef mat-header-cell class="font-normal text-gray-500 text-sm py-3.5 px-6">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.AFFECTED_SHOTS' | translate }}
            </th>
            <td *matCellDef="let row" mat-cell class="text-sm text-gray-600 font-normal py-4 px-6">
              @for (globalNumber of getAffectedShotNumbers(row); track $index; let last = $last) {
                {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.SHOT_LABEL' | translate: { globalNumber }
                }}{{ last ? '' : ', ' }}
              } @empty {
                {{ getAffectedShotCount(row) }}
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th *matHeaderCellDef mat-header-cell class="font-normal text-gray-500 text-sm py-3.5 px-6">
              <span class="inline-flex items-center gap-1">
                <span>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.STATUS' | translate }}</span>
                <span class="text-xs text-gray-400">↓</span>
              </span>
            </th>
            <td *matCellDef="let row" mat-cell class="py-4 px-6">
              <span
                class="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium"
                [class]="getStatusBadgeClass(row)"
              >
                {{ getStatusLabel(row) | translate }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="include">
            <th *matHeaderCellDef mat-header-cell class="font-normal text-gray-500 text-sm text-center py-3.5 px-4">
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.APPLY' | translate }}
            </th>
            <td *matCellDef="let row" mat-cell class="text-center py-4 px-4">
              @if (isRemoteDraft(row)) {
                <mat-checkbox
                  [checked]="isSelectedForApply(row)"
                  [disabled]="disabled()"
                  [attr.aria-label]="
                    ('TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.APPLY' | translate) +
                    ' - ' +
                    (getParameter(row) | translate)
                  "
                  (change)="includeChange.emit({ changeId: row.id, selected: $event.checked })"
                />
              } @else {
                <span aria-hidden="true">—</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="accept">
            <th
              *matHeaderCellDef
              mat-header-cell
              class="font-normal text-gray-500 text-sm text-center py-3.5 px-6"
              [matTooltip]="'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.ACCEPT_TOOLTIP' | translate"
            >
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACCEPT' | translate }}
            </th>
            <td *matCellDef="let row" mat-cell class="text-center py-4 px-6">
              <div class="flex items-center justify-center">
                <mat-slide-toggle
                  uiStopClick
                  class="planning-slide-toggle"
                  [preventDefault]="false"
                  [checked]="isAcceptChecked(row)"
                  [disabled]="isClassificationDisabled(row)"
                  [attr.aria-label]="
                    ('TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.ACCEPT' | translate) +
                    ' - ' +
                    (getParameter(row) | translate)
                  "
                  (change)="onToggleClassification(row, 'acepta')"
                />
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="request">
            <th
              *matHeaderCellDef
              mat-header-cell
              class="font-normal text-gray-500 text-sm text-center py-3.5 px-6"
              [matTooltip]="'TRIAL_EXECUTION.PLANNING_MODIFICATION.CLASSIFICATION.REQUEST_TOOLTIP' | translate"
            >
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.REQUEST' | translate }}
            </th>
            <td *matCellDef="let row" mat-cell class="text-center py-4 px-6">
              <div class="flex items-center justify-center">
                <mat-slide-toggle
                  uiStopClick
                  class="planning-slide-toggle"
                  [preventDefault]="false"
                  [checked]="isRequestChecked(row)"
                  [disabled]="isClassificationDisabled(row)"
                  [attr.aria-label]="
                    ('TRIAL_EXECUTION.PLANNING_MODIFICATION.COLUMNS.REQUEST' | translate) +
                    ' - ' +
                    (getParameter(row) | translate)
                  "
                  (change)="onToggleClassification(row, 'solicita')"
                />
              </div>
            </td>
          </ng-container>

          <tr *matHeaderRowDef="displayedColumns" mat-header-row class="bg-gray-50/60 border-b border-gray-100"></tr>
          <tr
            *matRowDef="let row; columns: displayedColumns"
            mat-row
            class="border-b border-gray-100 hover:bg-gray-50/40 transition-colors"
          ></tr>
        </table>
      </div>
    }
  `,
})
export class ModificationsTable {
  readonly modifications = input<ReadonlyArray<PlanningModificationRow>>([]);
  readonly shots = input<ReadonlyArray<PlanningSeriesShotItem>>([]);
  readonly valueReferences = input<PlanningValueReferences>({});
  readonly #translate = inject(TranslateService);
  readonly disabled = input<boolean>(false);

  readonly #shotNumbers = computed(() => new Map(this.shots().map((shot) => [shot.id, shot.globalNumber])));

  readonly classificationChange = output<ModificationClassificationChangeEvent>();
  readonly includeChange = output<PlanningChangeInclusionChangeEvent>();

  protected readonly displayedColumns = DISPLAYED_COLUMNS;

  protected getParameter(row: PlanningModificationRow): string {
    const field = 'field' in row && row.field ? row.field : 'parameter' in row ? row.parameter : '';
    if (field.startsWith('ratingCriteria.')) {
      const limit = RATING_LIMIT_LABELS[field.split('.')[2]];
      if (limit) return `TRIAL_EXECUTION.PLANNING_MODIFICATION.FIELDS.${limit}`;
    }
    if (field) return FIELD_LABEL_MAP[field] ?? field;
    if ('parameter' in row && row.parameter) return row.parameter;
    return '-';
  }

  protected getRatingProperty(row: PlanningModificationRow): string | null {
    if (!('field' in row) || !row.field?.startsWith('ratingCriteria.')) return null;
    const property = RATING_PROPERTY_LABELS[row.field.split('.')[1]];
    return property ? `TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.${property}` : null;
  }

  protected getSectionLabel(row: PlanningModificationRow): string {
    if ('section' in row) {
      return `TRIAL_EXECUTION.PLANNING_MODIFICATION.SECTIONS.${row.section.replaceAll('-', '_').toUpperCase()}`;
    }
    if ('resourceType' in row) {
      const sectionByResource: Record<string, string> = {
        PLANNING_INFO: 'GENERAL_DATA',
        SHOT_CONDITIONS: 'SHOOTING_CONDITIONS',
        MUNITION: 'MUNITIONS',
        MUNITION_COMPONENT: 'MUNITIONS',
        ARMAMENT: 'ARMAMENT',
      };
      return `TRIAL_EXECUTION.PLANNING_MODIFICATION.SECTIONS.${sectionByResource[row.resourceType] ?? 'GENERAL_DATA'}`;
    }
    return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.SECTIONS.GENERAL_DATA';
  }

  protected isClassificationDisabled(row: PlanningModificationRow): boolean {
    if (this.disabled()) {
      return true;
    }
    if ('persistable' in row) return !row.persistable || row.status !== 'READY';
    if ('selectedForApply' in row) return row.status !== 'DRAFT' || !row.selectedForApply;
    if (!('action' in row)) return true;
    const status = 'status' in row ? row.status : undefined;
    return status !== 'BORRADOR';
  }

  protected isRemoteDraft(row: PlanningModificationRow): boolean {
    return 'selectedForApply' in row && row.status === 'DRAFT';
  }

  protected isSelectedForApply(row: PlanningModificationRow): boolean {
    return 'selectedForApply' in row && row.selectedForApply;
  }

  protected isAcceptChecked(row: PlanningModificationRow): boolean {
    if ('requiresApproval' in row && typeof row.requiresApproval === 'boolean') {
      return row.requiresApproval;
    }
    return 'classification' in row && row.classification === 'acepta';
  }

  protected isRequestChecked(row: PlanningModificationRow): boolean {
    if ('requestClient' in row && typeof row.requestClient === 'boolean') {
      return row.requestClient;
    }
    return 'classification' in row && row.classification === 'solicita';
  }

  protected onToggleClassification(
    row: PlanningModificationRow,
    target: Exclude<ModificationClassification, 'none'>,
  ): void {
    if (this.isClassificationDisabled(row)) {
      return;
    }

    const currentChecked = target === 'acepta' ? this.isAcceptChecked(row) : this.isRequestChecked(row);
    const nextClassification: ModificationClassification = currentChecked ? 'none' : target;
    this.classificationChange.emit({
      modId: row.id,
      classification: nextClassification,
    });
  }

  protected getPreviousValue(row: PlanningModificationRow): string {
    const val = 'previousValue' in row ? row.previousValue : 'oldValue' in row ? row.oldValue : null;
    return formatPlanningChangeValue(
      val,
      'field' in row ? (row.field ?? '') : row.parameter,
      this.valueReferences(),
      this.#translate.currentLang() ?? 'es',
    );
  }

  protected getNewValue(row: PlanningModificationRow): string {
    const val = 'newValue' in row ? row.newValue : null;
    return formatPlanningChangeValue(
      val,
      'field' in row ? (row.field ?? '') : row.parameter,
      this.valueReferences(),
      this.#translate.currentLang() ?? 'es',
    );
  }

  protected getAffectedShotNumbers(row: PlanningModificationRow): number[] {
    const ids =
      'affectedShots' in row && Array.isArray(row.affectedShots)
        ? row.affectedShots
        : 'shotId' in row && row.shotId
          ? [row.shotId]
          : 'resourceType' in row && row.resourceType === 'SHOT_CONDITIONS' && row.resourceId
            ? [row.resourceId]
            : [];
    return [...new Set(ids)].flatMap((id) => {
      const globalNumber = this.#shotNumbers().get(id);
      return globalNumber === undefined ? [] : [globalNumber];
    });
  }

  protected getAffectedShotCount(row: PlanningModificationRow): string {
    if ('affectedShots' in row && typeof row.affectedShots === 'number') return String(row.affectedShots);
    return '-';
  }

  protected getActionLabel(row: PlanningModificationRow): string {
    if ('action' in row && row.action) {
      switch (row.action) {
        case 'Alta':
          return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.ALTA';
        case 'Baja':
          return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.BAJA';
        case 'Modificación':
          return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.MODIFICACION';
      }
    }
    if ('operation' in row && row.operation) {
      const previousValue = 'oldValue' in row ? row.oldValue : 'previousValue' in row ? row.previousValue : undefined;
      if (previousValue === null) {
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.ALTA';
      }
      if (row.newValue === null) {
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.BAJA';
      }
      return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.MODIFICACION';
    }
    return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.ACTION_TYPES.MODIFICACION';
  }

  protected getActionBadgeClass(row: PlanningModificationRow): string {
    const action = 'action' in row ? row.action : undefined;
    switch (action) {
      case 'Alta':
        return 'bg-[#eff6ff] text-[#2563eb]';
      case 'Baja':
        return 'bg-red-50 text-red-600';
      case 'Modificación':
      default:
        return 'bg-[#fff7ed] text-[#ea580c]';
    }
  }

  protected getStatusLabel(row: PlanningModificationRow): string {
    if ('localOnlyReason' in row && row.localOnlyReason === 'EXECUTED_SHOT') {
      return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.EXECUTED_SHOT';
    }
    const raw = 'status' in row ? row.status : '';
    switch (raw) {
      case 'ACEPTADO':
      case 'ACCEPTED':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.ACEPTADO';
      case 'PENDIENTE':
      case 'PENDING':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.PENDIENTE';
      case 'BORRADOR':
      case 'DRAFT':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.BORRADOR';
      case 'RECHAZADO':
      case 'REJECTED':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.RECHAZADO';
      case 'LOCAL_ONLY':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.LOCAL_ONLY';
      case 'READY':
        return 'TRIAL_EXECUTION.PLANNING_MODIFICATION.STATUS.READY';
      default:
        return String(raw);
    }
  }

  protected getStatusBadgeClass(row: PlanningModificationRow): string {
    const status = 'status' in row ? row.status : '';
    switch (status) {
      case 'ACEPTADO':
      case 'ACCEPTED':
        return 'bg-[#ecfdf5] text-[#059669]';
      case 'PENDIENTE':
      case 'PENDING':
        return 'bg-[#fff1f2] text-[#e11d48]';
      case 'BORRADOR':
      case 'DRAFT':
      case 'READY':
        return 'bg-gray-100 text-gray-600';
      case 'RECHAZADO':
      case 'REJECTED':
      case 'LOCAL_ONLY':
      default:
        return 'bg-red-50 text-red-700';
    }
  }
}

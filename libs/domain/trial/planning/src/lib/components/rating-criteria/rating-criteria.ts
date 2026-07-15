import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MEASURE_UNIT_LABELS, MeasureUnitEnum } from '@intaqalab/models';
import { IntaIconComponent, NumericRangeInput } from '@intaqalab/ui';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { RatingCriteria as RatingCriteriaModel } from '../../utils-models/trial-planing-info.model';

type NumericRange = { min: number | null; max: number | null } | null;

type LocalRatingCriteriaRow = {
  useful1: NumericRange;
  useless: NumericRange;
};

type LocalRatingCriteria = {
  v0c: LocalRatingCriteriaRow;
  v0cMean: LocalRatingCriteriaRow;
  v0cStdDev: LocalRatingCriteriaRow;
  p: LocalRatingCriteriaRow;
  pMean: LocalRatingCriteriaRow;
  projectile: LocalRatingCriteriaRow;
  primer: LocalRatingCriteriaRow;
  fuse: LocalRatingCriteriaRow;
};

const createEmptyRow = (): LocalRatingCriteriaRow => ({
  useful1: { min: null, max: null },
  useless: { min: null, max: null },
});

const createEmptyLocalCriteria = (): LocalRatingCriteria => ({
  v0c: createEmptyRow(),
  v0cMean: createEmptyRow(),
  v0cStdDev: createEmptyRow(),
  p: createEmptyRow(),
  pMean: createEmptyRow(),
  projectile: createEmptyRow(),
  primer: createEmptyRow(),
  fuse: createEmptyRow(),
});

@Component({
  selector: 'inta-rating-criteria',
  imports: [TranslateModule, MatFormFieldModule, MatSelectModule, IntaIconComponent, NumericRangeInput],
  template: `
    <div class="border border-slate-200 bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div class="flex justify-between items-center flex-wrap gap-4">
        <div class="flex items-center gap-2">
          <ui-inta-icon name="file_2" size="xxl" />
          <h3 class="text-xl font-bold text-gray-900">
            {{ 'TRIAL_PLANNING.RATING_CRITERIA.TITLE' | translate }}
          </h3>
        </div>
        <div class="flex gap-4">
          <button
            type="button"
            class="self-center text-client-primary hover:text-client-primary/80 transition-colors relative"
            [attr.aria-label]="criteriaInfoTitle()"
            (mouseenter)="showTooltip = true"
            (mouseleave)="showTooltip = false"
            (click)="showTooltip = !showTooltip"
          >
            <ui-inta-icon name="info" size="lg" />
            @if (showTooltip) {
              <div
                class="absolute bottom-full right-0 mb-2 w-80 bg-slate-800 text-white rounded-lg shadow-lg p-4 text-sm z-50"
              >
                <div class="font-semibold mb-3">{{ criteriaInfoTitle() }}</div>
                <div class="space-y-2 leading-relaxed">
                  <div>{{ 'TRIAL_PLANNING.RATING_CRITERIA.INFO_TOOLTIP.RULE_1' | translate }}</div>
                  <div>{{ 'TRIAL_PLANNING.RATING_CRITERIA.INFO_TOOLTIP.RULE_2' | translate }}</div>
                  <div>{{ 'TRIAL_PLANNING.RATING_CRITERIA.INFO_TOOLTIP.RULE_3' | translate }}</div>
                </div>
                <div
                  class="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800"
                ></div>
              </div>
            }
          </button>
          <div class="flex flex-col">
            <span id="velocityLabel" class="text-xs font-medium text-slate-500 mb-1">
              {{ 'TRIAL_PLANNING.RATING_CRITERIA.VELOCITY_LABEL' | translate }}
            </span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
              <mat-select
                aria-labelledby="velocityLabel"
                [value]="selectedVelocityUnit()"
                (valueChange)="selectedVelocityUnit.set($event)"
              >
                <mat-option [value]="MeasureUnitEnum.M_S">{{ unitLabel(MeasureUnitEnum.M_S) }}</mat-option>
                <mat-option [value]="MeasureUnitEnum.KM_H">{{ unitLabel(MeasureUnitEnum.KM_H) }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="flex flex-col">
            <span id="pressureLabel" class="text-xs font-medium text-slate-500 mb-1">
              {{ 'TRIAL_PLANNING.RATING_CRITERIA.PRESSURE_LABEL' | translate }}
            </span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-28">
              <mat-select
                aria-labelledby="pressureLabel"
                [value]="selectedPressureUnit()"
                (valueChange)="selectedPressureUnit.set($event)"
              >
                <mat-option [value]="MeasureUnitEnum.BAR">{{ unitLabel(MeasureUnitEnum.BAR) }}</mat-option>
                <mat-option [value]="MeasureUnitEnum.MPA">{{ unitLabel(MeasureUnitEnum.MPA) }}</mat-option>
                <mat-option [value]="MeasureUnitEnum.KG_CM2">{{ unitLabel(MeasureUnitEnum.KG_CM2) }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
      </div>
      @if (localCriteria()) {
        <div class="overflow-x-auto border border-gray-200 rounded-xl">
          <table class="min-w-full table-fixed border-collapse text-sm">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-100">
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-600 tracking-wider w-[40%]">
                  {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.PROPERTY' | translate }}
                </th>
                <th class="py-3 px-4 text-center text-xs font-medium text-gray-600 tracking-wider w-[30%]">
                  {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USEFUL_1' | translate }}
                </th>
                <th class="py-3 px-4 text-center text-xs font-medium text-gray-600 tracking-wider w-[30%]">
                  {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USELESS' | translate }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (row of rows; track row.key) {
                <tr class="hover-row transition-colors">
                  <td class="py-3 px-4 font-medium text-slate-700 text-left">
                    {{ row.label | translate }}
                  </td>
                  <td class="py-2 px-2">
                    <ui-numeric-range-input
                      [value]="getRowRange(row.key, 'useful1')"
                      [disabled]="readonly()"
                      (valueChange)="setRowRange(row.key, 'useful1', $event)"
                    />
                  </td>
                  <td class="py-2 px-2">
                    <ui-numeric-range-input
                      [value]="getRowRange(row.key, 'useless')"
                      [disabled]="readonly()"
                      (valueChange)="setRowRange(row.key, 'useless', $event)"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .hover-row:hover {
      background-color: #f8fafc;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingCriteria {
  readonly ratingCriteria = model<RatingCriteriaModel | undefined>();
  readonly readonly = input<boolean>(false);

  readonly #translate = signal(inject(TranslateService));

  protected readonly MeasureUnitEnum = MeasureUnitEnum;
  protected readonly unitLabel = (unit: MeasureUnitEnum) => MEASURE_UNIT_LABELS[unit];
  protected showTooltip = false;

  protected readonly criteriaInfoTitle = computed(() =>
    this.#translate().instant('TRIAL_PLANNING.RATING_CRITERIA.INFO_TOOLTIP.TITLE'),
  );

  readonly selectedVelocityUnit = signal<MeasureUnitEnum.M_S | MeasureUnitEnum.KM_H>(MeasureUnitEnum.M_S);
  readonly selectedPressureUnit = signal<MeasureUnitEnum.BAR | MeasureUnitEnum.MPA | MeasureUnitEnum.KG_CM2>(
    MeasureUnitEnum.BAR,
  );

  readonly rows = [
    { key: 'v0c', label: 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.V0C' },
    { key: 'v0cMean', label: 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.V0C_MEAN' },
    { key: 'v0cStdDev', label: 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.V0C_STD_DEV' },
    { key: 'p', label: 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.P' },
    { key: 'pMean', label: 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.P_MEAN' },
    { key: 'projectile', label: 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.PROJECTILE' },
    { key: 'primer', label: 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.PRIMER' },
    { key: 'fuse', label: 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.FUSE' },
  ];

  readonly localCriteria = signal<LocalRatingCriteria | undefined>(undefined);

  constructor() {
    // Sync: base units (ratingCriteria) -> UI units (localCriteria)
    effect(() => {
      const data = this.ratingCriteria();
      if (!data) {
        this.localCriteria.set(createEmptyLocalCriteria());
        return;
      }

      const vUnit = this.selectedVelocityUnit();
      const pUnit = this.selectedPressureUnit();

      const toUiSpeed = (val: number | null | undefined): number | null => {
        if (val === null || val === undefined) return null;
        if (vUnit === MeasureUnitEnum.KM_H) return Number((val * 3.6).toFixed(6));
        return val;
      };

      const toUiPressure = (val: number | null | undefined): number | null => {
        if (val === null || val === undefined) return null;
        if (pUnit === MeasureUnitEnum.MPA) return Number((val * 0.1).toFixed(6));
        if (pUnit === MeasureUnitEnum.KG_CM2) return Number((val * 1.01972).toFixed(6));
        return val;
      };

      const passThrough = (val: number | null | undefined): number | null =>
        val === null || val === undefined ? null : val;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapRow = (row: any, convertFn: (v: any) => number | null): LocalRatingCriteriaRow => ({
        useful1: { min: convertFn(row?.useful1Min), max: convertFn(row?.useful1Max) },
        useless: { min: convertFn(row?.uselessMin), max: convertFn(row?.uselessMax) },
      });

      this.localCriteria.set({
        v0c: mapRow(data.v0c, toUiSpeed),
        v0cMean: mapRow(data.v0cMean, toUiSpeed),
        v0cStdDev: mapRow(data.v0cStdDev, toUiSpeed),
        p: mapRow(data.p, toUiPressure),
        pMean: mapRow(data.pMean, toUiPressure),
        projectile: mapRow(data.projectile, passThrough),
        primer: mapRow(data.primer, passThrough),
        fuse: mapRow(data.fuse, passThrough),
      });
    });

    // Sync: UI units (localCriteria) -> base units (ratingCriteria)
    // Fields with no value default to 0.
    effect(() => {
      const localData = this.localCriteria();
      if (!localData) return;

      const currentBase = untracked(() => this.ratingCriteria());
      const vUnit = untracked(() => this.selectedVelocityUnit());
      const pUnit = untracked(() => this.selectedPressureUnit());

      const toBaseSpeed = (val: number | null | undefined): number => {
        if (val === null || val === undefined || isNaN(val)) return 0;
        if (vUnit === MeasureUnitEnum.KM_H) return Number((val / 3.6).toFixed(6));
        return val;
      };

      const toBasePressure = (val: number | null | undefined): number => {
        if (val === null || val === undefined || isNaN(val)) return 0;
        if (pUnit === MeasureUnitEnum.MPA) return Number((val / 0.1).toFixed(6));
        if (pUnit === MeasureUnitEnum.KG_CM2) return Number((val / 1.01972).toFixed(6));
        return val;
      };

      const toBaseInt = (val: number | null | undefined): number => {
        if (val === null || val === undefined || isNaN(val)) return 0;
        return Math.round(val);
      };

      const mapRow = (
        row: LocalRatingCriteriaRow | undefined,
        convertFn: (v: number | null | undefined) => number,
      ) => ({
        useful1Min: convertFn(row?.useful1?.min),
        useful1Max: convertFn(row?.useful1?.max),
        uselessMin: convertFn(row?.useless?.min),
        uselessMax: convertFn(row?.useless?.max),
      });

      const updatedBase: RatingCriteriaModel = {
        v0c: mapRow(localData.v0c, toBaseSpeed),
        v0cMean: mapRow(localData.v0cMean, toBaseSpeed),
        v0cStdDev: mapRow(localData.v0cStdDev, toBaseSpeed),
        p: mapRow(localData.p, toBasePressure),
        pMean: mapRow(localData.pMean, toBasePressure),
        projectile: mapRow(localData.projectile, toBaseInt),
        primer: mapRow(localData.primer, toBaseInt),
        fuse: mapRow(localData.fuse, toBaseInt),
      };

      if (JSON.stringify(currentBase) !== JSON.stringify(updatedBase)) {
        this.ratingCriteria.set(updatedBase);
      }
    });
  }

  getRowRange(rowKey: string, field: 'useful1' | 'useless'): NumericRange {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.localCriteria() as any)?.[rowKey]?.[field] ?? null;
  }

  setRowRange(rowKey: string, field: 'useful1' | 'useless', value: NumericRange): void {
    const current = this.localCriteria();
    if (!current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentRow: LocalRatingCriteriaRow = (current as any)[rowKey] ?? { useful1: null, useless: null };
    this.localCriteria.set({ ...current, [rowKey]: { ...currentRow, [field]: value } } as LocalRatingCriteria);
  }
}

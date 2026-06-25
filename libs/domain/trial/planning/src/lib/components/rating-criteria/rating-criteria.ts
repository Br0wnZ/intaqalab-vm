import { ChangeDetectionStrategy, Component, effect, input, model, signal, untracked } from '@angular/core';
import { FormField, disabled, form } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@intaqalab/theme';
import { IntaIconComponent } from '@intaqalab/ui';
import { LocaleDecimalInputDirective, NoLeadingZerosDirective, NoNegativeValuesDirective } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { RatingCriteria as RatingCriteriaModel } from '../../utils-models/trial-planing-info.model';

@Component({
  selector: 'inta-rating-criteria',
  imports: [
    TranslateModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    IntaIconComponent,
    MatInputModule,
    NoNegativeValuesDirective,
    LocaleDecimalInputDirective,
    NoLeadingZerosDirective,
    FormField,
  ],
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
                <mat-option value="m/s">m/s</mat-option>
                <mat-option value="ft/s">ft/s</mat-option>
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
                <mat-option value="bar">bar</mat-option>
                <mat-option value="MPa">MPa</mat-option>
                <mat-option value="kPa">kPa</mat-option>
                <mat-option value="psi">psi</mat-option>
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
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-600 tracking-wider w-[28%]">
                  {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.PROPERTY' | translate }}
                </th>
                <th class="py-3 px-4 text-center text-xs font-medium text-gray-600 tracking-wider w-[18%]">
                  {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USEFUL_1_MIN' | translate }}
                </th>
                <th class="py-3 px-4 text-center text-xs font-medium text-gray-600 tracking-wider w-[18%]">
                  {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USEFUL_1_MAX' | translate }}
                </th>
                <th class="py-3 px-4 text-center text-xs font-medium text-gray-600 tracking-wider w-[18%]">
                  {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USELESS_MIN' | translate }}
                </th>
                <th class="py-3 px-4 text-center text-xs font-medium text-gray-600 tracking-wider w-[18%]">
                  {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USELESS_MAX' | translate }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (row of rows; track row.key) {
                <tr class="hover-row transition-colors">
                  <td class="py-3 px-4 font-medium text-slate-700 text-left">
                    {{ row.label | translate }}
                  </td>
                  <td class="py-2 px-2 text-center">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full max-w-30 small-input">
                      <input
                        matInput
                        libNoLeadingZeros
                        libNoNegativeValues
                        libLocalDecimal
                        type="text"
                        step="any"
                        class="w-full text-center disabled:bg-slate-100/50 disabled:text-slate-400 disabled:border-slate-100"
                        [disabled]="readonly()"
                        [attr.aria-label]="row.key + '-useful1Min'"
                        [formField]="getFormField(row.key, 'useful1Min')"
                      />
                    </mat-form-field>
                  </td>
                  <td class="py-2 px-2 text-center">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full max-w-30 small-input">
                      <input
                        matInput
                        libNoLeadingZeros
                        libNoNegativeValues
                        libLocalDecimal
                        type="text"
                        step="any"
                        class="w-full text-center disabled:bg-slate-100/50 disabled:text-slate-400 disabled:border-slate-100"
                        [disabled]="readonly()"
                        [attr.aria-label]="row.key + '-useful1Max'"
                        [formField]="getFormField(row.key, 'useful1Max')"
                      />
                    </mat-form-field>
                  </td>
                  <td class="py-2 px-2 text-center">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full max-w-30 small-input">
                      <input
                        matInput
                        libNoLeadingZeros
                        libNoNegativeValues
                        libLocalDecimal
                        type="text"
                        step="any"
                        class="w-full text-center disabled:bg-slate-100/50 disabled:text-slate-400 disabled:border-slate-100"
                        [disabled]="readonly()"
                        [attr.aria-label]="row.key + '-uselessMin'"
                        [formField]="getFormField(row.key, 'uselessMin')"
                      />
                    </mat-form-field>
                  </td>
                  <td class="py-2 px-2 text-center">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full max-w-30 small-input">
                      <input
                        matInput
                        libNoLeadingZeros
                        libNoNegativeValues
                        libLocalDecimal
                        type="text"
                        step="any"
                        class="w-full text-center disabled:bg-slate-100/50 disabled:text-slate-400 disabled:border-slate-100"
                        [disabled]="readonly()"
                        [attr.aria-label]="row.key + '-uselessMax'"
                        [formField]="getFormField(row.key, 'uselessMax')"
                      />
                    </mat-form-field>
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

  readonly selectedVelocityUnit = signal<'m/s' | 'ft/s'>('m/s');
  readonly selectedPressureUnit = signal<'bar' | 'MPa' | 'kPa' | 'psi'>('bar');

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

  readonly localCriteria = signal<RatingCriteriaModel | undefined>(undefined);
  readonly criteriaForm = form(this.localCriteria, (f) => {
    const isReadonly = () => this.readonly();
    this.rows.forEach((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = (f as Record<string, any>)[row.key];
      disabled(r.useful1Min, isReadonly);
      disabled(r.useful1Max, isReadonly);
      disabled(r.uselessMin, isReadonly);
      disabled(r.uselessMax, isReadonly);
    });
  });

  constructor() {
    // Sync: base units (ratingCriteria) -> UI units (localCriteria)
    effect(() => {
      const data = this.ratingCriteria();
      if (!data) {
        this.localCriteria.set(undefined);
        return;
      }

      const vUnit = this.selectedVelocityUnit();
      const pUnit = this.selectedPressureUnit();

      const toUiSpeed = (val: number | null | undefined): number | null => {
        if (val === null || val === undefined) return null;
        if (vUnit === 'ft/s') return Number((val * 3.28084).toFixed(6));
        return val;
      };

      const toUiPressure = (val: number | null | undefined): number | null => {
        if (val === null || val === undefined) return null;
        if (pUnit === 'MPa') return Number((val * 0.1).toFixed(6));
        if (pUnit === 'kPa') return Number((val * 100).toFixed(6));
        if (pUnit === 'psi') return Number((val * 14.50377).toFixed(6));
        return val;
      };

      const passThrough = (val: number | null | undefined): number | null => {
        if (val === null || val === undefined) return null;
        return val;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapRow = (row: any, convertFn: (v: any) => number | null) => ({
        useful1Min: convertFn(row?.useful1Min),
        useful1Max: convertFn(row?.useful1Max),
        uselessMin: convertFn(row?.uselessMin),
        uselessMax: convertFn(row?.uselessMax),
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
    effect(() => {
      const localData = this.localCriteria();
      if (!localData) return;

      const currentBase = untracked(() => this.ratingCriteria());
      const vUnit = untracked(() => this.selectedVelocityUnit());
      const pUnit = untracked(() => this.selectedPressureUnit());

      const toBaseSpeed = (val: number | null | undefined): number | null => {
        if (val === null || val === undefined || isNaN(val)) return null;
        if (vUnit === 'ft/s') return Number((val / 3.28084).toFixed(6));
        return val;
      };

      const toBasePressure = (val: number | null | undefined): number | null => {
        if (val === null || val === undefined || isNaN(val)) return null;
        if (pUnit === 'MPa') return Number((val / 0.1).toFixed(6));
        if (pUnit === 'kPa') return Number((val / 100).toFixed(6));
        if (pUnit === 'psi') return Number((val / 14.50377).toFixed(6));
        return val;
      };

      const toBaseInt = (val: number | null | undefined): number | null => {
        if (val === null || val === undefined || isNaN(val)) return null;
        return Math.round(val);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapRow = (row: any, convertFn: (v: any) => number | null) => ({
        useful1Min: convertFn(row?.useful1Min),
        useful1Max: convertFn(row?.useful1Max),
        uselessMin: convertFn(row?.uselessMin),
        uselessMax: convertFn(row?.uselessMax),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFormField(rowKey: string, field: string): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.criteriaForm as any)?.[rowKey]?.[field];
  }
}

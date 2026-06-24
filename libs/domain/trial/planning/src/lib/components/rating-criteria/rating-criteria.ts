import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

import type { RatingCriteria as RatingCriteriaModel } from '../../utils-models/trial-planing-info.model';

@Component({
  selector: 'inta-rating-criteria',
  imports: [TranslateModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <div class="border border-slate-200 bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div class="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <mat-icon class="text-slate-600">assignment</mat-icon>
          <h3 class="text-lg font-semibold text-slate-800">
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
      <div class="overflow-x-auto">
        <table class="min-w-full table-fixed border-collapse text-sm">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="py-3 px-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[28%]">
                {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.PROPERTY' | translate }}
              </th>
              <th class="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">
                {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USEFUL_1_MIN' | translate }}
              </th>
              <th class="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">
                {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USEFUL_1_MAX' | translate }}
              </th>
              <th class="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">
                {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USELESS_MIN' | translate }}
              </th>
              <th class="py-3 px-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">
                {{ 'TRIAL_PLANNING.RATING_CRITERIA.COLUMNS.USELESS_MAX' | translate }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (row of convertedRows(); track row.key) {
              <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="py-3 px-4 font-medium text-slate-700 text-left">
                  {{ row.label | translate }}
                </td>
                <td class="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="any"
                    class="w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-700 bg-slate-50/30 hover:bg-white focus:bg-white disabled:bg-slate-100/50 disabled:text-slate-400 disabled:border-slate-100"
                    [disabled]="readonly()"
                    [attr.aria-label]="row.key + '-useful1Min'"
                    [value]="row.useful1Min !== null ? row.useful1Min : ''"
                    (input)="updateValue(row.key, 'useful1Min', $event)"
                  />
                </td>
                <td class="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="any"
                    class="w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-700 bg-slate-50/30 hover:bg-white focus:bg-white disabled:bg-slate-100/50 disabled:text-slate-400 disabled:border-slate-100"
                    [disabled]="readonly()"
                    [attr.aria-label]="row.key + '-useful1Max'"
                    [value]="row.useful1Max !== null ? row.useful1Max : ''"
                    (input)="updateValue(row.key, 'useful1Max', $event)"
                  />
                </td>
                <td class="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="any"
                    class="w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-700 bg-slate-50/30 hover:bg-white focus:bg-white disabled:bg-slate-100/50 disabled:text-slate-400 disabled:border-slate-100"
                    [disabled]="readonly()"
                    [attr.aria-label]="row.key + '-uselessMin'"
                    [value]="row.uselessMin !== null ? row.uselessMin : ''"
                    (input)="updateValue(row.key, 'uselessMin', $event)"
                  />
                </td>
                <td class="py-2 px-2 text-center">
                  <input
                    type="number"
                    step="any"
                    class="w-full text-center px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-700 bg-slate-50/30 hover:bg-white focus:bg-white disabled:bg-slate-100/50 disabled:text-slate-400 disabled:border-slate-100"
                    [disabled]="readonly()"
                    [attr.aria-label]="row.key + '-uselessMax'"
                    [value]="row.uselessMax !== null ? row.uselessMax : ''"
                    (input)="updateValue(row.key, 'uselessMax', $event)"
                  />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingCriteria {
  readonly ratingCriteria = model<RatingCriteriaModel | undefined>();
  readonly readonly = input<boolean>(false);

  readonly selectedVelocityUnit = signal<'m/s' | 'ft/s'>('m/s');
  readonly selectedPressureUnit = signal<'bar' | 'MPa' | 'kPa' | 'psi'>('bar');

  readonly convertedRows = computed(() => {
    const data = this.ratingCriteria();
    if (!data) return [];

    const vUnit = this.selectedVelocityUnit();
    const pUnit = this.selectedPressureUnit();

    const convertSpeed = (val: number | null | undefined): number | null => {
      if (val === null || val === undefined) return null;
      if (vUnit === 'ft/s') {
        return val * 3.28084;
      }
      return val;
    };

    const convertPressure = (val: number | null | undefined): number | null => {
      if (val === null || val === undefined) return null;
      if (pUnit === 'MPa') {
        return val * 0.1;
      }
      if (pUnit === 'kPa') {
        return val * 100;
      }
      if (pUnit === 'psi') {
        return val * 14.50377;
      }
      return val;
    };

    const passThrough = (val: number | null | undefined): number | null => {
      if (val === null || val === undefined) return null;
      return val;
    };

    const mapRow = (
      key: string,
      label: string,
      row:
        | {
            useful1Min?: number | null;
            useful1Max?: number | null;
            uselessMin?: number | null;
            uselessMax?: number | null;
          }
        | undefined,
      convertFn: (val: number | null | undefined) => number | null,
    ) => {
      return {
        key,
        label,
        useful1Min: convertFn(row?.useful1Min),
        useful1Max: convertFn(row?.useful1Max),
        uselessMin: convertFn(row?.uselessMin),
        uselessMax: convertFn(row?.uselessMax),
      };
    };

    return [
      mapRow('v0c', 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.V0C', data.v0c, convertSpeed),
      mapRow('v0cMean', 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.V0C_MEAN', data.v0cMean, convertSpeed),
      mapRow('v0cStdDev', 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.V0C_STD_DEV', data.v0cStdDev, convertSpeed),
      mapRow('p', 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.P', data.p, convertPressure),
      mapRow('pMean', 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.P_MEAN', data.pMean, convertPressure),
      mapRow('projectile', 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.PROJECTILE', data.projectile, passThrough),
      mapRow('primer', 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.PRIMER', data.primer, passThrough),
      mapRow('fuse', 'TRIAL_PLANNING.RATING_CRITERIA.PROPERTIES.FUSE', data.fuse, passThrough),
    ];
  });

  updateValue(rowKey: string, field: string, event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const rawVal = inputEl.value === '' ? null : Number(inputEl.value);

    // Convert rawVal from current UI unit to base unit
    const baseVal = this.#convertToBaseUnit(rowKey, rawVal);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (this.ratingCriteria() ?? {}) as Record<string, any>;
    const currentRow = current[rowKey] ?? {};

    const updatedRow = {
      ...currentRow,
      [field]: baseVal,
    };

    const updatedCriteria = {
      ...current,
      [rowKey]: updatedRow,
    } as RatingCriteriaModel;

    this.ratingCriteria.set(updatedCriteria);
  }

  #convertToBaseUnit(rowKey: string, val: number | null): number | null {
    if (val === null) return null;

    if (rowKey === 'v0c' || rowKey === 'v0cMean' || rowKey === 'v0cStdDev') {
      const vUnit = this.selectedVelocityUnit();
      if (vUnit === 'ft/s') {
        return val / 3.28084;
      }
      return val;
    }

    if (rowKey === 'p' || rowKey === 'pMean') {
      const pUnit = this.selectedPressureUnit();
      if (pUnit === 'MPa') {
        return val / 0.1;
      }
      if (pUnit === 'kPa') {
        return val / 100;
      }
      if (pUnit === 'psi') {
        return val / 14.50377;
      }
      return val;
    }

    // Integers: projectile, fuse, primer
    return Math.round(val);
  }
}

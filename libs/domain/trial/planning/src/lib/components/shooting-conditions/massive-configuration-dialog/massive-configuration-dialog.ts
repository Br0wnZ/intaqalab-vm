import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, FormRoot, apply, form, max, required, submit, validate } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SHOT_CONDITIONS_UNIT_OPTIONS } from '@intaqalab/models';
import { MatButtonModule, MatFormFieldModule, MatIconModule } from '@intaqalab/theme';
import { InputSelect, InputSelectInput, IntaIconComponent, MatSelectClearable, ValueTooltip } from '@intaqalab/ui';
import {
  IntaDatePipe,
  LocaleDecimalInputDirective,
  NoNegativeValuesDirective,
  boundedNumberSchema,
} from '@intaqalab/utils';
import { TranslatePipe } from '@ngx-translate/core';

import type { Serie, ShootingConditionsUnits, UpdateShot } from '../../../models/shooting-conditions.model';
import { MAX_ANGULAR_VALUE, MAX_DISTANCE_VALUE, MAX_WEIGHT_VALUE } from '../../../models/shooting-conditions.model';
import { ShootingConditionsService } from '../../../services/shooting-conditions.service';

interface BulkConfig {
  series: string[];
  date: string;
  targetType: string;
  material: string;
  impactZone: string;
  dimensions: string;
  thickness: string;
  distance: { value: number | null; unit: string };
  targetInclination: { value: number | null; unit: string };
  orientation: { value: number | null; unit: string };
  elevation: { value: number | null; unit: string };
  angle: { value: number | null; unit: string };
  range: { value: number | null; unit: string };
  functioningHeight: { value: number | null; unit: string };
  powderWeight: { value: number | null; unit: string };
  projectileWeight: { value: number | null; unit: string };
  nominalSpeed: { value: number | null; unit: string };
}

interface DialogData {
  series: Serie[];
  trialId: string;
}

@Component({
  selector: 'inta-massive-configuration-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSelectClearable,
    MatIconModule,
    ValueTooltip,
    FormField,
    FormRoot,
    IntaIconComponent,
    IntaDatePipe,
    TranslatePipe,
    InputSelect,
    InputSelectInput,
    NoNegativeValuesDirective,
    LocaleDecimalInputDirective,
  ],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      <h2 class="text-xl font-bold text-slate-800 m-0">
        {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TITLE' | translate }}
      </h2>
    </h2>
    <form class="contents" [formRoot]="bulkForm">
      <mat-dialog-content>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
          <div class="flex flex-col gap-1">
            <label for="bulk-series" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.SERIES_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <mat-select
                id="bulk-series"
                clearable
                multiple
                [placeholder]="
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.SERIES_PLACEHOLDER' | translate
                "
                [formField]="bulkForm.series"
              >
                @for (serie of data.series; track serie.seriesId) {
                  <mat-option [value]="serie.seriesId">{{ serie.seriesName }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-date" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.DATE_LABEL' | translate }}
            </label>
            <mat-form-field uiValueTooltip appearance="outline" [subscriptSizing]="'dynamic'">
              <mat-select
                id="bulk-date"
                clearable
                [placeholder]="
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.DATE_PLACEHOLDER' | translate
                "
                [formField]="bulkForm.date"
              >
                @for (schedule of shootingConditionsService.getTrialSchedulesResource.value(); track schedule.date) {
                  <mat-option class="truncate" [value]="schedule.date">
                    <span class="truncate">{{ schedule.date | intaDate }}</span>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-impact" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.IMPACT_ZONE_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
              <mat-select
                id="bulk-impact"
                clearable
                [placeholder]="
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.IMPACT_ZONE_PLACEHOLDER' | translate
                "
                [formField]="bulkForm.impactZone"
              >
                @for (impactZone of shootingConditionsService.getImpactZonesResource.value(); track impactZone.id) {
                  <mat-option [value]="impactZone.id">{{ impactZone.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-orient" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ORIENTATION_LABEL' | translate }}
            </label>
            <ui-input-select
              placeholder="0"
              label="{{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ORIENTATION_LABEL' | translate
              }}"
              [opciones]="unitOptions.orientation"
              [showLabel]="false"
              [value]="configModel().orientation"
              (valueChange)="onFieldChange('orientation', $event)"
            >
              <input id="bulk-orient" inputSelectInput libNoNegativeValues />
            </ui-input-select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-elev" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ELEVATION_LABEL' | translate }}
            </label>
            <ui-input-select
              placeholder="0"
              label="{{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ELEVATION_LABEL' | translate
              }}"
              [opciones]="unitOptions.elevation"
              [showLabel]="false"
              [value]="configModel().elevation"
              (valueChange)="onFieldChange('elevation', $event)"
            >
              <input id="bulk-elev" inputSelectInput libNoNegativeValues />
            </ui-input-select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-angle" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ANGLE_LABEL' | translate }}
            </label>
            <ui-input-select
              placeholder="0"
              label="{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ANGLE_LABEL' | translate }}"
              [opciones]="unitOptions.angle"
              [showLabel]="false"
              [value]="configModel().angle"
              (valueChange)="onFieldChange('angle', $event)"
            >
              <input id="bulk-angle" inputSelectInput libNoNegativeValues libLocalDecimal />
            </ui-input-select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-range" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.RANGE_LABEL' | translate }}
            </label>
            <ui-input-select
              placeholder="0"
              label="{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.RANGE_LABEL' | translate }}"
              [opciones]="unitOptions.range"
              [showLabel]="false"
              [value]="configModel().range"
              (valueChange)="onFieldChange('range', $event)"
            >
              <input id="bulk-range" inputSelectInput libNoNegativeValues />
            </ui-input-select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-height" class="text-xs font-bold text-slate-700 ml-1">
              {{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.FUNCTIONING_HEIGHT_LABEL' | translate
              }}
            </label>
            <ui-input-select
              placeholder="0"
              label="{{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.FUNCTIONING_HEIGHT_LABEL' | translate
              }}"
              [opciones]="unitOptions.functioningHeight"
              [showLabel]="false"
              [value]="configModel().functioningHeight"
              (valueChange)="onFieldChange('functioningHeight', $event)"
            >
              <input id="bulk-height" inputSelectInput libNoNegativeValues />
            </ui-input-select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-powder" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.POWDER_WEIGHT_LABEL' | translate }}
            </label>
            <ui-input-select
              placeholder="0"
              label="{{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.POWDER_WEIGHT_LABEL' | translate
              }}"
              [opciones]="unitOptions.powderWeight"
              [showLabel]="false"
              [value]="configModel().powderWeight"
              (valueChange)="onFieldChange('powderWeight', $event)"
            >
              <input id="bulk-powder" inputSelectInput libNoNegativeValues />
            </ui-input-select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-proj" class="text-xs font-bold text-slate-700 ml-1">
              {{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.PROJECTILE_WEIGHT_LABEL' | translate
              }}
            </label>
            <ui-input-select
              placeholder="0"
              label="{{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.PROJECTILE_WEIGHT_LABEL' | translate
              }}"
              [opciones]="unitOptions.projectileWeight"
              [showLabel]="false"
              [value]="configModel().projectileWeight"
              (valueChange)="onFieldChange('projectileWeight', $event)"
            >
              <input id="bulk-proj" inputSelectInput libNoNegativeValues />
            </ui-input-select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-speed" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.NOMINAL_SPEED_LABEL' | translate }}
            </label>
            <ui-input-select
              placeholder="0"
              label="{{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.NOMINAL_SPEED_LABEL' | translate
              }}"
              [opciones]="unitOptions.nominalSpeed"
              [showLabel]="false"
              [value]="configModel().nominalSpeed"
              (valueChange)="onFieldChange('nominalSpeed', $event)"
            >
              <input id="bulk-speed" inputSelectInput libNoNegativeValues />
            </ui-input-select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="bulk-target" class="text-xs font-bold text-slate-700 ml-1">
              {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
              <mat-select
                id="bulk-target"
                clearable
                [placeholder]="
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_PLACEHOLDER' | translate
                "
                [formField]="bulkForm.targetType"
              >
                @for (targetType of shootingConditionsService.getTargetTypesResource.value(); track targetType.id) {
                  <mat-option [value]="targetType.id">{{ targetType.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          @if (hasTargetSelected()) {
            <div class="flex flex-col gap-1">
              <label for="bulk-material" class="text-xs font-bold text-slate-700 ml-1">
                {{
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_MATERIAL_LABEL' | translate
                }}
              </label>
              <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                <mat-select
                  id="bulk-material"
                  clearable
                  [placeholder]="
                    'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_MATERIAL_PLACEHOLDER'
                      | translate
                  "
                  [formField]="bulkForm.material"
                >
                  @for (
                    targetMaterial of shootingConditionsService.getTargetMaterialsResource.value();
                    track targetMaterial.id
                  ) {
                    <mat-option [value]="targetMaterial.id">{{ targetMaterial.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="flex flex-col gap-1">
              <label for="bulk-dims" class="text-xs font-bold text-slate-700 ml-1">
                {{
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_DIMENSIONS_LABEL' | translate
                }}
              </label>
              <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                <mat-select
                  id="bulk-dims"
                  clearable
                  [placeholder]="
                    'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_DIMENSIONS_PLACEHOLDER'
                      | translate
                  "
                  [formField]="bulkForm.dimensions"
                >
                  @for (
                    targetDimension of shootingConditionsService.getTargetDimensionsResource.value();
                    track targetDimension.id
                  ) {
                    <mat-option [value]="targetDimension.id">{{ targetDimension.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="flex flex-col gap-1">
              <label for="bulk-thick" class="text-xs font-bold text-slate-700 ml-1">
                {{
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_THICKNESS_LABEL' | translate
                }}
              </label>
              <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                <mat-select
                  id="bulk-thick"
                  clearable
                  [placeholder]="
                    'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_THICKNESS_PLACEHOLDER'
                      | translate
                  "
                  [formField]="bulkForm.thickness"
                >
                  @for (
                    targetThickness of shootingConditionsService.getTargetThicknessesResource.value();
                    track targetThickness.id
                  ) {
                    <mat-option [value]="targetThickness.id">{{ targetThickness.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="flex flex-col gap-1">
              <label for="bulk-dist" class="text-xs font-bold text-slate-700 ml-1">
                {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.DISTANCE_LABEL' | translate }}
              </label>
              <ui-input-select
                placeholder="0"
                label="{{
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.DISTANCE_LABEL' | translate
                }}"
                [opciones]="unitOptions.distance"
                [showLabel]="false"
                [value]="configModel().distance"
                (valueChange)="onFieldChange('distance', $event)"
              >
                <input id="bulk-dist" inputSelectInput libNoNegativeValues />
              </ui-input-select>
            </div>

            <div class="flex flex-col gap-1">
              <label for="bulk-inclination" class="text-xs font-bold text-slate-700 ml-1">
                {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.INCLINATION_LABEL' | translate }}
              </label>
              <ui-input-select
                placeholder="0"
                label="{{
                  'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.INCLINATION_LABEL' | translate
                }}"
                [opciones]="unitOptions.targetInclination"
                [showLabel]="false"
                [value]="configModel().targetInclination"
                (valueChange)="onFieldChange('targetInclination', $event)"
              >
                <input id="bulk-inclination" inputSelectInput libNoNegativeValues />
              </ui-input-select>
            </div>
          }
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="!flex !justify-center gap-4 !pb-6">
        <button type="submit" mat-flat-button [disabled]="isUpdating() || bulkForm().invalid()">
          {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON' | translate }}
        </button>
        <button type="button" mat-stroked-button mat-dialog-close>
          {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.CANCEL_BUTTON' | translate }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-template-rows: auto 1fr auto;
        height: 100%;
        overflow: hidden;
      }
      mat-dialog-content {
        overflow-y: auto;
        min-height: 0;
        max-height: none !important;
      }
    `,
  ],
})
export class MassiveConfigurationDialog {
  readonly shootingConditionsService = inject(ShootingConditionsService);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<MassiveConfigurationDialog>);
  readonly #applyConfirmed = signal(false);
  readonly isUpdating = computed(() => this.shootingConditionsService.updateConditionsResource.isLoading());

  readonly unitOptions = SHOT_CONDITIONS_UNIT_OPTIONS;

  readonly hasTargetSelected = computed(() => !!this.configModel().targetType);

  readonly configModel = signal<BulkConfig>({
    series: [],
    date: '',
    targetType: '',
    material: '',
    impactZone: '',
    dimensions: '',
    thickness: '',
    distance: { value: null, unit: '' },
    targetInclination: { value: null, unit: '' },
    orientation: { value: null, unit: '' },
    elevation: { value: null, unit: '' },
    angle: { value: null, unit: '' },
    range: { value: null, unit: '' },
    functioningHeight: { value: null, unit: '' },
    powderWeight: { value: null, unit: '' },
    projectileWeight: { value: null, unit: '' },
    nominalSpeed: { value: null, unit: '' },
  });

  readonly bulkForm = form(
    this.configModel,
    (f) => {
      apply(f.orientation.value, boundedNumberSchema(0, MAX_ANGULAR_VALUE));
      apply(f.elevation.value, boundedNumberSchema(0, MAX_ANGULAR_VALUE));
      apply(f.angle.value, boundedNumberSchema(0, MAX_ANGULAR_VALUE));
      apply(f.targetInclination.value, boundedNumberSchema(0, MAX_ANGULAR_VALUE));
      max(f.distance.value, MAX_DISTANCE_VALUE);
      max(f.range.value, MAX_DISTANCE_VALUE);
      max(f.functioningHeight.value, MAX_DISTANCE_VALUE);
      max(f.powderWeight.value, MAX_WEIGHT_VALUE);
      max(f.projectileWeight.value, MAX_WEIGHT_VALUE);
      max(f.nominalSpeed.value, MAX_DISTANCE_VALUE);

      validate(f.series, ({ value }) => {
        const selected = value();
        return !selected || selected.length === 0
          ? { kind: 'required-series', message: 'Debe haber al menos una serie seleccionada' }
          : undefined;
      });
      required(f.impactZone);
    },
    {
      submission: {
        action: async () => {
          this.#applyConfiguration();
        },
      },
    },
  );

  constructor() {
    const units = this.shootingConditionsService.conditionsResource.value()?.units;
    this.configModel.set({
      series: [],
      date: '',
      targetType: '',
      material: '',
      impactZone: '',
      dimensions: '',
      thickness: '',
      distance: { value: null, unit: units?.distance ?? 'M' },
      targetInclination: { value: null, unit: units?.targetInclination ?? 'DEGREES' },
      orientation: { value: null, unit: units?.orientation ?? 'DEGREES' },
      elevation: { value: null, unit: units?.elevation ?? 'DEGREES' },
      angle: { value: null, unit: units?.angle ?? 'DEGREES' },
      range: { value: null, unit: units?.range ?? 'M' },
      functioningHeight: { value: null, unit: units?.functioningHeight ?? 'M' },
      powderWeight: { value: null, unit: units?.powderWeight ?? 'KG' },
      projectileWeight: { value: null, unit: units?.projectileWeight ?? 'KG' },
      nominalSpeed: { value: null, unit: units?.nominalSpeed ?? 'M_S' },
    });

    effect(() => {
      const status = this.shootingConditionsService.updateConditionsResource.status();
      if (this.#applyConfirmed() && status === 'resolved') {
        this.dialogRef.close(true);
      }
    });
  }

  onFieldChange(field: keyof BulkConfig, change: { value: number | null; unit: string } | null): void {
    if (!change) return;
    this.configModel.update((config) => ({
      ...config,
      [field]: change,
    }));
  }

  async apply(): Promise<void> {
    await submit(this.bulkForm);
  }

  #applyConfiguration(): void {
    const config = this.configModel();
    const selectedSeriesIds = new Set(config.series);

    const override: Partial<UpdateShot> = {};
    if (config.date) override.date = config.date;
    if (config.targetType) override.targetTypeId = config.targetType;
    if (config.material) override.targetMaterialId = config.material;
    if (config.impactZone) override.impactZoneId = config.impactZone;
    if (config.dimensions) override.targetDimensionsId = config.dimensions;
    if (config.thickness) override.targetThicknessId = config.thickness;
    if (config.distance.value !== null) {
      override.distance = config.distance.value;
      override.distanceUnit = config.distance.unit;
    }
    if (config.targetInclination.value !== null) {
      override.targetInclination = config.targetInclination.value;
      override.targetInclinationUnit = config.targetInclination.unit;
    }
    if (config.orientation.value !== null) {
      override.orientation = config.orientation.value;
      override.orientationUnit = config.orientation.unit;
    }
    if (config.elevation.value !== null) {
      override.elevation = config.elevation.value;
      override.elevationUnit = config.elevation.unit;
    }
    if (config.angle.value !== null) {
      override.angle = config.angle.value;
      override.angleUnit = config.angle.unit;
    }
    if (config.range.value !== null) {
      override.range = config.range.value;
      override.rangeUnit = config.range.unit;
    }
    if (config.functioningHeight.value !== null) {
      override.functioningHeight = config.functioningHeight.value;
      override.functioningHeightUnit = config.functioningHeight.unit;
    }
    if (config.powderWeight.value !== null) {
      override.powderWeight = config.powderWeight.value;
      override.powderWeightUnit = config.powderWeight.unit;
    }
    if (config.projectileWeight.value !== null) {
      override.projectileWeight = config.projectileWeight.value;
      override.projectileWeightUnit = config.projectileWeight.unit;
    }
    if (config.nominalSpeed.value !== null) {
      override.nominalSpeed = config.nominalSpeed.value;
      override.nominalSpeedUnit = config.nominalSpeed.unit;
    }

    const shotsById = new Map<string, UpdateShot>();
    for (const serie of this.data.series) {
      if (!selectedSeriesIds.has(serie.seriesId)) continue;
      for (const shot of serie.shots) {
        if (!shot.shotId) continue;
        const { globalNumber, ...rest } = shot;
        const updatedShot: UpdateShot = { ...rest, ...override, shotId: shot.shotId };
        if (!updatedShot.targetTypeId) {
          updatedShot.targetMaterialId = '';
          updatedShot.targetDimensionsId = '';
          updatedShot.targetThicknessId = '';
          updatedShot.distance = 0;
          updatedShot.targetInclination = 0;
        }
        shotsById.set(shot.shotId, updatedShot);
      }
    }

    const shots = Array.from(shotsById.values());

    const units: ShootingConditionsUnits = {
      distance: (config.distance.unit as ShootingConditionsUnits['distance']) ?? null,
      orientation: (config.orientation.unit as ShootingConditionsUnits['orientation']) ?? null,
      targetInclination: (config.targetInclination.unit as ShootingConditionsUnits['targetInclination']) ?? null,
      elevation: (config.elevation.unit as ShootingConditionsUnits['elevation']) ?? null,
      angle: (config.angle.unit as ShootingConditionsUnits['angle']) ?? null,
      range: (config.range.unit as ShootingConditionsUnits['range']) ?? null,
      functioningHeight: (config.functioningHeight.unit as ShootingConditionsUnits['functioningHeight']) ?? null,
      nominalSpeed: (config.nominalSpeed.unit as ShootingConditionsUnits['nominalSpeed']) ?? null,
      powderWeight: (config.powderWeight.unit as ShootingConditionsUnits['powderWeight']) ?? null,
      projectileWeight: (config.projectileWeight.unit as ShootingConditionsUnits['projectileWeight']) ?? null,
    };

    this.#applyConfirmed.set(true);
    this.shootingConditionsService.updateShootingConditions({
      trialId: this.data.trialId,
      units,
      shots,
    });
  }
}

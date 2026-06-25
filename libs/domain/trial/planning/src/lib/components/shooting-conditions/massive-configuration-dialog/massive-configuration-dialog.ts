import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SHOT_CONDITIONS_UNIT_OPTIONS } from '@intaqalab/models';
import { MatButtonModule, MatFormFieldModule, MatIconModule } from '@intaqalab/theme';
import { InputSelect, InputSelectInput, IntaIconComponent } from '@intaqalab/ui';
import {
  IntaDatePipe,
  LocaleDecimalInputDirective,
  NoLeadingZerosDirective,
  NoNegativeValuesDirective,
} from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../../+state/planning-general-data.store';
import type { Serie, ShootingConditionsUnits, UpdateShot } from '../../../models/shooting-conditions.model';
import { ShootingConditionsService } from '../../../services/shooting-conditions.service';

interface BulkConfig {
  series: string[];
  date: string;
  targetType: string;
  material: string;
  impactZone: string;
  dimensions: string;
  thickness: string;
  distance: { value: string; unit: string };
  targetInclination: { value: string; unit: string };
  orientation: { value: string; unit: string };
  elevation: { value: string; unit: string };
  angle: { value: string; unit: string };
  range: { value: string; unit: string };
  functioningHeight: { value: string; unit: string };
  powderWeight: { value: string; unit: string };
  projectileWeight: { value: string; unit: string };
  nominalSpeed: { value: string; unit: string };
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
    MatIconModule,
    MatTooltipModule,
    FormField,
    IntaIconComponent,
    IntaDatePipe,
    TranslateModule,
    InputSelect,
    InputSelectInput,
    NoNegativeValuesDirective,
    NoLeadingZerosDirective,
    LocaleDecimalInputDirective,
  ],
  providers: [PlanningGeneralDataStore],
  template: `
    <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
      <ui-inta-icon name="edit" size="xxl" />
      <h2 class="text-xl font-bold text-slate-800 m-0">
        {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TITLE' | translate }}
      </h2>
    </h2>
    <mat-dialog-content>
      <div class="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
        <div class="flex flex-col gap-1">
          <label for="bulk-series" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.SERIES_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select
              id="bulk-series"
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
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select
              id="bulk-date"
              [placeholder]="
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.DATE_PLACEHOLDER' | translate
              "
              [formField]="bulkForm.date"
            >
              @for (schedule of shootingConditionsService.getTrialSchedulesResource.value(); track schedule.date) {
                <mat-option
                  class="truncate"
                  [value]="schedule.date"
                  [matTooltip]="schedule.date | intaDate"
                  [matTooltipDisabled]="(schedule.date | intaDate)!.length <= 20"
                >
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
              [placeholder]="
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_MATERIAL_PLACEHOLDER'
                  | translate
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
          <label for="bulk-target" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select
              id="bulk-target"
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

        <div class="flex flex-col gap-1">
          <label for="bulk-material" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_MATERIAL_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select
              id="bulk-material"
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
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_DIMENSIONS_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select
              id="bulk-dims"
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
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.TARGET_THICKNESS_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select
              id="bulk-thick"
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
            label="{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.DISTANCE_LABEL' | translate }}"
            [opciones]="unitOptions.distance"
            [showLabel]="false"
            [value]="configModel().distance"
            (valueChange)="onFieldChange('distance', $event)"
          >
            <input id="bulk-dist" inputSelectInput libNoNegativeValues libNoLeadingZeros />
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
            <input id="bulk-inclination" inputSelectInput libNoLeadingZeros />
          </ui-input-select>
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
            <input id="bulk-orient" inputSelectInput libNoLeadingZeros />
          </ui-input-select>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-elev" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ELEVATION_LABEL' | translate }}
          </label>
          <ui-input-select
            placeholder="0"
            label="{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ELEVATION_LABEL' | translate }}"
            [opciones]="unitOptions.elevation"
            [showLabel]="false"
            [value]="configModel().elevation"
            (valueChange)="onFieldChange('elevation', $event)"
          >
            <input id="bulk-elev" inputSelectInput libNoLeadingZeros />
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
            <input id="bulk-angle" inputSelectInput libNoLeadingZeros libLocalDecimal />
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
            <input id="bulk-range" inputSelectInput libNoNegativeValues libNoLeadingZeros />
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
            <input id="bulk-height" inputSelectInput libNoNegativeValues libNoLeadingZeros />
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
            <input id="bulk-powder" inputSelectInput libNoNegativeValues libNoLeadingZeros />
          </ui-input-select>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-proj" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.PROJECTILE_WEIGHT_LABEL' | translate }}
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
            <input id="bulk-proj" inputSelectInput libNoNegativeValues libNoLeadingZeros />
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
            <input id="bulk-speed" inputSelectInput libNoNegativeValues libNoLeadingZeros />
          </ui-input-select>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="!flex !justify-center gap-4 !pb-6">
      <button mat-flat-button [disabled]="isUpdating() || bulkForm().invalid()" (click)="apply()">
        {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.APPLY_BUTTON' | translate }}
      </button>
      <button mat-stroked-button mat-dialog-close>
        {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.CANCEL_BUTTON' | translate }}
      </button>
    </mat-dialog-actions>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MassiveConfigurationDialog {
  readonly shootingConditionsService = inject(ShootingConditionsService);
  protected readonly store = inject(PlanningGeneralDataStore);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<MassiveConfigurationDialog>);
  readonly #applyConfirmed = signal(false);
  readonly isUpdating = computed(() => this.shootingConditionsService.updateConditionsResource.isLoading());

  readonly unitOptions = SHOT_CONDITIONS_UNIT_OPTIONS;

  readonly configModel = signal<BulkConfig>({
    series: [],
    date: '',
    targetType: '',
    material: '',
    impactZone: '',
    dimensions: '',
    thickness: '',
    distance: { value: '', unit: '' },
    targetInclination: { value: '', unit: '' },
    orientation: { value: '', unit: '' },
    elevation: { value: '', unit: '' },
    angle: { value: '', unit: '' },
    range: { value: '', unit: '' },
    functioningHeight: { value: '', unit: '' },
    powderWeight: { value: '', unit: '' },
    projectileWeight: { value: '', unit: '' },
    nominalSpeed: { value: '', unit: '' },
  });

  readonly bulkForm = form(this.configModel, (f) => {
    validate(f.series, ({ value }) => {
      const selected = value();
      return !selected || selected.length === 0
        ? { kind: 'required-series', message: 'Debe haber al menos una serie seleccionada' }
        : undefined;
    });
    required(f.impactZone);
  });

  constructor() {
    const units = this.store.conditionsUnits();
    this.configModel.set({
      series: [],
      date: '',
      targetType: '',
      material: '',
      impactZone: '',
      dimensions: '',
      thickness: '',
      distance: { value: '', unit: units?.distance ?? 'M' },
      targetInclination: { value: '', unit: units?.targetInclination ?? 'DEGREES' },
      orientation: { value: '', unit: units?.orientation ?? 'DEGREES' },
      elevation: { value: '', unit: units?.elevation ?? 'DEGREES' },
      angle: { value: '', unit: units?.angle ?? 'DEGREES' },
      range: { value: '', unit: units?.range ?? 'M' },
      functioningHeight: { value: '', unit: units?.functioningHeight ?? 'M' },
      powderWeight: { value: '', unit: units?.powderWeight ?? 'KG' },
      projectileWeight: { value: '', unit: units?.projectileWeight ?? 'KG' },
      nominalSpeed: { value: '', unit: units?.nominalSpeed ?? 'M_S' },
    });

    effect(() => {
      const status = this.shootingConditionsService.updateConditionsResource.status();
      if (this.#applyConfirmed() && status === 'resolved') {
        this.dialogRef.close(true);
      }
    });
  }

  onFieldChange(field: keyof BulkConfig, change: { value: string; unit: string } | null): void {
    if (!change) return;
    this.configModel.update((config) => ({
      ...config,
      [field]: change,
    }));
  }

  apply() {
    const config = this.configModel();
    const selectedSeriesIds = new Set(config.series);

    const override: Partial<UpdateShot> = {};
    if (config.date) override.date = config.date;
    if (config.targetType) override.targetTypeId = config.targetType;
    if (config.material) override.targetMaterialId = config.material;
    if (config.impactZone) override.impactZoneId = config.impactZone;
    if (config.dimensions) override.targetDimensionsId = config.dimensions;
    if (config.thickness) override.targetThicknessId = config.thickness;
    if (config.distance.value !== '') {
      override.distance = Number(config.distance.value);
      override.distanceUnit = config.distance.unit;
    }
    if (config.targetInclination.value !== '') {
      override.targetInclination = Number(config.targetInclination.value);
      override.targetInclinationUnit = config.targetInclination.unit;
    }
    if (config.orientation.value !== '') {
      override.orientation = Number(config.orientation.value);
      override.orientationUnit = config.orientation.unit;
    }
    if (config.elevation.value !== '') {
      override.elevation = Number(config.elevation.value);
      override.elevationUnit = config.elevation.unit;
    }
    if (config.angle.value !== '') {
      override.angle = Number(config.angle.value);
      override.angleUnit = config.angle.unit;
    }
    if (config.range.value !== '') {
      override.range = Number(config.range.value);
      override.rangeUnit = config.range.unit;
    }
    if (config.functioningHeight.value !== '') {
      override.functioningHeight = Number(config.functioningHeight.value);
      override.functioningHeightUnit = config.functioningHeight.unit;
    }
    if (config.powderWeight.value !== '') {
      override.powderWeight = Number(config.powderWeight.value);
      override.powderWeightUnit = config.powderWeight.unit;
    }
    if (config.projectileWeight.value !== '') {
      override.projectileWeight = Number(config.projectileWeight.value);
      override.projectileWeightUnit = config.projectileWeight.unit;
    }
    if (config.nominalSpeed.value !== '') {
      override.nominalSpeed = Number(config.nominalSpeed.value);
      override.nominalSpeedUnit = config.nominalSpeed.unit;
    }

    const shotsById = new Map<string, UpdateShot>();
    for (const serie of this.data.series) {
      if (!selectedSeriesIds.has(serie.seriesId)) continue;
      for (const shot of serie.shots) {
        if (!shot.shotId) continue;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { globalNumber, ...rest } = shot;
        shotsById.set(shot.shotId, { ...rest, ...override, shotId: shot.shotId });
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

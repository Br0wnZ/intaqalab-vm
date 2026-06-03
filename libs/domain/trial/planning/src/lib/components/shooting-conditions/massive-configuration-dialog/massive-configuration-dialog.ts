import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule, MatFormFieldModule, MatIconModule } from '@intaqalab/theme';
import { IntaIconComponent } from '@intaqalab/ui';
import { IntaDatePipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import type { Serie } from '../../../models/shooting-conditions.model';
import { ShootingConditionsService } from '../../../services/shooting-conditions.service';

interface BulkConfig {
  series: string[];
  date: string;
  targetType: string;
  material: string;
  impactZone: string;
  dimensions: string;
  thickness: string;
  distance: string;
  targetInclination: string;
  orientation: string;
  elevation: string;
  angle: string;
  range: string;
  functioningHeight: string;
  powderWeight: string;
  projectWeight: string;
  nominalSpeed: string;
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
  ],
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
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-dist" matInput type="number" [formField]="bulkForm.distance" />
            <mat-error>
              {{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.VALIDATIONS.NEGATIVE_VALUE'
                  | translate
              }}
            </mat-error>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-inclination" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.INCLINATION_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-inclination" matInput type="number" [formField]="bulkForm.targetInclination" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-orient" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ORIENTATION_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-orient" matInput type="number" [formField]="bulkForm.orientation" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-elev" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ELEVATION_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-elev" matInput type="number" [formField]="bulkForm.elevation" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-angle" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.ANGLE_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-angle" matInput type="number" [formField]="bulkForm.angle" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-range" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.RANGE_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-range" matInput type="number" [formField]="bulkForm.range" />
            <mat-error>
              {{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.VALIDATIONS.NEGATIVE_VALUE'
                  | translate
              }}
            </mat-error>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-height" class="text-xs font-bold text-slate-700 ml-1">
            {{
              'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.FUNCTIONING_HEIGHT_LABEL' | translate
            }}
          </label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-height" matInput type="number" [formField]="bulkForm.functioningHeight" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-powder" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.POWDER_WEIGHT_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-powder" matInput type="number" step="any" [formField]="bulkForm.powderWeight" />
            <mat-error>
              {{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.VALIDATIONS.NEGATIVE_VALUE'
                  | translate
              }}
            </mat-error>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-proj" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.PROJECTILE_WEIGHT_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-proj" matInput type="number" [formField]="bulkForm.projectWeight" />
            <mat-error>
              {{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.VALIDATIONS.NEGATIVE_VALUE'
                  | translate
              }}
            </mat-error>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-speed" class="text-xs font-bold text-slate-700 ml-1">
            {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.NOMINAL_SPEED_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-speed" matInput type="number" [formField]="bulkForm.nominalSpeed" />
            <mat-error>
              {{
                'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.MASSIVE_CONFIG_DIALOG.VALIDATIONS.NEGATIVE_VALUE'
                  | translate
              }}
            </mat-error>
          </mat-form-field>
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
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<MassiveConfigurationDialog>);
  readonly #applyConfirmed = signal(false);
  readonly isUpdating = computed(() => this.shootingConditionsService.updateConditionsResource.isLoading());

  readonly configModel = signal<BulkConfig>({
    series: [],
    date: '',
    targetType: '',
    material: '',
    impactZone: '',
    dimensions: '',
    thickness: '',
    distance: '',
    targetInclination: '',
    orientation: '',
    elevation: '',
    angle: '',
    range: '',
    functioningHeight: '',
    powderWeight: '',
    projectWeight: '',
    nominalSpeed: '',
  });

  readonly bulkForm = form(this.configModel, (f) => {
    const notNegative = (v: string) =>
      v !== '' && Number(v) < 0 ? { kind: 'min' as const, message: 'El valor no puede ser negativo' } : undefined;
    validate(f.series, ({ value }) => {
      const selected = value();
      return !selected || selected.length === 0
        ? { kind: 'required-series', message: 'Debe haber al menos una serie seleccionada' }
        : undefined;
    });
    required(f.impactZone);
    validate(f.distance, ({ value }) => notNegative(value()));
    validate(f.range, ({ value }) => notNegative(value()));
    validate(f.powderWeight, ({ value }) => notNegative(value()));
    validate(f.projectWeight, ({ value }) => notNegative(value()));
    validate(f.nominalSpeed, ({ value }) => notNegative(value()));
  });

  constructor() {
    effect(() => {
      const status = this.shootingConditionsService.updateConditionsResource.status();
      if (this.#applyConfirmed() && status === 'resolved') {
        this.dialogRef.close(true);
      }
    });
  }

  apply() {
    const config = this.configModel();
    const selectedSeriesIds = new Set(config.series);

    const shots = this.data.series.flatMap((serie) => {
      const isSelected = selectedSeriesIds.has(serie.seriesId);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return serie.shots.map(({ globalNumber, date, ...rest }) => {
        if (!isSelected) return { date, ...rest };
        return {
          date: config.date || date,
          ...rest,
          ...(config.targetType && { targetTypeId: config.targetType }),
          ...(config.material && { targetMaterialId: config.material }),
          ...(config.impactZone && { impactZoneId: config.impactZone }),
          ...(config.dimensions && { targetDimensionsId: config.dimensions }),
          ...(config.thickness && { targetThicknessId: config.thickness }),
          ...(config.distance && { distance: Number(config.distance) }),
          ...(config.targetInclination && { targetInclination: Number(config.targetInclination) }),
          ...(config.orientation && { orientation: Number(config.orientation) }),
          ...(config.elevation && { elevation: Number(config.elevation) }),
          ...(config.angle && { angle: Number(config.angle) }),
          ...(config.range && { range: Number(config.range) }),
          ...(config.functioningHeight && { functioningHeight: Number(config.functioningHeight) }),
          ...(config.powderWeight && { powderWeight: Number(config.powderWeight) }),
          ...(config.projectWeight && { projectWeight: Number(config.projectWeight) }),
          ...(config.nominalSpeed && { nominalSpeed: Number(config.nominalSpeed) }),
        };
      });
    });

    this.#applyConfirmed.set(true);
    this.shootingConditionsService.updateShootingConditions({
      trialId: this.data.trialId,
      shots,
    });
  }
}

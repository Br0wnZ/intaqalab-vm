import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, validate } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule, MatFormFieldModule, MatIconModule } from '@intaqalab/theme';
import { IntaIconComponent } from '@intaqalab/ui';
import { IntaDatePipe } from '@intaqalab/utils';

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
  orientation: string;
  elevation: string;
  angle: string;
  range: string;
  functioningHeight: string;
  powderWeight: string;
  projectileWeight: string;
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
  ],
  template: `
    <div>
      <h2 mat-dialog-title class="!flex gap-2 !pt-4 items-center align-center gap-3 text-xl font-semibold !mx-auto">
        <ui-inta-icon name="edit" size="xxl" />
        <h2 class="text-xl font-bold text-slate-800 m-0">Configuración masiva de disparos</h2>
      </h2>

      <div class="grid grid-cols-2 gap-x-8 gap-y-4">
        <div class="flex flex-col gap-1">
          <label for="bulk-series" class="text-xs font-bold text-slate-700 ml-1">Series</label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <mat-select placeholder="Selecciona las series" id="bulk-series" multiple [formField]="bulkForm.series">
              @for (serie of data.series; track serie.seriesId) {
                <mat-option [value]="serie.seriesId">{{ serie.seriesName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-date" class="text-xs font-bold text-slate-700 ml-1">Fecha</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select placeholder="Selecciona la fecha" id="bulk-date" [formField]="bulkForm.date">
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
          <label for="bulk-target" class="text-xs font-bold text-slate-700 ml-1">Blanco</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select placeholder="Selecciona el blanco" id="bulk-target" [formField]="bulkForm.targetType">
              @for (targetType of shootingConditionsService.getTargetTypesResource.value(); track targetType.id) {
                <mat-option [value]="targetType.id">{{ targetType.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-material" class="text-xs font-bold text-slate-700 ml-1">Material blanco</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select
              placeholder="Selecciona el material del blanco"
              id="bulk-material"
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
          <label for="bulk-impact" class="text-xs font-bold text-slate-700 ml-1">Zona impacto</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select
              placeholder="Selecciona el material del blanco"
              id="bulk-impact"
              [formField]="bulkForm.impactZone"
            >
              @for (impactZone of shootingConditionsService.getImpactZonesResource.value(); track impactZone.id) {
                <mat-option [value]="impactZone.id">{{ impactZone.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-dims" class="text-xs font-bold text-slate-700 ml-1">Dimensiones blanco</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select
              placeholder="Selecciona las dimensiones del blanco"
              id="bulk-dims"
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
          <label for="bulk-thick" class="text-xs font-bold text-slate-700 ml-1">Espesor blanco</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <mat-select placeholder="Selecciona el espesor del blanco" id="bulk-thick" [formField]="bulkForm.thickness">
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
          <label for="bulk-dist" class="text-xs font-bold text-slate-700 ml-1">Distancia</label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-dist" matInput type="number" [formField]="bulkForm.distance" />
            <mat-error>El valor no puede ser negativo</mat-error>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-orient" class="text-xs font-bold text-slate-700 ml-1">Orientación</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-orient" matInput type="number" [formField]="bulkForm.orientation" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-elev" class="text-xs font-bold text-slate-700 ml-1">Elevación</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-elev" matInput type="number" [formField]="bulkForm.elevation" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-angle" class="text-xs font-bold text-slate-700 ml-1">Ángulo tiro</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-angle" matInput type="number" [formField]="bulkForm.angle" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-range" class="text-xs font-bold text-slate-700 ml-1">Alcance</label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-range" matInput type="number" [formField]="bulkForm.range" />
            <mat-error>El valor no puede ser negativo</mat-error>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-height" class="text-xs font-bold text-slate-700 ml-1">Altura funcionamiento</label>
          <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
            <input placeholder="0" id="bulk-height" matInput type="number" [formField]="bulkForm.functioningHeight" />
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-powder" class="text-xs font-bold text-slate-700 ml-1">Peso de pólvora</label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-powder" matInput type="number" [formField]="bulkForm.powderWeight" />
            <mat-error>El valor no puede ser negativo</mat-error>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-proj" class="text-xs font-bold text-slate-700 ml-1">Peso del proyectil</label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-proj" matInput type="number" [formField]="bulkForm.projectileWeight" />
            <mat-error>El valor no puede ser negativo</mat-error>
          </mat-form-field>
        </div>

        <div class="flex flex-col gap-1">
          <label for="bulk-speed" class="text-xs font-bold text-slate-700 ml-1">Velocidad nominal</label>
          <mat-form-field appearance="outline">
            <input placeholder="0" id="bulk-speed" matInput type="number" [formField]="bulkForm.nominalSpeed" />
            <mat-error>El valor no puede ser negativo</mat-error>
          </mat-form-field>
        </div>
      </div>

      <div class="flex justify-center gap-4 mt-8">
        <button mat-flat-button [disabled]="isUpdating() || bulkForm().invalid()" (click)="apply()">Aplicar</button>
        <button mat-stroked-button mat-dialog-close>Cancelar</button>
      </div>
    </div>
  `,
  styles: [],
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
    orientation: '',
    elevation: '',
    angle: '',
    range: '',
    functioningHeight: '',
    powderWeight: '',
    projectileWeight: '',
    nominalSpeed: '',
  });

  readonly bulkForm = form(this.configModel, (f) => {
    const notNegative = (v: string) =>
      v !== '' && Number(v) < 0 ? { kind: 'min' as const, message: 'El valor no puede ser negativo' } : undefined;
    validate(f.distance, ({ value }) => notNegative(value()));
    validate(f.range, ({ value }) => notNegative(value()));
    validate(f.powderWeight, ({ value }) => notNegative(value()));
    validate(f.projectileWeight, ({ value }) => notNegative(value()));
    validate(f.nominalSpeed, ({ value }) => notNegative(value()));
  });

  constructor() {
    effect(() => {
      const status = this.shootingConditionsService.updateConditionsResource.status();
      if (this.#applyConfirmed() && status === 'resolved') {
        this.dialogRef.close(true);
      }
    });

    const allShots = this.data.series.flatMap((s) => s.shots);
    if (allShots.length) {
      const first = allShots[0];
      this.configModel.set({
        series: [],
        date: first.date || '',
        targetType: first.targetTypeId || '',
        material: first.targetMaterialId || '',
        impactZone: first.impactZoneId || '',
        dimensions: first.targetDimensionsId || '',
        thickness: first.targetThicknessId || '',
        distance: first.distance ? String(first.distance) : '',
        orientation: first.orientation !== undefined ? String(first.orientation) : '',
        elevation: first.elevation ? String(first.elevation) : '',
        angle: first.angle ? String(first.angle) : '',
        range: first.range ? String(first.range) : '',
        functioningHeight: first.functioningHeight ? String(first.functioningHeight) : '',
        powderWeight: first.powderWeight ? String(first.powderWeight) : '',
        projectileWeight: first.projectileWeight ? String(first.projectileWeight) : '',
        nominalSpeed: first.nominalSpeed ? String(first.nominalSpeed) : '',
      });
    }
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
          ...(config.orientation && { orientation: Number(config.orientation) }),
          ...(config.elevation && { elevation: Number(config.elevation) }),
          ...(config.angle && { angle: Number(config.angle) }),
          ...(config.range && { range: Number(config.range) }),
          ...(config.functioningHeight && { functioningHeight: Number(config.functioningHeight) }),
          ...(config.powderWeight && { powderWeight: Number(config.powderWeight) }),
          ...(config.projectileWeight && { projectileWeight: Number(config.projectileWeight) }),
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

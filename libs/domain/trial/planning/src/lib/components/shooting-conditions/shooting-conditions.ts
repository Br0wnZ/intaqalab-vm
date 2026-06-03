import type { OnInit } from '@angular/core';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormField, applyEach, form, min, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { MasterData, TargetDimension, TargetThickness } from '@intaqalab/models';
import { Badge, IntaIconComponent } from '@intaqalab/ui';
import { IntaDatePipe } from '@intaqalab/utils';
import { TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import type { Serie, Shot, UpdateConditionsRequest } from '../../models/shooting-conditions.model';
import { ShootingConditionsService } from '../../services/shooting-conditions.service';
import type { Serie as SeriesAndShotsSerie } from '../../utils-models/series-and-shots.model';
import { MassiveConfigurationDialog } from './massive-configuration-dialog/massive-configuration-dialog';

@Component({
  selector: 'inta-shooting-conditions',
  standalone: true,
  imports: [
    TranslateModule,
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    FormField,
    IntaDatePipe,
    Badge,
    TrialStatusLabelPipe,
    IntaIconComponent,
  ],
  template: `
    <div class="w-full space-y-4">
      <div class="flex items-center justify-between mt-6 mb-8">
        <div class="flex gap-2">
          <h2 class="bg-purple-200/50 text-purple-700 p-2 rounded-lg">
            {{ store.fireTrialCode() }}
          </h2>
          <ui-badge [status]="store.fireTrial()?.status">
            {{ store.fireTrial()!.status | trialStatusLabel }}
          </ui-badge>
        </div>
        <button mat-flat-button (click)="openMassiveConfigurationDialog()">Aplicar configuración masiva</button>
      </div>
      <mat-accordion multi class="flex flex-col gap-6">
        @for (serie of seriesSignal(); track serie.seriesId; let serieIdx = $index) {
          <mat-expansion-panel
            class="!shadow-sm !border !border-slate-200 !rounded-xl overflow-hidden !m-0 !bg-gray-200"
            [expanded]="true"
          >
            <mat-expansion-panel-header class="!h-12 !bg-gray-200">
              <mat-panel-title class="flex items-center gap-2">
                <h2 class="!font-medium !text-sm !text-gray-900">{{ serie.seriesName }}</h2>
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="py-4 bg-white -mx-6 -mb-6 rounded-t-lg">
              <div class="flex items-center justify-between mb-4 px-4">
                <h3 class="font-semibold text-sm text-gray-700">
                  {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE' | translate }}
                </h3>
              </div>

              <div class="overflow-x-auto border border-slate-200">
                <table mat-table class="w-full compact-table" [dataSource]="serie.shots" [trackBy]="trackByShotId">
                  <ng-container matColumnDef="globalNumber">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.SHOT' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      {{ shot.globalNumber || i + 1 }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="date">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.DATE' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <mat-select [formField]="getShotField(serieIdx, i).date">
                          @for (schedule of getTrialSchedulesResource.value(); track schedule.date) {
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
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="impactZoneId">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.IMPACT_ZONE' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <mat-select [formField]="getShotField(serieIdx, i).impactZoneId">
                          @for (zone of impactZones(); track zone.id) {
                            <mat-option
                              class="truncate"
                              [value]="zone.id"
                              [matTooltip]="zone.label"
                              [matTooltipDisabled]="zone.label.length <= 20"
                            >
                              <span class="truncate">{{ zone.label }}</span>
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="targetTypeId">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <mat-select [formField]="getShotField(serieIdx, i).targetTypeId">
                          @for (target of targetTypes(); track target.id) {
                            <mat-option
                              class="truncate"
                              [value]="target.id"
                              [matTooltip]="target.label"
                              [matTooltipDisabled]="target.label.length <= 20"
                            >
                              <span class="truncate">{{ target.label }}</span>
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="targetMaterialId">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_MATERIAL' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <mat-select [formField]="getShotField(serieIdx, i).targetMaterialId">
                          @for (material of targetMaterials(); track material.id) {
                            <mat-option
                              class="truncate"
                              [value]="material.id"
                              [matTooltip]="material.label"
                              [matTooltipDisabled]="material.label.length <= 20"
                            >
                              <span class="truncate">{{ material.label }}</span>
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="targetDimensionsId">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_DIMENSIONS' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <mat-select matNativeControl [formField]="getShotField(serieIdx, i).targetDimensionsId">
                          @for (dimension of targetDimensions(); track dimension.id) {
                            <mat-option
                              class="truncate"
                              [value]="dimension.id"
                              [matTooltip]="dimension.label"
                              [matTooltipDisabled]="dimension.label.length <= 20"
                            >
                              <span class="truncate">{{ dimension.label }}</span>
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="targetThicknessId">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.TARGET_THICKNESS' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <mat-select [formField]="getShotField(serieIdx, i).targetThicknessId">
                          @for (thickness of targetThicknesses(); track thickness.id) {
                            <mat-option
                              class="truncate"
                              [value]="thickness.id"
                              [matTooltip]="thickness.name"
                              [matTooltipDisabled]="thickness.name.length <= 20"
                            >
                              <span class="truncate">{{ thickness.name }}</span>
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="distance">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.DISTANCE' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input
                          placeholder="0"
                          matInput
                          type="number"
                          [formField]="getShotField(serieIdx, i).distance"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="targetInclination">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.INCLINATION' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input
                          placeholder="0"
                          matInput
                          type="number"
                          [formField]="getShotField(serieIdx, i).targetInclination"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="orientation">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.ORIENTATION' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input
                          placeholder="0"
                          matInput
                          type="number"
                          [formField]="getShotField(serieIdx, i).orientation"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="elevation">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.ELEVATION' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input
                          placeholder="0"
                          matInput
                          type="number"
                          [formField]="getShotField(serieIdx, i).elevation"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="angle">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.ANGLE' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input placeholder="0" matInput type="number" [formField]="getShotField(serieIdx, i).angle" />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="range">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.RANGE' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input placeholder="0" matInput type="number" [formField]="getShotField(serieIdx, i).range" />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="powderWeight">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.POWDER_WEIGHT' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input
                          placeholder="0"
                          matInput
                          type="number"
                          step="any"
                          [formField]="getShotField(serieIdx, i).powderWeight"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="functioningHeight">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.FUNCTIONING_HEIGHT' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input
                          placeholder="0"
                          matInput
                          type="number"
                          [formField]="getShotField(serieIdx, i).functioningHeight"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="projectWeight">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.PROJECTILE_WEIGHT' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input
                          placeholder="0"
                          matInput
                          type="number"
                          [formField]="getShotField(serieIdx, i).projectWeight"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="nominalSpeed">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.NOMINAL_SPEED' | translate }}
                    </th>
                    <td
                      *matCellDef="let shot; let i = index"
                      mat-cell
                      class="px-6 py-4 text-sm text-gray-900 !bg-white"
                    >
                      <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'">
                        <input
                          placeholder="0"
                          matInput
                          type="number"
                          [formField]="getShotField(serieIdx, i).nominalSpeed"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="observations">
                    <th
                      *matHeaderCellDef
                      mat-header-cell
                      class="text-xs font-medium text-gray-600 px-6 py-3 !bg-gray-100"
                    >
                      {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TABLE.OBSERVATIONS' | translate }}
                    </th>
                    <td *matCellDef="let shot" mat-cell class="px-6 py-4 text-sm text-gray-900 !bg-white">
                      <button mat-icon-button class="!text-gray-600 scale-90" [title]="shot.observation">
                        <ui-inta-icon name="info" size="xxl" />
                      </button>
                    </td>
                  </ng-container>

                  <tr *matHeaderRowDef="displayedColumns" mat-header-row class="!bg-slate-50"></tr>
                  <tr
                    *matRowDef="let row; columns: displayedColumns"
                    mat-row
                    class="hover:bg-slate-50/50 transition-colors"
                  ></tr>
                </table>
              </div>
            </div>
          </mat-expansion-panel>
        } @empty {
          <div class="py-8 text-center text-gray-400">
            <mat-icon class="!text-5xl !w-12 !h-12 mx-auto mb-2">inbox</mat-icon>
            <p>{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.EMPTY_STATE' | translate }}</p>
          </div>
        }
      </mat-accordion>
      <div class="mt-10 flex gap-4 justify-end">
        <button mat-flat-button [disabled]="isUpdating() || !isFormValid()" (click)="saveForm()">
          {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.ACTIONS.SAVE' | translate }}
        </button>
        <button mat-stroked-button [disabled]="isUpdating() || !isFormValid()" (click)="resetForm()">
          {{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.ACTIONS.CANCEL' | translate }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './shooting-conditions.scss',
})
export class ShootingConditionsComponent implements OnInit {
  readonly #dialog = inject(MatDialog);
  protected readonly store = inject(PlanningGeneralDataStore);
  readonly shootingConditionsService = inject(ShootingConditionsService);
  readonly shootingConditionsSource = this.shootingConditionsService.conditionsResource;
  readonly updateConditionsSource = this.shootingConditionsService.updateConditionsResource;
  readonly getTrialSchedulesResource = this.shootingConditionsService.getTrialSchedulesResource;
  readonly isUpdating = computed(() => this.store.isUpdatingConditions() || this.store.isLoadingShootingConditions());

  readonly targetTypes = signal<MasterData[] | undefined>(undefined);
  readonly targetMaterials = signal<MasterData[] | undefined>(undefined);
  readonly targetDimensions = signal<TargetDimension[] | undefined>(undefined);
  readonly targetThicknesses = signal<TargetThickness[] | undefined>(undefined);
  readonly impactZones = signal<MasterData[] | undefined>(undefined);

  readonly displayedColumns = [
    'globalNumber',
    'date',
    'impactZoneId',
    'targetTypeId',
    'targetMaterialId',
    'targetDimensionsId',
    'targetThicknessId',
    'distance',
    'targetInclination',
    'orientation',
    'elevation',
    'angle',
    'range',
    'functioningHeight',
    'powderWeight',
    'projectWeight',
    'nominalSpeed',
    'observations',
  ];

  #initialSeriesData: Serie[] = [];
  #conditionsApplied = false;

  readonly seriesSignal = signal<Serie[]>([]);

  constructor() {
    effect(() => {
      const series = this.store.series();
      const conditions = this.store.shootingConditions();
      if (!series?.length) return;

      const hasConditions = !!conditions?.length;

      // Skip if series-only update after conditions were already applied
      if (this.#conditionsApplied && !hasConditions) return;

      const merged = this.#buildSeriesFromStore(series, conditions);
      this.seriesSignal.set(merged);
      this.#initialSeriesData = this.#deepClone(merged);

      if (hasConditions) this.#conditionsApplied = true;
    });
    effect(() => {
      const status = this.updateConditionsSource.status();
      if (status === 'resolved') {
        this.store.getShootingConditions();
      }
    });
    effect(() => {
      const targetTypes = this.store.targetTypes();
      this.targetTypes.set(targetTypes || []);
    });
    effect(() => {
      const targetMaterials = this.store.targetMaterials();
      this.targetMaterials.set(targetMaterials || []);
    });
    effect(() => {
      const targetDimensions = this.store.targetDimensions();
      this.targetDimensions.set(targetDimensions || []);
    });
    effect(() => {
      const targetThicknesses = this.store.targetThicknesses();
      this.targetThicknesses.set(targetThicknesses || []);
    });
    effect(() => {
      const impactZones = this.store.impactZones();
      this.impactZones.set(impactZones || []);
    });
  }

  ngOnInit(): void {
    this.store.loadSeries();
    this.store.getShootingConditions();
    this.store.getTargetTypes();
    this.store.getTargetMaterials();
    this.store.getTargetDimensions();
    this.store.getTargetThicknesses();
    this.store.getImpactZones();
    this.store.getSchedules();
  }

  seriesForm = form(this.seriesSignal, (formPath) => {
    applyEach(formPath, (seriePath) => {
      required(seriePath.seriesName);
      required(seriePath.seriesId);

      applyEach(seriePath.shots, (shotPath) => {
        required(shotPath.shotId);
        required(shotPath.impactZoneId);

        min(shotPath.orientation, 0);
        min(shotPath.angle, 0);
        min(shotPath.range, 0);
        min(shotPath.functioningHeight, 0);
        min(shotPath.projectWeight, 0);
        min(shotPath.nominalSpeed, 0);
      });
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSerieField(serieIdx: number): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.seriesForm as any)[serieIdx];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getShotField(serieIdx: number, shotIdx: number): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.seriesForm as any)[serieIdx].shots[shotIdx];
  }

  trackByShotId(index: number, shot: Shot): string {
    return shot.shotId;
  }

  getFormValues(): Serie[] {
    return this.seriesSignal();
  }

  isFormValid(): boolean {
    const length = this.seriesSignal().length;
    for (let i = 0; i < length; i++) {
      const serieForm = this.getSerieField(i);
      if (serieForm) {
        const state = serieForm();
        if (state.touched() && !state.valid()) {
          return false;
        }
      }
    }
    return true;
  }

  openMassiveConfigurationDialog() {
    this.#dialog.open(MassiveConfigurationDialog, {
      maxWidth: 800,
      width: '100vw',
      height: '100vh',
      maxHeight: 750,
      data: {
        series: this.seriesSignal(),
        trialId: this.store.fireTrialId() ?? '',
      },
    });
  }

  saveForm() {
    const formData = this.getFormValues();
    const request = this.#mapDataToRequest(formData);
    this.store.updateShootingConditions(request);
  }

  resetForm() {
    this.seriesSignal.set(this.#deepClone(this.#initialSeriesData));
  }

  #mapDataToRequest(formData: Serie[]): Omit<UpdateConditionsRequest, 'trialId'> {
    return {
      shots: formData.flatMap((serie) =>
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        serie.shots.map(({ globalNumber, date, ...rest }) => ({ date, ...rest })),
      ),
    };
  }

  #deepClone(series: Serie[]): Serie[] {
    return JSON.parse(JSON.stringify(series));
  }

  #findSerieCondition(serie: SeriesAndShotsSerie, conditions: Serie[] | undefined): Serie | undefined {
    if (!conditions?.length) return undefined;
    return conditions.find((candidate) => candidate.seriesId === serie.id || candidate.seriesName === serie.name);
  }

  #findShotCondition(shotConditions: Shot[] | undefined, shotId: string, globalNumber: number): Shot | undefined {
    if (!shotConditions?.length) return undefined;

    const byId = shotConditions.find((shot) => shot.shotId === shotId);
    if (byId) return byId;

    const byGlobalNumber = shotConditions.find((shot) => shot.globalNumber === globalNumber);
    if (byGlobalNumber) return byGlobalNumber;

    return undefined;
  }

  #buildSeriesFromStore(series: SeriesAndShotsSerie[], conditions?: Serie[]): Serie[] {
    return series.map((serie) => {
      const serieCondition = this.#findSerieCondition(serie, conditions);
      return {
        seriesId: serie.id,
        seriesName: serie.name,
        shots: serie.shots.map((shot) => {
          const existing = this.#findShotCondition(serieCondition?.shots, shot.id, shot.globalNumber);
          if (existing)
            return {
              ...existing,
              shotId: shot.id,
              projectWeight: existing.projectWeight ?? 0,
              nominalSpeed: existing.nominalSpeed ?? 0,
            };
          return {
            shotId: shot.id,
            globalNumber: shot.globalNumber,
            date: '',
            targetTypeId: '',
            targetMaterialId: '',
            targetDimensionsId: '',
            targetThicknessId: '',
            distance: 0,
            targetInclination: 0,
            orientation: 0,
            elevation: 0,
            angle: 0,
            range: 0,
            impactZoneId: '',
            functioningHeight: 0,
            projectWeight: 0,
            powderWeight: 0,
            nominalSpeed: 0,
            observations: '',
          };
        }),
      };
    });
  }
}

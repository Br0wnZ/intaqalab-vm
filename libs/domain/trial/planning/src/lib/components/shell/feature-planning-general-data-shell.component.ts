import { Component, computed, effect, inject, input, output } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import type { FireTrial, TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { TranslatePipe } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import type { PlanningFormSnapshotEvent, PlanningShellMode } from '../../models/planning-shell.model';
import { PLANNING_REVISION_BY_SHELL_MODE } from '../../models/planning-shell.model';
import { PlanningPermissionsService } from '../../planning-permissions.service';
import { Armament } from '../armament/armament';
import { Measures } from '../measures/measures';
import { Munitions } from '../munitions/munitions';
import { PlanningGeneralDataFormComponent } from '../planning-general-data-form/planning-general-data-form.component';
import { SeriesAndShots } from '../series-and-shots/series-and-shots';
import { ShootingConditionsComponent } from '../shooting-conditions/shooting-conditions';

@Component({
  selector: 'inta-feature-planning-general-data-shell',
  imports: [
    TranslatePipe,
    MatTabsModule,
    PlanningGeneralDataFormComponent,
    SeriesAndShots,
    ShootingConditionsComponent,
    Munitions,
    Armament,
    Measures,
  ],
  providers: [PlanningGeneralDataStore],
  template: `
    @if (canAccessPlanning()) {
      @if (!isExecutionModification()) {
        <mat-tab-group class="mt-4" (selectedIndexChange)="onIndexChange($event)">
          <mat-tab label="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.TAB_TITLE' | translate }}">
            <inta-planning-general-data-form [readonly]="isReadonly()" />
          </mat-tab>
          <mat-tab
            label="{{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.TAB_TITLE' | translate }}"
            [disabled]="disableSeriesTab()"
          >
            <ng-template matTabContent>
              <inta-series-and-shots [readonly]="isReadonly()" />
            </ng-template>
          </mat-tab>
          <mat-tab
            label="{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE' | translate }}"
            [disabled]="disableShootingConditionsTab()"
          >
            <ng-template matTabContent>
              <inta-shooting-conditions [readonly]="isReadonly()" />
            </ng-template>
          </mat-tab>
          <mat-tab label="{{ 'TRIAL_PLANNING.MUNITIONS.TITLE' | translate }}" [disabled]="disableSeriesDependentTab()">
            <ng-template matTabContent>
              <inta-munitions [readonly]="isReadonly()" />
            </ng-template>
          </mat-tab>
          <mat-tab label="{{ 'TRIAL_PLANNING.ARMAMENT.TITLE' | translate }}" [disabled]="disableSeriesDependentTab()">
            <ng-template matTabContent>
              <inta-armament [readonly]="isReadonly()" />
            </ng-template>
          </mat-tab>
          <mat-tab label="{{ 'TRIAL_PLANNING.MEASURES.TITLE' | translate }}" [disabled]="disableSeriesDependentTab()">
            <ng-template matTabContent>
              <inta-measures [readonly]="isReadonly()" />
            </ng-template>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <mat-tab-group
          class="mt-4"
          [class.w-full]="isExecutionModification()"
          [class.min-w-0]="isExecutionModification()"
          (selectedIndexChange)="onIndexChange($event)"
        >
          <mat-tab label="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.TAB_TITLE' | translate }}">
            <div class="min-w-0" [class.px-4]="isExecutionModification()">
              <inta-planning-general-data-form
                [readonly]="isReadonly()"
                [detectPlanningChanges]="isExecutionModification()"
                (formSnapshotChanged)="planningFormChanged.emit($event)"
              />
            </div>
          </mat-tab>
          <mat-tab
            label="{{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.TAB_TITLE' | translate }}"
            [disabled]="!isExecutionModification() && disableSeriesTab()"
          >
            @if (isExecutionModification()) {
              <div class="min-w-0 px-4">
                <inta-series-and-shots
                  [readonly]="isReadonly()"
                  [detectPlanningChanges]="isExecutionModification()"
                  [executedShotIds]="executedShotIds()"
                  (formSnapshotChanged)="planningFormChanged.emit($event)"
                />
              </div>
            }
          </mat-tab>
          <mat-tab
            label="{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE' | translate }}"
            [disabled]="!isExecutionModification() && disableShootingConditionsTab()"
          >
            @if (isExecutionModification()) {
              <div class="min-w-0 px-4">
                <inta-shooting-conditions
                  [readonly]="isReadonly()"
                  [detectPlanningChanges]="isExecutionModification()"
                  [executedShotIds]="executedShotIds()"
                  (formSnapshotChanged)="planningFormChanged.emit($event)"
                />
              </div>
            }
          </mat-tab>
          <mat-tab
            label="{{ 'TRIAL_PLANNING.MUNITIONS.TITLE' | translate }}"
            [disabled]="!isExecutionModification() && disableSeriesDependentTab()"
          >
            @if (isExecutionModification()) {
              <div class="min-w-0 px-4">
                <inta-munitions
                  [readonly]="isReadonly()"
                  [detectPlanningChanges]="isExecutionModification()"
                  [executedShotIds]="executedShotIds()"
                  (formSnapshotChanged)="planningFormChanged.emit($event)"
                />
              </div>
            }
          </mat-tab>
          <mat-tab
            label="{{ 'TRIAL_PLANNING.ARMAMENT.TITLE' | translate }}"
            [disabled]="!isExecutionModification() && disableSeriesDependentTab()"
          >
            @if (isExecutionModification()) {
              <div class="min-w-0 px-4">
                <inta-armament
                  [readonly]="isReadonly()"
                  [detectPlanningChanges]="isExecutionModification()"
                  [executedShotIds]="executedShotIds()"
                  (formSnapshotChanged)="planningFormChanged.emit($event)"
                />
              </div>
            }
          </mat-tab>
          <mat-tab
            label="{{ 'TRIAL_PLANNING.MEASURES.TITLE' | translate }}"
            [disabled]="!isExecutionModification() && disableSeriesDependentTab()"
          >
            @if (isExecutionModification()) {
              <div class="min-w-0 px-4">
                <inta-measures
                  [readonly]="isReadonly()"
                  [detectPlanningChanges]="isExecutionModification()"
                  (formSnapshotChanged)="planningFormChanged.emit($event)"
                />
              </div>
            }
          </mat-tab>
        </mat-tab-group>
      }
    } @else {
      <div class="flex items-center justify-center h-40 text-gray-400 text-sm">
        {{ 'TRIAL_PLANNING.ACCESS_DENIED' | translate }}
      </div>
    }
  `,
  styles: ``,
})
export class FeaturePlanningGeneralDataShellComponent {
  readonly trial = input<TrialCreateModifyForm>();
  readonly trialId = input<FireTrial['id']>();
  readonly mode = input<PlanningShellMode>('planning');
  readonly executedShotIds = input<ReadonlyArray<string>>([]);
  readonly forcedReadonly = input<boolean>(false);

  readonly planningFormChanged = output<PlanningFormSnapshotEvent>();

  readonly #store = inject(PlanningGeneralDataStore);
  readonly #planningPermissions = inject(PlanningPermissionsService);

  protected readonly isExecutionModification = computed(() => this.mode() === 'execution-modification');

  /**
   * True si el usuario puede VER la pestaña de planificación para este estado de prueba.
   * - En modo 'execution-modification': el diálogo padre valida las precondiciones antes de abrir.
   * - UNDER_REVIEW: solo Admin, PlanningHead, Consultant
   * - PLANNED+: todos excepto Viewer
   */
  readonly canAccessPlanning = computed(() => {
    if (this.mode() === 'execution-modification') {
      return true;
    }
    const trialStatus = this.#currentStatus();
    return this.#planningPermissions.canAccessPlanningTab(trialStatus);
  });

  /**
   * True si la planificación debe estar bloqueada para edición:
   * - En modo 'execution-modification': editable solo para Ingeniero de Ensayos en estado INTERRUPTED.
   * - En modo 'planning': bloqueada si el usuario no tiene rol de edición o la prueba no está en UNDER_REVIEW.
   * El store es la única fuente de verdad del estado, así que tras validar/desbloquear
   * el formulario reacciona sin depender del input estático `trial`.
   */
  readonly isReadonly = computed(() => {
    if (this.forcedReadonly()) return true;
    if (this.mode() === 'execution-modification') {
      return !this.#planningPermissions.canModifyPlanningDuringExecution(this.#currentStatus());
    }
    return !this.#planningPermissions.canEditPlanning() || this.#currentStatus() !== TrialStatus.UNDER_REVIEW;
  });

  #currentStatus = computed(() => this.#store.fireTrial()?.status ?? this.trial()?.status ?? TrialStatus.UNDER_REVIEW);

  // Tabs 2 (series & shots) require general info to exist.
  protected readonly disableSeriesTab = computed(() => !this.#store.hasPlanningInfo());

  // Tab 3 (shooting conditions) requires general info and at least one serie with shots.
  protected readonly disableShootingConditionsTab = computed(
    () => !this.#store.hasPlanningInfo() || !this.#store.hasSeriesWithShots(),
  );

  // Tabs 4-6 (munitions, armament, measures) depend on at least one serie being registered.
  protected readonly disableSeriesDependentTab = computed(
    () => !this.#store.hasPlanningInfo() || !this.#store.hasSeries(),
  );

  constructor() {
    effect(() => {
      const trial = this.trial();
      const trialId = this.trialId();

      const revision = PLANNING_REVISION_BY_SHELL_MODE[this.mode()];

      if (trial && trialId) {
        // La revisión se fija ANTES de cualquier carga para que el primer GET ya lleve `?revision=`.
        this.#store.setRevision(revision);
        this.#store.setFireTrialData(trialId, trial);
      }
    });
  }

  isShotReadonly(shotId: string): boolean {
    return this.isReadonly() || (this.mode() === 'execution-modification' && this.executedShotIds().includes(shotId));
  }

  onIndexChange(index: number): void {
    if (index === 0 && this.mode() === 'planning') {
      this.#store.reloadPlanningInfo();
    }
  }
}

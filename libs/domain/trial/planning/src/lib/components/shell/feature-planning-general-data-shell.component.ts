import { Component, computed, effect, inject, input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import type { FireTrial, TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
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
    TranslateModule,
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
      <mat-tab-group class="mt-4" (selectedIndexChange)="onIndexChange($event)">
        <mat-tab label="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.TAB_TITLE' | translate }}">
          <inta-planning-general-data-form [readonly]="isReadonly()" />
        </mat-tab>
        <mat-tab
          label="{{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.TAB_TITLE' | translate }}"
          [disabled]="disableSeriesTab()"
        >
          <ng-template matTabContent>
            @defer (on idle) {
              <inta-series-and-shots [readonly]="isReadonly()" />
            } @placeholder {
              <div class="h-40 flex items-center justify-center">
                <span class="text-sm text-gray-400">Cargando...</span>
              </div>
            }
          </ng-template>
        </mat-tab>
        <mat-tab
          label="{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE' | translate }}"
          [disabled]="disableShootingConditionsTab()"
        >
          <ng-template matTabContent>
            @defer (on idle) {
              <inta-shooting-conditions [readonly]="isReadonly()" />
            } @placeholder {
              <div class="h-40 flex items-center justify-center">
                <span class="text-sm text-gray-400">Cargando...</span>
              </div>
            }
          </ng-template>
        </mat-tab>
        <mat-tab label="{{ 'TRIAL_PLANNING.MUNITIONS.TITLE' | translate }}" [disabled]="disableSeriesDependentTab()">
          <ng-template matTabContent>
            @defer (on idle) {
              <inta-munitions [readonly]="isReadonly()" />
            } @placeholder {
              <div class="h-40 flex items-center justify-center">
                <span class="text-sm text-gray-400">Cargando...</span>
              </div>
            }
          </ng-template>
        </mat-tab>
        <mat-tab label="{{ 'TRIAL_PLANNING.ARMAMENT.TITLE' | translate }}" [disabled]="disableSeriesDependentTab()">
          <ng-template matTabContent>
            @defer (on idle) {
              <inta-armament [readonly]="isReadonly()" />
            } @placeholder {
              <div class="h-40 flex items-center justify-center">
                <span class="text-sm text-gray-400">Cargando...</span>
              </div>
            }
          </ng-template>
        </mat-tab>
        <mat-tab label="Medidas" [disabled]="disableSeriesDependentTab()">
          <ng-template matTabContent>
            @defer (on idle) {
              <inta-measures [readonly]="isReadonly()" />
            } @placeholder {
              <div class="h-40 flex items-center justify-center">
                <span class="text-sm text-gray-400">Cargando...</span>
              </div>
            }
          </ng-template>
        </mat-tab>
      </mat-tab-group>
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

  readonly #store = inject(PlanningGeneralDataStore);
  readonly #planningPermissions = inject(PlanningPermissionsService);

  /**
   * True si el usuario puede VER la pestaña de planificación para este estado de prueba.
   * - UNDER_REVIEW: solo Admin, PlanningHead, Consultant
   * - PLANNED+: todos excepto Viewer
   */
  protected readonly canAccessPlanning = computed(() => {
    const trialStatus = this.#currentStatus();
    return this.#planningPermissions.canAccessPlanningTab(trialStatus);
  });

  /**
   * True si la planificación debe estar bloqueada para edición:
   * - el usuario no tiene rol de edición, o
   * - la prueba ya no está en UNDER_REVIEW (se validó y pasó a PLANNED).
   * El store es la única fuente de verdad del estado, así que tras validar/desbloquear
   * el formulario reacciona sin depender del input estático `trial`.
   */
  protected readonly isReadonly = computed(
    () => !this.#planningPermissions.canEditPlanning() || this.#currentStatus() !== TrialStatus.UNDER_REVIEW,
  );

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

      if (trial && trialId) {
        this.#store.setFireTrialData(trialId, trial);
      }
    });
  }

  protected onIndexChange(index: number): void {
    if (index === 0) {
      this.#store.reloadPlanningInfo();
    }
  }
}

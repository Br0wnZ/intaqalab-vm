import { Component, computed, effect, inject, input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import type { FireTrial, TrialCreateModifyForm } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
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
    <mat-tab-group class="mt-4">
      <mat-tab label="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.TAB_TITLE' | translate }}">
        <inta-planning-general-data-form />
      </mat-tab>
      <mat-tab
        label="{{ 'TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.TAB_TITLE' | translate }}"
        [disabled]="disableSeriesTab()"
      >
        <ng-template matTabContent>
          <inta-series-and-shots />
        </ng-template>
      </mat-tab>
      <mat-tab
        label="{{ 'TRIAL_PLANNING.SHOOTING_CONDITIONS_SECTION.TITLE' | translate }}"
        [disabled]="disableShootingConditionsTab()"
      >
        <ng-template matTabContent>
          <inta-shooting-conditions />
        </ng-template>
      </mat-tab>
      <mat-tab label="{{ 'TRIAL_PLANNING.MUNITIONS.TITLE' | translate }}" [disabled]="disableSeriesDependentTab()">
        <ng-template matTabContent>
          <inta-munitions />
        </ng-template>
      </mat-tab>
      <mat-tab label="{{ 'TRIAL_PLANNING.ARMAMENT.TITLE' | translate }}" [disabled]="disableSeriesDependentTab()">
        <ng-template matTabContent>
          <inta-armament />
        </ng-template>
      </mat-tab>
      <mat-tab label="Medidas" [disabled]="disableSeriesDependentTab()">
        <ng-template matTabContent>
          <inta-measures />
        </ng-template>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: ``,
})
export class FeaturePlanningGeneralDataShellComponent {
  readonly trial = input<TrialCreateModifyForm>();
  readonly trialId = input<FireTrial['id']>();

  readonly #store = inject(PlanningGeneralDataStore);

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
}

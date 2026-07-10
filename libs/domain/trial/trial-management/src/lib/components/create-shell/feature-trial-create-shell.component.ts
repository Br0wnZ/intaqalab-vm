import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  Injector,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { TrialsDataService } from '@intaqalab/data-access';
import type { FireTrial } from '@intaqalab/models';
import { TranslateModule } from '@ngx-translate/core';

import type { TriaUpsertForm } from '../../utils-models/upsert-trial-form.model';
import { TrialGeneralDataStore } from '../shared/+state/trial-general-data.store';
import { FeatureTrialCreateFormComponent } from '../shared/components/form/feature-trial-create-form.component';
import { mapFormToCreateDto } from '../shared/utils/helper';

type ParamsComponent = { id: string };
export const injectionTokenComponentCreateModifyShell = new InjectionToken<ParamsComponent>('params');

@Component({
  imports: [TranslateModule, FeatureTrialCreateFormComponent, MatCardModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TrialGeneralDataStore],
  template: `
    <h2 class="text-base font-semibold text-gray-900 my-6">{{ 'MENU_LEFT.GESTION_TRIALS_NEW' | translate }}</h2>

    <inta-feature-trial-create-form
      [editable]="editable()"
      [formData]="this.trialStore.trial()"
      [trialId]="trialId()"
      #form
    />

    @if (params().id && !editable()) {
      <div class="flex justify-end mt-6">
        <button mat-flat-button type="button" (click)="enableEdit()">
          {{ 'UTILS_TRIALS.TRIAL_ACTIONS.MODIFY' | translate }}
        </button>
      </div>
    } @else {
      <mat-card-actions class="flex justify-end gap-4 mt-6">
        <button mat-flat-button type="button" [disabled]="!formValid()" (click)="register()">
          {{ 'TRIAL_CREATE_MODIFY_FORM.SAVE_TRIAL' | translate }}
        </button>
        <button mat-stroked-button (click)="reset()">{{ 'TRIAL_CREATE_MODIFY_FORM.RESET_DATA' | translate }}</button>
      </mat-card-actions>
    }
  `,
  styleUrl: './feature-trial-create-shell.component.css',
})
export class FeatureTrialCreateShellComponent {
  formComponent = viewChild<FeatureTrialCreateFormComponent>('form');

  readonly #injector = inject(Injector);
  readonly #router = inject(Router);
  readonly trialStore = inject(TrialGeneralDataStore);
  readonly #trialDataService = inject(TrialsDataService);

  rawParams = this.#injector.get(injectionTokenComponentCreateModifyShell);
  params = signal(this.rawParams);
  readonly trialId = signal<FireTrial['trialNumber'] | undefined>(undefined);

  readonly #isEditMode = signal(false);

  readonly editable = computed(() => {
    const id = this.params().id;
    if (!id) return true;
    return this.#isEditMode();
  });

  readonly formValid = computed(() => {
    const form = this.formComponent()?.upsertTrialForm();
    return form ? form.valid() : false;
  });

  constructor() {
    effect(() => {
      const id = this.params().id;
      if (id) {
        this.trialStore.setTrialId(id);
        this.trialId.set(id);
      }
    });

    effect(() => {
      const result: FireTrial | undefined = this.#trialDataService.createTrialResource.value();
      if (result) {
        this.#trialDataService.resetCreateTrial();
        this.#router.navigateByUrl(`/trial/view/${result.id}`);
      }
    });

    effect(() => {
      const result: FireTrial | undefined = this.#trialDataService.updateTrialResource.value();
      if (result) {
        this.#trialDataService.resetUpdateTrial();
        this.trialStore.setTrialId(this.params().id);
        this.#isEditMode.set(false);
      }
    });
  }

  enableEdit(): void {
    this.#isEditMode.set(true);
  }

  register() {
    const form = this.formComponent()?.upsertTrialForm();
    if (form && form.valid()) {
      const data: Partial<TriaUpsertForm> = form.value();
      const id = this.params().id;
      if (id) {
        this.#trialDataService.updateTrial(id, mapFormToCreateDto(data));
      } else {
        this.#trialDataService.createTrial(mapFormToCreateDto(data));
      }
    } else {
      form?.markAsTouched();
    }
  }

  reset() {
    const id = this.params().id;
    if (id) {
      this.trialStore.setTrialId(id);
      this.#isEditMode.set(false);
      return;
    }
    const formModel = this.formComponent()?.upsertTrialModel;
    if (formModel) {
      formModel.set({
        type: '',
        client: '',
        code: '',
        hasAssociatedTrial: false,
        hasLinkedTrial: false,
        linkedTrial: '',
        description: '',
        clientReference: '',
        observations: '',
        requestedDate: '',
        associatedTrial: '',
        associatedTrialView: '',
        linkedTrialView: '',
      });
    }
  }
}

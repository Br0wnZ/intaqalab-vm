import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  Injector,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { injectionTokenTabCommand } from '@intaqalab/core';
import { TrialsDataService } from '@intaqalab/data-access';
import type { TrialActions } from '@intaqalab/models';
import { TrialStatus, injectTrialStatus } from '@intaqalab/models';
import { FeaturePlanningGeneralDataShellComponent } from '@intaqalab/planning';
import { Badge, UiDialogService } from '@intaqalab/ui';
import { TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { TrialDocsService } from '../../services/trial-docs-service';
import { TrialTransitionsService } from '../../services/trial-transitions.service';
import type { TriaUpsertForm } from '../../utils-models/upsert-trial-form.model';
import { ButtonTrialActionsImplComponent } from '../../utils/components/button-trial-actions-impl/button-trial-actions-impl.component';
import { TrialGeneralDataStore } from '../shared/+state/trial-general-data.store';
import { FeatureTrialCreateFormComponent } from '../shared/components/form/feature-trial-create-form.component';
import { mapFormToCreateDto } from '../shared/utils/helper';

type ParamsComponent = { id: string };

export const injectionTokenTrialViewComponent = new InjectionToken<ParamsComponent>('params');
@Component({
  imports: [
    MatTabsModule,
    MatButton,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    FeatureTrialCreateFormComponent,
    FeaturePlanningGeneralDataShellComponent,
    ButtonTrialActionsImplComponent,
    Badge,
    TrialStatusLabelPipe,
  ],
  template: `
    <h2 class="text-base font-semibold text-gray-900 my-6">
      {{ 'TRIAL_CREATE_MODIFY_FORM.HEADING_PAGE' | translate }}
    </h2>
    <mat-tab-group class="inta-tabs-2" [preserveContent]="true">
      <mat-tab [label]="'TAPS_TOP.TRIAL_GENERAL_INFO' | translate">
        <div class="flex items-center justify-between mt-4 py-4">
          @if (store.trial(); as u) {
            @if (u !== null) {
              <div class="flex items-center gap-2">
                <ui-badge [status]="u.status">
                  {{ u.status | trialStatusLabel }}
                </ui-badge>
                @if (u.status === trialStatusEnum.CANCELLED || u.status === trialStatusEnum.VOIDED) {
                  @if (u.statusReason) {
                    <mat-icon matTooltipPosition="right" [matTooltip]="u.statusReason">info</mat-icon>
                  }
                }
              </div>
              @if (!editable()) {
                <inta-button-trial-actions-impl
                  [trial]="u"
                  (clicked)="handleClickTrialAction($event)"
                ></inta-button-trial-actions-impl>
              }
            }
          }
        </div>

        <inta-feature-trial-create-form
          [trialId]="id"
          [editable]="editable()"
          [formData]="this.store.trial()"
          (viewDocument)="handleViewDocument($event)"
          #form
        />

        @if (editable()) {
          <mat-card-actions class="flex justify-end mt-6 gap-4">
            <button mat-flat-button color="primary" type="button" (click)="save()">
              {{ 'COMMONS.SAVE' | translate }}
            </button>
            <button mat-stroked-button type="button" (click)="cancel()">
              {{ 'COMMONS.CANCEL' | translate }}
            </button>
          </mat-card-actions>
        }
      </mat-tab>
      <mat-tab [label]="'TAPS_TOP.TRIAL_PLANIFICATION' | translate">
        <ng-template matTabContent>
          <inta-feature-planning-general-data-shell [trial]="store.trial()!" [trialId]="id" />
        </ng-template>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TrialGeneralDataStore],
})
export class FeatureTrialViewShellComponent {
  readonly formComponent = viewChild(FeatureTrialCreateFormComponent);
  readonly #trialTransitionsService = inject(TrialTransitionsService);
  readonly #trialDataService = inject(TrialsDataService);
  readonly #trialDocsService = inject(TrialDocsService);
  readonly store = inject(TrialGeneralDataStore);
  readonly uiDialogs = inject(UiDialogService);
  readonly #injector = inject(Injector);

  readonly #rawParams = this.#injector.get(injectionTokenTrialViewComponent);
  readonly id = this.#rawParams.id;

  readonly onAction = this.#injector.get(injectionTokenTabCommand);

  readonly trialStatus = injectTrialStatus();
  readonly trialStatusEnum = TrialStatus;

  readonly editable = signal(false);
  #isDeletePending = false;

  constructor() {
    this.#trialTransitionsService.resetDelete();
    this.store.setTrialId(this.id);

    effect(() => {
      const value = this.#trialTransitionsService.actionResource.value();
      if (value !== undefined) {
        this.store.setTrialId(this.id);
      }
    });

    effect(() => {
      const status = this.#trialTransitionsService.deleteResource.status();
      if (status === 'resolved' && this.#isDeletePending) {
        this.#isDeletePending = false;
        this.onAction({ command: 'TRIAL_LIST' });
      }
    });

    effect(() => {
      const deleted = this.#trialTransitionsService.deleteResource.status();
      if (deleted === 'resolved') {
        this.onAction({ command: 'TRIAL_LIST' });
      }
    });

    effect(() => {
      const updated = this.#trialDataService.updateTrialResource.value();
      if (updated !== undefined) {
        this.#trialDataService.resetUpdateTrial();
        this.store.setTrialId(this.id);
        this.editable.set(false);
      }
    });
  }

  handleClickTrialAction(action: TrialActions) {
    if (action === 'MODIFY') {
      this.editable.set(true);
    } else if (action === 'CANCEL') {
      this.#cancelTrial();
    } else if (action === 'ANNUL') {
      this.#annulTrial();
    } else if (action === 'REMOVE') {
      this.#removeTrial();
    } else if (action === 'CLOSE') {
      this.#closeTrial();
    } else if (action === 'REOPEN') {
      this.#reopenTrial();
    } else if (action === 'REACTIVATE') {
      this.#reactivateTrial();
    }
  }

  handleViewDocument(documentId: string) {
    this.#trialDocsService.setFireTrialId(this.id);
    this.onAction({ command: 'TRIAL_VIEW_DOCUMENT', argument: documentId });
  }

  cancel() {
    this.store.setTrialId(this.#rawParams.id);
    this.editable.set(false);
  }

  save() {
    const form = this.formComponent()?.upsertTrialForm();
    if (form && form.valid()) {
      const data: Partial<TriaUpsertForm> = form.value();
      this.#trialDataService.updateTrial(this.store.trialId() || '', mapFormToCreateDto(data));
    } else {
      form?.markAsTouched();
    }
  }

  async #cancelTrial() {
    const reason = await this.uiDialogs.input({
      labelButtonConfirm: 'TRIAL_ACTIONS.CANCEL_BUTTON_CONFIRM',
      placeholder: 'TRIAL_ACTIONS.CANCEL_PLACEHOLDER',
      title: 'TRIAL_ACTIONS.CANCEL_TITLE',
      labelCancel: 'COMMONS.RETURN',
    });
    if (reason !== false) {
      this.#trialTransitionsService.cancel(this.id, reason);
    }
  }

  async #annulTrial() {
    const reason = await this.uiDialogs.input({
      labelButtonConfirm: 'TRIAL_ACTIONS.ANNUL_BUTTON_CONFIRM',
      placeholder: 'TRIAL_ACTIONS.ANNUL_PLACEHOLDER',
      title: 'TRIAL_ACTIONS.ANNUL_TITLE',
      labelCancel: 'COMMONS.RETURN',
    });
    if (reason !== false) {
      this.#trialTransitionsService.void(this.id, reason);
    }
  }

  async #removeTrial() {
    const ok = await this.uiDialogs.confirm({
      description: 'TRIAL_ACTIONS.REMOVE_DESCRIPTION',
      labelButtonConfirm: 'TRIAL_ACTIONS.REMOVE_BUTTON_CONFIRM',
      title: 'TRIAL_ACTIONS.REMOVE_TITLE',
      title2: 'TRIAL_ACTIONS.REMOVE_TITLE2',
      title2Param: this.store.trial()?.code,
    });
    if (ok) {
      this.#isDeletePending = true;
      this.#trialTransitionsService.delete(this.id);
    }
  }

  async #closeTrial() {
    const ok = await this.uiDialogs.confirm({
      description: 'TRIAL_ACTIONS.CLOSE_DESCRIPTION',
      labelButtonConfirm: 'TRIAL_ACTIONS.CLOSE_BUTTON_CONFIRM',
      title: 'TRIAL_ACTIONS.CLOSE_TITLE',
      title2: 'TRIAL_ACTIONS.CLOSE_TITLE2',
      title2Param: this.store.trial()?.code,
    });
    if (ok) {
      this.#trialTransitionsService.close(this.id);
    }
  }

  async #reopenTrial() {
    const ok = await this.uiDialogs.confirm({
      description: 'TRIAL_ACTIONS.REOPEN_DESCRIPTION',
      labelButtonConfirm: 'TRIAL_ACTIONS.REOPEN_BUTTON_CONFIRM',
      title: 'TRIAL_ACTIONS.REOPEN_TITLE',
      title2: 'TRIAL_ACTIONS.REOPEN_TITLE2',
      title2Param: this.store.trial()?.code,
    });
    if (ok) {
      this.#trialTransitionsService.reopen(this.id);
    }
  }

  async #reactivateTrial() {
    const ok = await this.uiDialogs.confirm({
      description: 'TRIAL_ACTIONS.REACTIVATE_DESCRIPTION',
      labelButtonConfirm: 'TRIAL_ACTIONS.REACTIVATE_BUTTON_CONFIRM',
      title: 'TRIAL_ACTIONS.REACTIVATE_TITLE',
      title2: 'TRIAL_ACTIONS.REACTIVATE_TITLE2',
      title2Param: this.store.trial()?.code,
    });
    if (ok) {
      this.#trialTransitionsService.reactivate(this.id);
    }
  }
}

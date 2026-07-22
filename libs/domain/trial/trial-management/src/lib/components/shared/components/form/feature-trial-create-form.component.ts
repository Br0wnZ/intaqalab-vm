import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormField, disabled, form, readonly, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { provideIntaDateAdapter } from '@intaqalab/config';
import { ClientsDataService } from '@intaqalab/data-access';
import { IntaSignalCheckboxComponent, IntaSignalSelectComponent } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { TrialTypeService } from '../../../../services/trial-type.service';
import { TrialSchedulerInlineComponent } from '../../../../trial-scheduler/components/inline/trial-scheduler-inline.component';
import type { TriaUpsertForm } from '../../../../utils-models/upsert-trial-form.model';
import { AssociatedTrialDialog } from '../../../associated-trial-dialog/associated-trial-dialog';
import { TrialDocs } from '../../../trial-docs/trial-docs';
import { mapDataToSignalForm } from '../../utils/helper';
import type { TrialCreateModifyForm } from './trial-create.model';

@Component({
  selector: 'inta-feature-trial-create-form',
  imports: [
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatIconModule,
    TranslatePipe,
    TrialSchedulerInlineComponent,
    TrialDocs,
    FormField,
    IntaSignalCheckboxComponent,
    IntaSignalSelectComponent,
  ],
  providers: [...provideIntaDateAdapter()],
  template: `
    <div class="mx-auto">
      <div class="flex flex-col lg:flex-row gap-6 items-start mb-6">
        <div class="flex-1 w-full lg:max-w-lg">
          <label for="trial-number" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_CREATE_MODIFY_FORM.CODE' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="trial-number"
              matInput
              [formField]="upsertTrialForm.code"
              [placeholder]="'TRIAL_CREATE_MODIFY_FORM.CODE' | translate"
            />
          </mat-form-field>
        </div>
        <div class="flex-1 flex flex-col gap-4 w-full lg:max-w-lg">
          <div class="flex items-center gap-4">
            <ui-signal-checkbox
              [formField]="upsertTrialForm.hasAssociatedTrial"
              [label]="'TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL' | translate"
            />
            @if (upsertTrialForm.hasAssociatedTrial().value()) {
              <div class="flex-1">
                <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
                  <input
                    id="associated-trial"
                    matInput
                    [formField]="upsertTrialForm.associatedTrialView"
                    [placeholder]="'TRIAL_CREATE_MODIFY_FORM.ASSOCIATED_TRIAL' | translate"
                  />
                  <button
                    mat-icon-button
                    matIconSuffix
                    type="button"
                    (click)="openTrialDialog('ASSOCIATED_TRIAL_DIALOG.ASSOCIATED_TITLE', 'associatedTrial')"
                  >
                    <mat-icon>add</mat-icon>
                  </button>
                </mat-form-field>
              </div>
            }
          </div>
          <div class="flex items-center gap-4">
            <ui-signal-checkbox
              [formField]="upsertTrialForm.hasLinkedTrial"
              [label]="'TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL' | translate"
            />
            @if (upsertTrialForm.hasLinkedTrial().value()) {
              <div class="flex-1">
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full">
                  <input
                    id="linked-trial"
                    matInput
                    [formField]="upsertTrialForm.linkedTrialView"
                    [placeholder]="'TRIAL_CREATE_MODIFY_FORM.LINKED_TRIAL' | translate"
                  />
                  <button
                    mat-icon-button
                    class="!absolute right-0 top-0 bottom-0 m-auto !text-gray-500"
                    (click)="openTrialDialog('ASSOCIATED_TRIAL_DIALOG.LINKED_TITLE', 'linkedTrial')"
                  >
                    <mat-icon matSuffix>add</mat-icon>
                  </button>
                </mat-form-field>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="mb-4">
        <label for="trial-description" class="block text-sm font-medium text-gray-700 mb-2">
          {{ 'TRIAL_CREATE_MODIFY_FORM.DESCRIPTION' | translate }}
        </label>
        <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
          <textarea
            id="trial-description"
            matInput
            rows="4"
            class="resize-none"
            [formField]="upsertTrialForm.description"
            [placeholder]="'TRIAL_CREATE_MODIFY_FORM.DESCRIPTION_PLACEHOLDER' | translate"
          ></textarea>
        </mat-form-field>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ui-inta-signal-select
          appearance="outline"
          [id]="'trial-type'"
          [valueKey]="'id'"
          [labelKey]="'name'"
          [formField]="upsertTrialForm.type"
          [label]="'TRIAL_CREATE_MODIFY_FORM.TYPE' | translate"
          [placeholder]="'TRIAL_CREATE_MODIFY_FORM.TYPE_PLACEHOLDER' | translate"
          [options]="trialTypeOptions()"
        />

        <ui-inta-signal-select
          appearance="outline"
          [id]="'trial-client'"
          [valueKey]="'id'"
          [labelKey]="'name'"
          [formField]="upsertTrialForm.client"
          [label]="'TRIAL_CREATE_MODIFY_FORM.CLIENT' | translate"
          [searchable]="true"
          [placeholder]="'TRIAL_CREATE_MODIFY_FORM.CLIENT_PLACEHOLDER' | translate"
          [options]="clientsService.clients()"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <label for="client-reference" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_CREATE_MODIFY_FORM.CLIENT_REFERENCE' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="client-reference"
              matInput
              [formField]="upsertTrialForm.clientReference"
              [placeholder]="'TRIAL_CREATE_MODIFY_FORM.CLIENT_REFERENCE_PLACEHOLDER' | translate"
            />
          </mat-form-field>
        </div>
        <div>
          <label for="requested-date" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_CREATE_MODIFY_FORM.REQUESTED_DATE' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <input
              id="requested-date"
              matInput
              [formField]="upsertTrialForm.requestedDate"
              [matDatepicker]="picker"
              [placeholder]="'TRIAL_CREATE_MODIFY_FORM.REQUESTED_DATE_PLACEHOLDER' | translate"
              (click)="picker.open()"
              #dateInput
            />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker (closed)="dateInput.blur()" #picker></mat-datepicker>
          </mat-form-field>
          @if (upsertTrialForm.requestedDate().touched() && upsertTrialForm.requestedDate().errors()) {
            @for (error of upsertTrialForm.requestedDate().errors(); track error) {
              <mat-error>{{ error.message | translate }}</mat-error>
            }
          }
        </div>
      </div>
      @if (trialId()) {
        <div class="w-full mb-6">
          @defer (on idle) {
            <inta-trial-scheduler-inline
              [trialId]="trialId()!"
              [trialNumber]="upsertTrialModel().code"
              [trialStatus]="trialStatus()"
            ></inta-trial-scheduler-inline>
          } @placeholder {
            <div class="h-10 bg-gray-100 rounded animate-pulse"></div>
          } @error {
            <div class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {{ 'TRIAL_CREATE_MODIFY_FORM.SCHEDULER_LOAD_ERROR' | translate }}
            </div>
          }
        </div>
      }
      <div>
        <div>
          <label for="trial-description" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_CREATE_MODIFY_FORM.OBSERVATIONS' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <textarea
              id="trial-description"
              matInput
              rows="4"
              class="resize-none"
              [formField]="upsertTrialForm.observations"
              [placeholder]="'TRIAL_CREATE_MODIFY_FORM.OBSERVATIONS_PLACEHOLDER' | translate"
            ></textarea>
          </mat-form-field>
        </div>
      </div>
      @if (trialId()) {
        @defer (on idle) {
          <inta-trial-docs [trialId]="trialId()!" (viewDocument)="viewDocument.emit($event)" />
        } @placeholder {
          <div class="h-20 bg-gray-100 rounded animate-pulse"></div>
        } @error {
          <div class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ 'TRIAL_CREATE_MODIFY_FORM.DOCUMENTS_LOAD_ERROR' | translate }}
          </div>
        }
      }
    </div>
  `,
  styles: ``,
})
export class FeatureTrialCreateFormComponent {
  readonly #dialog = inject(MatDialog);
  readonly editable = input.required<boolean>();
  readonly trialId = input<string | undefined>();
  readonly formData = input<TrialCreateModifyForm | null>();

  viewDocument = output<string>();

  protected readonly clientsService = inject(ClientsDataService);
  protected readonly trialsTypeResource = inject(TrialTypeService).fireTrialTypesResource;

  readonly trialTypeOptions = computed(() => {
    const typesResp = this.trialsTypeResource.value();
    return typesResp?.items ? typesResp.items.map((type) => ({ id: type.id, name: type.label })) : [];
  });

  readonly #emptyTrialModel: TriaUpsertForm = {
    code: '',
    hasAssociatedTrial: false,
    hasLinkedTrial: false,
    associatedTrial: '',
    associatedTrialView: '',
    linkedTrial: '',
    linkedTrialView: '',
    description: '',
    type: '',
    client: '',
    clientReference: '',
    requestedDate: '',
    observations: '',
  };

  readonly upsertTrialModel = signal<TriaUpsertForm>({ ...this.#emptyTrialModel });

  readonly upsertTrialForm = form(this.upsertTrialModel, (f) => {
    disabled(f, () => !this.editable());
    disabled(f.code);
    required(f.type);
    required(f.client);
    disabled(f.client, () => this.clientsService.hasError());
    disabled(f.associatedTrialView, ({ valueOf }) => valueOf(f.hasAssociatedTrial));
    readonly(f.associatedTrialView, ({ valueOf }) => valueOf(f.hasAssociatedTrial));
    disabled(f.linkedTrial, ({ valueOf }) => valueOf(f.hasLinkedTrial));
    readonly(f.linkedTrial, ({ valueOf }) => valueOf(f.hasLinkedTrial));
    readonly(f.requestedDate);
  });

  constructor() {
    effect(() => {
      const formData = this.formData();
      if (formData) {
        this.upsertTrialModel.set(mapDataToSignalForm(formData));
      } else {
        this.upsertTrialModel.set({ ...this.#emptyTrialModel });
      }
    });
  }

  trialStatus = computed(() => this.formData()?.status);

  async openTrialDialog(title: string, controlName: 'associatedTrial' | 'linkedTrial') {
    if (!this.editable()) {
      return;
    }

    const dialogRef = this.#dialog.open(AssociatedTrialDialog, {
      width: '600px',
      disableClose: true,
      data: { title },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      this.upsertTrialModel.update((current) => ({
        ...current,
        [controlName]: result.id,
        [controlName + 'View']: result.trialNumber,
      }));
    }
  }
}

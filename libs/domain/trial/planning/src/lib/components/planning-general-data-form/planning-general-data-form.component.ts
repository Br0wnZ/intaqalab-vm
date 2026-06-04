import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormField, disabled, form, required, submit, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CalendarTrialScheduleStore } from '@intaqalab/data-access';
import { Badge, IntaSignalSelectComponent } from '@intaqalab/ui';
import { NoNegativeValuesDirective, TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import type { TrialPlanningInfo, UpsertTrialPlanningInfo } from '../../utils-models/trial-planing-info.model';
import { PlanningScheduledDatesComponent } from '../planning-scheduled-dates/planning-scheduled-dates.component';
import { SpecimensManagmentDialog } from '../specimens-managment-dialog/specimens-managment-dialog';

export type PlanningGeneralData = {
  goal: string;
  specimen: { specimenId: string; batch: string }[];
  planningUser: string;
  observations: string;
  requeriments: string;
  additionalInfo: string;
  maxEmissionDates: number | string;
  percentageTechnicalUnits: number | string;
  percentageEndTrial: number | string;
  daysSignReport: number | string;
};

const DEFAULT_REQUERIMENTS = `- Las condiciones meteorológicas son adversas.
- Por cualquier otra circunstancia que afecte a la seguridad o validez de los resultados, según criterio del Jefe del Área de Ensayos.
- A petición del cliente.`;

@Component({
  selector: 'inta-planning-general-data-form',
  imports: [
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormField,
    IntaSignalSelectComponent,
    Badge,
    TrialStatusLabelPipe,
    PlanningScheduledDatesComponent,
    NoNegativeValuesDirective,
  ],
  template: `
    <div class="py-6">
      <div class="flex justify-between items-center mb-6">
        <div class="flex gap-2">
          <h2 class="bg-purple-200/50 text-purple-700 p-2 rounded-lg">
            {{ store.fireTrialCode() }}
          </h2>
          <ui-badge [status]="store.fireTrial()?.status">
            {{ store.fireTrial()!.status | trialStatusLabel }}
          </ui-badge>
        </div>
        <button mat-flat-button [disabled]="generalDataForm().invalid()" (click)="onValidate()">
          {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE' | translate }}
        </button>
      </div>
      <div class="space-y-6">
        <!-- Objeto de la prueba -->
        <div>
          <label for="goal" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.TRIAL_GOAL_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <textarea
              placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.TRIAL_GOAL_PLACEHOLDER' | translate }}"
              id="goal"
              matInput
              rows="3"
              class="w-full"
              [formField]="generalDataForm.goal"
            ></textarea>
          </mat-form-field>
        </div>

        <!-- Espécimen -->
        <div>
          <label for="specimen" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.SPECIMEN_LABEL' | translate }}
          </label>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input
                id="specimen"
                matInput
                readonly
                [disabled]="generalDataForm.specimen().disabled()"
                [placeholder]="'TRIAL_PLANNING.GENERAL_DATA_SECTION.SPECIMEN_PLACEHOLDER' | translate"
                [value]="specimenSummary()"
              />
            </mat-form-field>
            <button
              mat-flat-button
              type="button"
              class="w-fit justify-self-start"
              [disabled]="generalDataForm.specimen().disabled()"
              (click)="openSpecimenManagement()"
            >
              {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.MANAGE_SPECIMEN_BUTTON' | translate }}
            </button>
          </div>
          <input type="hidden" aria-hidden="true" />
          @if (generalDataForm.specimen().touched() && generalDataForm.specimen().errors()) {
            <div class="text-sm text-red-600 mt-1 space-y-1">
              @for (error of generalDataForm.specimen().errors(); track error) {
                <p>{{ error.message }}</p>
              }
            </div>
          }
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Usuario planificación -->
          <ui-inta-signal-select
            appearance="outline"
            [id]="'planningUser'"
            [valueKey]="'id'"
            [labelKey]="'fullname'"
            [formField]="generalDataForm.planningUser"
            [label]="'TRIAL_PLANNING.GENERAL_DATA_SECTION.PLANNING_USER_LABEL' | translate"
            [placeholder]="'TRIAL_PLANNING.GENERAL_DATA_SECTION.PLANNING_USER_PLACEHOLDER' | translate"
            [options]="store.users()"
          />

          <!-- Fechas programadas (solo lectura) -->
          <inta-planning-scheduled-dates [trialId]="store.fireTrialId()!" />
        </div>

        <!-- TODO -->
        <!-- <div class="flex flex-wrap gap-4 mb-8">
          <ui-signal-checkbox
            [formField]="generalDataForm.mockCheckbox"
            [label]="'Revisión hipocelométrica antes de la prueba'"
          /> -->
        <!-- <ui-signal-checkbox
            [formField]="generalDataForm.mockCheckbox"
            [label]="'Revisión hipocelométrica después de la prueba'"
          />
        </div> -->

        <!-- Observaciones -->
        <div>
          <label for="observations" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.OBSERVATIONS_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <textarea
              placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.OBSERVATIONS_PLACEHOLDER' | translate }}"
              id="observations"
              matInput
              rows="3"
              class="w-full"
              [formField]="generalDataForm.observations"
            ></textarea>
          </mat-form-field>
        </div>

        <!-- Requisitos para aprobación -->
        <div>
          <label for="requeriments" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.REQUERIMENTS_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <textarea
              placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.REQUERIMENTS_PLACEHOLDER' | translate }}"
              id="requeriments"
              matInput
              rows="8"
              class="w-full"
              [formField]="generalDataForm.requeriments"
            ></textarea>
          </mat-form-field>
        </div>

        <!-- Información adicional del cliente -->
        <div>
          <label for="additionalInfo" class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.ADDITIONAL_INFO_LABEL' | translate }}
          </label>
          <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
            <textarea
              placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.ADDITIONAL_INFO_PLACEHOLDER' | translate }}"
              id="additionalInfo"
              matInput
              rows="4"
              class="w-full"
              [formField]="generalDataForm.additionalInfo"
            ></textarea>
          </mat-form-field>
        </div>

        <!-- <div class="mb-8"> -->
        <!-- TODO -->
        <!-- <ui-signal-checkbox [formField]="generalDataForm.mockCheckbox" [label]="'Velocidad nominal'" /> -->
        <!-- </div> -->

        <!-- TODO -->
        <!-- <div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="flex flex-col">
              <label for="maxDaysReport" class="block text-xs text-gray-600 mb-2">Zona 1</label>
              <mat-form-field appearance="outline" class="w-full">
                <input placeholder="Zona 1" matInput type="number" />
              </mat-form-field>
            </div>

            <div class="flex flex-col">
              <label for="maxDaysReport" class="block text-xs text-gray-600 mb-2">Zona 2</label>
              <mat-form-field appearance="outline" class="w-full">
                <input placeholder="Zona 2" matInput type="number" />
              </mat-form-field>
            </div>

            <div class="flex flex-col">
              <label for="maxDaysReport" class="block text-xs text-gray-600 mb-2">Zona 3</label>
              <mat-form-field appearance="outline" class="w-full">
                <input placeholder="Zona 3" matInput type="number" />
              </mat-form-field>
            </div>

            <div class="flex flex-col">
              <label for="maxDaysReport" class="block text-xs text-gray-600 mb-2">Zona 4</label>
              <mat-form-field appearance="outline" class="w-full">
                <input placeholder="Zona 4" matInput type="number" />
              </mat-form-field>
            </div>

            <div class="flex flex-col">
              <label for="maxDaysReport" class="block text-xs text-gray-600 mb-2">Zona 5</label>
              <mat-form-field appearance="outline" class="w-full">
                <input placeholder="Zona 5" matInput type="number" />
              </mat-form-field>
            </div>
          </div>
        </div> -->

        <!-- Parámetros de control de fechas -->
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-4 border-b border-gray-300 pb-2">
            {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.DATE_PARAMS_CONTROL' | translate }}
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <!--Fecha límite para emisión de informe -->
            <!-- <div class="flex flex-col">
              <label for="limitDate" class="flex items-end text-xs text-gray-600 mb-2 h-8">
                {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.LIMIT_DATE_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.LIMIT_DATE_PLACEHOLDER' | translate }}"
                  id="limitDate"
                  matInput
                  [formField]="generalDataForm.limitDate"
                  [matDatepicker]="limitDatePicker"
                />
                <mat-datepicker-toggle matIconSuffix [for]="limitDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #limitDatePicker></mat-datepicker>
              </mat-form-field>
              @if (generalDataForm.limitDate().touched() && generalDataForm.limitDate().errors()) {
                @for (error of generalDataForm.limitDate().errors(); track error) {
                  <mat-error>{{ error.message }}</mat-error>
                }
              }
            </div> -->

            <!-- Máximo días para emisión de informe -->
            <div class="flex flex-col">
              <label for="maxDaysReport" class="flex items-end text-xs text-gray-600 mb-2 h-8">
                {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.MAX_DATE_REPORT_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.MAX_DATE_REPORT_PLACEHOLDER' | translate }}"
                  id="maxDaysReport"
                  libNoNegativeValues
                  matInput
                  type="number"
                  [formField]="generalDataForm.maxEmissionDates"
                />
              </mat-form-field>
            </div>

            <!-- Porcentaje para unidades técnicas -->
            <div class="flex flex-col">
              <label for="percentageTechnicalUnits" class="flex items-end text-xs text-gray-600 mb-2 h-8">
                {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.UNITS_PERCENTAGE_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.UNITS_PERCENTAGE_PLACEHOLDER' | translate }}"
                  id="percentageTechnicalUnits"
                  libNoNegativeValues
                  matInput
                  type="number"
                  [formField]="generalDataForm.percentageTechnicalUnits"
                />
                <span matSuffix class="mr-2 text-gray-500">%</span>
              </mat-form-field>
              @if (
                generalDataForm.percentageTechnicalUnits().touched() &&
                generalDataForm.percentageTechnicalUnits().errors()
              ) {
                @for (error of generalDataForm.percentageTechnicalUnits().errors(); track error) {
                  <mat-error>{{ error.message }}</mat-error>
                }
              }
            </div>

            <!-- Porcentaje para fin de prueba -->
            <div class="flex flex-col">
              <label for="percentageEndTrial" class="flex items-end text-xs text-gray-600 mb-2 h-8">
                {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.END_PERCENTAGE_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <div class="flex items-center justify-between w-full">
                  <input
                    placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.END_PERCENTAGE_PLACEHOLDER' | translate }}"
                    id="percentageEndTrial"
                    libNoNegativeValues
                    matInput
                    type="number"
                    class="flex-1"
                    [formField]="generalDataForm.percentageEndTrial"
                  />
                  <span matSuffix class="mr-2 text-gray-500">%</span>
                </div>
              </mat-form-field>
              @if (generalDataForm.percentageEndTrial().touched() && generalDataForm.percentageEndTrial().errors()) {
                @for (error of generalDataForm.percentageEndTrial().errors(); track error) {
                  <mat-error>{{ error.message }}</mat-error>
                }
              }
            </div>

            <!-- Días para firma del informe -->
            <div class="flex flex-col">
              <label for="daysSignReport" class="flex items-end text-xs text-gray-600 mb-2 h-8">
                {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.DAYS_SIGN_REPORT_LABEL' | translate }}
              </label>
              <mat-form-field appearance="outline" class="w-full">
                <input
                  placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.DAYS_SIGN_REPORT_PLACEHOLDER' | translate }}"
                  id="daysSignReport"
                  libNoNegativeValues
                  matInput
                  type="number"
                  [formField]="generalDataForm.daysSignReport"
                />
              </mat-form-field>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button mat-flat-button [disabled]="isSaving() || !generalDataForm().valid()" (click)="saveDraft()">
          @if (isSaving()) {
            <ng-container>
              <mat-icon class="animate-spin mr-2">sync</mat-icon>
            </ng-container>
          }
          {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.SAVE_DRAFT' | translate }}
        </button>
        <button mat-stroked-button [disabled]="isSaving()" (click)="cancel()">
          {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.CANCEL' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: ``,
})
export class PlanningGeneralDataFormComponent {
  protected readonly store = inject(PlanningGeneralDataStore);
  readonly #calendarStore = inject(CalendarTrialScheduleStore);
  readonly #cachedSpecimens = signal<
    Array<{ id: string; label?: string; name?: { es?: string; en?: string } | string; type?: string }>
  >([]);
  readonly dialog = inject(MatDialog);

  readonly isSaving = computed(() => this.store.isLoadingPlanningInfo());

  readonly formModel = signal<PlanningGeneralData>({
    goal: '',
    specimen: [],
    planningUser: '',
    observations: '',
    requeriments: DEFAULT_REQUERIMENTS,
    additionalInfo: '',
    maxEmissionDates: 20,
    percentageTechnicalUnits: 40,
    percentageEndTrial: 60,
    daysSignReport: 1,
  });
  #initialFormModel = this.formModel();
  #initialSelectedSpecimens: { specimenId: string; batch: string }[] = [];

  readonly fakeSpecimens = [
    { id: crypto.randomUUID(), label: 'Specimen 1' },
    { id: crypto.randomUUID(), label: 'Specimen 2' },
    { id: crypto.randomUUID(), label: 'Specimen 3' },
  ];

  readonly generalDataForm = form(this.formModel, (f) => {
    required(f.goal);
    // validate(f.specimen, ({ value }) => (value().length === 0 ? { kind: 'required', message: 'Requerido' } : null));
    required(f.planningUser);
    // disabled(f.specimen, () => this.store.isLoadingSpecimens());
    disabled(f.planningUser, () => this.store.isLoadingUsers());
    validate(f.percentageTechnicalUnits, ({ value, valueOf }) => {
      const sum = Number(value()) + Number(valueOf(f.percentageEndTrial));
      return !isNaN(sum) && sum !== 100
        ? { kind: 'invalid_percentage_range', message: 'La suma de los porcentajes deben ser 100' }
        : null;
    });
    validate(f.percentageEndTrial, ({ value, valueOf }) => {
      const sum = Number(value()) + Number(valueOf(f.percentageTechnicalUnits));
      return !isNaN(sum) && sum !== 100
        ? { kind: 'invalid_percentage_range', message: 'La suma de los porcentajes deben ser 100' }
        : null;
    });
  });

  readonly specimenSummary = computed(() => {
    const selectedSpecimens = this.store.selectedSpecimens() ?? [];
    const selectedIds = selectedSpecimens.map((item) => item.specimenId);
    if (!selectedIds.length) return '';

    const specimens = this.store.specimens() ?? [];
    const cachedSpecimens = this.#cachedSpecimens();
    const specimenList = specimens.length ? specimens : cachedSpecimens;
    if (!specimenList.length) return '';

    const getName = (s: (typeof specimenList)[number]): string => {
      if (s.label) return s.label;
      if (typeof s.name === 'string') return s.name as string;
      return (
        (s.name as { es?: string; en?: string } | undefined)?.es ||
        (s.name as { es?: string; en?: string } | undefined)?.en ||
        s.id
      );
    };

    const labelMap = new Map(specimenList.map((s) => [s.id, getName(s)]));
    return selectedIds.map((id) => labelMap.get(id) ?? id).join(', ');
  });

  constructor() {
    this.store.loadSpecimens();
    this.store.loadUsers();

    effect(() => {
      const specimens = this.store.specimens() ?? [];
      if (specimens.length) {
        this.#cachedSpecimens.set(specimens);
      }
    });

    effect(() => {
      const planningInfo: TrialPlanningInfo | undefined = this.store.planningInfo();
      if (planningInfo) {
        const mappedModel = this.#mapDataToFormModel(planningInfo);
        const selectedSpecimens = planningInfo.specimens.map((s) => ({
          specimenId: s.specimenId,
          batch: s.batch ?? '',
        }));
        this.formModel.set(mappedModel);
        this.#initialFormModel = mappedModel;
        this.#initialSelectedSpecimens = structuredClone(selectedSpecimens);
        this.store.setSelectedSpecimens(selectedSpecimens);
        untracked(() => {
          this.generalDataForm.percentageTechnicalUnits().markAsTouched();
          this.generalDataForm.percentageEndTrial().markAsTouched();
        });
      }
    });
    effect(() => {
      const status = this.store.updatePlanningInfoStatus();
      if (status === 'resolved') {
        this.store.reloadPlanningInfo();
      }
    });

    effect(() => {
      this.#calendarStore.scheduleChangeTrigger();
      untracked(() => {
        this.store.reloadPlanningInfo();
      });
    });
  }

  openSpecimenManagement(): void {
    const specimensSource = this.store.specimens() ?? [];
    const specimens = specimensSource.length ? specimensSource : this.#cachedSpecimens();
    const planningInfo = this.store.planningInfo();
    const fireTrialId = this.store.fireTrialId();

    const dialogRef = this.dialog.open(SpecimensManagmentDialog, {
      width: '600px',
      data: {
        specimens,
        selectedSpecimenIds: this.generalDataForm
          .specimen()
          .value()
          .map((entry) => entry.specimenId),
        selectedSpecimens: this.store.selectedSpecimens(),
        planningInfo,
        fireTrialId,
      },
    });

    dialogRef.afterClosed().subscribe((result: { specimenId: string; batch: string }[] | undefined) => {
      if (result !== undefined) {
        this.store.setSelectedSpecimens(result);
      }
    });
  }

  async onValidate() {
    await submit(this.generalDataForm, async () => {
      const data = this.#mapFormDataToUpsertModel();
      this.store.updatePlanningInfo(data);
    });
  }

  cancel(): void {
    // Omit no saved form changes
    this.store.reloadPlanningInfo();
    this.formModel.set(this.#deepClone(this.#initialFormModel));
    this.store.setSelectedSpecimens(structuredClone(this.#initialSelectedSpecimens));
  }

  saveDraft(): void {
    this.store.updatePlanningInfo(this.#mapFormDataToUpsertModel());
  }

  #deepClone(data: PlanningGeneralData): PlanningGeneralData {
    return structuredClone(data);
  }

  #mapFormDataToUpsertModel(): UpsertTrialPlanningInfo {
    const formValue = this.generalDataForm().value();
    return {
      goal: formValue.goal,
      specimens: this.store.selectedSpecimens() ?? [],
      planningUserId: formValue.planningUser,
      observations: formValue.observations,
      requirements: formValue.requeriments,
      additionalInfo: formValue.additionalInfo,
      dateControl: {
        maxEmissionDates: Number(formValue.maxEmissionDates),
        percentageTechnicalUnits: Number(formValue.percentageTechnicalUnits),
        percentageEndTrial: Number(formValue.percentageEndTrial),
        daysSignReport: Number(formValue.daysSignReport),
      },
    };
  }

  #mapDataToFormModel(data: TrialPlanningInfo): PlanningGeneralData {
    return {
      goal: data.goal,
      specimen: data.specimens.map((s) => ({
        specimenId: s.specimenId,
        batch: s.batch ?? '',
      })),
      planningUser: data.planningUser.id,
      observations: data.observations,
      requeriments: data.requirements || DEFAULT_REQUERIMENTS,
      additionalInfo: data.additionalInfo,
      maxEmissionDates: String(data.dateControl.maxEmissionDates),
      percentageTechnicalUnits: String(data.dateControl.percentageTechnicalUnits),
      percentageEndTrial: String(data.dateControl.percentageEndTrial),
      daysSignReport: String(data.dateControl.daysSignReport),
    };
  }
}

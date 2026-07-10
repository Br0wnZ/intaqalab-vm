import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormField, disabled, form, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CalendarTrialScheduleStore } from '@intaqalab/data-access';
import { TrialStatus } from '@intaqalab/models';
import { Badge, IntaIconComponent } from '@intaqalab/ui';
import { NoNegativeValuesDirective, TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { PlanningPermissionsService } from '../../planning-permissions.service';
import type {
  RatingCriteria as RatingCriteriaModel,
  RatingCriteriaUnits,
  TrialPlanningInfo,
  UpsertTrialPlanningInfo,
} from '../../utils-models/trial-planing-info.model';
import { PlanningScheduledDatesComponent } from '../planning-scheduled-dates/planning-scheduled-dates.component';
import { RatingCriteria } from '../rating-criteria/rating-criteria';
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
  hypochelometricReviewBefore: boolean;
  hypochelometricReviewAfter: boolean;
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
    MatCheckboxModule,
    FormField,
    Badge,
    IntaIconComponent,
    TrialStatusLabelPipe,
    PlanningScheduledDatesComponent,
    NoNegativeValuesDirective,
    RatingCriteria,
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
        @if (!readonly() && canValidate() && isUnderReview()) {
          <div class="flex items-center gap-2">
            @if (validationErrors().length > 0) {
              <button
                type="button"
                class="self-center text-client-primary hover:text-client-primary/80 transition-colors relative"
                [attr.aria-label]="validationErrorsTitle()"
                (mouseenter)="showValidationErrorsTooltip = true"
                (mouseleave)="showValidationErrorsTooltip = false"
                (click)="showValidationErrorsTooltip = !showValidationErrorsTooltip"
              >
                <ui-inta-icon name="alert" size="lg" />
                @if (showValidationErrorsTooltip) {
                  <div
                    class="absolute top-full right-0 mt-2 w-80 bg-slate-800 text-white rounded-lg shadow-lg p-4 text-sm z-50"
                  >
                    <div
                      class="absolute bottom-full right-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-800"
                    ></div>
                    <div class="font-semibold mb-3">{{ validationErrorsTitle() }}</div>
                    <ul class="space-y-2 leading-relaxed list-disc list-inside">
                      @for (error of validationErrors(); track error) {
                        <li>{{ error }}</li>
                      }
                    </ul>
                  </div>
                }
              </button>
            }
            <button
              mat-flat-button
              [disabled]="generalDataForm().invalid() || !store.isPlanningValidable() || store.isValidatingPlanning()"
              (click)="onValidate()"
            >
              {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATE' | translate }}
            </button>
          </div>
        }
        @if (canModifyPlanning() && isPlanned()) {
          <button mat-stroked-button [disabled]="store.isUnlockingPlanning()" (click)="onUnlockPlanning()">
            {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.MODIFY_PLANNING' | translate }}
          </button>
        }
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
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-[2rem]">
            <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
              <input
                id="specimen"
                matInput
                readonly
                [disabled]="generalDataForm.specimen().disabled()"
                [placeholder]="'TRIAL_PLANNING.GENERAL_DATA_SECTION.SPECIMEN_PLACEHOLDER' | translate"
                [value]="specimenSummary()"
              />
              @if (generalDataForm.specimen().touched() && generalDataForm.specimen().errors()) {
                @for (error of generalDataForm.specimen().errors(); track error) {
                  <mat-error class="text-sm mt-[8px]">{{ error.message | translate }}</mat-error>
                }
              }
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
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Usuario planificación -->
          <div class="flex flex-col">
            <label for="planningUser" class="block text-sm font-medium mb-2">
              {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.PLANNING_USER_LABEL' | translate }}
            </label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-select
                placeholder="{{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.PLANNING_USER_PLACEHOLDER' | translate }}"
                id="planningUser"
                [aria-label]="'TRIAL_PLANNING.GENERAL_DATA_SECTION.PLANNING_USER_LABEL' | translate"
                [formField]="generalDataForm.planningUser"
              >
                @for (opt of store.users(); track opt.id) {
                  <mat-option [value]="opt.id">{{ opt.fullname }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Fechas programadas (solo lectura) -->
          <inta-planning-scheduled-dates [trialId]="store.fireTrialId()!" />
        </div>

        <div class="mb-8 space-y-2">
          <p class="text-sm font-medium text-gray-700">
            {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.HYPOCHELOMETRIC_REVIEW_LABEL' | translate }}
          </p>
          <div class="flex flex-wrap gap-4">
            <mat-checkbox [formField]="generalDataForm.hypochelometricReviewBefore">
              <span>
                {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.HYPOCHELOMETRIC_REVIEW_BEFORE_LABEL' | translate }}
              </span>
            </mat-checkbox>
            <mat-checkbox [formField]="generalDataForm.hypochelometricReviewAfter">
              <span>
                {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.HYPOCHELOMETRIC_REVIEW_AFTER_LABEL' | translate }}
              </span>
            </mat-checkbox>
          </div>
        </div>

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

        <!-- Checkbox para mostrar criterios de calificación -->
        <div>
          <mat-checkbox [checked]="showRatingCriteria()" (change)="showRatingCriteria.set(!showRatingCriteria())">
            <span>
              {{ 'TRIAL_PLANNING.GENERAL_DATA_SECTION.SHOW_RATING_CRITERIA' | translate }}
            </span>
          </mat-checkbox>
        </div>

        @if (showRatingCriteria()) {
          <!-- Criterios de calificación -->
          <inta-rating-criteria [readonly]="readonly()" [(ratingCriteria)]="ratingCriteriaState" />
        }

        <!-- Información adicional del cliente -->
        <div>
          <label for="additionalInfo" class="block text-sm font-medium text-gray-700 mt-4 mb-2">
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

        <!-- Parámetros de control de fechas -->
        <div>
          <span class="block text-sm font-medium text-gray-700 mb-2 border-b border-gray-300 pb-2">
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
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
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
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
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
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
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
              <mat-form-field appearance="outline" class="w-full" [subscriptSizing]="'dynamic'">
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
      @if (!readonly()) {
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
      }
    </div>
  `,
  styles: ``,
})
export class PlanningGeneralDataFormComponent {
  /** Propagado desde el shell: true cuando el usuario no tiene permisos de edición */
  readonly readonly = input<boolean>(false);

  readonly showRatingCriteria = signal<boolean>(false);
  readonly ratingCriteriaState = signal<RatingCriteriaModel | undefined>(undefined);
  readonly ratingCriteriaUnitsState = signal<RatingCriteriaUnits | undefined>(undefined);

  protected readonly store = inject(PlanningGeneralDataStore);
  readonly #calendarStore = inject(CalendarTrialScheduleStore);
  readonly #planningPermissions = inject(PlanningPermissionsService);
  readonly #cachedSpecimens = signal<
    Array<{ id: string; label?: string; name?: { es?: string; en?: string } | string; type?: string }>
  >([]);
  readonly dialog = inject(MatDialog);
  #specimenSynced = false;

  /** Puede validar planificación (pasar a PLANNED) */
  readonly canValidate = computed(() => this.#planningPermissions.canValidatePlanning());

  /** Puede modificar (desbloquear) una planificación ya validada */
  readonly canModifyPlanning = computed(() => this.#planningPermissions.canModifyPlanning());

  readonly isUnderReview = computed(() => this.store.fireTrial()?.status === TrialStatus.UNDER_REVIEW);
  readonly isPlanned = computed(() => this.store.fireTrial()?.status === TrialStatus.PLANNED);

  readonly #translate = inject(TranslateService);
  protected showValidationErrorsTooltip = false;
  readonly validationErrors = computed(() => this.store.planningValidationErrors());
  readonly validationErrorsTitle = computed(() =>
    this.#translate.instant('TRIAL_PLANNING.GENERAL_DATA_SECTION.VALIDATION_ERRORS_TITLE'),
  );

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
    hypochelometricReviewBefore: false,
    hypochelometricReviewAfter: false,
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
    validate(f.specimen, ({ value }) =>
      value().length === 0
        ? { kind: 'required', message: 'TRIAL_PLANNING.GENERAL_DATA_SECTION.SPECIMEN_REQUIRED' }
        : null,
    );
    required(f.planningUser);
    // En modo readonly o cargando, todos los campos se deshabilitan
    disabled(f.goal, () => this.readonly() || false);
    disabled(f.observations, () => this.readonly() || false);
    disabled(f.requeriments, () => this.readonly() || false);
    disabled(f.additionalInfo, () => this.readonly() || false);
    disabled(f.maxEmissionDates, () => this.readonly() || false);
    disabled(f.percentageTechnicalUnits, () => this.readonly() || false);
    disabled(f.percentageEndTrial, () => this.readonly() || false);
    disabled(f.daysSignReport, () => this.readonly() || false);
    disabled(f.specimen, () => this.readonly() || this.store.isLoadingSpecimens());
    disabled(f.planningUser, () => this.readonly() || this.store.isLoadingUsers());
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
        const ratingCriteria = structuredClone(planningInfo.ratingCriteria);
        this.ratingCriteriaState.set(ratingCriteria);
        this.ratingCriteriaUnitsState.set(planningInfo.ratingCriteriaUnits);
        this.showRatingCriteria.set(this.#hasRatingCriteriaValues(ratingCriteria));
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

        let planningUserId;
        untracked(() => {
          planningUserId = this.formModel().planningUser;
        });

        if (planningUserId) this.store.updateAssociatedUser(planningUserId);
      }
    });

    effect(() => {
      this.#calendarStore.scheduleChangeTrigger();
      untracked(() => {
        this.store.reloadPlanningInfo();
      });
    });

    // Sync selectedSpecimens from store → formModel.specimen + mark touched
    // This keeps Signal Forms validation reactive when the dialog adds/removes specimens
    effect(() => {
      const selected = this.store.selectedSpecimens() ?? [];
      const mapped = selected.map((s) => ({ specimenId: s.specimenId, batch: s.batch ?? '' }));
      untracked(() => {
        this.formModel.update((m) => ({ ...m, specimen: mapped }));
        if (this.#specimenSynced) {
          // Only mark touched after the first sync — avoids showing error on initial load
          this.generalDataForm.specimen().markAsTouched();
        } else {
          this.#specimenSynced = true;
        }
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

  onValidate(): void {
    this.store.validatePlanning();
  }

  onUnlockPlanning(): void {
    this.store.unlockPlanning();
  }

  cancel(): void {
    // Omit no saved form changes
    this.store.reloadPlanningInfo();
    this.formModel.set(this.#deepClone(this.#initialFormModel));
    this.store.setSelectedSpecimens(structuredClone(this.#initialSelectedSpecimens));
    const initialCriteria = this.store.planningInfo()?.ratingCriteria;
    this.ratingCriteriaState.set(structuredClone(initialCriteria));
    this.showRatingCriteria.set(this.#hasRatingCriteriaValues(initialCriteria));
    const initialUnits = this.store.planningInfo()?.ratingCriteriaUnits;
    this.ratingCriteriaUnitsState.set(initialUnits);
  }

  saveDraft(): void {
    this.store.updatePlanningInfo(this.#mapFormDataToUpsertModel());
  }

  #deepClone(data: PlanningGeneralData): PlanningGeneralData {
    return structuredClone(data);
  }

  #hasRatingCriteriaValues(criteria: RatingCriteriaModel | undefined): boolean {
    if (!criteria) return false;
    return Object.values(criteria).some((row) => Object.values(row ?? {}).some((value) => !!value));
  }

  #mapFormDataToUpsertModel(): UpsertTrialPlanningInfo {
    const formValue = this.generalDataForm().value();
    const basePayload: UpsertTrialPlanningInfo = {
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
      hypochelometricReviewBefore: formValue.hypochelometricReviewBefore,
      hypochelometricReviewAfter: formValue.hypochelometricReviewAfter,
    };

    // Solo incluir ratingCriteria y ratingCriteriaUnits si el checkbox está habilitado
    if (this.showRatingCriteria()) {
      basePayload.ratingCriteria = this.ratingCriteriaState();
      basePayload.ratingCriteriaUnits = this.ratingCriteriaUnitsState() || {
        speedUnit: 'M_S',
        pressureUnit: 'BAR',
      };
    }

    return basePayload;
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
      hypochelometricReviewBefore: !!data.hypochelometricReviewBefore,
      hypochelometricReviewAfter: !!data.hypochelometricReviewAfter,
    };
  }
}

import { Component, type OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule, type MatTabChangeEvent } from '@angular/material/tabs';
import type { TrialCreateModifyForm } from '@intaqalab/models';
import { FeaturePlanningGeneralDataShellComponent, type PlanningFieldChangeEvent } from '@intaqalab/planning';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import {
  PlanningModificationsStore,
  type PlanningChange,
  type PlanningModification,
} from '../../../data-access/planning-modifications';
import { PlanningModificationsTab } from './modifications-tab/planning-modifications-tab';
import type {
  ModificationClassificationChangeEvent,
  ModifyPlanningDialogData,
  ModifyPlanningDialogResult,
  PlanningBaselineSnapshot,
} from './modify-planning-dialog.models';
import { PlanningChangeDetector } from './planning-change-detector';

function buildInitialBaseline(trial: TrialCreateModifyForm | null): PlanningBaselineSnapshot {
  if (!trial) {
    return {};
  }

  return {
    'general-data::description::global': trial.description ?? null,
    'general-data::clientReference::global': trial.clientReference ?? null,
    'general-data::requestedDate::global': trial.requestedDate ?? null,
    'general-data::observations::global': trial.observations ?? null,
  };
}

@Component({
  selector: 'inta-modify-planning-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    TranslatePipe,
    FeaturePlanningGeneralDataShellComponent,
    PlanningModificationsTab,
  ],
  providers: [PlanningModificationsStore],
  template: `
    <div class="flex flex-col h-full w-full bg-white overflow-hidden">
      <header class="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <mat-icon class="text-purple-700 shrink-0">tune</mat-icon>
          <h2 class="text-lg font-semibold text-gray-900 m-0 truncate">
            @if (trialCode()) {
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.TITLE_WITH_CODE' | translate: { code: trialCode() } }}
            } @else {
              {{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.TITLE' | translate }}
            }
          </h2>
        </div>

        <button mat-stroked-button type="button" (click)="onClose()">
          <mat-icon>close</mat-icon>
          <span>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.CLOSE_BTN' | translate }}</span>
        </button>
      </header>

      <div class="flex-1 min-h-0 flex flex-col px-6 pb-4 overflow-hidden">
        <mat-tab-group class="flex-1 min-h-0" (selectedTabChange)="onTabChange($event.index)">
          <mat-tab [label]="'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.TAB_PLANNING' | translate">
            <div class="h-full overflow-y-auto pt-2">
              <inta-feature-planning-general-data-shell
                [trial]="fireTrial()"
                [trialId]="fireTrialId()"
                [mode]="'execution-modification'"
                [executedShotIds]="executedShotIds()"
                (planningFieldChanged)="onPlanningFieldChanged($event)"
              />
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <span class="inline-flex items-center gap-2">
                <span>{{ 'TRIAL_EXECUTION.PLANNING_MODIFICATION.DIALOG.TAB_MODIFICATIONS' | translate }}</span>
                @if (modificationsCount() > 0) {
                  <span
                    class="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"
                  >
                    {{ modificationsCount() }}
                  </span>
                }
              </span>
            </ng-template>

            <inta-planning-modifications-tab
              [modifications]="modifications()"
              [validationErrors]="validationErrors()"
              [hasPendingModifications]="hasPendingModifications()"
              [isSaving]="isSaving()"
              [isLoading]="isLoading()"
              [canSave]="canSave()"
              [errorMessage]="error()"
              (classificationChange)="onClassificationChange($event)"
              (saveChanges)="onSaveChanges()"
            />
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
})
export class ModifyPlanningDialog implements OnInit {
  readonly #dialogRef = inject<MatDialogRef<ModifyPlanningDialog, ModifyPlanningDialogResult>>(MatDialogRef);
  readonly #data = inject<ModifyPlanningDialogData>(MAT_DIALOG_DATA);
  readonly #store = inject(PlanningModificationsStore);
  readonly #translate = inject(TranslateService);
  readonly #toastr = inject(ToastrService, { optional: true });
  readonly #changeDetector = new PlanningChangeDetector();

  readonly #savedDuringSession = signal(false);
  readonly #hadAcceptedChanges = signal(false);

  protected readonly fireTrialId = computed(() => this.#data.fireTrialId);
  protected readonly fireTrial = computed<TrialCreateModifyForm | undefined>(() => this.#data.fireTrial ?? undefined);
  protected readonly trialCode = computed(() => this.#data.fireTrial?.code?.trim() ?? '');
  protected readonly executedShotIds = computed<ReadonlyArray<string>>(() => this.#data.executedShotIds ?? []);

  protected readonly modifications = computed<ReadonlyArray<PlanningModification | PlanningChange>>(() => {
    const changes = this.#store.changes();
    const local = this.#store.modifications();
    if (changes.length > 0) {
      const localIds = new Set(local.map((m) => m.id));
      const nonOverlappingChanges = changes.filter((c) => !localIds.has(c.id));
      return [...nonOverlappingChanges, ...local];
    }
    return local;
  });
  protected readonly modificationsCount = computed(() => this.modifications().length);
  protected readonly validationErrors = computed(() => this.#store.validationErrors());
  protected readonly hasPendingModifications = computed(() => this.#store.hasPendingModifications());
  protected readonly isSaving = computed(() => this.#store.isSaving());
  protected readonly isLoading = computed(() => this.#store.isLoading());
  protected readonly canSave = computed(() => this.#store.canSave());
  protected readonly error = computed(() => this.#store.error());
  protected readonly changes = computed(() => this.#store.changes());
  protected readonly isLoadingChanges = computed(() => this.#store.isLoadingChanges());

  onTabChange(index: number): void {
    if (index === 1) {
      this.#store.loadChanges(this.#data.fireTrialId, this.#data.centerId);
    }
  }

  ngOnInit(): void {
    this.#changeDetector.captureBaseline(buildInitialBaseline(this.#data.fireTrial));
    void this.#store.loadModifications(this.#data.fireTrialId, this.#data.centerId);
  }

  onPlanningFieldChanged(event: PlanningFieldChangeEvent): void {
    if (this.#store.hasPendingModifications()) {
      return;
    }

    const result = this.#changeDetector.detectFieldChange(event);
    if (result.type === 'remove') {
      this.#store.removeModificationByKey(result.key);
      return;
    }

    this.#store.addModification(result.modification);
  }

  onClassificationChange(event: ModificationClassificationChangeEvent): void {
    this.#store.updateClassification(event.modId, event.classification);
  }

  async onSaveChanges(): Promise<void> {
    const response = await this.#store.validateAndSave();
    if (!response) {
      if (this.#store.error()) {
        this.#toastr?.error(
          this.#translate.instant('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.SAVE_ERROR'),
        );
      }
      return;
    }

    this.#savedDuringSession.set(true);
    if (response.acceptedCount > 0) {
      this.#hadAcceptedChanges.set(true);
    }

    const successKey =
      response.pendingCount > 0
        ? 'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.SAVE_SUCCESS_PENDING'
        : 'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.SAVE_SUCCESS';
    this.#toastr?.success(this.#translate.instant(successKey));
  }

  onClose(): void {
    const result: ModifyPlanningDialogResult = {
      saved: this.#savedDuringSession(),
      hasAcceptedChanges: this.#hadAcceptedChanges(),
      hasPendingChanges: this.#store.hasPendingModifications(),
    };
    this.#dialogRef.close(result);
  }
}

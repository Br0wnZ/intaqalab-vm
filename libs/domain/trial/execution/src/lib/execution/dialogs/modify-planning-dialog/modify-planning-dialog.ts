import { Component, type OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { type MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { injectTrialShots } from '@intaqalab/data-access-planning';
import {
  FeaturePlanningGeneralDataShellComponent,
  type PlanningFormSnapshotEvent,
  type PlanningValueReferences,
} from '@intaqalab/planning';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

import { PlanningChangesStore } from '../../../data-access/planning-modifications';
import { collectPlanningValueReferences } from '../../../data-access/planning-modifications/planning-change-value.mapper';
import type { PlanningChange as ApiPlanningChange, PlanningDetectedChange } from '../../models/planning-changes.models';
import { ConfirmDiscardChanges, type ConfirmDiscardChangesDialogData } from './confirm-discard-changes';
import { PlanningModificationsTab } from './modifications-tab/planning-modifications-tab';
import type {
  ModificationClassificationChangeEvent,
  ModifyPlanningDialogData,
  ModifyPlanningDialogResult,
  PlanningChangeInclusionChangeEvent,
} from './modify-planning-dialog.models';
import { PlanningChangeDetector } from './planning-change-detector';

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
    ConfirmDiscardChanges,
  ],
  providers: [PlanningChangesStore],
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
            <div class="h-full min-w-0 overflow-y-auto pt-2">
              <inta-feature-planning-general-data-shell
                [trial]="fireTrial()"
                [trialId]="fireTrialId()"
                [mode]="'execution-modification'"
                [executedShotIds]="executedShotIds()"
                [forcedReadonly]="isLocked()"
                (planningFormChanged)="onPlanningFormChanged($event)"
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
              [shots]="shots()"
              [valueReferences]="valueReferences()"
              [validationErrors]="validationErrors()"
              [hasPendingModifications]="hasPendingModifications()"
              [isSaving]="isSaving()"
              [isLoading]="isLoading()"
              [canSave]="canSave()"
              [canRetry]="canRetry()"
              [errorMessage]="error()"
              (classificationChange)="onClassificationChange($event)"
              (includeChange)="onIncludeChange($event)"
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
  readonly #changesStore = inject(PlanningChangesStore);
  readonly #dialog = inject(MatDialog);
  readonly #translate = inject(TranslateService);
  readonly #toastr = inject(ToastrService, { optional: true });
  readonly #changeDetector = new PlanningChangeDetector();
  readonly #trialShots = injectTrialShots();

  protected readonly shots = this.#trialShots.shots;
  protected readonly valueReferences = signal<PlanningValueReferences>({});

  readonly #savedDuringSession = signal(false);
  readonly #hadAcceptedChanges = signal(false);

  protected readonly fireTrialId = computed(() => this.#data.fireTrialId);
  protected readonly fireTrial = computed(() => this.#data.fireTrial ?? undefined);
  protected readonly trialCode = computed(() => this.#data.fireTrial?.code?.trim() ?? '');
  protected readonly executedShotIds = this.#data.executedShotIds;

  protected readonly modifications = computed<ReadonlyArray<PlanningDetectedChange | ApiPlanningChange>>(() =>
    this.#changesStore.rows(),
  );
  protected readonly modificationsCount = computed(() => this.modifications().length);
  protected readonly validationErrors = computed(() => this.#changesStore.validationErrors());
  protected readonly hasPendingModifications = computed(() => this.#changesStore.hasPendingChanges());
  protected readonly isLocked = computed(
    () =>
      !this.#data.executionProgressReady() ||
      !this.#changesStore.canEdit() ||
      this.hasPendingModifications() ||
      this.isSaving() ||
      this.canRetry(),
  );
  protected readonly isSaving = computed(() => this.#changesStore.isSaving());
  protected readonly isLoading = computed(() => this.#changesStore.isLoading());
  protected readonly canSave = computed(() => this.#changesStore.canSave());
  protected readonly canRetry = computed(() => this.#changesStore.savePhase() === 'recovery-required');
  protected readonly error = computed(
    () =>
      this.#changesStore.error() ??
      (this.#changesStore.changesError() ? 'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.LOAD_ERROR' : null),
  );

  onTabChange(index: number): void {
    if (index === 1) {
      this.#changesStore.load(this.#data.fireTrialId);
    }
  }

  ngOnInit(): void {
    this.#changesStore.load(this.#data.fireTrialId);
  }

  onPlanningFormChanged(event: PlanningFormSnapshotEvent): void {
    this.valueReferences.update((previous) => collectPlanningValueReferences(event, previous));
    const changes = this.#changeDetector.replaceFormSnapshot(event, {
      fireTrialId: this.#data.fireTrialId,
      executedShotIds: this.#data.executedShotIds(),
    });
    this.#changesStore.replaceSectionChanges(event.section, changes, event.valid ?? true);
  }

  onClassificationChange(event: ModificationClassificationChangeEvent): void {
    this.#changesStore.updateClassification(event.modId, event.classification);
  }

  onIncludeChange(event: PlanningChangeInclusionChangeEvent): void {
    this.#changesStore.toggleRemoteApply(event.changeId, event.selected);
  }

  async onSaveChanges(): Promise<void> {
    const response = this.canRetry() ? await this.#changesStore.retryApply() : await this.#changesStore.save();
    if (!response) {
      if (this.#changesStore.error()) {
        this.#toastr?.error(this.#translate.instant('TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.SAVE_ERROR'));
      }
      return;
    }

    this.#savedDuringSession.set(true);
    if (response.acceptedCount > 0) {
      this.#hadAcceptedChanges.set(true);
      if (response.pendingCount === 0) this.#changeDetector.rebaseFormSnapshots();
    }

    const successKey =
      response.pendingCount > 0
        ? 'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.SAVE_SUCCESS_PENDING'
        : 'TRIAL_EXECUTION.PLANNING_MODIFICATION.MESSAGES.SAVE_SUCCESS';
    this.#toastr?.success(this.#translate.instant(successKey));
  }

  async onClose(): Promise<void> {
    if (this.isSaving()) return;
    const hasLocalChanges = this.#changesStore.localChanges().length > 0;
    const hasUnsavedChanges = this.#changesStore.hasUnsavedChanges();
    if (hasUnsavedChanges || this.canRetry()) {
      const data: ConfirmDiscardChangesDialogData = { hasLocalChanges };
      const confirmed = await firstValueFrom(
        this.#dialog
          .open<ConfirmDiscardChanges, ConfirmDiscardChangesDialogData, boolean>(ConfirmDiscardChanges, { data })
          .afterClosed(),
        { defaultValue: false },
      );
      if (!confirmed) return;
    }

    const result: ModifyPlanningDialogResult = {
      saved: this.#savedDuringSession(),
      hasAcceptedChanges: this.#hadAcceptedChanges(),
      hasPendingChanges: this.#changesStore.hasPendingChanges(),
    };
    this.#dialogRef.close(result);
  }
}

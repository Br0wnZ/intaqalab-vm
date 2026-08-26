import { Location } from '@angular/common';
import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ErrorState, Skeleton } from '@intaqalab/ui';
import { explicitEffect, injectParams } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import type { TrialSelectorDialogResult } from '../../dialogs/trial-selector-dialog';
import { TrialSelectorDialog } from '../../dialogs/trial-selector-dialog';
import { ExecutionPageFacade } from '../../services/execution-page-facade.service';
import { WidgetStateService } from '../../services/widget-state.service';
import { WidgetLibrary } from '../../widgets/widget-library/widget-library';
import { ExecutionGridComponent } from './execution-grid/execution-grid';
import { ExecutionHeader } from './execution-header/execution-header';

@Component({
  selector: 'inta-execution',
  imports: [TranslateModule, ErrorState, Skeleton, ExecutionGridComponent, ExecutionHeader, WidgetLibrary],
  providers: [WidgetStateService, ExecutionPageFacade],
  template: `
    <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <inta-execution-header
        [executionData]="executionData()"
        [shotInfo]="shotInfo()"
        [hasUnsavedChanges]="hasUnsavedChanges()"
        [isSaving]="isSaving()"
        [editMode]="isEditMode()"
        (startRequested)="startExecution()"
        (pauseRequested)="pauseExecution()"
        (resumeRequested)="resumeExecution()"
        (interruptRequested)="interruptExecution()"
        (cancelRequested)="cancelExecution()"
        (finishRequested)="finishExecution()"
        (equipmentSelectorRequested)="openEquipmentSelector()"
        (saveRequested)="saveAllChanges()"
        (widgetsPanelToggleRequested)="toggleWidgetsPanel()"
        (editModeToggleRequested)="toggleEditMode()"
      />

      @if (isLoading()) {
        <div class="flex-1 my-6 bg-white rounded-lg shadow-sm overflow-hidden p-6 flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <ui-skeleton variant="text" animation="wave" width="35%" height="2rem" />
            <ui-skeleton variant="button" animation="wave" width="120px" />
          </div>
          <ui-skeleton variant="rectangle" animation="wave" width="100%" height="100%" />
        </div>
      } @else if (loadError()) {
        <div class="flex-1 my-6 bg-white rounded-lg shadow-sm overflow-hidden flex items-center">
          <ui-error-state
            [title]="'TRIAL_EXECUTION.ERRORS.LOAD_FAILED_TITLE' | translate"
            [message]="'TRIAL_EXECUTION.ERRORS.LOAD_FAILED_DETAIL' | translate"
          />
        </div>
      } @else {
        <div class="flex-1 my-6 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <inta-execution-grid [editMode]="isEditMode()" />
        </div>
      }

      <inta-widget-library
        [widgets]="widgets()"
        [isOpen]="isWidgetsPanelOpen()"
        (selected)="addWidget($event)"
        (closed)="closeWidgetsPanel()"
      />
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Execution implements OnDestroy {
  readonly #dialog = inject(MatDialog);
  readonly #location = inject(Location);
  readonly #router = inject(Router);
  readonly #executionFacade = inject(ExecutionPageFacade);
  readonly #fireTrialId = injectParams('fireTrialId');
  #trialSelectorOpen = false;

  readonly executionData = this.#executionFacade.executionData;
  readonly shotInfo = this.#executionFacade.shotInfo;
  readonly widgets = this.#executionFacade.widgets;
  readonly hasUnsavedChanges = this.#executionFacade.hasUnsavedChanges;
  readonly isSaving = this.#executionFacade.isSaving;
  readonly isLoading = this.#executionFacade.isLoading;
  readonly loadError = this.#executionFacade.loadError;
  readonly isWidgetsPanelOpen = signal(false);
  readonly isEditMode = signal(false);

  // eslint-disable-next-line no-unused-private-class-members
  readonly #routeSyncEffect = explicitEffect([this.#fireTrialId], ([fireTrialId]) => {
    if (fireTrialId) {
      this.#executionFacade.initialize(fireTrialId);
      return;
    }
    void this.#openTrialSelectorDialog();
  });

  ngOnDestroy(): void {
    this.#executionFacade.persistPreferences();
  }

  toggleWidgetsPanel(): void {
    this.isWidgetsPanelOpen.update((isOpen) => !isOpen);
  }

  closeWidgetsPanel(): void {
    this.isWidgetsPanelOpen.set(false);
  }

  toggleEditMode(): void {
    this.isEditMode.update((isEditMode) => !isEditMode);
  }

  startExecution(): void {
    this.#executionFacade.startExecution();
  }

  pauseExecution(): Promise<void> {
    return this.#executionFacade.pauseExecution();
  }

  resumeExecution(): void {
    this.#executionFacade.resumeExecution();
  }

  interruptExecution(): Promise<void> {
    return this.#executionFacade.interruptExecution();
  }

  cancelExecution(): Promise<void> {
    return this.#executionFacade.cancelExecution();
  }

  finishExecution(): void {
    this.#executionFacade.finishExecution();
  }

  openEquipmentSelector(): Promise<void> {
    return this.#executionFacade.openEquipmentSelector();
  }

  addWidget(widgetId: string): void {
    this.#executionFacade.addWidget(widgetId);
    this.closeWidgetsPanel();
  }

  saveAllChanges(): Promise<void> {
    return this.#executionFacade.saveAllChanges();
  }

  async #openTrialSelectorDialog(): Promise<void> {
    if (this.#trialSelectorOpen) {
      return;
    }
    this.#trialSelectorOpen = true;

    const result = await firstValueFrom(
      this.#dialog
        .open<TrialSelectorDialog, void, TrialSelectorDialogResult>(TrialSelectorDialog, {
          width: '1100px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          disableClose: true,
        })
        .afterClosed(),
    );
    this.#trialSelectorOpen = false;

    if (!result || result.action === 'cancel') {
      this.#location.back();
      return;
    }
    await this.#router.navigate(['/execution', result.trial.id], { replaceUrl: true });
  }
}

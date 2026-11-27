import type { Signal } from '@angular/core';
import type { TrialCreateModifyForm } from '@intaqalab/models';

import type { ModificationClassification } from '../../../data-access/planning-modifications';

export interface ModifyPlanningDialogData {
  fireTrialId: string;
  fireTrial: TrialCreateModifyForm | null;
  executedShotIds: Signal<ReadonlyArray<string>>;
  executionProgressReady: Signal<boolean>;
}

export interface ModifyPlanningDialogResult {
  saved: boolean;
  hasAcceptedChanges: boolean;
  hasPendingChanges: boolean;
}

export interface ModificationClassificationChangeEvent {
  modId: string;
  classification: ModificationClassification;
}

export interface PlanningChangeInclusionChangeEvent {
  changeId: string;
  selected: boolean;
}

import type { TrialCreateModifyForm } from '@intaqalab/models';

import type {
  ModificationClassification,
  PlanningModification,
} from '../../../data-access/planning-modifications';

export interface ModifyPlanningDialogData {
  fireTrialId: string;
  centerId?: string;
  fireTrial: TrialCreateModifyForm | null;
  executedShotIds?: ReadonlyArray<string>;
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

export type PlanningFieldValue = string | number | null;

export type PlanningBaselineSnapshot = Record<string, PlanningFieldValue>;

export interface SeriesFieldInput {
  parameter: string;
  value: string | number;
  unit?: string;
  affectedShots?: string[] | null;
}

export interface ShotInheritanceInput {
  shotLabel: string;
  inheritedValues: Readonly<Record<string, PlanningFieldValue>>;
  currentValues: Readonly<Record<string, PlanningFieldValue>>;
  units?: Readonly<Record<string, string>>;
}

export interface MeasureCriterion {
  label: string;
  value: string | number;
  unit?: string;
}

export interface NewMeasurePayload {
  measureName: string;
  criteria: ReadonlyArray<MeasureCriterion>;
  affectedShots?: string[] | null;
}

export type FieldChangeDetectionResult =
  | { type: 'upsert'; modification: PlanningModification }
  | { type: 'remove'; key: string };

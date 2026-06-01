import type { ControlsOf, FireTrial, FireTrialClient, FireTrialType } from '@intaqalab/models';

export type TriaUpsertForm = {
  code: FireTrial['trialNumber'];
  hasAssociatedTrial: boolean;
  hasLinkedTrial: boolean;
  associatedTrial: string;
  associatedTrialView: string;
  linkedTrial: string;
  linkedTrialView: string;
  description: string;
  type: FireTrialType['id'];
  client: FireTrialClient['id'];
  clientReference: string;
  requestedDate: string;
  observations: string;
  status?: FireTrial['status'];
};

export type TriaUpsertFormControls = ControlsOf<TriaUpsertForm>;

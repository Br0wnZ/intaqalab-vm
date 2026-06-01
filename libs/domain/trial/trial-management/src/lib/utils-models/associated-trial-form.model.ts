import type { ControlsOf, FireTrialClient } from '@intaqalab/models';

export type AssociatedTrialForm = {
  year: string | null;
  clientId: FireTrialClient['id'];
  searchTerm: string;
  trialId: string;
};

export type AssociatedTrialFormControls = ControlsOf<AssociatedTrialForm>;

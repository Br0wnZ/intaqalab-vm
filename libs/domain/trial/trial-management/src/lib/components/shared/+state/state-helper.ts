import type { FireTrial, TrialStatus } from '@intaqalab/models';

import type { TrialCreateModifyForm } from '../components/form/trial-create.model';

export const mapTrialDetailsToState = (trialDetails: FireTrial): TrialCreateModifyForm => ({
  associatedTrial: trialDetails.associatedTrial?.id,
  associatedTrialView: trialDetails.associatedTrial?.trialNumber,
  hasAssociatedTrial: !!trialDetails.associatedTrial,
  hasLinkedTrial: !!trialDetails.linkedTrial,
  linkedTrial: trialDetails.linkedTrial?.id,
  linkedTrialView: trialDetails.linkedTrial?.trialNumber,
  client: trialDetails.client.id,
  clientReference: trialDetails.clientReference,
  code: trialDetails.trialNumber,
  description: trialDetails.description,
  type: trialDetails.fireTrialType.id,
  status: trialDetails.status as TrialStatus,
  statusReason: trialDetails.statusReason,
  observations: trialDetails.observations,
  requestedDate: trialDetails.requestedDate,
});

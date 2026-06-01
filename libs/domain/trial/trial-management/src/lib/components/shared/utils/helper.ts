import type { FireTrial, TrialCreateModifyForm } from '@intaqalab/models';

import type { UpsertFireTrial } from '../../../utils-models/upsert-fire-trial-request.model';
import type { TriaUpsertForm } from '../../../utils-models/upsert-trial-form.model';

export const mapFormToCreateDto = (data: Partial<TriaUpsertForm>): UpsertFireTrial => ({
  fireTrialTypeId: data.type as string,
  clientId: data.client as string,
  ...(data.code && { code: data.code }),
  ...(data.linkedTrial && { linkedTrialId: data.linkedTrial }),
  ...(data.description && { description: data.description }),
  ...(data.clientReference && { clientReference: data.clientReference }),
  ...(data.observations && { observations: data.observations }),
  ...(data.requestedDate && { requestedDate: data.requestedDate }),
  ...(data.hasAssociatedTrial && data.associatedTrial && { associatedTrialId: data.associatedTrial }),
});

export const mapDataToPatchForm = (data: FireTrial): TriaUpsertForm => ({
  type: data.fireTrialType.id,
  client: data.client.id,
  code: data.id,
  hasAssociatedTrial: !!data.associatedTrial,
  hasLinkedTrial: !!data.linkedTrial,
  linkedTrial: data.linkedTrial?.id ?? '',
  linkedTrialView: data.linkedTrial?.trialNumber ?? '',
  description: data.description ?? '',
  clientReference: data.clientReference ?? '',
  observations: data.observations ?? '',
  requestedDate: data.requestedDate ?? '',
  associatedTrial: data.associatedTrial?.id ?? '',
  associatedTrialView: data.trialNumber,
});

export const mapDataToSignalForm = (data: TrialCreateModifyForm): TriaUpsertForm => ({
  type: data.type,
  client: data.client,
  code: data.code ?? '',
  hasAssociatedTrial: data.hasAssociatedTrial,
  hasLinkedTrial: data.hasLinkedTrial,
  linkedTrial: data.linkedTrial ?? '',
  linkedTrialView: data.linkedTrialView ?? '',
  description: data.description ?? '',
  clientReference: data.clientReference ?? '',
  observations: data.observations ?? '',
  requestedDate: data.requestedDate ?? '',
  associatedTrial: data.associatedTrial ?? '',
  associatedTrialView: data.associatedTrialView ?? '',
});

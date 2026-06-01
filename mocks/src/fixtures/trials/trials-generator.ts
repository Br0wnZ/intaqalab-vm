import type { FireTrial, UpsertFireTrial } from '../../utils.model';

export const trialsGenerator = () => {
  let uniqueTrialNumber = 1;
  const getNextUniqueTrialNumber = () => ++uniqueTrialNumber;

  const generateTrial = (overrides: Partial<UpsertFireTrial> = {}): FireTrial => {
    const newTrialNumber = `${getNextUniqueTrialNumber().toString().padStart(3, '0')}/${new Date()
      .getFullYear()
      .toString()
      .slice(-2)}`;
    const trial: FireTrial = {
      id: crypto.randomUUID(),
      trialNumber: newTrialNumber,
      centerId: 'center-001',
      status: 'Pending',
      statusReason: '',
      linkedTrial: {
        id: 'linked-001',
        trialNumber: (overrides.linkedTrialId as string) || 'LT-001',
        description: 'Linked Trial Description',
      },
      associatedTrial: {
        id: 'associated-001',
        trialNumber: (overrides.associatedTrialId as string) || 'AT-001',
        description: 'Associated Trial Description',
      },
      fireTrialType: {
        id: overrides.fireTrialTypeId as string,
        name: 'Type A',
      },
      client: {
        id: 'client-001',
        name: 'Client A',
      },
      clientReference: 'REF-001',
      requestedDate: new Date().toISOString(),
      description: 'This is a sample fire trial description.',
      observations: 'No observations.',
      createdBy: 'user-001',
      modifiedBy: 'user-001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
    return trial;
  };

  return {
    generateTrial,
  };
};

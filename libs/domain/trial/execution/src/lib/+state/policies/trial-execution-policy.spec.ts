import { TrialStatus } from '@intaqalab/models';

import { resolveTrialExecutionCapabilities } from './trial-execution-policy';

describe('resolveTrialExecutionCapabilities', () => {
  const idle = { executionActive: false };
  const active = { executionActive: true };

  it.each([
    [TrialStatus.PLANNED, idle, { canEditSetup: true, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: false, isReadOnly: false }],
    [TrialStatus.PREPARED, idle, { canEditSetup: true, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: false, isReadOnly: false }],
    [TrialStatus.UNDER_REVIEW, idle, { canEditSetup: true, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: false, isReadOnly: false }],
    [TrialStatus.IN_PROGRESS, active, { canEditSetup: true, canUpdateParticipatingEquipment: true, canRegisterNewShots: true, canEditExecutedShots: true, isReadOnly: false }],
    [TrialStatus.INTERRUPTED, active, { canEditSetup: false, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: true, isReadOnly: false }],
    [TrialStatus.EXECUTED, idle, { canEditSetup: false, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: true, isReadOnly: false }],
    [TrialStatus.CANCELLED, idle, { canEditSetup: false, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: true, isReadOnly: false }],
    [TrialStatus.ANALYZING, idle, { canEditSetup: false, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: false, isReadOnly: true }],
    [TrialStatus.FINALIZING, idle, { canEditSetup: false, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: false, isReadOnly: true }],
    [TrialStatus.CLOSED, idle, { canEditSetup: false, canUpdateParticipatingEquipment: false, canRegisterNewShots: false, canEditExecutedShots: false, isReadOnly: true }],
  ])('resolves capabilities for status %s', (status, context, expected) => {
    expect(resolveTrialExecutionCapabilities(status, context)).toEqual(expected);
  });

  it('allows registering new shots when started and an execution is active', () => {
    const capabilities = resolveTrialExecutionCapabilities(TrialStatus.STARTED, active);

    expect(capabilities.canRegisterNewShots).toBe(true);
    expect(capabilities.canEditExecutedShots).toBe(true);
    expect(capabilities.canEditSetup).toBe(false);
  });

  it('blocks new shots when started but no execution is active', () => {
    const capabilities = resolveTrialExecutionCapabilities(TrialStatus.STARTED, idle);

    expect(capabilities.canRegisterNewShots).toBe(false);
    expect(capabilities.canEditExecutedShots).toBe(true);
    expect(capabilities.isReadOnly).toBe(false);
  });

  it('keeps the trial read-only when status is missing', () => {
    const capabilities = resolveTrialExecutionCapabilities(null, idle);

    expect(capabilities.canEditSetup).toBe(false);
    expect(capabilities.canRegisterNewShots).toBe(false);
    expect(capabilities.canEditExecutedShots).toBe(false);
  });

  it('treats unknown statuses as read-only', () => {
    expect(resolveTrialExecutionCapabilities('UNKNOWN', active).isReadOnly).toBe(true);
  });
});

import { Role } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';

export const CAN_SCHEDULE_ROLES: ReadonlyArray<Role> = [Role.PLANNING_TECHNICIAN, Role.INTAQALAB_ADMIN];

export const CAN_SCHEDULE_STATUS: ReadonlyArray<TrialStatus> = [
  TrialStatus.UNDER_REVIEW,
  TrialStatus.PLANNED,
  TrialStatus.PREPARED,
];

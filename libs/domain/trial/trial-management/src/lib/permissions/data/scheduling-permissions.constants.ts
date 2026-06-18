import { CAN_SCHEDULE_TRIAL_ROLES } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';

/**
 * Roles que pueden programar/desprogramar una prueba en el calendario.
 * Spec §3: Admin + Administrativo ensayos.
 */
export const CAN_SCHEDULE_ROLES = CAN_SCHEDULE_TRIAL_ROLES;

/**
 * Estados de prueba en los que es posible programar/desprogramar.
 */
export const CAN_SCHEDULE_STATUS: ReadonlyArray<TrialStatus> = [
  TrialStatus.UNDER_REVIEW,
  TrialStatus.PLANNED,
  TrialStatus.PREPARED,
];

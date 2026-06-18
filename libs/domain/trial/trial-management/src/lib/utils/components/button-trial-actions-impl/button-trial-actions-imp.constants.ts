import {
  ADMIN_ROLES,
  CAN_ANNUL_ROLES,
  CAN_CANCEL_ROLES,
  CAN_CLOSE_ROLES,
  CAN_DELETE_ROLES,
  CAN_REACTIVATE_ROLES,
  CAN_REOPEN_ROLES,
} from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';

import type { ButtonTrialActionsConfiguration } from '../button-trial-actions/button-trial-actions.model';

export const config: ButtonTrialActionsConfiguration = [
  {
    // Modificar: Admin, Engineer, Administrative, PlanningHead, Consultant (UNDER_REVIEW)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.MODIFY',
    option: 'MODIFY',
    status: [TrialStatus.UNDER_REVIEW],
    roles: [...ADMIN_ROLES],
  },
  {
    // Anular: Admin, Administrative, PlanningHead, Engineer (UNDER_REVIEW → VOIDED)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.ANNUL',
    option: 'ANNUL',
    status: [TrialStatus.UNDER_REVIEW],
    roles: [...CAN_ANNUL_ROLES],
  },
  {
    // Eliminar: solo Admin (UNDER_REVIEW)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.REMOVE',
    option: 'REMOVE',
    status: [TrialStatus.UNDER_REVIEW],
    roles: [...CAN_DELETE_ROLES],
  },
  {
    // Cancelar: PlanningHead, Engineer, Admin (estados activos)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.CANCEL',
    option: 'CANCEL',
    status: [
      TrialStatus.PLANNED,
      TrialStatus.PREPARED,
      TrialStatus.IN_PROGRESS,
      TrialStatus.INTERRUPTED,
      TrialStatus.STARTED,
      TrialStatus.EXECUTED,
      TrialStatus.ANALYZING,
      TrialStatus.FINALIZING,
    ],
    roles: [...CAN_CANCEL_ROLES],
  },
  {
    // Cerrar: Admin, Administrative, PlanningHead (FINALIZING → CLOSED)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.CLOSE',
    option: 'CLOSE',
    status: [TrialStatus.FINALIZING],
    roles: [...CAN_CLOSE_ROLES],
  },
  {
    // Reabrir: Admin, Administrative, PlanningHead (CLOSED → FINALIZING)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.REOPEN',
    option: 'REOPEN',
    status: [TrialStatus.CLOSED],
    roles: [...CAN_REOPEN_ROLES],
  },
  {
    // Reactivar: Admin, Administrative, PlanningHead (CANCELLED/VOIDED → UNDER_REVIEW)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.REACTIVATE',
    option: 'REACTIVATE',
    status: [TrialStatus.CANCELLED, TrialStatus.VOIDED],
    roles: [...CAN_REACTIVATE_ROLES],
  },
  {
    // Ejecutar: todos (sin restricción de rol, restringido por estado)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.EXECUTION',
    option: 'EXECUTION',
    status: [TrialStatus.PLANNED, TrialStatus.STARTED, TrialStatus.IN_PROGRESS, TrialStatus.INTERRUPTED],
  },
];

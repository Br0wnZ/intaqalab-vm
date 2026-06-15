import { Role } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';

import type { ButtonTrialActionsConfiguration } from '../button-trial-actions/button-trial-actions.model';

export const config: ButtonTrialActionsConfiguration = [
  {
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.MODIFY',
    option: 'MODIFY',
    status: [TrialStatus.UNDER_REVIEW],
    roles: [Role.PLANNING_TECHNICIAN, Role.INTAQALAB_ADMIN],
  },
  {
    // Anular: (En estudio → Anulada)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.ANNUL',
    option: 'ANNUL',
    status: [TrialStatus.UNDER_REVIEW],
    roles: [Role.PLANNING_TECHNICIAN, Role.INTAQALAB_ADMIN],
  },
  {
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.REMOVE',
    option: 'REMOVE',
    status: [TrialStatus.UNDER_REVIEW],
    roles: [Role.INTAQALAB_ADMIN],
  },
  {
    // Cancelar: (Planificada/Preparada/En progreso/Interrumpida/Iniciada/Ejecutada/Analizando/Finalizando → Cancelada)
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
    roles: [Role.PLANNING_TECHNICIAN, Role.INTAQALAB_ADMIN],
  },
  {
    // Cerrar: (Finalizando → Cerrada) (cierre definitivo)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.CLOSE',
    option: 'CLOSE',
    status: [TrialStatus.FINALIZING],
    roles: [Role.INTAQALAB_ADMIN],
  },
  {
    // Reabrir: (Cerrada → Finalizando) (solo si el cierre fue por error)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.REOPEN',
    option: 'REOPEN',
    status: [TrialStatus.CLOSED],
    roles: [Role.PLANNING_TECHNICIAN, Role.INTAQALAB_ADMIN],
  },
  {
    // Reactivar: (Cancelada/Anulada → estado anterior / En estudio)
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.REACTIVATE',
    option: 'REACTIVATE',
    status: [TrialStatus.CANCELLED, TrialStatus.VOIDED],
    roles: [Role.INTAQALAB_ADMIN],
  },
  // Ejecutar (En Estudio → Ejecutada)
  {
    label: 'UTILS_TRIALS.TRIAL_ACTIONS.EXECUTION',
    option: 'EXECUTION',
    status: [TrialStatus.PLANNED, TrialStatus.STARTED, TrialStatus.IN_PROGRESS, TrialStatus.INTERRUPTED],
  },
];

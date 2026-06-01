import type { Role } from '@intaqalab/core';
import type { TrialStatus } from '@intaqalab/models';

import type { ButtonTrialActionsConfiguration } from './button-trial-actions.model';

export function filterTrialActions(
  actions: ButtonTrialActionsConfiguration,
  trialStatus: TrialStatus,
  userRoles: Role[],
): ButtonTrialActionsConfiguration {
  return actions.filter(({ status, roles }) => {
    const statusMatch = !status || status.includes(trialStatus);
    const roleMatch = !roles || roles.some((role) => userRoles.includes(role));
    return statusMatch && roleMatch;
  });
}

import { Injectable, inject } from '@angular/core';
import { AuthService } from '@intaqalab/core';
import type { TrialStatus } from '@intaqalab/models';

import { CAN_SCHEDULE_ROLES, CAN_SCHEDULE_STATUS } from './data/scheduling-permissions.constants';

@Injectable({
  providedIn: 'root',
})
export class TrialPersmissionsService {
  #userService = inject(AuthService);

  canSchedule(trialStatus?: TrialStatus): boolean {
    if (trialStatus && !CAN_SCHEDULE_STATUS.includes(trialStatus)) {
      return false;
    }

    const userRoles = this.#userService.userRoles();
    for (const role of CAN_SCHEDULE_ROLES) {
      if (userRoles.includes(role)) {
        return true;
      }
    }
    return false;
  }
}

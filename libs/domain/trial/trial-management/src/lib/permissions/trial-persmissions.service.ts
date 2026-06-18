import { Injectable, computed, inject } from '@angular/core';
import {
  ADMIN_ROLES,
  AuthService,
  CAN_ANNUL_ROLES,
  CAN_CANCEL_ROLES,
  CAN_CLOSE_ROLES,
  CAN_DELETE_ROLES,
  CAN_REACTIVATE_ROLES,
  CAN_REOPEN_ROLES,
  type Role,
} from '@intaqalab/core';
import type { TrialStatus } from '@intaqalab/models';

import { CAN_SCHEDULE_ROLES, CAN_SCHEDULE_STATUS } from './data/scheduling-permissions.constants';

@Injectable({
  providedIn: 'root',
})
export class TrialPersmissionsService {
  #authService = inject(AuthService);

  /** Signal de los roles del usuario actual */
  readonly #userRoles = computed(() => this.#authService.userRoles());

  // ─── Scheduling ────────────────────────────────────────────────────────────

  canSchedule(trialStatus?: TrialStatus): boolean {
    if (trialStatus && !CAN_SCHEDULE_STATUS.includes(trialStatus)) {
      return false;
    }
    return this.#hasAnyRole(CAN_SCHEDULE_ROLES);
  }

  // ─── Control Administrativo ────────────────────────────────────────────────

  /** Puede crear una nueva prueba */
  canCreate(): boolean {
    return this.#hasAnyRole(ADMIN_ROLES);
  }

  /** Puede ver una prueba (todos los roles) */
  canView(): boolean {
    return this.#userRoles().length > 0;
  }

  /** Puede modificar los datos de una prueba */
  canModify(trialStatus?: TrialStatus): boolean {
    if (trialStatus) {
      // Solo modificable en UNDER_REVIEW según las acciones del botón
      const modifiableStatuses: TrialStatus[] = ['UNDER_REVIEW' as TrialStatus];
      if (!modifiableStatuses.includes(trialStatus)) return false;
    }
    return this.#hasAnyRole(ADMIN_ROLES);
  }

  /** Puede cancelar una prueba */
  canCancel(): boolean {
    return this.#hasAnyRole(CAN_CANCEL_ROLES);
  }

  /** Puede anular una prueba */
  canAnnul(): boolean {
    return this.#hasAnyRole(CAN_ANNUL_ROLES);
  }

  /** Puede eliminar una prueba (solo Admin) */
  canDelete(): boolean {
    return this.#hasAnyRole(CAN_DELETE_ROLES);
  }

  /** Puede cerrar una prueba */
  canClose(): boolean {
    return this.#hasAnyRole(CAN_CLOSE_ROLES);
  }

  /** Puede reactivar una prueba (de Cancelada/Anulada) */
  canReactivate(): boolean {
    return this.#hasAnyRole(CAN_REACTIVATE_ROLES);
  }

  /** Puede reabrir una prueba (de Cerrada) */
  canReopen(): boolean {
    return this.#hasAnyRole(CAN_REOPEN_ROLES);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  #hasAnyRole(roles: ReadonlyArray<Role>): boolean {
    const userRoles = this.#userRoles();
    return roles.some((role) => userRoles.includes(role));
  }
}

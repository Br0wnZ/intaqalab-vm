import { Injectable, computed, inject } from '@angular/core';
import {
  AuthService,
  CAN_ACCESS_PLANNING_UNDER_REVIEW_ROLES,
  CAN_ASSIGN_PLANNING_USER_ROLES,
  CAN_EDIT_PLANNING_ROLES,
  CAN_MODIFY_PLANNING_ROLES,
  CAN_SELF_ASSIGN_PLANNING_ROLES,
  CAN_VALIDATE_PLANNING_ROLES,
  type Role,
} from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';

/**
 * Estados a partir de los cuales TODOS (excepto Viewer) pueden VER la planificación.
 * Una prueba es "validada" cuando pasa a PLANNED.
 */
const PLANNING_VISIBLE_STATUSES: ReadonlyArray<TrialStatus> = [
  TrialStatus.PLANNED,
  TrialStatus.PREPARED,
  TrialStatus.IN_PROGRESS,
  TrialStatus.INTERRUPTED,
  TrialStatus.STARTED,
  TrialStatus.EXECUTED,
  TrialStatus.ANALYZING,
  TrialStatus.FINALIZING,
  TrialStatus.CLOSED,
  TrialStatus.CANCELLED,
  TrialStatus.VOIDED,
];

@Injectable({
  providedIn: 'root',
})
export class PlanningPermissionsService {
  readonly #authService = inject(AuthService);
  readonly #userRoles = computed(() => this.#authService.userRoles());

  /**
   * Determina si el usuario puede VER la pestaña de planificación dado el estado de la prueba.
   *
   * Reglas:
   * - UNDER_REVIEW: solo Admin, PlanningHead y Consultant
   * - PLANNED en adelante: todos los roles excepto Viewer
   */
  canAccessPlanningTab(trialStatus: TrialStatus): boolean {
    if (trialStatus === TrialStatus.UNDER_REVIEW) {
      return this.#hasAnyRole(CAN_ACCESS_PLANNING_UNDER_REVIEW_ROLES);
    }
    if (PLANNING_VISIBLE_STATUSES.includes(trialStatus)) {
      // Todos excepto Viewer pueden ver la planificación una vez validada
      return !this.#isOnlyViewer();
    }
    return false;
  }

  /**
   * Determina si el usuario puede EDITAR la planificación.
   * Solo Admin, PlanningHead y Consultant.
   */
  canEditPlanning(): boolean {
    return this.#hasAnyRole(CAN_EDIT_PLANNING_ROLES);
  }

  /**
   * Determina si el usuario puede VALIDAR la planificación (pasar a PLANNED).
   * Solo Admin y PlanningHead.
   */
  canValidatePlanning(): boolean {
    return this.#hasAnyRole(CAN_VALIDATE_PLANNING_ROLES);
  }

  /**
   * Determina si el usuario puede MODIFICAR (desbloquear) una planificación ya validada.
   * Solo Admin y PlanningHead.
   */
  canModifyPlanning(): boolean {
    return this.#hasAnyRole(CAN_MODIFY_PLANNING_ROLES);
  }

  /**
   * Determina si el usuario puede ASIGNAR un usuario de planificación (cualquier usuario).
   * Solo Admin y PlanningHead.
   */
  canAssignPlanningUser(): boolean {
    return this.#hasAnyRole(CAN_ASSIGN_PLANNING_USER_ROLES);
  }

  /**
   * Determina si el usuario puede AUTOASIGNARSE como responsable de planificación.
   * Admin, PlanningHead pueden asignar a cualquiera.
   * Consultant solo puede asignarse a sí mismo.
   */
  canSelfAssign(): boolean {
    return this.#hasAnyRole(CAN_SELF_ASSIGN_PLANNING_ROLES);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  #hasAnyRole(roles: ReadonlyArray<Role>): boolean {
    const userRoles = this.#userRoles();
    return roles.some((role) => userRoles.includes(role));
  }

  #isOnlyViewer(): boolean {
    const userRoles = this.#userRoles();
    return userRoles.length > 0 && userRoles.every((role) => role === ('INTAQALAB_VIEWER' as Role));
  }
}

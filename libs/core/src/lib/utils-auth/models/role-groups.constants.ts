import { Role } from './role.model';

// ─── ROLES ADMINISTRATIVOS (pueden crear/modificar pruebas) ──────────────────
export const ADMIN_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ENGINEER,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_CONSULTANT,
] as const;

// ─── TODOS LOS ROLES (excepto Viewer) ────────────────────────────────────────
export const ALL_ROLES_EXCEPT_VIEWER: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ENGINEER,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_CONSULTANT,
  Role.INTAQALAB_SHOOTING_LINE_HEAD,
  Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
  Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
  Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
  Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
  Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
  Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
  Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN,
  Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD,
] as const;

// ─── TODOS LOS ROLES (incluido Viewer) ───────────────────────────────────────
export const ALL_ROLES: ReadonlyArray<Role> = [...ALL_ROLES_EXCEPT_VIEWER, Role.INTAQALAB_VIEWER] as const;

// ─── MENÚ: ACCESO A NUEVA PRUEBA / LISTA PRUEBAS ─────────────────────────────
// Solo roles administrativos + Viewer (con restricción de datos)
export const MENU_NEW_TRIAL_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ENGINEER,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_CONSULTANT,
] as const;

export const MENU_TRIAL_LIST_ROLES: ReadonlyArray<Role> = [...ALL_ROLES_EXCEPT_VIEWER] as const;

// ─── MENÚ: ACCESO A EVENT LOG ────────────────────────────────────────────────
// Todos excepto Viewer y Municiones
export const MENU_EVENT_LOG_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ENGINEER,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_CONSULTANT,
  Role.INTAQALAB_SHOOTING_LINE_HEAD,
  Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
  Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
  Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
  Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
  Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN,
  Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD,
] as const;

// ─── MENÚ: ACCESO A ALMACÉN ──────────────────────────────────────────────────
export const MENU_WAREHOUSE_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
  Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
] as const;

export const MENU_STOCK_MUNITION_ROLES: ReadonlyArray<Role> = [
  ...MENU_WAREHOUSE_ROLES,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_TRIAL_ENGINEER,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_SHOOTING_LINE_HEAD,
  Role.INTAQALAB_ARMAMENT_UNIT_HEAD,
  Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,
  Role.INTAQALAB_BALLISTICS_UNIT_HEAD,
  Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,
  Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN,
  Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD,
] as const;

// ─── MENÚ: ACCESO A EJECUCIÓN ────────────────────────────────────────────────
export const MENU_EXECUTION_ROLES: ReadonlyArray<Role> = [...ALL_ROLES_EXCEPT_VIEWER, Role.INTAQALAB_VIEWER] as const;

// ─── CONTROL ADMINISTRATIVO: ACCIONES POR ROL ────────────────────────────────

/** Puede Cancelar: PlanningHead, Engineer, Admin */
export const CAN_CANCEL_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_ENGINEER,
] as const;

/** Puede Anular: Admin, Administrative, PlanningHead, Engineer */
export const CAN_ANNUL_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_ENGINEER,
] as const;

/** Puede Eliminar: solo Admin */
export const CAN_DELETE_ROLES: ReadonlyArray<Role> = [Role.INTAQALAB_ADMIN] as const;

/** Puede Cerrar: Admin, Administrative, PlanningHead */
export const CAN_CLOSE_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
] as const;

/** Puede Reabrir: Admin, Administrative, PlanningHead */
export const CAN_REOPEN_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
] as const;

/** Puede Reactivar: Admin, Administrative, PlanningHead */
export const CAN_REACTIVATE_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
] as const;

// ─── PLANIFICACIÓN ───────────────────────────────────────────────────────────

/**
 * Puede ACCEDER a la pestaña de planificación cuando la prueba está UNDER_REVIEW.
 * Para estados >= PLANNED, todos excepto Viewer pueden verla (modo readonly).
 */
export const CAN_ACCESS_PLANNING_UNDER_REVIEW_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_CONSULTANT,
] as const;

/** Puede EDITAR planificación (en cualquier estado) */
export const CAN_EDIT_PLANNING_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_CONSULTANT,
] as const;

/** Puede VALIDAR planificación (pasar a PLANNED) */
export const CAN_VALIDATE_PLANNING_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
] as const;

/** Puede ASIGNAR usuario de planificación */
export const CAN_ASSIGN_PLANNING_USER_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
] as const;

/** Puede AUTOASIGNARSE como usuario de planificación (Consultant solo a sí mismo) */
export const CAN_SELF_ASSIGN_PLANNING_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
  Role.INTAQALAB_TRIAL_CONSULTANT,
] as const;

// ─── CALENDARIO ──────────────────────────────────────────────────────────────

/** Puede gestionar días especiales */
export const CAN_MANAGE_SPECIAL_DAYS_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
  Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
] as const;

/** Puede añadir observaciones al calendario */
export const CAN_ADD_CALENDAR_OBSERVATIONS_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_TRIAL_ADMINISTRATIVE,
] as const;

/** Puede programar/desprogramar prueba en el calendario */
export const CAN_SCHEDULE_TRIAL_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
] as const;

// ─── ALMACÉN ─────────────────────────────────────────────────────────────────

/** Puede realizar acciones de escritura en almacén */
export const WAREHOUSE_WRITE_ROLES: ReadonlyArray<Role> = [
  Role.INTAQALAB_ADMIN,
  Role.INTAQALAB_MUNITIONS_UNIT_HEAD,
  Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN,
] as const;

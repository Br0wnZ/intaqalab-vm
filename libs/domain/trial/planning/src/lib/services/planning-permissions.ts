import { computed } from '@angular/core';
import { Role, injectCurrentUserRole } from '@intaqalab/core';

export function injectPlanningPermissions() {
  const roles = injectCurrentUserRole();

  const hasRole = (allowedRoles: Role[]) => {
    return allowedRoles.some((role) => roles().includes(role));
  };

  return {
    canEditGeneralData: computed(() =>
      hasRole([Role.INTAQALAB_ADMIN, Role.INTAQALAB_PLANNING_ANALYSIS_HEAD, Role.PLANNING_TECHNICIAN]),
    ),
    canEditArmament: computed(() =>
      hasRole([Role.INTAQALAB_ADMIN, Role.INTAQALAB_ARMAMENT_UNIT_HEAD, Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN]),
    ),
    canEditMunitions: computed(() =>
      hasRole([Role.INTAQALAB_ADMIN, Role.INTAQALAB_MUNITIONS_UNIT_HEAD, Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN]),
    ),
    canEditTopographyMeasures: computed(() =>
      hasRole([Role.INTAQALAB_ADMIN, Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD, Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN]),
    ),
    canEditMunitionsMeasures: computed(() =>
      hasRole([Role.INTAQALAB_ADMIN, Role.INTAQALAB_MUNITIONS_UNIT_HEAD, Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN]),
    ),
    canEditArmamentMeasures: computed(() =>
      hasRole([Role.INTAQALAB_ADMIN, Role.INTAQALAB_ARMAMENT_UNIT_HEAD, Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN]),
    ),
    canEditBallisticsMeasures: computed(() =>
      hasRole([Role.INTAQALAB_ADMIN, Role.INTAQALAB_BALLISTICS_UNIT_HEAD, Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN]),
    ),
    canEditSeriesAndShots: computed(() =>
      hasRole([
        Role.INTAQALAB_ADMIN,
        Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
        Role.PLANNING_TECHNICIAN,
        Role.INTAQALAB_TRIAL_ENGINEER,
      ]),
    ),
    canEditShootingConditions: computed(() =>
      hasRole([
        Role.INTAQALAB_ADMIN,
        Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,
        Role.PLANNING_TECHNICIAN,
        Role.INTAQALAB_TRIAL_ENGINEER,
      ]),
    ),
    canValidate: computed(() =>
      hasRole([Role.INTAQALAB_ADMIN, Role.INTAQALAB_PLANNING_ANALYSIS_HEAD, Role.HEAD_ARMAMENT_TRIALS]),
    ),
  };
}

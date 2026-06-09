import { Injectable, computed, inject } from '@angular/core';
import { AuthService, Role } from '@intaqalab/core';

import { EXECUTION_PROFILE_REGISTRY } from '../models/execution-profile-registry';
import {
  type ExecutionFeature,
  ExecutionProfile,
  type ExecutionProfileCategory,
  type ExecutionProfileConfig,
} from '../models/execution-profile.model';

/**
 * Priority-ordered mapping from global `Role` to `ExecutionProfile`.
 *
 * When a user holds multiple roles, the **first** matching entry
 * (highest priority) determines their active execution profile.
 *
 * Roles not listed here are not mapped to any execution profile
 * and will fall back to `TRIAL_CONSULTANT` (observer).
 */
const ROLE_TO_PROFILE_PRIORITY: ReadonlyArray<{ role: Role; profile: ExecutionProfile }> = [
  { role: Role.INTAQALAB_ADMIN,                    profile: ExecutionProfile.DIRECTOR },
  { role: Role.HEAD_ARMAMENT_TRIALS,               profile: ExecutionProfile.TRIAL_AREA_CHIEF },
  { role: Role.INTAQALAB_SHOOTING_LINE_HEAD,        profile: ExecutionProfile.FIRING_LINE_CHIEF },
  { role: Role.INTAQALAB_PLANNING_ANALYSIS_HEAD,    profile: ExecutionProfile.PLANNING_ANALYSIS_CHIEF },
  { role: Role.INTAQALAB_TRIAL_ENGINEER,            profile: ExecutionProfile.TRIAL_ENGINEER },
  { role: Role.INTAQALAB_ARMAMENT_UNIT_HEAD,        profile: ExecutionProfile.UNIT_CHIEF },
  { role: Role.INTAQALAB_MUNITIONS_UNIT_HEAD,       profile: ExecutionProfile.UNIT_CHIEF },
  { role: Role.INTAQALAB_BALLISTICS_UNIT_HEAD,      profile: ExecutionProfile.UNIT_CHIEF },
  { role: Role.INTAQALAB_FIRE_TRIALS_UNIT_HEAD,     profile: ExecutionProfile.UNIT_CHIEF },
  { role: Role.UNIT_TECHNICIAN,                    profile: ExecutionProfile.UNIT_TECHNICIAN },
  { role: Role.INTAQALAB_ARMAMENT_UNIT_TECHNICIAN,  profile: ExecutionProfile.UNIT_TECHNICIAN },
  { role: Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN, profile: ExecutionProfile.UNIT_TECHNICIAN },
  { role: Role.INTAQALAB_BALLISTICS_UNIT_TECHNICIAN,profile: ExecutionProfile.UNIT_TECHNICIAN },
  { role: Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN,profile: ExecutionProfile.UNIT_TECHNICIAN },
  { role: Role.INTAQALAB_TRIAL_CONSULTANT,          profile: ExecutionProfile.TRIAL_CONSULTANT },
  { role: Role.PLANNING_TECHNICIAN,                profile: ExecutionProfile.TRIAL_CONSULTANT },
  { role: Role.INTAQALAB_TRIAL_ADMINISTRATIVE,      profile: ExecutionProfile.TRIAL_CONSULTANT },
  { role: Role.ADMINISTRATIVE,                     profile: ExecutionProfile.TRIAL_CONSULTANT },
  { role: Role.INTAQALAB_VIEWER,                   profile: ExecutionProfile.TRIAL_CONSULTANT },
];

/** Fallback profile when no role matches */
const FALLBACK_PROFILE = ExecutionProfile.TRIAL_CONSULTANT;

/**
 * Resolves the execution profile for a given set of roles.
 *
 * Uses the priority-ordered mapping: the first matching role wins.
 * Falls back to `TRIAL_CONSULTANT` (observer) if no role matches.
 */
export function resolveExecutionProfile(roles: readonly Role[]): ExecutionProfile {
  for (const entry of ROLE_TO_PROFILE_PRIORITY) {
    if (roles.includes(entry.role)) {
      return entry.profile;
    }
  }
  return FALLBACK_PROFILE;
}

/**
 * Service that resolves the logged-in user's execution profile
 * and exposes their available features, widgets, and category
 * as reactive signals.
 *
 * @usageNotes
 * Provide this service at the execution route/component level:
 *
 * ```typescript
 * providers: [ExecutionProfileService]
 * ```
 *
 * Then inject and use its signals:
 *
 * ```typescript
 * readonly profileService = inject(ExecutionProfileService);
 * readonly showChat = this.profileService.hasFeature(ExecutionFeature.TRIAL_CHAT);
 * ```
 */
@Injectable()
export class ExecutionProfileService {
  readonly #authService = inject(AuthService);

  /** The resolved execution profile for the current user */
  readonly activeProfile = computed(() => resolveExecutionProfile(this.#authService.userRoles()));

  /** Full configuration object for the active profile */
  readonly profileConfig = computed<ExecutionProfileConfig>(() => {
    const config = EXECUTION_PROFILE_REGISTRY.get(this.activeProfile());
    if (!config) {
      // This should never happen as all enum values have entries in the registry
      throw new Error(`[ExecutionProfileService] No config found for profile: ${this.activeProfile()}`);
    }
    return config;
  });

  /** Whether the current user has direct intervention rights */
  readonly isDirectIntervention = computed<boolean>(() => this.profileConfig().category === 'direct');

  /** The profile category: 'direct' or 'observer' */
  readonly profileCategory = computed<ExecutionProfileCategory>(() => this.profileConfig().category);

  /** Feature list available for the active profile */
  readonly availableFeatures = computed<readonly ExecutionFeature[]>(() => this.profileConfig().availableFeatures);

  /** Default widget IDs to show for the active profile */
  readonly defaultWidgetIds = computed<readonly string[]>(() => this.profileConfig().defaultWidgetIds);

  /**
   * Returns a computed signal indicating whether the active profile
   * has access to the given feature.
   *
   * @param feature - The feature to check
   * @returns A computed signal that emits `true` if the feature is available
   */
  hasFeature(feature: ExecutionFeature) {
    return computed(() => this.availableFeatures().includes(feature));
  }
}

import { ExecutionFeature, ExecutionProfile, type ExecutionProfileConfig } from './execution-profile.model';

/**
 * Static registry of default configurations per execution profile.
 *
 * This is the single source of truth defining which widgets and features
 * are available by default for each profile during trial execution.
 */
export const EXECUTION_PROFILE_REGISTRY: ReadonlyMap<ExecutionProfile, ExecutionProfileConfig> = new Map<
  ExecutionProfile,
  ExecutionProfileConfig
>([
  // ─── Direct Intervention Profiles ──────────────────────────────

  [
    ExecutionProfile.TRIAL_AREA_CHIEF,
    {
      profile: ExecutionProfile.TRIAL_AREA_CHIEF,
      category: 'direct',
      labelKey: 'EXECUTION_PROFILES.TRIAL_AREA_CHIEF',
      defaultWidgetIds: ['seguimiento-general', 'disparo'],
      availableFeatures: [ExecutionFeature.SERIES_AND_SHOTS, ExecutionFeature.TRIAL_CHAT],
    },
  ],

  [
    ExecutionProfile.FIRING_LINE_CHIEF,
    {
      profile: ExecutionProfile.FIRING_LINE_CHIEF,
      category: 'direct',
      labelKey: 'EXECUTION_PROFILES.FIRING_LINE_CHIEF',
      defaultWidgetIds: ['seguimiento-general', 'preparacion-ejecucion', 'disparo', 'magnitudes'],
      availableFeatures: [
        ExecutionFeature.ALL_UNIT_CONFORMITIES,
        ExecutionFeature.OWN_FIXED_UNIT_CONFORMITIES,
        ExecutionFeature.SERIES_AND_SHOTS,
        ExecutionFeature.TRIAL_CHAT,
        ExecutionFeature.FIRING_LINE_CHIEF_FIELDS,
      ],
    },
  ],

  [
    ExecutionProfile.TRIAL_ENGINEER,
    {
      profile: ExecutionProfile.TRIAL_ENGINEER,
      category: 'direct',
      labelKey: 'EXECUTION_PROFILES.TRIAL_ENGINEER',
      defaultWidgetIds: ['seguimiento-general'],
      availableFeatures: [
        ExecutionFeature.POWDER_CALIBRATION,
        ExecutionFeature.PRESSURE_ADJUSTMENTS,
        ExecutionFeature.TRIAL_SUPERVISION,
        ExecutionFeature.TRIAL_CHAT,
      ],
    },
  ],

  [
    ExecutionProfile.UNIT_CHIEF,
    {
      profile: ExecutionProfile.UNIT_CHIEF,
      category: 'direct',
      labelKey: 'EXECUTION_PROFILES.UNIT_CHIEF',
      defaultWidgetIds: ['seguimiento-general', 'preparacion-ejecucion'],
      availableFeatures: [
        ExecutionFeature.BALLISTICS_UNIT,
        ExecutionFeature.MUNITIONS_UNIT,
        ExecutionFeature.TOPOGRAPHY_UNIT,
        ExecutionFeature.ARMAMENT_UNIT,
        ExecutionFeature.TRIAL_CHAT,
      ],
    },
  ],

  [
    ExecutionProfile.UNIT_TECHNICIAN,
    {
      profile: ExecutionProfile.UNIT_TECHNICIAN,
      category: 'direct',
      labelKey: 'EXECUTION_PROFILES.UNIT_TECHNICIAN',
      defaultWidgetIds: ['seguimiento-general', 'preparacion-ejecucion'],
      availableFeatures: [
        ExecutionFeature.BALLISTICS_UNIT,
        ExecutionFeature.MUNITIONS_UNIT,
        ExecutionFeature.TOPOGRAPHY_UNIT,
        ExecutionFeature.ARMAMENT_UNIT,
        ExecutionFeature.TRIAL_CHAT,
      ],
    },
  ],

  // ─── Observer / Consultation Profiles ──────────────────────────

  [
    ExecutionProfile.DIRECTOR,
    {
      profile: ExecutionProfile.DIRECTOR,
      category: 'observer',
      labelKey: 'EXECUTION_PROFILES.DIRECTOR',
      defaultWidgetIds: ['seguimiento-general'],
      availableFeatures: [
        ExecutionFeature.SERIES_AND_SHOTS,
        ExecutionFeature.SHOT_RESULTS,
        ExecutionFeature.CONFIGURABLE_EXTRAS,
      ],
    },
  ],

  [
    ExecutionProfile.CLIENT,
    {
      profile: ExecutionProfile.CLIENT,
      category: 'observer',
      labelKey: 'EXECUTION_PROFILES.CLIENT',
      defaultWidgetIds: ['seguimiento-general'],
      availableFeatures: [
        ExecutionFeature.SERIES_AND_SHOTS,
        ExecutionFeature.SHOT_RESULTS,
        ExecutionFeature.CONFIGURABLE_EXTRAS,
      ],
    },
  ],

  [
    ExecutionProfile.PLANNING_ANALYSIS_CHIEF,
    {
      profile: ExecutionProfile.PLANNING_ANALYSIS_CHIEF,
      category: 'observer',
      labelKey: 'EXECUTION_PROFILES.PLANNING_ANALYSIS_CHIEF',
      defaultWidgetIds: ['seguimiento-general'],
      availableFeatures: [
        ExecutionFeature.SERIES_AND_SHOTS,
        ExecutionFeature.SHOT_RESULTS,
        ExecutionFeature.CONFIGURABLE_EXTRAS,
      ],
    },
  ],

  [
    ExecutionProfile.TRIAL_CONSULTANT,
    {
      profile: ExecutionProfile.TRIAL_CONSULTANT,
      category: 'observer',
      labelKey: 'EXECUTION_PROFILES.TRIAL_CONSULTANT',
      defaultWidgetIds: ['seguimiento-general'],
      availableFeatures: [
        ExecutionFeature.SERIES_AND_SHOTS,
        ExecutionFeature.SHOT_RESULTS,
        ExecutionFeature.CONFIGURABLE_EXTRAS,
      ],
    },
  ],
]);

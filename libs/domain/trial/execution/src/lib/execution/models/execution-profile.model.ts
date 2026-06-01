/**
 * Execution profiles representing the different user roles
 * that participate in a fire trial execution.
 *
 * These are independent from the global `Role` enum in `@intaqalab/core`
 * and are specific to the execution domain.
 */
export enum ExecutionProfile {
  /** Jefe de área de ensayos de armamento */
  TRIAL_AREA_CHIEF = 'TRIAL_AREA_CHIEF',

  /** Jefe de la línea de tiro */
  FIRING_LINE_CHIEF = 'FIRING_LINE_CHIEF',

  /** Ingeniero de ensayos */
  TRIAL_ENGINEER = 'TRIAL_ENGINEER',

  /** Jefe de unidad (Balística, Municiones, Armamento, Topografía) */
  UNIT_CHIEF = 'UNIT_CHIEF',

  /** Técnico de unidad (Balística, Municiones, Armamento, Topografía) */
  UNIT_TECHNICIAN = 'UNIT_TECHNICIAN',

  /** Director */
  DIRECTOR = 'DIRECTOR',

  /** Cliente */
  CLIENT = 'CLIENT',

  /** Jefe de la unidad de planificación y análisis */
  PLANNING_ANALYSIS_CHIEF = 'PLANNING_ANALYSIS_CHIEF',

  /** Consultor de ensayos */
  INTAQALAB_TRIAL_CONSULTANT = 'INTAQALAB_TRIAL_CONSULTANT',
}

export type ExecutionProfileCategory = 'direct' | 'observer';

export enum ExecutionFeature {
  /** Series y disparos que componen el ensayo */
  SERIES_AND_SHOTS = 'SERIES_AND_SHOTS',

  /** Chat del ensayo */
  TRIAL_CHAT = 'TRIAL_CHAT',

  /** Conformidades de todas las unidades intervinientes */
  ALL_UNIT_CONFORMITIES = 'ALL_UNIT_CONFORMITIES',

  /** Conformidades de las unidades fijas propias */
  OWN_FIXED_UNIT_CONFORMITIES = 'OWN_FIXED_UNIT_CONFORMITIES',

  /** Campos que debe informar el jefe de la línea de tiro */
  FIRING_LINE_CHIEF_FIELDS = 'FIRING_LINE_CHIEF_FIELDS',

  /** Tarado de pólvora */
  POWDER_CALIBRATION = 'POWDER_CALIBRATION',

  /** Ajustes de presiones */
  PRESSURE_ADJUSTMENTS = 'PRESSURE_ADJUSTMENTS',

  /** Vigilancia y supervisión del correcto desarrollo del ensayo */
  TRIAL_SUPERVISION = 'TRIAL_SUPERVISION',

  /** Elementos específicos de la unidad de Balística */
  BALLISTICS_UNIT = 'BALLISTICS_UNIT',

  /** Elementos específicos de la unidad de Municiones */
  MUNITIONS_UNIT = 'MUNITIONS_UNIT',

  /** Elementos específicos de la unidad de Topografía */
  TOPOGRAPHY_UNIT = 'TOPOGRAPHY_UNIT',

  /** Elementos específicos de la unidad de Armamento */
  ARMAMENT_UNIT = 'ARMAMENT_UNIT',

  /** Resultado de la ejecución de cada disparo (para perfiles observadores) */
  SHOT_RESULTS = 'SHOT_RESULTS',

  /** Elementos configurables adicionales (para perfiles observadores) */
  CONFIGURABLE_EXTRAS = 'CONFIGURABLE_EXTRAS',
}

/**
 * Configuration describing what a given execution profile
 * can see and interact with by default.
 */
export interface ExecutionProfileConfig {
  /** The execution profile this config applies to */
  readonly profile: ExecutionProfile;

  /** Category: direct intervention or observer */
  readonly category: ExecutionProfileCategory;

  /** Human-readable label for this profile (i18n key) */
  readonly labelKey: string;

  /** Default widget IDs that are shown for this profile */
  readonly defaultWidgetIds: readonly string[];

  /** Features enabled by default for this profile */
  readonly availableFeatures: readonly ExecutionFeature[];
}

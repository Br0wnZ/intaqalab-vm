/**
 * 🆔 Enum centralizado de IDs de widgets
 * ÚNICA fuente de verdad para los IDs — cambios aquí se replican automáticamente
 * al usar la referencia en todo el código
 */
export enum WidgetId {
  // Datos del disparo
  SHOT = 'shot',

  // Preparación de ejecución
  EXECUTION_PREP_TECH = 'execution-prep-tech',
  EXECUTION_PREP_JLT = 'execution-prep-jlt',

  // Datos técnicos
  ARMAMENT_INTRODUCTION = 'armament-introduction',
  MUNITION_INTRODUCTION = 'munition-introduction',
  JLT_SHOT_DATA = 'jlt-shot-data',
  RADAR_METCMQ = 'radar-metcmq',

  // Topografía y posicionamiento
  MAO_TOPOGRAPHY = 'mao-topography',
  JLT_MAO = 'jlt-mao',
  PASS_COORDS = 'pass-coords',
  TARGET_DATA = 'target-data',

  // Orientación de equipos
  VIDEO_CAMERA_ORIENTATION = 'video-camera-orientation',
  RADAR_TRAYECTOGRAPHY_ORIENTATION = 'radar-trayectography-orientation',

  // Velocidad y presión
  VELOCITY_INTRODUCTION = 'velocity-introduction',
  MANOMETER_INTRODUCTION = 'manometer-introduction',
  PIEZO_PRESSURE_INTRODUCTION = 'piezo-pressure-introduction',

  // Tarado y uniformidad
  TARADO_VELOCIDAD_CHART = 'tarado-velocidad-chart',
  TARADO_PRESION_CHART = 'tarado-presion-chart',
  UNIFORMIDAD_CHART = 'uniformidad-chart',

  // Seguimiento y análisis
  SEGUIMIENTO = 'seguimiento',
  INFORMACION_TARADO = 'informacion-tarado',
  STANAG_CRITERIOS = 'stanag-criterios',
  GRUBBS_CRITERION = 'grubbs-criterion',

  // Sobrepresión
  OVERPRESSURE_INFO = 'overpressure-info',
  OVERPRESSURE_CHART = 'overpressure-chart',

  // Trayectografía
  TRAYECTOGRAFIA_INTRODUCTION = 'trayectografia-introduction',

  // Topografía acústica
  TOPOGRAPHY_INTRODUCTION = 'topography-introduction',
  ACOUSTIC_LEVEL_INTRODUCTION = 'acoustic-level-introduction',

  // Datos adicionales
  VIGILANCIA = 'vigilancia',
  DATOS_BLANCO_BOLA = 'datos-blanco-bola',
  SEGURIDAD = 'seguridad',
}

/**
 * Array de todos los IDs de widgets (útil para iteraciones)
 */
export const ALL_WIDGET_IDS = Object.values(WidgetId);

/**
 * Type guard para validar que un string es un WidgetId válido
 */
export function isValidWidgetId(value: string): value is WidgetId {
  return ALL_WIDGET_IDS.includes(value as WidgetId);
}

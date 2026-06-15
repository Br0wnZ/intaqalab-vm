import type { WidgetWidth } from './execution-grid.models';
import { WidgetId } from './widget-id.enum';

/**
 * 📋 Registro centralizado de configuración de todos los widgets
 * Permite:
 * - Validar IDs de widgets
 * - Acceder a metadatos (título, descripción, tamaño por defecto)
 * - Mantener un único punto de verdad para la configuración
 */
export interface WidgetConfig {
  id: WidgetId;
  titleKey: string; // Clave i18n para el título
  descriptionKey: string; // Clave i18n para la descripción
  defaultWidth: WidgetWidth;
  hasForm: boolean; // Si el widget tiene un formulario que puede tener cambios
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetConfig> = {
  // Datos del disparo
  [WidgetId.SHOT]: {
    id: WidgetId.SHOT,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.SHOT.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.SHOT.DESCRIPTION',
    defaultWidth: 1,
    hasForm: true,
  },

  // Preparación de ejecución
  [WidgetId.EXECUTION_PREP_TECH]: {
    id: WidgetId.EXECUTION_PREP_TECH,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.DESCRIPTION',
    defaultWidth: 3,
    hasForm: true,
  },
  [WidgetId.EXECUTION_PREP_JLT]: {
    id: WidgetId.EXECUTION_PREP_JLT,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_JLT.DESCRIPTION',
    defaultWidth: 3,
    hasForm: true,
  },

  // Datos técnicos
  [WidgetId.ARMAMENT_INTRODUCTION]: {
    id: WidgetId.ARMAMENT_INTRODUCTION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.ARMAMENT_INTRODUCTION.DESCRIPTION',
    defaultWidth: 3,
    hasForm: true,
  },
  [WidgetId.MUNITION_INTRODUCTION]: {
    id: WidgetId.MUNITION_INTRODUCTION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.MUNITION_INTRODUCTION.DESCRIPTION',
    defaultWidth: 3,
    hasForm: true,
  },
  [WidgetId.JLT_SHOT_DATA]: {
    id: WidgetId.JLT_SHOT_DATA,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.JLT_SHOT_DATA.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.RADAR_METCMQ]: {
    id: WidgetId.RADAR_METCMQ,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.RADAR_METCMQ.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },

  // Topografía y posicionamiento
  [WidgetId.MAO_TOPOGRAPHY]: {
    id: WidgetId.MAO_TOPOGRAPHY,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.MAO_TOPOGRAPHY.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.JLT_MAO]: {
    id: WidgetId.JLT_MAO,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.JLT_MAO.DESCRIPTION',
    defaultWidth: 3,
    hasForm: true,
  },
  [WidgetId.PASS_COORDS]: {
    id: WidgetId.PASS_COORDS,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.PASS_COORDS.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.TARGET_DATA]: {
    id: WidgetId.TARGET_DATA,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.TARGET_DATA.DESCRIPTION',
    defaultWidth: 2,
    hasForm: false,
  },

  // Orientación de equipos
  [WidgetId.VIDEO_CAMERA_ORIENTATION]: {
    id: WidgetId.VIDEO_CAMERA_ORIENTATION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.VIDEO_CAMERA_ORIENTATION.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.RADAR_TRAYECTOGRAPHY_ORIENTATION]: {
    id: WidgetId.RADAR_TRAYECTOGRAPHY_ORIENTATION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.RADAR_TRAYECTOGRAPHY_ORIENTATION.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },

  // Velocidad y presión
  [WidgetId.VELOCITY_INTRODUCTION]: {
    id: WidgetId.VELOCITY_INTRODUCTION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.VELOCITY_INTRODUCTION.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.MANOMETER_INTRODUCTION]: {
    id: WidgetId.MANOMETER_INTRODUCTION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.MANOMETER_INTRODUCTION.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.PIEZO_PRESSURE_INTRODUCTION]: {
    id: WidgetId.PIEZO_PRESSURE_INTRODUCTION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.PIEZO_PRESSURE.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },

  // Tarado y uniformidad
  [WidgetId.TARADO_VELOCIDAD_CHART]: {
    id: WidgetId.TARADO_VELOCIDAD_CHART,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.TARADO_VELOCIDAD.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.TARADO_PRESION_CHART]: {
    id: WidgetId.TARADO_PRESION_CHART,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.TARADO_PRESION.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.UNIFORMIDAD_CHART]: {
    id: WidgetId.UNIFORMIDAD_CHART,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.UNIFORMIDAD.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },

  // Seguimiento y análisis
  [WidgetId.SEGUIMIENTO]: {
    id: WidgetId.SEGUIMIENTO,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.SEGUIMIENTO.DESCRIPTION',
    defaultWidth: 3,
    hasForm: true,
  },
  [WidgetId.INFORMACION_TARADO]: {
    id: WidgetId.INFORMACION_TARADO,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.INFORMACION_TARADO.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.INFORMACION_TARADO.DESCRIPTION',
    defaultWidth: 2,
    hasForm: false,
  },
  [WidgetId.STANAG_CRITERIOS]: {
    id: WidgetId.STANAG_CRITERIOS,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.STANAG_CRITERIOS.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.GRUBBS_CRITERION]: {
    id: WidgetId.GRUBBS_CRITERION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.GRUBBS_CRITERION.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },

  // Sobrepresión
  [WidgetId.OVERPRESSURE_INFO]: {
    id: WidgetId.OVERPRESSURE_INFO,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_INFO.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.OVERPRESSURE_CHART]: {
    id: WidgetId.OVERPRESSURE_CHART,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.OVERPRESSURE_CHART.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },

  // Trayectografía
  [WidgetId.TRAYECTOGRAFIA_INTRODUCTION]: {
    id: WidgetId.TRAYECTOGRAFIA_INTRODUCTION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.TRAYECTOGRAFIA_INTRODUCTION.DESCRIPTION',
    defaultWidth: 3,
    hasForm: true,
  },

  // Topografía acústica
  [WidgetId.TOPOGRAPHY_INTRODUCTION]: {
    id: WidgetId.TOPOGRAPHY_INTRODUCTION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.TOPOGRAPHY_INTRODUCTION.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.ACOUSTIC_LEVEL_INTRODUCTION]: {
    id: WidgetId.ACOUSTIC_LEVEL_INTRODUCTION,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.ACOUSTIC_LEVEL_INTRODUCTION.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },

  // Datos adicionales
  [WidgetId.VIGILANCIA]: {
    id: WidgetId.VIGILANCIA,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.VIGILANCIA.DESCRIPTION',
    defaultWidth: 3,
    hasForm: true,
  },
  [WidgetId.DATOS_BLANCO_BOLA]: {
    id: WidgetId.DATOS_BLANCO_BOLA,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.DATOS_BLANCO_BOLA.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
  [WidgetId.SEGURIDAD]: {
    id: WidgetId.SEGURIDAD,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.SEGURIDAD.DESCRIPTION',
    defaultWidth: 2,
    hasForm: true,
  },
};

/**
 * Obtener configuración de un widget por ID
 */
export function getWidgetConfig(widgetId: WidgetId): WidgetConfig {
  const config = WIDGET_REGISTRY[widgetId];
  if (!config) {
    throw new Error(`Widget configuration not found for ID: ${widgetId}`);
  }
  return config;
}

/**
 * Obtener todos los widgets registrados
 */
export function getAllWidgetConfigs(): WidgetConfig[] {
  return Object.values(WIDGET_REGISTRY);
}

// Widget ID enum
export { ALL_WIDGET_IDS, isValidWidgetId, WidgetId } from './widget-id.enum';

// Widget registry
export { getAllWidgetConfigs, getWidgetConfig, WIDGET_REGISTRY } from './widget-registry';
export type { WidgetConfig as WidgetConfigType } from './widget-registry';

// Execution grid models
export type {
  FormWidget,
  GridPosition,
  PlacedWidget,
  TechProfile,
  WidgetFormState,
  WidgetHeight,
  WidgetPreferenceId,
  WidgetType,
  WidgetWidth,
} from './execution-grid.models';

// Equipment models
export * from './equipment.models';
export * from './armament-equipment.models';

// Shot munition models (Widget 20)
export * from './shot-munition.models';

// Shot manometer pressures models (Widget 21)
export * from './shot-acoustic-level.models';
export * from './shot-camera-orientation.models';
export * from './shot-jlt-mao.models';
export * from './shot-manometer-pressures.models';
export * from './shot-mao-topography.models';
export * from './shot-topography.models';
export * from './shot-trajectography.models';
export * from './shot-video-data.models';

// Propelling charge parameters models (Widget 9)
export * from './propellant-charge-adjustment.models';
export * from './propelling-charge-parameters.models';

// Shot piezo pressures models (Widget 5)
export * from './shot-piezo-pressures.models';
export * from './shot-radar-trayectography-orientation.models';

// Shot IPG pressures models (Widget 32)
export * from './shot-ipg-pressures.models';

// Execution runtime models (state, progress, measurements, countdown, transitions)
export * from './execution-runtime.models';

// Execution planning models (document, approval, munition options)
export * from './execution-planning.models';

// Execution readiness models (technical profiles, JLT preparation)
export * from './execution-readiness.models';

// Execution preferences models (widget layout, equipment selector)
export * from './execution-preferences.models';

// Shot data models extracted from ExecutionService
export * from './shot-velocities.models';
export * from './jlt-shot-data.models';
export * from './armament.models';
export * from './trial-overpressure-info.models';

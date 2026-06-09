import type { Signal } from '@angular/core';

/**
 * 📐 Tamaño de un widget en el grid
 */
export type WidgetWidth = 1 | 2 | 3;
export type WidgetHeight = 1 | 2;

/**
 * 📍 Posición en el grid (1-based)
 */
export interface GridPosition {
  row: number; // 1-3
  col: number; // 1-3
}

/**
 * 🎯 Widget colocado en el grid
 */
export interface PlacedWidget {
  id: string;
  type: WidgetType;
  position: GridPosition;
  width: WidgetWidth;
  height: WidgetHeight;
  color?: string;
  /** 🎭 Perfil técnico — sólo para widgets de tipo 'execution-prep-tech' */
  techProfile?: TechProfile;
}

/**
 * 🎨 Tipos de widgets disponibles
 */
export type WidgetType =
  | 'shot'
  | 'execution-prep-tech'
  | 'execution-prep-jlt'
  | 'video-camera-orientation'
  | 'radar-trayectography-orientation'
  | 'mao-topography'
  | 'jlt-mao'
  | 'armament-introduction'
  | 'jlt-shot-data'
  | 'munition-introduction'
  | 'radar-metcmq'
  | 'tarado-velocidad-chart'
  | 'velocity-introduction'
  | 'piezo-pressure-introduction'
  | 'manometer-introduction'
  | 'seguimiento'
  | 'informacion-tarado'
  | 'tarado-presion-chart'
  | 'uniformidad-chart'
  | 'stanag-criterios'
  | 'trayectografia-introduction'
  | 'overpressure-info'
  | 'overpressure-chart'
  | 'pass-coords'
  | 'grubbs-criterion'
  | 'topography-introduction'
  | 'target-data'
  | 'acoustic-level-introduction'
  | 'vigilancia'
  | 'datos-blanco-bola'
  | 'seguridad';

/**
 * 🎭 Perfiles técnicos para el widget Preparación ejecución – Unidades técnicas
 */
export type TechProfile =
  | 'velocidades'
  | 'presiones'
  | 'video'
  | 'trayectografia'
  | 'municiones'
  | 'armamento';

/**
 * 📊 Estado del formulario de un widget
 */
export interface WidgetFormState {
  widgetId: string;
  dirty: boolean;
  touched: boolean;
  valid: boolean;
  hasChanges: boolean;
}

/**
 * 🎯 Configuración de un widget
 */
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  defaultWidth: WidgetWidth;
  hasForm: boolean;
}

/**
 * 📝 Interface que deben implementar los widgets con formulario
 */
export interface FormWidget {
  /** Signal del estado del formulario */
  formState: Signal<WidgetFormState>;

  /** Resetear el formulario */
  resetForm(): void;

  /** Guardar cambios del formulario */
  saveForm(): Promise<void>;
}

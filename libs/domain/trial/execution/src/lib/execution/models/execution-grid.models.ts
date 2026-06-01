import type { Signal } from '@angular/core';

/**
 * 📐 Tamaño de un widget en el grid
 */
export type WidgetWidth = 1 | 2 | 3;
export type WidgetHeight = 1;

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
}

/**
 * 🎨 Tipos de widgets disponibles
 */
export type WidgetType =
  | 'shot'
  | 'general-tracking'
  | 'execution-prep'
  | 'radar-config'
  | 'velocity-history'
  | 'magnitudes';

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

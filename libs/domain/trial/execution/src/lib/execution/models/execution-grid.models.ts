import type { Signal } from '@angular/core';

import type { WidgetId } from './widget-id.enum';

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
  type: WidgetId;
  position: GridPosition;
  width: WidgetWidth;
  height: WidgetHeight;
  color?: string;
  /** 🎭 Perfil técnico — sólo para widgets de tipo 'execution-prep-tech' */
  techProfile?: TechProfile;
}

/**
 * ⚠️ DEPRECATED: Usa `WidgetId` enum en su lugar
 * 🎨 Tipos de widgets disponibles (mantenido para compatibilidad)
 */
export type WidgetType = WidgetId;

/**
 * 🎭 Perfiles técnicos para el widget Preparación ejecución – Unidades técnicas
 */
export type TechProfile = 'velocidades' | 'presiones' | 'video' | 'trayectografia' | 'municiones' | 'armamento';

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

/**
 * 🧩 Widget en la librería/panel lateral
 * Configuración de widget disponible para añadir al grid
 */
export interface Widget {
  id: string;
  widgetId: WidgetId;
  title: string;
  description: string;
  category: string;
  badge?: string;
  badgeColor?: 'purple' | 'blue';
  defaultWidth: WidgetWidth;
  defaultHeight?: WidgetHeight;
  /** 🎭 Perfil técnico (sólo para type 'execution-prep-tech') */
  techProfile?: TechProfile;
}

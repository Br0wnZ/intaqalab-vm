import type { GridPosition, WidgetHeight, WidgetWidth } from './execution-grid.models';
import type { WidgetId } from './widget-id.enum';

/**
 * 💾 Preferencias de widgets persistidas en backend
 * Representa la configuración de widgets seleccionados por el usuario/rol
 */
export interface WidgetPreferences {
  id?: string; // ID en la DB
  centerId: string;
  fireTrialId: string;
  role?: string; // Para preferencias a nivel de rol (opcional si es por usuario)
  username?: string; // Para preferencias a nivel de usuario (opcional si es por rol)
  widgets: SavedWidgetConfig[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 💾 Configuración guardada de un widget individual
 */
export interface SavedWidgetConfig {
  widgetId: WidgetId;
  position: GridPosition;
  width: WidgetWidth;
  height: WidgetHeight;
  techProfile?: string; // Para widgets que soportan perfiles (ej: execution-prep-tech)
}

/**
 * 📤 Payload para crear/actualizar preferencias de widgets
 */
export interface UpsertWidgetPreferencesRequest {
  widgets: SavedWidgetConfig[];
}

/**
 * 📥 Respuesta del servidor al guardar preferencias
 */
export interface WidgetPreferencesResponse {
  success: boolean;
  message?: string;
  preferences?: WidgetPreferences;
}

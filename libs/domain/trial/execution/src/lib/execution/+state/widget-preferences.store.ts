import { Injectable, inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import type { WidgetId } from '../models/widget-id.enum';
import type { SavedWidgetConfig, WidgetPreferences } from '../models/widget-preferences.model';
import { WidgetPreferencesService } from '../services/widget-preferences.service';

interface WidgetPreferencesState {
  centerId: string | null;
  fireTrialId: string | null;
  preferences: WidgetPreferences | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WidgetPreferencesState = {
  centerId: null,
  fireTrialId: null,
  preferences: null,
  isLoading: false,
  error: null,
};

/**
 * 🏪 Store para gestionar preferencias de widgets persistidas
 * Sincroniza con el backend para guardar la configuración del usuario
 */
@Injectable({ providedIn: 'root' })
export class WidgetPreferencesStore extends signalStore(
  withState(initialState),
  withMethods((store, preferencesService = inject(WidgetPreferencesService)) => ({
    /**
     * 📥 Cargar preferencias desde el backend
     */
    async loadPreferences(centerId: string, fireTrialId: string): Promise<void> {
      patchState(store, { centerId, fireTrialId, isLoading: true, error: null });

      try {
        const preferences = await preferencesService.getWidgetPreferences(centerId, fireTrialId);
        patchState(store, { preferences });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar preferencias';
        patchState(store, { error: message });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    /**
     * 💾 Guardar preferencias en el backend
     */
    async savePreferences(widgets: SavedWidgetConfig[]): Promise<void> {
      const centerId = store.centerId();
      const fireTrialId = store.fireTrialId();

      if (!centerId || !fireTrialId) {
        throw new Error('Centro o trial no configurado');
      }

      patchState(store, { isLoading: true, error: null });

      try {
        const response = await preferencesService.upsertWidgetPreferences(centerId, fireTrialId, widgets);

        if (response.preferences) {
          patchState(store, { preferences: response.preferences });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar preferencias';
        patchState(store, { error: message });
        throw err;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    /**
     * 🔄 Actualizar una sola configuración de widget
     */
    updateWidgetConfig(widgetId: WidgetId, config: Partial<SavedWidgetConfig>): void {
      const prefs = store.preferences();
      if (!prefs) return;

      const index = prefs.widgets.findIndex((w) => w.widgetId === widgetId);
      if (index >= 0) {
        prefs.widgets[index] = { ...prefs.widgets[index], ...config };
        patchState(store, { preferences: { ...prefs } });
      }
    },

    /**
     * ➕ Añadir nueva configuración de widget
     */
    addWidgetConfig(config: SavedWidgetConfig): void {
      const prefs = store.preferences();
      if (!prefs) return;

      prefs.widgets.push(config);
      patchState(store, { preferences: { ...prefs } });
    },

    /**
     * 🗑️ Remover configuración de widget
     */
    removeWidgetConfig(widgetId: WidgetId): void {
      const prefs = store.preferences();
      if (!prefs) return;

      prefs.widgets = prefs.widgets.filter((w) => w.widgetId !== widgetId);
      patchState(store, { preferences: { ...prefs } });
    },

    /**
     * 🔍 Obtener configuración de un widget específico
     */
    getWidgetConfig(widgetId: WidgetId): SavedWidgetConfig | undefined {
      return store.preferences()?.widgets.find((w) => w.widgetId === widgetId);
    },

    /**
     * 🗂️ Obtener todos los widgets guardados
     */
    getAllWidgets(): SavedWidgetConfig[] {
      return store.preferences()?.widgets ?? [];
    },

    /**
     * 🧹 Limpiar estado
     */
    clearPreferences(): void {
      patchState(store, { preferences: null, error: null });
    },
  })),
) {}

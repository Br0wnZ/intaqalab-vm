import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  SavedWidgetConfig,
  WidgetPreferences,
  WidgetPreferencesResponse,
} from '../models/widget-preferences.model';

/**
 * 🌐 Servicio para comunicarse con el backend sobre preferencias de widgets
 * Maneja peticiones HTTP para guardar y recuperar configuración de widgets
 */
@Injectable({ providedIn: 'root' })
export class WidgetPreferencesService {
  readonly #http = inject(HttpClient);

  /**
   * 📥 Obtener preferencias de widgets para un centro y trial
   * Intenta primero por usuario actual, luego por rol
   */
  async getWidgetPreferences(centerId: string, fireTrialId: string): Promise<WidgetPreferences> {
    const url = `/${centerId}/fire-trials/${fireTrialId}/execution/preferences`;

    try {
      const response = await firstValueFrom(this.#http.get<WidgetPreferences>(url));
      return response;
    } catch (err) {
      console.error('Error al obtener preferencias de widgets:', err);
      // Retornar preferencias vacías si hay error
      return {
        centerId,
        fireTrialId,
        widgets: [],
      };
    }
  }

  /**
   * 💾 Guardar/actualizar preferencias de widgets para un usuario o rol
   */
  async upsertWidgetPreferences(
    centerId: string,
    fireTrialId: string,
    widgets: SavedWidgetConfig[],
  ): Promise<WidgetPreferencesResponse> {
    const url = `/${centerId}/fire-trials/${fireTrialId}/execution/preferences`;
    const payload = { widgets };

    const response = await firstValueFrom(this.#http.put<WidgetPreferencesResponse>(url, payload));

    if (!response.success) {
      throw new Error(response.message || 'Error al guardar preferencias');
    }

    return response;
  }

  /**
   * 📥 Obtener preferencias por rol específico
   */
  async getWidgetPreferencesByRole(
    centerId: string,
    fireTrialId: string,
    roleName: string,
  ): Promise<WidgetPreferences> {
    const url = `/${centerId}/fire-trials/${fireTrialId}/execution/preferences/roles/${roleName}`;

    try {
      const response = await firstValueFrom(this.#http.get<WidgetPreferences>(url));
      return response;
    } catch (err) {
      console.error(`Error al obtener preferencias para rol ${roleName}:`, err);
      return {
        centerId,
        fireTrialId,
        role: roleName,
        widgets: [],
      };
    }
  }

  /**
   * 💾 Guardar preferencias por rol
   */
  async upsertWidgetPreferencesByRole(
    centerId: string,
    fireTrialId: string,
    roleName: string,
    widgets: SavedWidgetConfig[],
  ): Promise<WidgetPreferencesResponse> {
    const url = `/${centerId}/fire-trials/${fireTrialId}/execution/preferences/roles/${roleName}`;
    const payload = { widgets };

    const response = await firstValueFrom(this.#http.put<WidgetPreferencesResponse>(url, payload));

    if (!response.success) {
      throw new Error(response.message || 'Error al guardar preferencias de rol');
    }

    return response;
  }

  /**
   * 📥 Obtener preferencias por usuario específico
   */
  async getWidgetPreferencesByUser(
    centerId: string,
    fireTrialId: string,
    username: string,
  ): Promise<WidgetPreferences> {
    const url = `/${centerId}/fire-trials/${fireTrialId}/execution/preferences/users/${username}`;

    try {
      const response = await firstValueFrom(this.#http.get<WidgetPreferences>(url));
      return response;
    } catch (err) {
      console.error(`Error al obtener preferencias para usuario ${username}:`, err);
      return {
        centerId,
        fireTrialId,
        username,
        widgets: [],
      };
    }
  }

  /**
   * 💾 Guardar preferencias por usuario
   */
  async upsertWidgetPreferencesByUser(
    centerId: string,
    fireTrialId: string,
    username: string,
    widgets: SavedWidgetConfig[],
  ): Promise<WidgetPreferencesResponse> {
    const url = `/${centerId}/fire-trials/${fireTrialId}/execution/preferences/users/${username}`;
    const payload = { widgets };

    const response = await firstValueFrom(this.#http.put<WidgetPreferencesResponse>(url, payload));

    if (!response.success) {
      throw new Error(response.message || 'Error al guardar preferencias de usuario');
    }

    return response;
  }
}

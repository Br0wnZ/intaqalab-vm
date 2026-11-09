import { httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { injectExecutionEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type { ExecutionWidgetLayout, WidgetPreferenceId } from '../../../execution/models';
import { executionTrialUrl } from '../shared/execution-endpoints';

interface PreferencesRoleParams {
  fireTrialId: FireTrial['id'];
  roleName: string;
  widgetsLayout?: WidgetPreferenceId[];
}

interface PreferencesUserParams {
  fireTrialId: FireTrial['id'];
  username: string;
  widgetsLayout?: WidgetPreferenceId[];
}

@Injectable({
  providedIn: 'root',
})
export class WidgetPreferencesService {
  readonly #executionUrl = injectExecutionEndpoint();

  readonly #getPreferencesByRoleParams = signal<PreferencesRoleParams | null>(null);

  readonly preferencesByRoleResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#getPreferencesByRoleParams();
    if (!params || !params.roleName) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'preferences', 'roles', params.roleName),
      method: 'GET',
    };
  });

  getPreferencesByRole(fireTrialId: FireTrial['id'], roleName: string): void {
    this.#getPreferencesByRoleParams.set({ fireTrialId, roleName });
  }

  readonly #updatePreferencesByRoleParams = signal<PreferencesRoleParams | null>(null);

  readonly updatePreferencesByRoleResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#updatePreferencesByRoleParams();
    if (!params || !params.roleName || !params.widgetsLayout) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'preferences', 'roles', params.roleName),
      method: 'PUT',
      body: { widgetsLayout: params.widgetsLayout } satisfies ExecutionWidgetLayout,
    };
  });

  updatePreferencesByRole(fireTrialId: FireTrial['id'], roleName: string, widgetsLayout: WidgetPreferenceId[]): void {
    this.#updatePreferencesByRoleParams.set({ fireTrialId, roleName, widgetsLayout });
  }

  readonly #getPreferencesByUserParams = signal<PreferencesUserParams | null>(null);

  readonly preferencesByUserResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#getPreferencesByUserParams();
    if (!params || !params.username) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'preferences', 'users', params.username),
      method: 'GET',
    };
  });

  getPreferencesByUser(fireTrialId: FireTrial['id'], username: string): void {
    this.#getPreferencesByUserParams.set({ fireTrialId, username });
  }

  readonly #updatePreferencesByUserParams = signal<PreferencesUserParams | null>(null);

  readonly updatePreferencesByUserResource = httpResource<ExecutionWidgetLayout>(() => {
    const params = this.#updatePreferencesByUserParams();
    if (!params || !params.username || !params.widgetsLayout) return undefined;
    return {
      url: executionTrialUrl(this.#executionUrl, params.fireTrialId, 'preferences', 'users', params.username),
      method: 'PUT',
      body: { widgetsLayout: params.widgetsLayout } satisfies ExecutionWidgetLayout,
    };
  });

  updatePreferencesByUser(fireTrialId: FireTrial['id'], username: string, widgetsLayout: WidgetPreferenceId[]): void {
    this.#updatePreferencesByUserParams.set({ fireTrialId, username, widgetsLayout });
  }
}

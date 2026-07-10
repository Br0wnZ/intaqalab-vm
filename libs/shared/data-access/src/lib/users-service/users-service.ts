import { HttpContext, httpResource } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { SKIP_CENTER_INTERCEPTOR, injectFireTrialsEndpoint, injectUsersEndpoint } from '@intaqalab/config';
import type { FireTrial } from '@intaqalab/models';

import type { PlanningUsersQueryParams, PlanningUsersResponse } from './users-service.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  readonly #usersUrl = injectUsersEndpoint();
  readonly #fireTrialUrl = injectFireTrialsEndpoint();

  readonly queryParams = signal<PlanningUsersQueryParams | null>(null);
  readonly associatedPlanningUserId = signal<{ fireTrialId: string; id: string } | null>(null);

  readonly usersResource = httpResource<PlanningUsersResponse>(() => {
    const params = this.queryParams();

    if (!params) return;

    let urlParams = `?limit=${params.limit}`;
    if (params.search) urlParams += `&search=${params.search}`;

    return {
      url: `${this.#usersUrl}/users${urlParams}`,
      context: new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
    };
  });

  readonly updateFireTrialAssociatedUser = httpResource<FireTrial>(() => {
    const ids = this.associatedPlanningUserId();

    if (!ids) return undefined;

    return {
      url: `${this.#fireTrialUrl}/${ids.fireTrialId}/planning-user`,
      method: 'PUT',
      body: [ids.id],
    };
  });
}

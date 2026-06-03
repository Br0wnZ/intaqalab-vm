import { HttpContext, HttpParams, httpResource } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { SKIP_CENTER_INTERCEPTOR, injectUsersEndpoint } from '@intaqalab/config';

import type { User, UserListResponse, UserQueryParams } from './users-service.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  readonly #url = injectUsersEndpoint();

  readonly #queryParams = signal<UserQueryParams>({ page: 1, pageSize: 25 });

  readonly usersResource = httpResource<UserListResponse>(
    () => {
      const { page, pageSize } = this.#queryParams();
      return {
        url: `${this.#url}/users`,
        params: new HttpParams().set('page', String(page)).set('pageSize', String(pageSize)),
        context: new HttpContext().set(SKIP_CENTER_INTERCEPTOR, true),
      };
    },
    {
      defaultValue: { page: 1, pageSize: 25, totalElements: 0, items: [] },
    },
  );

  readonly hasError = computed<boolean>(() => !!this.usersResource.error());

  readonly users = computed<User[]>(() => {
    if (this.hasError()) return [];
    return this.usersResource.value()?.items ?? [];
  });

  readonly totalElements = computed<number>(() => {
    if (this.hasError()) return 0;
    return this.usersResource.value()?.totalElements ?? 0;
  });

  load(params: UserQueryParams): void {
    this.#queryParams.set(params);
  }
}

import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { injectEventLogEndpoint } from '@intaqalab/config';

import type { EventLogUser } from '../utils-models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  readonly #apiUrl = injectEventLogEndpoint();

  getUsersResponse = httpResource<EventLogUser[]>(() => {
    return {
      url: `${this.#apiUrl}/users`,
      method: 'GET',
    };
  });
}

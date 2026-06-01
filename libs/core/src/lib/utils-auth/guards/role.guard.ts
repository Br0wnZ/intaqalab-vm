import { inject } from '@angular/core';
import type { CanMatchFn, Route } from '@angular/router';

import { AuthService } from '../auth-service';
import type { Role } from '../models/role.model';

export const canMatchRole: CanMatchFn = (route: Route) => {
  const allowedRoles = (route.data?.['roles'] as Role[]) || [];
  return inject(AuthService).hasAnyRole(allowedRoles);
};

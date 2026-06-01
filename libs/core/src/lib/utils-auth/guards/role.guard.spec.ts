import { TestBed } from '@angular/core/testing';
import type { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../auth-service';
import { Role } from '../models/role.model';
import { canMatchRole } from './role.guard';

describe('RoleGuard', () => {
  const executeGuard: CanMatchFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => canMatchRole(...guardParameters));

  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            hasAnyRole: vi.fn(),
            userRoles: vi.fn(),
          },
        },
      ],
    });
    authService = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should allow access if no roles are defined in route data', () => {
    const route: Route = { data: {} };
    const segments: UrlSegment[] = [];
    vi.spyOn(authService, 'hasAnyRole').mockReturnValue(true);

    const result = executeGuard(route, segments);

    expect(result).toBe(true);
  });

  it('should call AuthService.hasAnyRole with roles from route data', () => {
    const roles = [Role.ADMINISTRATIVE];
    const route: Route = { data: { roles } };
    const segments: UrlSegment[] = [];
    vi.spyOn(authService, 'hasAnyRole').mockReturnValue(true);

    executeGuard(route, segments);

    expect(authService.hasAnyRole).toHaveBeenCalledWith(roles);
  });

  it('should return false if AuthService returns false', () => {
    const roles = [Role.ADMINISTRATIVE];
    const route: Route = { data: { roles } };
    const segments: UrlSegment[] = [];
    vi.spyOn(authService, 'hasAnyRole').mockReturnValue(false);

    const result = executeGuard(route, segments);

    expect(result).toBe(false);
  });
});

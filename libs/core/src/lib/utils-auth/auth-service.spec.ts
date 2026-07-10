import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from './auth-service';
import { Role } from './models/role.model';

describe('AuthService', () => {
  let service: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
            events: of(new NavigationEnd(0, 'http://localhost:4200/dashboard', 'http://localhost:4200/dashboard')),
            routerState: {
              root: {
                snapshot: {
                  data: {},
                },
              },
            },
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {},
            },
          },
        },
      ],
    });
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should redirect to home if user loses required role for current route', () => {
    const requiredRole = Role.ADMINISTRATIVE;
    router.routerState.root.snapshot.data = { roles: [requiredRole] };

    service.setRoles([requiredRole]);

    service.setRoles([Role.INTAQALAB_VIEWER]);
    TestBed.flushEffects();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should NOT redirect if user maintains required role', () => {
    const requiredRole = Role.ADMINISTRATIVE;
    router.routerState.root.snapshot.data = { roles: [requiredRole] };

    service.setRoles([requiredRole, Role.PLANNING_TECHNICIAN]);

    service.setRoles([requiredRole]);
    TestBed.flushEffects();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should notb have initial roles', () => {
    const roles = service.userRoles();
    expect(roles).toStrictEqual([]);
  });

  it('should update roles', () => {
    const newRoles = [Role.INTAQALAB_VIEWER];
    service.setRoles(newRoles);
    expect(service.userRoles()).toEqual(newRoles);
  });

  it('should check if user has specific role', () => {
    service.setRoles([Role.INTAQALAB_ADMIN]);
    expect(service.hasRole(Role.INTAQALAB_ADMIN)).toBe(true);
    expect(service.hasRole(Role.INTAQALAB_VIEWER)).toBe(false);
  });

  it('should check if user has any of the provided roles', () => {
    service.setRoles([Role.INTAQALAB_ADMIN]);
    expect(service.hasAnyRole([Role.INTAQALAB_ADMIN])).toBe(true);
    expect(service.hasAnyRole([Role.INTAQALAB_VIEWER, Role.INTAQALAB_ADMIN])).toBe(true);
    expect(service.hasAnyRole([Role.INTAQALAB_VIEWER])).toBe(false);
  });
  it('should setRawRoles assign validr roles', () => {
    service.setRawRoles([Role.INTAQALAB_ADMIN, 'foo', 'bar']);
    expect(service.userRoles()).toStrictEqual([Role.INTAQALAB_ADMIN]);
  });
});

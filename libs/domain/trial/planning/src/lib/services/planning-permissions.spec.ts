import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService, Role } from '@intaqalab/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { injectPlanningPermissions } from './planning-permissions';

describe('injectPlanningPermissions', () => {
  let userRolesSignal: ReturnType<typeof signal<Role[]>>;

  beforeEach(() => {
    userRolesSignal = signal<Role[]>([]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            userRoles: userRolesSignal,
          },
        },
      ],
    });
  });

  it('should compute canEditGeneralData correctly', () => {
    const injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      const permissions = injectPlanningPermissions();

      expect(permissions.canEditGeneralData()).toBe(false);

      userRolesSignal.set([Role.PLANNING_TECHNICIAN]);
      expect(permissions.canEditGeneralData()).toBe(true);

      userRolesSignal.set([Role.INTAQALAB_ADMIN]);
      expect(permissions.canEditGeneralData()).toBe(true);

      userRolesSignal.set([Role.INTAQALAB_PLANNING_ANALYSIS_HEAD]);
      expect(permissions.canEditGeneralData()).toBe(true);

      userRolesSignal.set([Role.INTAQALAB_VIEWER]);
      expect(permissions.canEditGeneralData()).toBe(false);
    });
  });

  it('should compute canEditArmament and canEditMunitions correctly', () => {
    const injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      const permissions = injectPlanningPermissions();

      expect(permissions.canEditArmament()).toBe(false);
      expect(permissions.canEditMunitions()).toBe(false);

      userRolesSignal.set([Role.INTAQALAB_ARMAMENT_UNIT_HEAD]);
      expect(permissions.canEditArmament()).toBe(true);
      expect(permissions.canEditMunitions()).toBe(false);

      userRolesSignal.set([Role.INTAQALAB_MUNITIONS_UNIT_TECHNICIAN]);
      expect(permissions.canEditArmament()).toBe(false);
      expect(permissions.canEditMunitions()).toBe(true);
    });
  });

  it('should compute canEditMeasures categories correctly', () => {
    const injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      const permissions = injectPlanningPermissions();

      userRolesSignal.set([Role.INTAQALAB_BALLISTICS_UNIT_HEAD]);
      expect(permissions.canEditBallisticsMeasures()).toBe(true);
      expect(permissions.canEditTopographyMeasures()).toBe(false);

      userRolesSignal.set([Role.INTAQALAB_TOPOGRAPHY_UNIT_TECHNICIAN]);
      expect(permissions.canEditBallisticsMeasures()).toBe(false);
      expect(permissions.canEditTopographyMeasures()).toBe(true);
    });
  });

  it('should compute canValidate correctly', () => {
    const injector = TestBed.inject(Injector);
    runInInjectionContext(injector, () => {
      const permissions = injectPlanningPermissions();

      expect(permissions.canValidate()).toBe(false);

      userRolesSignal.set([Role.HEAD_ARMAMENT_TRIALS]);
      expect(permissions.canValidate()).toBe(true);

      userRolesSignal.set([Role.INTAQALAB_PLANNING_ANALYSIS_HEAD]);
      expect(permissions.canValidate()).toBe(true);
    });
  });
});

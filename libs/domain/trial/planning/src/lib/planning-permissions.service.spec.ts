import { TestBed } from '@angular/core/testing';
import { AuthService, Role } from '@intaqalab/core';
import { TrialStatus } from '@intaqalab/models';

import { PlanningPermissionsService } from './planning-permissions.service';

describe('PlanningPermissionsService', () => {
  let authService: AuthService;
  let service: PlanningPermissionsService;

  const setRoles = (roles: Role[]) => {
    authService.userRoles.set(roles);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PlanningPermissionsService, AuthService] });
    authService = TestBed.inject(AuthService);
    service = TestBed.inject(PlanningPermissionsService);
  });

  describe('canValidatePlanning', () => {
    it('should allow Admin', () => {
      setRoles([Role.INTAQALAB_ADMIN]);
      expect(service.canValidatePlanning()).toBe(true);
    });

    it('should allow Planning Analysis Head', () => {
      setRoles([Role.INTAQALAB_PLANNING_ANALYSIS_HEAD]);
      expect(service.canValidatePlanning()).toBe(true);
    });

    it('should NOT allow Trial Consultant', () => {
      setRoles([Role.INTAQALAB_TRIAL_CONSULTANT]);
      expect(service.canValidatePlanning()).toBe(false);
    });
  });

  describe('canModifyPlanning', () => {
    it('should allow Admin', () => {
      setRoles([Role.INTAQALAB_ADMIN]);
      expect(service.canModifyPlanning()).toBe(true);
    });

    it('should allow Planning Analysis Head', () => {
      setRoles([Role.INTAQALAB_PLANNING_ANALYSIS_HEAD]);
      expect(service.canModifyPlanning()).toBe(true);
    });

    it('should NOT allow Trial Consultant', () => {
      setRoles([Role.INTAQALAB_TRIAL_CONSULTANT]);
      expect(service.canModifyPlanning()).toBe(false);
    });
  });

  describe('canAccessPlanningTab', () => {
    it('should restrict UNDER_REVIEW to Admin, PlanningHead and Consultant', () => {
      setRoles([Role.INTAQALAB_TRIAL_CONSULTANT]);
      expect(service.canAccessPlanningTab(TrialStatus.UNDER_REVIEW)).toBe(true);

      setRoles([Role.INTAQALAB_TRIAL_ENGINEER]);
      expect(service.canAccessPlanningTab(TrialStatus.UNDER_REVIEW)).toBe(false);
    });

    it('should allow every non-viewer role once the trial is PLANNED', () => {
      setRoles([Role.INTAQALAB_TRIAL_ENGINEER]);
      expect(service.canAccessPlanningTab(TrialStatus.PLANNED)).toBe(true);
    });

    it('should NOT allow a viewer-only role once the trial is PLANNED', () => {
      setRoles([Role.INTAQALAB_VIEWER]);
      expect(service.canAccessPlanningTab(TrialStatus.PLANNED)).toBe(false);
    });
  });
});

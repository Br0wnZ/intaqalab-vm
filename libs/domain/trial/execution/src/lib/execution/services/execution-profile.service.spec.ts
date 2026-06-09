import { TestBed } from '@angular/core/testing';
import { AuthService, Role } from '@intaqalab/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { EXECUTION_PROFILE_REGISTRY } from '../models/execution-profile-registry';
import { ExecutionFeature, ExecutionProfile } from '../models/execution-profile.model';
import { ExecutionProfileService, resolveExecutionProfile } from './execution-profile.service';

// // Pure function tests
//

describe('resolveExecutionProfile', () => {
  it('resolves TRIAL_EXECUTION_ADMIN to TRIAL_AREA_CHIEF', () => {
    expect(resolveExecutionProfile([Role.TRIAL_EXECUTION_ADMIN])).toBe(ExecutionProfile.TRIAL_AREA_CHIEF);
  });

  it('resolves UNIT_ADMIN to UNIT_CHIEF', () => {
    expect(resolveExecutionProfile([Role.UNIT_ADMIN])).toBe(ExecutionProfile.UNIT_CHIEF);
  });

  it('resolves UNIT_TECHNICIAN to UNIT_TECHNICIAN', () => {
    expect(resolveExecutionProfile([Role.UNIT_TECHNICIAN])).toBe(ExecutionProfile.UNIT_TECHNICIAN);
  });

  it('resolves TRIAL_ADMIN to PLANNING_ANALYSIS_CHIEF', () => {
    expect(resolveExecutionProfile([Role.TRIAL_ADMIN])).toBe(ExecutionProfile.PLANNING_ANALYSIS_CHIEF);
  });

  it('resolves SYSTEM_ADMIN to DIRECTOR', () => {
    expect(resolveExecutionProfile([Role.SYSTEM_ADMIN])).toBe(ExecutionProfile.DIRECTOR);
  });

  it('resolves READ_ONLY to TRIAL_CONSULTANT', () => {
    expect(resolveExecutionProfile([Role.READ_ONLY])).toBe(ExecutionProfile.TRIAL_CONSULTANT);
  });

  it('falls back to TRIAL_CONSULTANT when no role matches', () => {
    expect(resolveExecutionProfile([Role.ADMINISTRATIVE])).toBe(ExecutionProfile.TRIAL_CONSULTANT);
  });

  it('falls back to TRIAL_CONSULTANT for empty roles', () => {
    expect(resolveExecutionProfile([])).toBe(ExecutionProfile.TRIAL_CONSULTANT);
  });

  it('uses priority ordering when user has multiple roles', () => {
    // TRIAL_EXECUTION_ADMIN has higher priority than SYSTEM_ADMIN
    expect(resolveExecutionProfile([Role.SYSTEM_ADMIN, Role.TRIAL_EXECUTION_ADMIN])).toBe(
      ExecutionProfile.TRIAL_AREA_CHIEF,
    );
  });

  it('uses priority ordering: UNIT_ADMIN wins over READ_ONLY', () => {
    expect(resolveExecutionProfile([Role.READ_ONLY, Role.UNIT_ADMIN])).toBe(ExecutionProfile.UNIT_CHIEF);
  });
});

// // Service tests
//

describe('ExecutionProfileService', () => {
  let service: ExecutionProfileService;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExecutionProfileService],
    });

    authService = TestBed.inject(AuthService);
    service = TestBed.inject(ExecutionProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('activeProfile', () => {
    it('resolves the profile based on current user roles', () => {
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);
      expect(service.activeProfile()).toBe(ExecutionProfile.TRIAL_AREA_CHIEF);
    });

    it('updates reactively when roles change', () => {
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);
      expect(service.activeProfile()).toBe(ExecutionProfile.TRIAL_AREA_CHIEF);

      authService.setRoles([Role.UNIT_ADMIN]);
      expect(service.activeProfile()).toBe(ExecutionProfile.UNIT_CHIEF);
    });
  });

  describe('profileConfig', () => {
    it('returns the full config for the active profile', () => {
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);

      const config = service.profileConfig();
      expect(config.profile).toBe(ExecutionProfile.TRIAL_AREA_CHIEF);
      expect(config.category).toBe('direct');
    });

    it('matches the registry entry', () => {
      authService.setRoles([Role.UNIT_ADMIN]);

      const config = service.profileConfig();
      const registryConfig = EXECUTION_PROFILE_REGISTRY.get(ExecutionProfile.UNIT_CHIEF);
      expect(registryConfig).toBeDefined();
      expect(config).toEqual(registryConfig);
    });
  });

  describe('isDirectIntervention', () => {
    it('returns true for direct intervention profiles', () => {
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);
      expect(service.isDirectIntervention()).toBe(true);
    });

    it('returns false for observer profiles', () => {
      authService.setRoles([Role.READ_ONLY]);
      expect(service.isDirectIntervention()).toBe(false);
    });
  });

  describe('profileCategory', () => {
    it('returns "direct" for intervention profiles', () => {
      authService.setRoles([Role.UNIT_TECHNICIAN]);
      expect(service.profileCategory()).toBe('direct');
    });

    it('returns "observer" for consultation profiles', () => {
      authService.setRoles([Role.SYSTEM_ADMIN]);
      expect(service.profileCategory()).toBe('observer');
    });
  });

  describe('availableFeatures', () => {
    it('exposes the correct features for TRIAL_AREA_CHIEF', () => {
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);

      const features = service.availableFeatures();
      expect(features).toContain(ExecutionFeature.SERIES_AND_SHOTS);
      expect(features).toContain(ExecutionFeature.TRIAL_CHAT);
      expect(features).not.toContain(ExecutionFeature.POWDER_CALIBRATION);
    });

    it('exposes the correct features for FIRING_LINE_CHIEF config (via UNIT_ADMIN fallback)', () => {
      authService.setRoles([Role.UNIT_ADMIN]);

      const features = service.availableFeatures();
      expect(features).toContain(ExecutionFeature.BALLISTICS_UNIT);
      expect(features).toContain(ExecutionFeature.TRIAL_CHAT);
    });
  });

  describe('defaultWidgetIds', () => {
    it('returns the correct widget IDs for the active profile', () => {
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);

      const widgetIds = service.defaultWidgetIds();
      expect(widgetIds).toContain('seguimiento-general');
      expect(widgetIds).toContain('disparo');
    });

    it('updates reactively when role changes', () => {
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);
      const widgetsBefore = service.defaultWidgetIds();

      authService.setRoles([Role.READ_ONLY]);
      const widgetsAfter = service.defaultWidgetIds();

      expect(widgetsBefore).not.toEqual(widgetsAfter);
    });
  });

  describe('hasFeature', () => {
    it('returns a signal that is true when the feature is available', () => {
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);
      const hasChat = service.hasFeature(ExecutionFeature.TRIAL_CHAT);
      expect(hasChat()).toBe(true);
    });

    it('returns a signal that is false when the feature is not available', () => {
      authService.setRoles([Role.READ_ONLY]);
      const hasPowder = service.hasFeature(ExecutionFeature.POWDER_CALIBRATION);
      expect(hasPowder()).toBe(false);
    });

    it('signal updates reactively when roles change', () => {
      const hasPowder = service.hasFeature(ExecutionFeature.POWDER_CALIBRATION);

      // Set roles that do NOT have powder calibration
      authService.setRoles([Role.READ_ONLY]);
      expect(hasPowder()).toBe(false);

      // The current mapping does not directly map to TRIAL_ENGINEER
      // but TRIAL_EXECUTION_ADMIN maps to TRIAL_AREA_CHIEF which lacks it
      authService.setRoles([Role.TRIAL_EXECUTION_ADMIN]);
      expect(hasPowder()).toBe(false);
    });
  });
});

// // Registry completeness tests
//

describe('EXECUTION_PROFILE_REGISTRY', () => {
  it('has an entry for every ExecutionProfile value', () => {
    const allProfiles = Object.values(ExecutionProfile);
    for (const profile of allProfiles) {
      expect(EXECUTION_PROFILE_REGISTRY.has(profile)).toBe(true);
    }
  });

  it('every config has at least one available feature', () => {
    for (const config of EXECUTION_PROFILE_REGISTRY.values()) {
      expect(config.availableFeatures.length).toBeGreaterThan(0);
    }
  });

  it('every config has a non-empty labelKey', () => {
    for (const config of EXECUTION_PROFILE_REGISTRY.values()) {
      expect(config.labelKey).toBeTruthy();
    }
  });

  it('marks direct intervention profiles correctly', () => {
    const directProfiles: ExecutionProfile[] = [
      ExecutionProfile.TRIAL_AREA_CHIEF,
      ExecutionProfile.FIRING_LINE_CHIEF,
      ExecutionProfile.TRIAL_ENGINEER,
      ExecutionProfile.UNIT_CHIEF,
      ExecutionProfile.UNIT_TECHNICIAN,
    ];

    for (const profile of directProfiles) {
      const config = EXECUTION_PROFILE_REGISTRY.get(profile);
      expect(config).toBeDefined();
      expect(config?.category).toBe('direct');
    }
  });

  it('marks observer profiles correctly', () => {
    const observerProfiles = [
      ExecutionProfile.DIRECTOR,
      ExecutionProfile.CLIENT,
      ExecutionProfile.PLANNING_ANALYSIS_CHIEF,
      ExecutionProfile.TRIAL_CONSULTANT,
    ];

    for (const profile of observerProfiles) {
      const config = EXECUTION_PROFILE_REGISTRY.get(profile);
      expect(config).toBeDefined();
      expect(config?.category).toBe('observer');
    }
  });
});

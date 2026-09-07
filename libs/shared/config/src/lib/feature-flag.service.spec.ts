import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { injectIsProduction, isDesEnvironment, isPreEnvironment } from './config.functions';
import { APP_ENV } from './environment.token';
import type { AppEnvironment } from './environment.types';
import { FeatureFlagService } from './feature-flag.service';

const createMockEnvironment = (partial: Partial<AppEnvironment> = {}): AppEnvironment => ({
  production: false,
  apiUrl: 'https://apis.des.inta.es/intaqalab',
  features: {
    enableTabsNavigation: false,
  },
  authConfig: {},
  endpoints: {
    linesOfShot: '',
    fireTrials: '',
    users: '',
    clients: '',
    fireTrialTypes: '',
    calendar: '',
    documents: '',
    whareHouse: '',
    specimens: '',
    eventLog: '',
    munitionComponentTypes: '',
    munitionDenominations: '',
    fuseWorkingModes: '',
    planning: '',
    execution: '',
    centers: '',
  },
  ...partial,
});

describe('Environment Arrow Functions', () => {
  it('should identify DES environment when apiUrl is des', () => {
    const env = createMockEnvironment({ apiUrl: 'https://apis.des.inta.es/intaqalab' });

    expect(isDesEnvironment(env)).toBe(true);
    expect(isPreEnvironment(env)).toBe(false);
    expect(env.production).toBe(false);
  });

  it('should identify DES environment when apiUrl is /api (local mocks)', () => {
    const env = createMockEnvironment({ apiUrl: '/api', production: false });

    expect(isDesEnvironment(env)).toBe(true);
    expect(isPreEnvironment(env)).toBe(false);
    expect(env.production).toBe(false);
  });

  it('should identify PRE environment when apiUrl contains .pre.', () => {
    const env = createMockEnvironment({ apiUrl: 'https://apis.pre.inta.es/intaqalab' });

    expect(isDesEnvironment(env)).toBe(false);
    expect(isPreEnvironment(env)).toBe(true);
    expect(env.production).toBe(false);
  });

  it('should identify PROD environment when apiUrl is apis.inta.es and production is true', () => {
    const env = createMockEnvironment({
      apiUrl: 'https://apis.inta.es/intaqalab',
      production: true,
    });

    expect(isDesEnvironment(env)).toBe(false);
    expect(isPreEnvironment(env)).toBe(false);
    expect(env.production).toBe(true);
  });

  it('should work within Angular injection context without passing env parameter', () => {
    const env = createMockEnvironment({ apiUrl: 'https://apis.pre.inta.es/intaqalab' });
    TestBed.configureTestingModule({
      providers: [{ provide: APP_ENV, useValue: env }],
    });

    TestBed.runInInjectionContext(() => {
      expect(isPreEnvironment()).toBe(true);
      expect(isDesEnvironment()).toBe(false);
      expect(injectIsProduction()).toBe(false);
    });
  });
});

describe('FeatureFlagService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const setup = (env: AppEnvironment) => {
    TestBed.configureTestingModule({
      providers: [FeatureFlagService, { provide: APP_ENV, useValue: env }],
    });
    return TestBed.inject(FeatureFlagService);
  };

  describe('Tabs Navigation Feature Flag', () => {
    it('should read initial tabs navigation value from environment features', () => {
      const service = setup(
        createMockEnvironment({
          features: { enableTabsNavigation: true },
        }),
      );

      expect(service.tabsNavigation()).toBe(true);
    });

    it('should read initial tabs navigation value from localStorage when set', () => {
      localStorage.setItem('ENABLED_TABS_NAVIGATION', 'true');
      const service = setup(
        createMockEnvironment({
          features: { enableTabsNavigation: false },
        }),
      );

      expect(service.tabsNavigation()).toBe(true);
    });
  });
});

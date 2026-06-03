import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { FeatureFlagService } from '@intaqalab/config';
import { AuthService, Role } from '@intaqalab/core';
import { Subject } from 'rxjs';

import { CommandsTabService } from '../../services/tabs/commands-tab-service';
import { MenuLeftService } from './menu-left.service';

const createRouterMock = (initialUrl = '/') => {
  const events$ = new Subject<NavigationEnd>();
  return {
    url: initialUrl,
    navigateByUrl: vi.fn(),
    events: events$,
    _triggerNavigation: (url: string) => events$.next(new NavigationEnd(1, url, url)),
  };
};

const createTabsServiceMock = () => ({
  addTrialCreate: vi.fn(),
  addTrialList: vi.fn(),
  addCalendarTrials: vi.fn(),
  addExecution: vi.fn(),
});

const createAuthServiceMock = () => ({
  userRoles: vi.fn().mockReturnValue([Role.INTAQALAB_ADMIN]),
  hasAnyRole: vi.fn().mockReturnValue(true),
});

describe('MenuLeftService', () => {
  let routerMock: ReturnType<typeof createRouterMock>;
  let tabsMock: ReturnType<typeof createTabsServiceMock>;
  let featureFlagsMock: { tabsNavigation: ReturnType<typeof vi.fn> };

  const setup = (initialUrl = '/') => {
    routerMock = createRouterMock(initialUrl);
    tabsMock = createTabsServiceMock();
    featureFlagsMock = { tabsNavigation: vi.fn().mockReturnValue(false) };
    const authServiceMock = createAuthServiceMock();

    TestBed.configureTestingModule({
      providers: [
        MenuLeftService,
        { provide: Router, useValue: routerMock },
        { provide: CommandsTabService, useValue: tabsMock },
        { provide: FeatureFlagService, useValue: featureFlagsMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    return { service: TestBed.inject(MenuLeftService) };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  describe('dataSource', () => {
    it('should expose the MENU_TREE nodes', () => {
      const { service } = setup();
      expect(service.dataSource().length).toBeGreaterThan(0);
    });
  });

  describe('active state sync from initial URL', () => {
    it.each([
      ['/demos', 'DEMO'],
      ['/calendar-trials', 'CALENDAR_TRIALS'],
      ['/master-data/trial-type', 'MASTER_DATA_TRIAL_TYPE'],
      ['/master-data/document-type', 'MASTER_DATA_DOCUMENT_TYPE'],
      ['/master-data/target-type', 'MASTER_DATA_TARGET_TYPE'],
      ['/master-data/material', 'MASTER_DATA_MATERIAL'],
      ['/master-data/dimension', 'MASTER_DATA_DIMENSION'],
      ['/master-data/fuze-type', 'MASTER_DATA_FUZE_TYPE'],
      ['/execution', 'EXECUTION'],
    ] as const)('url "%s" → should set activeNodeId to "%s"', (url, expectedAction) => {
      const { service } = setup(url);
      expect(service.activeNodeId()).toBe(expectedAction);
    });

    it('should clear activeNodeId for unknown URL', () => {
      const { service } = setup('/unknown-route');
      expect(service.activeNodeId()).toBeNull();
    });

    it('should ignore query params and hash when syncing URL', () => {
      const { service } = setup('/execution?foo=bar#section');
      expect(service.activeNodeId()).toBe('EXECUTION');
    });
  });

  describe('active state sync from router NavigationEnd events', () => {
    it('should update activeNodeId when router navigates', () => {
      const { service } = setup('/');

      expect(service.activeNodeId()).toBeNull();

      TestBed.runInInjectionContext(() => {
        routerMock._triggerNavigation('/execution');
      });

      expect(service.activeNodeId()).toBe('EXECUTION');
    });

    it('should clear activeNodeId when navigating to an unknown route', () => {
      const { service } = setup('/execution');

      expect(service.activeNodeId()).toBe('EXECUTION');

      TestBed.runInInjectionContext(() => {
        routerMock._triggerNavigation('/some-unknown-page');
      });

      expect(service.activeNodeId()).toBeNull();
    });
  });

  describe('activeCollapsedSection', () => {
    it('should set activeCollapsedSection to the parent section name when a child node is active', () => {
      const { service } = setup('/master-data/trial-type');
      expect(service.activeCollapsedSection()).toBe('MENU_LEFT.CATALOG.TITLE');
    });

    it('should set activeCollapsedSection to the node name itself when a top-level node is active', () => {
      const { service } = setup('/execution');
      expect(service.activeCollapsedSection()).toBe('MENU_LEFT.EXECUTION');
    });

    it('should clear activeCollapsedSection for unknown URL', () => {
      const { service } = setup('/unknown');
      expect(service.activeCollapsedSection()).toBeNull();
    });
  });

  describe('navigate() with URL-based actions', () => {
    it.each([
      [
        { name: 'MENU_LEFT.CATALOG.OPTIONS.TRIAL_TYPE', id: 'MASTER_DATA_TRIAL_TYPE' as const },
        '/master-data/trial-type',
      ],
      [
        { name: 'MENU_LEFT.CATALOG.OPTIONS.DOCUMENT_TYPE', id: 'MASTER_DATA_DOCUMENT_TYPE' as const },
        '/master-data/document-type',
      ],
      [
        { name: 'MENU_LEFT.CATALOG.OPTIONS.TARGET_TYPE', id: 'MASTER_DATA_TARGET_TYPE' as const },
        '/master-data/target-type',
      ],
      [{ name: 'MENU_LEFT.CATALOG.OPTIONS.MATERIAL', id: 'MASTER_DATA_MATERIAL' as const }, '/master-data/material'],
      [{ name: 'MENU_LEFT.CATALOG.OPTIONS.DIMENSION', id: 'MASTER_DATA_DIMENSION' as const }, '/master-data/dimension'],
      [{ name: 'MENU_LEFT.CATALOG.OPTIONS.FUZE_TYPE', id: 'MASTER_DATA_FUZE_TYPE' as const }, '/master-data/fuze-type'],
      [
        { name: 'MENU_LEFT.WHAREHOUSE.OPTIONS.MUNITION_NEW', id: 'WHAREHOUSE_MUNITION_NEW' as const },
        '/wharehouse-managment/munitions',
      ],
      [
        { name: 'MENU_LEFT.WHAREHOUSE.OPTIONS.DENOMINATIONS', id: 'WHAREHOUSE_DENOMINATIONS' as const },
        '/wharehouse-managment/denominations',
      ],
      [{ name: 'MENU_LEFT.EXECUTION', id: 'EXECUTION' as const }, '/execution'],
    ])('node "%s" → should call router.navigateByUrl with "%s"', (node, expectedUrl) => {
      const { service } = setup();

      service.navigate(node);

      expect(routerMock.navigateByUrl).toHaveBeenCalledWith(expectedUrl);
    });

    it('should set activeNodeId to the navigated action', () => {
      const { service } = setup();
      const node = { name: 'MENU_LEFT.CATALOG.OPTIONS.TRIAL_TYPE', id: 'MASTER_DATA_TRIAL_TYPE' as const };

      service.navigate(node);

      expect(service.activeNodeId()).toBe('MASTER_DATA_TRIAL_TYPE');
    });

    it('should do nothing when node has no id', () => {
      const { service } = setup();

      service.navigate({ name: 'Section without id' });

      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
      expect(service.activeNodeId()).toBeNull();
    });
  });

  describe('navigate() with tab-based actions', () => {
    it('should call tabsService.addTrialCreate for TRIAL_NEW', () => {
      const { service } = setup();

      service.navigate({ name: 'MENU_LEFT.GESTION_TRIALS_NEW', id: 'TRIAL_NEW' });

      expect(tabsMock.addTrialCreate).toHaveBeenCalledOnce();
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should call tabsService.addTrialList for TRIAL_LIST', () => {
      const { service } = setup();

      service.navigate({ name: 'MENU_LEFT.GESTION_TRIALS_LIST', id: 'TRIAL_LIST' });

      expect(tabsMock.addTrialList).toHaveBeenCalledOnce();
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should call tabsService.addCalendarTrials for CALENDAR_TRIALS', () => {
      const { service } = setup();

      service.navigate({ name: 'MENU_LEFT.CALENDAR_TRIALS', id: 'CALENDAR_TRIALS' });

      expect(tabsMock.addCalendarTrials).toHaveBeenCalledOnce();
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FeatureFlagService } from '@intaqalab/config';
import type { TabTopProcess } from '@intaqalab/core';
import { vi } from 'vitest';

import { CommandsTabService } from './commands-tab-service';

const createMockTab = (id: string, route?: string): TabTopProcess => ({ id, route }) as unknown as TabTopProcess;

const MOCK_TABS = {
  trialCreate: createMockTab('trial-create', '/trial-create'),
  trialList: createMockTab('trial-list', '/trial-list'),
  calendarTrials: createMockTab('calendar-trials', '/calendar-trials'),
  trialView: (id: string | number) => createMockTab(`trial-view-${id}`, `/trial-view/${id}`),
  trialDoc: (id: string | number) => createMockTab(`trial-doc-${id}`, `/trial-doc/${id}`),
} as const;

vi.mock('@intaqalab/trial-management', () => ({
  DomainTrialsTabsCommands: {
    TopTabTrialCreate: MOCK_TABS.trialCreate,
    TopTabTrialViewFactory: MOCK_TABS.trialView,
    TopTabTrialList: MOCK_TABS.trialList,
    TopTabTrialDocumentsViewFactory: MOCK_TABS.trialDoc,
  },
}));

vi.mock('@intaqalab/calendar-trials', () => ({
  TopTabTrialList: MOCK_TABS.calendarTrials,
}));

describe('CommandsTabService', () => {
  const setup = (enabledTabs: boolean) => {
    const featureFlagsSpy = { tabsNavigation: vi.fn().mockReturnValue(enabledTabs) };

    const routerSpy = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        CommandsTabService,
        { provide: Router, useValue: routerSpy },
        { provide: FeatureFlagService, useValue: featureFlagsSpy },
      ],
    });

    return {
      service: TestBed.inject(CommandsTabService),
      routerSpy,
    };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when tabs navigation is ENABLED', () => {
    it.each([
      ['addTrialCreate', [], MOCK_TABS.trialCreate],
      ['addTrialList', [], MOCK_TABS.trialList],
      ['addCalendarTrials', [], MOCK_TABS.calendarTrials],
      ['addTrialView', [42], MOCK_TABS.trialView(42)],
      ['addDocumentTrial', ['doc-7'], MOCK_TABS.trialDoc('doc-7')],
    ] as const)('%s → should set tabToAdd signal', async (method, args, expectedTab) => {
      const { service } = setup(true);

      await (service[method] as (...a: unknown[]) => Promise<void>)(...args);

      expect(service.tabToAdd()).toEqual(expectedTab);
    });
  });

  describe('when tabs navigation is DISABLED', () => {
    it('should navigate via router instead of setting tabToAdd', async () => {
      const { service, routerSpy } = setup(false);

      await service.addTrialCreate();

      expect(service.tabToAdd()).toBeUndefined();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/trial-create');
    });

    it('should warn when no route is defined', async () => {
      const { service, routerSpy } = setup(false);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const tabWithoutRoute = createMockTab('no-route');

      vi.doMock('@intaqalab/trial-management', () => ({
        DomainTrialsTabsCommands: {
          TopTabTrialCreate: tabWithoutRoute,
        },
      }));

      const original = MOCK_TABS.trialCreate.route;
      (MOCK_TABS.trialCreate as { route?: string }).route = undefined;

      await service.addTrialCreate();

      expect(consoleSpy).toHaveBeenCalledWith('not defined route in', expect.any(Object));
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();

      (MOCK_TABS.trialCreate as { route?: string }).route = original;
    });
  });

  describe('executeCommand', () => {
    it.each([
      ['TRIAL_DETAIL' as const, 'addTrialView', 99],
      ['TRIAL_LIST' as const, 'addTrialList', undefined],
      ['TRIAL_VIEW_DOCUMENT' as const, 'addDocumentTrial', 'doc-5'],
    ])('command "%s" → should delegate to %s', (command, method, argument) => {
      const { service } = setup(true);
      const spy = vi.spyOn(service as any, method).mockImplementation(async () => {});

      service.executeCommand({ command, argument } as any);
      if (argument !== undefined) {
        expect(spy).toHaveBeenCalledWith(argument);
      } else {
        expect(spy).toHaveBeenCalled();
      }
    });

    it('command "EXECUTION" → should navigate by url to execution page', () => {
      const { service, routerSpy } = setup(true);

      service.executeCommand({ command: 'EXECUTION' as any, argument: 'trial-123' });
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/execution/trial-123');
    });

    it('should not delegate for unknown commands', () => {
      const { service } = setup(true);
      const spies = (['addTrialView', 'addTrialList', 'addDocumentTrial'] as const).map((m) =>
        vi.spyOn(service as any, m).mockImplementation(async () => {}),
      );

      service.executeCommand({ command: 'UNKNOWN' as any, argument: '' });

      spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });
  });
});

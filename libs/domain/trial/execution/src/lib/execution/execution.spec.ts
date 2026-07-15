import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService } from '@intaqalab/core';
import { TrialsDataService } from '@intaqalab/data-access';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../+state/execution.store';
import type { ExecutionWidgetLayout } from '../services/execution.service';
import { ExecutionService } from '../services/execution.service';
import { Execution } from './execution';
import { WidgetId } from './models/widget-id.enum';
import { WidgetStateService } from './services/widget-state.service';

type MockExecutionService = ReturnType<typeof createMockExecutionService>;

function createMockExecutionService(
  preferencesByUser: ExecutionWidgetLayout | null = null,
  updatedPreferencesByUser: ExecutionWidgetLayout | null = null,
) {
  return {
    executionStateResource: { value: signal(null), isLoading: signal(false), error: signal<Error | null>(null) },
    executionProgressResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    securityCountdownResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    updateSecurityCountdownResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    startResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    pauseResource: { value: signal(null), isLoading: signal(false), error: signal(null), status: signal('idle') },
    interruptResource: {
      value: signal(null),
      isLoading: signal(false),
      error: signal(null),
      status: signal('idle'),
    },
    resumeResource: { value: signal(null), isLoading: signal(false), error: signal(null), status: signal('idle') },
    cancelResource: { value: signal(null), isLoading: signal(false), error: signal(null), status: signal('idle') },
    finishResource: { value: signal(null), isLoading: signal(false), error: signal(null), status: signal('idle') },
    planningResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    updatePlanningResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    planningStateResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    approvePlanningResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    preferencesByRoleResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    updatePreferencesByRoleResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    preferencesByUserResource: {
      value: signal<ExecutionWidgetLayout | null>(preferencesByUser),
      isLoading: signal(false),
      error: signal(null),
    },
    updatePreferencesByUserResource: {
      value: signal<ExecutionWidgetLayout | null>(updatedPreferencesByUser),
      isLoading: signal(false),
      error: signal(null),
    },
    profilesReadinessResource: {
      value: signal({ profiles: [] }),
      isLoading: signal(false),
      error: signal(null),
    },
    setProfileReadinessResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    equipmentSelectorResource: {
      value: signal({
        categories: [],
        items: [],
        serieOptions: [],
        disparoOptions: [],
        serieDisparoMap: {},
        equipments: [],
      }),
      isLoading: signal(false),
      error: signal(null),
    },
    updateEquipmentSelectorResource: { value: signal(null), isLoading: signal(false), error: signal(null) },
    getExecutionState: vi.fn(),
    getExecutionProgress: vi.fn(),
    getSecurityCountdownState: vi.fn(),
    updateSecurityCountdown: vi.fn(),
    startExecution: vi.fn(),
    pauseExecution: vi.fn(),
    interruptExecution: vi.fn(),
    resumeExecution: vi.fn(),
    cancelExecution: vi.fn(),
    finishExecution: vi.fn(),
    getExecutionPlanning: vi.fn(),
    updateExecutionPlanning: vi.fn(),
    getExecutionPlanningState: vi.fn(),
    approveExecutionPlanning: vi.fn(),
    getPreferencesByRole: vi.fn(),
    updatePreferencesByRole: vi.fn(),
    getPreferencesByUser: vi.fn(),
    updatePreferencesByUser: vi.fn(),
    loadEquipmentSelector: vi.fn(),
    equipmentSelector: vi.fn(() => ({
      categories: [],
      items: [],
      serieOptions: [],
      disparoOptions: [],
      serieDisparoMap: {},
      equipments: [],
    })),
  };
}

function createTrialsDataServiceMock() {
  return {
    byIdResource: {
      value: signal({
        id: 'b5b4eab5-4e5d-7f6a-1b4c-4d5e6f7a8b9c',
        trialNumber: '034A/25',
        client: { id: 'client-1', name: 'RHEINMETALL EXPAL MUNITIONS' },
        description: 'Proyectil de 155 mm SMK RP ERG2A1',
        status: 'IN_PROGRESS',
      }),
      isLoading: signal(false),
      error: signal(null),
    },
    loadById: vi.fn(),
  };
}

describe('Execution', () => {
  const setup = async ({
    fireTrialId = 'b5b4eab5-4e5d-7f6a-1b4c-4d5e6f7a8b9c',
    executionService = createMockExecutionService(),
  }: {
    fireTrialId?: string;
    executionService?: MockExecutionService;
  } = {}) => {
    const user = userEvent.setup();
    const trialsDataService = createTrialsDataServiceMock();

    const view = await render(Execution, {
      imports: [NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ExecutionStore,
        {
          provide: TrialsDataService,
          useValue: trialsDataService,
        },
        {
          provide: ExecutionService,
          useValue: executionService,
        },
        {
          provide: AuthService,
          useValue: {
            getUserData: () => ({
              preferred_username: 'test_user',
              name: 'Test User',
              roles: ['SYSTEM_ADMIN'],
            }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'fireTrialId' ? fireTrialId : null),
              },
            },
          },
        },
      ],
    });

    const rootLoader = TestbedHarnessEnvironment.documentRootLoader(view.fixture);
    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, rootLoader, loader, executionService, trialsDataService };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, 'setInterval').mockReturnValue(0 as unknown as ReturnType<typeof setInterval>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the execution basic details', async () => {
    await setup();
    expect(screen.getByText('034A/25')).toBeInTheDocument();
    expect(screen.getByText('Cliente: RHEINMETALL EXPAL MUNITIONS')).toBeInTheDocument();
  });

  it('keeps the shell mounted when execution state resource is in error', async () => {
    const executionService = createMockExecutionService();
    const executionStateError = new Error('execution state failed');

    executionService.executionStateResource.error.set(executionStateError);

    await setup({ executionService });

    expect(screen.getByText('034A/25')).toBeInTheDocument();
    expect(screen.getByText('Cliente: RHEINMETALL EXPAL MUNITIONS')).toBeInTheDocument();
  });

  it('toggles the widgets sidebar panel visibility', async () => {
    const { user } = await setup();

    const toggleBtn = screen.getByText('TRIAL_EXECUTION.WIDGETS_BTN').closest('button');
    expect(toggleBtn).toBeInTheDocument();
    if (!toggleBtn) {
      throw new Error('Widgets toggle button not found');
    }

    await user.click(toggleBtn);

    const libraryTitle = screen.getByText('TRIAL_EXECUTION.WIDGET_LIBRARY_TITLE');
    expect(libraryTitle).toBeInTheDocument();
  });

  it('allows toggling the edit mode via slide toggle', async () => {
    const { loader } = await setup();
    const slideToggle = await loader.getHarness(MatSlideToggleHarness.with({ label: /TRIAL_EXECUTION\.EDIT_PANEL/i }));

    expect(await slideToggle.isChecked()).toBe(false);
    await slideToggle.toggle();
    expect(await slideToggle.isChecked()).toBe(true);
  });

  it('opens the actions menu and can trigger the interrupt dialog', async () => {
    const { loader, rootLoader } = await setup();

    // Expand the Actions menu
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();

    // Find the 'Action Stop' item
    const items = await menu.getItems();
    let interruptItem = null;
    for (const item of items) {
      const text = await item.getText();
      if (text.includes('TRIAL_EXECUTION.ACTION_STOP')) {
        interruptItem = item;
        break;
      }
    }

    expect(interruptItem).toBeTruthy();
    if (!interruptItem) {
      throw new Error('Interrupt action menu item not found');
    }

    await interruptItem.click();

    // Verify the dialog was opened
    const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
    expect(dialogs.length).toBe(1);

    const dialogTitle = await dialogs[0].getTitleText();
    expect(dialogTitle).toContain('Interrumpir prueba de fuego');
  });

  describe('User Preferences Layout', () => {
    it('loads preferences on init and paints widgets using WidgetId enum', async () => {
      const executionService = createMockExecutionService({ widgetsLayout: [WidgetId.SHOT] });
      const { view } = await setup({
        fireTrialId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        executionService,
      });

      const widgetStateService = view.fixture.debugElement.injector.get(WidgetStateService);
      view.fixture.detectChanges();

      expect(executionService.getPreferencesByUser).toHaveBeenCalledWith(
        '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'test_user',
      );

      // Verify that the widget was added to the grid
      expect(widgetStateService.placedWidgets().length).toBe(1);
      expect(widgetStateService.placedWidgets()[0].type).toBe(WidgetId.SHOT);
    });

    it('saves preferences on destroy using WidgetId enum', async () => {
      const executionService = createMockExecutionService({ widgetsLayout: [WidgetId.SHOT] });
      const { view } = await setup({
        fireTrialId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        executionService,
      });

      const widgetStateService = view.fixture.debugElement.injector.get(WidgetStateService);
      view.fixture.detectChanges();

      expect(widgetStateService.placedWidgets().map((widget) => widget.type)).toEqual([WidgetId.SHOT]);

      // Trigger destroy to save preferences
      view.fixture.destroy();

      expect(executionService.updatePreferencesByUser).toHaveBeenCalledWith(
        '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'test_user',
        [WidgetId.SHOT],
      );
    });

    it('clears execution state polling interval on destroy', async () => {
      const spyClearInterval = vi.spyOn(globalThis, 'clearInterval');
      const { view } = await setup();
      view.fixture.detectChanges();

      // Trigger destroy
      view.fixture.destroy();

      expect(spyClearInterval).toHaveBeenCalled();
    });
  });
});

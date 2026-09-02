import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideTestingEnvironment } from '@intaqalab/config';
import { AuthService, Role } from '@intaqalab/core';
import { TrialsDataService } from '@intaqalab/data-access';
import { type FireTrial, MeasureUnitEnum } from '@intaqalab/models';
import { createMockResource } from '@intaqalab/utils/testing/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import type {
  EquipmentSelectorResponse,
  EquipmentSelectorUpdateResponse,
  ExecutionProgressResponse,
  ExecutionStateResponse,
  ExecutionWidgetLayout,
  JltPreparationResponse,
  JltReadinessItem,
  JltShotDataResponse,
  PlanningArmamentResponse,
  PlanningConditionsResponse,
  PlanningResponse,
  PlanningSeriesItem,
  PlanningStateResponse,
  ProfileReadinessItem,
  ProfilesReadinessResponse,
  SecurityCountdownResponse,
  ShotArmamentResponse,
  ShotPressuresResponse,
  ShotVelocitiesResponse,
} from '../../../services/execution.service';
import { ExecutionService } from '../../../services/execution.service';
import { WidgetId } from '../../models/widget-id.enum';
import { WidgetStateService } from '../../services/widget-state.service';
import { Execution } from './execution';

type MockExecutionService = ReturnType<typeof createMockExecutionService>;

function createMockExecutionService(
  preferencesByUser: ExecutionWidgetLayout | null = null,
  updatedPreferencesByUser: ExecutionWidgetLayout | null = null,
) {
  return {
    planningSeriesResource: createMockResource<PlanningSeriesItem[]>([]),
    planningConditionsResource: createMockResource<PlanningConditionsResponse>({ series: [] }),
    executionStateResource: createMockResource<ExecutionStateResponse>({
      status: 'IN_PROGRESS',
      activeSeriesId: 'serie-1',
      activeShotId: 'shot-1',
      updatedAt: '2026-08-19T10:00:00Z',
    }),
    executionProgressResource: createMockResource<ExecutionProgressResponse>({
      series: [
        {
          seriesId: 'serie-1',
          shots: [
            {
              shotId: 'shot-1',
              status: 'FIRED',
              updatedAt: '2026-08-19T10:05:00Z',
            },
            {
              shotId: 'shot-2',
              status: 'ACTIVE',
              updatedAt: '2026-08-19T10:10:00Z',
            },
          ],
        },
      ],
    }),
    securityCountdownResource: createMockResource<SecurityCountdownResponse>({
      status: 'INACTIVE',
      targetEndTime: null,
      remainingSeconds: null,
    }),
    updateSecurityCountdownResource: createMockResource<SecurityCountdownResponse>(),
    startResource: createMockResource<void>(),
    pauseResource: createMockResource<void>(),
    interruptResource: createMockResource<void>(),
    resumeResource: createMockResource<void>(),
    cancelResource: createMockResource<void>(),
    finishResource: createMockResource<void>(),
    planningResource: createMockResource<PlanningResponse>(),
    updatePlanningResource: createMockResource<PlanningResponse>(),
    planningStateResource: createMockResource<PlanningStateResponse>(),
    approvePlanningResource: createMockResource<void>(),
    preferencesByRoleResource: createMockResource<ExecutionWidgetLayout>(),
    updatePreferencesByRoleResource: createMockResource<ExecutionWidgetLayout>(),
    preferencesByUserResource: createMockResource<ExecutionWidgetLayout | null>(preferencesByUser),
    updatePreferencesByUserResource: createMockResource<ExecutionWidgetLayout | null>(updatedPreferencesByUser),
    profilesReadinessResource: createMockResource<ProfilesReadinessResponse>({
      profilesReadiness: [],
    }),
    setProfileReadinessResource: createMockResource<ProfileReadinessItem>(),
    jltPreparationResource: createMockResource<JltPreparationResponse>(),
    setJltReadinessResource: createMockResource<JltReadinessItem>(),
    selectShotResource: createMockResource<void>(),
    fireShotResource: createMockResource<void>(),
    equipmentSelectorResource: createMockResource<EquipmentSelectorResponse>([]),
    updateEquipmentSelectorResource: createMockResource<EquipmentSelectorUpdateResponse>(),
    jltShotDataResource: createMockResource<JltShotDataResponse>(),
    updateJltShotDataResource: createMockResource<JltShotDataResponse>(),
    shotVelocitiesResource: createMockResource<ShotVelocitiesResponse>(),
    updateShotVelocitiesResource: createMockResource<ShotVelocitiesResponse>(),
    shotPressuresResource: createMockResource<ShotPressuresResponse>(),
    updateShotPressuresResource: createMockResource<ShotPressuresResponse>(),
    updateShotArmamentResource: createMockResource<ShotArmamentResponse>(),

    getPlanningSeries: vi.fn(),
    getPlanningConditions: vi.fn(),
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
    getProfilesReadiness: vi.fn(),
    setSeriesProfileReadiness: vi.fn().mockResolvedValue([]),
    setProfileReadiness: vi.fn().mockResolvedValue([]),
    resetSetProfileReadiness: vi.fn(),
    getJltPreparation: vi.fn(),
    setJltReadiness: vi.fn(),
    selectShot: vi.fn(),
    fireShot: vi.fn(),
    getEquipmentSelector: vi.fn(),
    loadEquipmentItemsByCategories: vi.fn().mockResolvedValue({}),
    updateEquipmentSelector: vi.fn(),
    getJltShotData: vi.fn(),
    fetchJltShotData: vi.fn(),
    setJltShotData: vi.fn(),
    getShotVelocities: vi.fn(),
    fetchShotVelocities: vi.fn(),
    setShotVelocity: vi.fn(),
    getShotPressures: vi.fn(),
    fetchShotPressures: vi.fn(),
    setShotPressure: vi.fn(),
    loadArmamentEquipmentItems: vi.fn().mockResolvedValue([]),
    fetchPlanningArmament: vi.fn().mockResolvedValue({ series: [] } as PlanningArmamentResponse),
    fetchShotArmament: vi.fn().mockResolvedValue({} as ShotArmamentResponse),
    setShotArmament: vi.fn(),
  };
}

function createTrialsDataServiceMock() {
  return {
    byIdResource: createMockResource<FireTrial>({
      id: 'b5b4eab5-4e5d-7f6a-1b4c-4d5e6f7a8b9c',
      trialNumber: '034A/25',
      client: { id: 'client-1', name: 'RHEINMETALL EXPAL MUNITIONS' },
      description: 'Proyectil de 155 mm SMK RP ERG2A1',
      status: 'IN_PROGRESS',
    } as unknown as FireTrial),
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
      imports: [TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
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
            userRoles: signal<Role[]>([Role.INTAQALAB_ADMIN]),
            hasRole: () => true,
            hasAnyRole: () => true,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ fireTrialId }),
            snapshot: {
              params: { fireTrialId },
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
    expect(screen.getByText('Proyectil de 155 mm SMK RP ERG2A1')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();
  });

  it('keeps the shell mounted when execution state resource is in error', async () => {
    const executionService = createMockExecutionService();
    const executionStateError = new Error('execution state failed');

    executionService.executionStateResource._setError(executionStateError);

    await setup({ executionService });

    expect(screen.getByText('034A/25')).toBeInTheDocument();
    expect(screen.getByText('Cliente: RHEINMETALL EXPAL MUNITIONS')).toBeInTheDocument();
  });

  it('toggles the widgets sidebar panel visibility', async () => {
    const { user } = await setup();

    const toggleBtn = screen.getByRole('button', { name: /TRIAL_EXECUTION\.WIDGETS_BTN/i });
    expect(toggleBtn).toBeInTheDocument();
    await user.click(toggleBtn);

    const libraryTitle = screen.getByText('TRIAL_EXECUTION.WIDGET_LIBRARY_TITLE');
    expect(libraryTitle).toBeInTheDocument();
  });

  it('filters widget list and allows adding widget from side panel', async () => {
    const { user, view } = await setup();
    const widgetStateService = view.fixture.debugElement.injector.get(WidgetStateService);

    const toggleBtn = screen.getByRole('button', { name: /TRIAL_EXECUTION\.WIDGETS_BTN/i });
    await user.click(toggleBtn);

    const searchInput = screen.getByPlaceholderText('TRIAL_EXECUTION.SEARCH_WIDGET_PLACEHOLDER');
    await user.type(searchInput, 'non_existing_widget_xyz');

    expect(screen.getByText('TRIAL_EXECUTION.NO_WIDGETS_FOUND')).toBeInTheDocument();

    await user.clear(searchInput);

    const addButtons = screen.getAllByRole('button', { name: /TRIAL_EXECUTION\.ADD/i });
    expect(addButtons.length).toBeGreaterThan(0);
    await user.click(addButtons[0]);

    expect(widgetStateService.placedWidgets().length).toBeGreaterThan(0);
  });

  it('allows toggling the edit mode via slide toggle', async () => {
    const { loader } = await setup();
    const slideToggle = await loader.getHarness(MatSlideToggleHarness.with({ label: /TRIAL_EXECUTION\.EDIT_PANEL/i }));

    expect(await slideToggle.isChecked()).toBe(false);
    await slideToggle.toggle();
    expect(await slideToggle.isChecked()).toBe(true);
  });

  it('opens the actions menu and can trigger execution start, pause, resume, and finish', async () => {
    const { loader, executionService } = await setup();

    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));

    // Start execution
    await menu.open();
    const startItem = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_START/i });
    expect(startItem.length).toBe(1);
    await startItem[0].click();
    expect(executionService.startExecution).toHaveBeenCalledWith('b5b4eab5-4e5d-7f6a-1b4c-4d5e6f7a8b9c');

    // Resume execution
    await menu.open();
    const resumeItem = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_RESUME/i });
    expect(resumeItem.length).toBe(1);
    await resumeItem[0].click();
    expect(executionService.resumeExecution).toHaveBeenCalledWith('b5b4eab5-4e5d-7f6a-1b4c-4d5e6f7a8b9c');

    // Finish execution
    await menu.open();
    const finishItem = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_FINISH/i });
    expect(finishItem.length).toBe(1);
    await finishItem[0].click();
    expect(executionService.finishExecution).toHaveBeenCalledWith('b5b4eab5-4e5d-7f6a-1b4c-4d5e6f7a8b9c');
  });

  it('opens the actions menu and can trigger the interrupt dialog', async () => {
    const { loader, rootLoader } = await setup();

    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));
    await menu.open();

    const interruptItem = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_STOP/i });
    expect(interruptItem.length).toBe(1);
    await interruptItem[0].click();

    const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
    expect(dialogs.length).toBe(1);

    const dialogTitle = await dialogs[0].getTitleText();
    expect(dialogTitle).toContain('Interrumpir prueba de fuego');
  });

  it('opens the actions menu and can trigger the pause and cancel dialogs', async () => {
    const { loader, rootLoader } = await setup();

    const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: /TRIAL_EXECUTION\.ACTIONS/i }));

    // Pause Dialog
    await menu.open();
    const pauseItem = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_PAUSE/i });
    expect(pauseItem.length).toBe(1);
    await pauseItem[0].click();

    let dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
    expect(dialogs.length).toBe(1);
    await dialogs[0].close();

    // Cancel Dialog
    await menu.open();
    const cancelItem = await menu.getItems({ text: /TRIAL_EXECUTION\.ACTION_CANCEL/i });
    expect(cancelItem.length).toBe(1);
    await cancelItem[0].click();

    dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
    expect(dialogs.length).toBe(1);
    const cancelTitle = await dialogs[0].getTitleText();
    expect(cancelTitle).toContain('Cancelar prueba de fuego');
  });

  it('opens equipment selector dialog when clicking selector button', async () => {
    const { loader, rootLoader } = await setup();

    const equipmentBtn = await loader.getHarness(
      MatButtonHarness.with({ text: /TRIAL_EXECUTION\.DIALOGS\.EQUIPMENT_SELECTOR\.BTN_LABEL/i }),
    );
    await equipmentBtn.click();

    const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
    expect(dialogs.length).toBe(1);
    await dialogs[0].close();
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

      view.fixture.destroy();

      expect(spyClearInterval).toHaveBeenCalled();
    });
  });

  it('saves JLT shot data from parent when jlt-shot-data widget is dirty', async () => {
    const executionService = createMockExecutionService();
    const { view } = await setup({ executionService });
    const widgetStateService = view.fixture.debugElement.injector.get(WidgetStateService);
    const store = view.fixture.debugElement.injector.get(ExecutionStore);

    const placedWidgetId = widgetStateService.addWidget(WidgetId.JLT_SHOT_DATA, 1);
    store.updateJltShotData({
      serie: 'serie-1',
      disparo: 'shot-1',
      jet: 'JET-001',
      operadorPieza: 'OP-001',
      observaciones: 'Saved from parent',
      atacado: 12,
      retroceso: 8,
    });
    widgetStateService.updateWidgetFormState(placedWidgetId, {
      widgetId: placedWidgetId,
      dirty: true,
      touched: true,
      valid: true,
      hasChanges: true,
    });
    vi.spyOn(widgetStateService, 'saveAllDirtyForms').mockResolvedValue();

    await view.fixture.componentInstance.saveAllChanges();

    expect(executionService.setJltShotData).toHaveBeenCalledWith(
      'b5b4eab5-4e5d-7f6a-1b4c-4d5e6f7a8b9c',
      'serie-1',
      'shot-1',
      {
        jet: 'JET-001',
        pieceOperator: 'OP-001',
        attackDistance: 12,
        attackDistanceUnit: MeasureUnitEnum.MM,
        recoilDistance: 8,
        recoilDistanceUnit: MeasureUnitEnum.MM,
        observations: 'Saved from parent',
      },
    );
  });
});

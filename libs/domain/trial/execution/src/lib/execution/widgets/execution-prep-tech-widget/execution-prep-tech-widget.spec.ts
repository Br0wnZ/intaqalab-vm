import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExecutionStore } from '../../../+state/execution.store';
import { WidgetStateService } from '../../services/widget-state.service';
import { ExecutionPrepTechWidgetComponent } from './execution-prep-tech-widget';

// ──────────────────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────────────────

const SERIE_ID_1 = 'serie-001';
const SERIE_ID_2 = 'serie-002';

function createMockProfilesReadiness(overrides?: {
  isReady1?: boolean;
  observations1?: string;
  isReady2?: boolean;
  observations2?: string;
}) {
  return [
    {
      profile: 'VELOCITIES', // Valor de API para perfil 'velocidades'
      seriesReadiness: [
        {
          seriesId: SERIE_ID_1,
          isReady: overrides?.isReady1 ?? false,
          observations: overrides?.observations1 ?? '',
        },
        {
          seriesId: SERIE_ID_2,
          isReady: overrides?.isReady2 ?? false,
          observations: overrides?.observations2 ?? '',
        },
      ],
    },
  ];
}

function createMockExecutionProgress() {
  return {
    series: [
      { seriesId: SERIE_ID_1, shots: [] },
      { seriesId: SERIE_ID_2, shots: [] },
    ],
  };
}

function createMockPlanningSeries() {
  return [
    { id: SERIE_ID_1, name: 'First test series' },
    { id: SERIE_ID_2, name: 'Second test series' },
  ];
}

// ──────────────────────────────────────────────────────────────────────────────
// Mock factories
// ──────────────────────────────────────────────────────────────────────────────

function createMockStore(overrides?: {
  profilesReadiness?: ReturnType<typeof createMockProfilesReadiness> | null;
  planningSeries?: ReturnType<typeof createMockPlanningSeries> | null;
  isLoadingReadiness?: boolean;
}) {
  return {
    profilesReadiness: signal(overrides?.profilesReadiness ?? createMockProfilesReadiness()),
    planningSeries: signal(overrides?.planningSeries ?? null),
    executionProgress: signal(createMockExecutionProgress()),
    isLoadingReadiness: signal(overrides?.isLoadingReadiness ?? false),
    isSavingReadiness: signal(false),
    fireTrialId: signal<string | null>('trial-123'),
    isTrialReadOnly: vi.fn().mockReturnValue(false),
    saveProfileReadiness: vi.fn(),
  };
}

function createMockWidgetStateService() {
  return {
    updateWidgetFormState: vi.fn(),
    registerWidgetInstance: vi.fn(),
    unregisterWidgetInstance: vi.fn(),
    dirtyWidgets: signal([]),
    hasUnsavedChanges: signal(false),
    placedWidgets: signal([]),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Setup helper
// ──────────────────────────────────────────────────────────────────────────────

interface SetupOptions {
  profile?: 'velocidades' | 'presiones' | 'video' | 'trayectografia' | 'municiones' | 'armamento';
  storeOverrides?: Parameters<typeof createMockStore>[0];
}

async function runSetup(options: SetupOptions = {}) {
  const { profile = 'velocidades', storeOverrides } = options;

  const mockStore = createMockStore(storeOverrides);
  const mockWidgetStateService = createMockWidgetStateService();

  const view = await render(ExecutionPrepTechWidgetComponent, {
    imports: [TranslateModule.forRoot(), NoopAnimationsModule],
    componentInputs: {
      widgetId: 'widget-test-1',
      profile,
    },
    providers: [
      provideTestingEnvironment(),
      { provide: ExecutionStore, useValue: mockStore },
      { provide: WidgetStateService, useValue: mockWidgetStateService },
    ],
  });

  const loader = TestbedHarnessEnvironment.loader(view.fixture);

  return { view, loader, mockStore, mockWidgetStateService };
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('ExecutionPrepTechWidgetComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render the widget title', async () => {
      await runSetup();
      expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.TITLE')).toBeInTheDocument();
    });

    it('should render the profile subtitle for velocidades', async () => {
      await runSetup({ profile: 'velocidades' });
      expect(screen.getByText(/TRIAL_EXECUTION\.WIDGETS\.EXEC_PREP_TECH\.PROFILES\.VELOCIDADES/)).toBeInTheDocument();
    });

    it('should register widget instance with WidgetStateService on init', async () => {
      const { mockWidgetStateService } = await runSetup();
      expect(mockWidgetStateService.registerWidgetInstance).toHaveBeenCalledWith('widget-test-1', expect.anything());
    });

    it('should render the profile subtitle for video', async () => {
      await runSetup({ profile: 'video' });
      expect(screen.getByText(/TRIAL_EXECUTION\.WIDGETS\.EXEC_PREP_TECH\.PROFILES\.VIDEO/)).toBeInTheDocument();
    });

    it('should render one checkbox per series plus the select-all', async () => {
      const { loader } = await runSetup();
      // 2 series + 1 select-all = 3
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      expect(checkboxes.length).toBe(3);
    });

    it('should render one input per series for observations', async () => {
      const { loader } = await runSetup();
      const inputs = await loader.getAllHarnesses(MatInputHarness);
      expect(inputs.length).toBe(2);
    });

    it('should render every series returned by the planning series GET', async () => {
      const partialReadiness = createMockProfilesReadiness();
      partialReadiness[0].seriesReadiness = partialReadiness[0].seriesReadiness.slice(0, 1);

      const { loader } = await runSetup({
        storeOverrides: {
          planningSeries: createMockPlanningSeries(),
          profilesReadiness: partialReadiness,
        },
      });

      expect(screen.getByText('First test series')).toBeInTheDocument();
      expect(screen.getByText('Second test series')).toBeInTheDocument();
      expect(await loader.getAllHarnesses(MatInputHarness)).toHaveLength(2);
    });

    it('should not show the dirty indicator when form is clean', async () => {
      const { view } = await runSetup();
      const dirtyDot = view.fixture.nativeElement.querySelector('.bg-orange-500');
      expect(dirtyDot).not.toBeTruthy();
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator when isLoadingReadiness is true', async () => {
      await runSetup({ storeOverrides: { isLoadingReadiness: true } });
      expect(screen.getByText('TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.LOADING')).toBeInTheDocument();
    });

    it('should not render series checkboxes when loading', async () => {
      const { loader } = await runSetup({ storeOverrides: { isLoadingReadiness: true } });
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      expect(checkboxes.length).toBe(0);
    });

    it('should not show loading indicator when isLoadingReadiness is false', async () => {
      await runSetup({ storeOverrides: { isLoadingReadiness: false } });
      expect(screen.queryByText('TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.LOADING')).not.toBeInTheDocument();
    });
  });

  describe('Empty state (no profilesReadiness data)', () => {
    it('should render no observation inputs when no matching profile in profilesReadiness', async () => {
      const { loader } = await runSetup({
        // Array con perfil distinto al widget → profileItem no encontrado → seriesReadiness = []
        storeOverrides: {
          profilesReadiness: [{ profile: 'VIDEO', seriesReadiness: [] }] as ReturnType<
            typeof createMockProfilesReadiness
          >,
        },
      });
      const inputs = await loader.getAllHarnesses(MatInputHarness);
      expect(inputs.length).toBe(0);
    });
  });

  describe('toggleSelectAll', () => {
    it('should check all series checkboxes when select-all is checked', async () => {
      const { loader } = await runSetup();
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      // checkboxes[0] = select-all
      await checkboxes[0].check();

      expect(await checkboxes[1].isChecked()).toBe(true);
      expect(await checkboxes[2].isChecked()).toBe(true);
    });

    it('should uncheck all series when select-all is unchecked', async () => {
      const { loader } = await runSetup({
        storeOverrides: {
          profilesReadiness: createMockProfilesReadiness({ isReady1: true, isReady2: true }),
        },
      });
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      await checkboxes[0].uncheck();

      expect(await checkboxes[1].isChecked()).toBe(false);
      expect(await checkboxes[2].isChecked()).toBe(false);
    });

    it('should show select-all as indeterminate when only some series are ready', async () => {
      const { loader } = await runSetup({
        storeOverrides: {
          profilesReadiness: createMockProfilesReadiness({ isReady1: true, isReady2: false }),
        },
      });
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      expect(await checkboxes[0].isIndeterminate()).toBe(true);
    });

    it('should show select-all as checked when all series are ready', async () => {
      const { loader } = await runSetup({
        storeOverrides: {
          profilesReadiness: createMockProfilesReadiness({ isReady1: true, isReady2: true }),
        },
      });
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      expect(await checkboxes[0].isChecked()).toBe(true);
    });
  });

  describe('toggleSerie', () => {
    it('should check a single series checkbox independently', async () => {
      const { loader } = await runSetup();
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      // checkboxes[1] = Serie 1
      await checkboxes[1].check();
      expect(await checkboxes[1].isChecked()).toBe(true);
    });

    it('should not affect other series when toggling one', async () => {
      const { loader } = await runSetup();
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      await checkboxes[1].check();
      expect(await checkboxes[2].isChecked()).toBe(false);
    });
  });

  describe('onObservationsChange', () => {
    it('should update observations input value', async () => {
      const { loader } = await runSetup();
      const inputs = await loader.getAllHarnesses(MatInputHarness);
      await inputs[0].setValue('Test observation');
      expect(await inputs[0].getValue()).toBe('Test observation');
    });

    it('should not affect the second input when editing the first', async () => {
      const { loader } = await runSetup();
      const inputs = await loader.getAllHarnesses(MatInputHarness);
      await inputs[0].setValue('Only first');
      expect(await inputs[1].getValue()).toBe('');
    });
  });

  describe('formState dirty indicator', () => {
    it('should show dirty dot when a checkbox state differs from store', async () => {
      const { loader, view } = await runSetup({
        storeOverrides: {
          profilesReadiness: createMockProfilesReadiness({ isReady1: false }),
        },
      });

      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      await checkboxes[1].check();
      view.fixture.detectChanges();

      const dirtyDot = view.fixture.nativeElement.querySelector('.bg-orange-500');
      expect(dirtyDot).toBeTruthy();
    });

    it('should not show dirty dot when state matches the store', async () => {
      const { view } = await runSetup();
      const dirtyDot = view.fixture.nativeElement.querySelector('.bg-orange-500');
      expect(dirtyDot).not.toBeTruthy();
    });
  });

  describe('saveForm', () => {
    it('should call store.saveProfileReadiness with the current series state', async () => {
      const { view, mockStore } = await runSetup();
      const component = view.fixture.componentInstance;

      await component.saveForm();

      expect(mockStore.saveProfileReadiness).toHaveBeenCalledWith(
        'trial-123',
        'VELOCITIES',
        expect.arrayContaining([
          expect.objectContaining({ seriesId: SERIE_ID_1 }),
          expect.objectContaining({ seriesId: SERIE_ID_2 }),
        ]),
      );
    });

    it('should not call store.saveProfileReadiness when fireTrialId is null', async () => {
      const { view, mockStore } = await runSetup();
      mockStore.fireTrialId.set(null);
      const component = view.fixture.componentInstance;

      await component.saveForm();

      expect(mockStore.saveProfileReadiness).not.toHaveBeenCalled();
    });

    it('should pass isReady=true for checked series when saving', async () => {
      const { view, loader, mockStore } = await runSetup();

      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      await checkboxes[1].check();

      await view.fixture.componentInstance.saveForm();

      expect(mockStore.saveProfileReadiness).toHaveBeenCalledWith(
        'trial-123',
        'VELOCITIES',
        expect.arrayContaining([expect.objectContaining({ seriesId: SERIE_ID_1, isReady: true })]),
      );
    });

    it('should pass observations value when saving', async () => {
      const { view, loader, mockStore } = await runSetup();

      const inputs = await loader.getAllHarnesses(MatInputHarness);
      await inputs[0].setValue('obs texto');

      await view.fixture.componentInstance.saveForm();

      expect(mockStore.saveProfileReadiness).toHaveBeenCalledWith(
        'trial-123',
        'VELOCITIES',
        expect.arrayContaining([expect.objectContaining({ seriesId: SERIE_ID_1, observations: 'obs texto' })]),
      );
    });
  });

  describe('resetForm', () => {
    it('should restore series ready state from the store', async () => {
      const { view, loader } = await runSetup({
        storeOverrides: {
          profilesReadiness: createMockProfilesReadiness({ isReady1: false }),
        },
      });

      // Marcar serie 1 → dirty
      const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      await checkboxes[1].check();

      // Resetear
      view.fixture.componentInstance.resetForm();
      view.fixture.detectChanges();

      const refreshedCheckboxes = await loader.getAllHarnesses(MatCheckboxHarness);
      expect(await refreshedCheckboxes[1].isChecked()).toBe(false);
    });
  });

  describe('widgetStateService integration', () => {
    it('should call updateWidgetFormState on init', async () => {
      const { mockWidgetStateService } = await runSetup();
      expect(mockWidgetStateService.updateWidgetFormState).toHaveBeenCalled();
    });
  });
});

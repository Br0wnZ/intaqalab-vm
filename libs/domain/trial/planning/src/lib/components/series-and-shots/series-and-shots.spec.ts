import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import {
  TEST_CONSTANTS,
  createMockMatDialog,
  createMockPlanningGeneralDataStore,
  createMockSeriesAndShotsStore,
  createSeries,
} from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import type { Serie } from '../../utils-models/series-and-shots.model';
import { SeriesAndShots } from './series-and-shots';

describe('SeriesAndShots', () => {
  let mockPlanningStore: ReturnType<typeof createMockPlanningGeneralDataStore>;
  let mockSeriesStore: ReturnType<typeof createMockSeriesAndShotsStore>;
  let mockDialog: ReturnType<typeof createMockMatDialog>;

  const createSeriesData = (count = 3, shotsPerSerie = 2): Serie[] =>
    createSeries(count, shotsPerSerie).map((serie, index) => ({
      id: `${serie.id}`,
      name: `${serie.name}`,
      shotQuantity: serie.shots.length,
      executionOrder: index + 1,
      observations: `${serie.observations}`,
      shots: serie.shots.map((shot) => ({
        id: `${shot.id}`,
        globalNumber: shot.globalNumber,
        observation: shot.observation,
      })),
    }));

  const runSetup = async (
    series: Serie[] = createSeriesData(3, 2),
    fireTrialId: string | null = TEST_CONSTANTS.IDS.TRIAL.DEFAULT,
  ) => {
    mockPlanningStore = createMockPlanningGeneralDataStore({
      fireTrialId: fireTrialId ?? undefined,
      fireTrial: { status: 'planned', code: 'TRIAL-2025-001' },
    });
    mockSeriesStore = createMockSeriesAndShotsStore({
      series,
      fireTrialId: fireTrialId ?? undefined,
    });

    mockDialog = createMockMatDialog({ defaultResult: null });

    const user = userEvent.setup();

    const view = await render(SeriesAndShots, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideTestingEnvironment(),
        { provide: PlanningGeneralDataStore, useValue: mockPlanningStore },
        { provide: MatDialog, useValue: mockDialog },
      ],
      componentProviders: [{ provide: SeriesAndShotsStore, useValue: mockSeriesStore }],
    });

    const container = view.fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user, view, container, loader };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const expandPanelByIndex = async (loader: HarnessLoader, index: number) => {
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    expect(panels.length).toBeGreaterThan(index);
    await panels[index].expand();
    return panels[index];
  };

  describe('Initial rendering', () => {
    it('should render the section title heading', async () => {
      await runSetup();
      expect(screen.getByText('TRIAL-2025-001')).toBeInTheDocument();
    });

    it('should render the create series button', async () => {
      await runSetup();
      expect(screen.getByText('TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.CREATE_SERIE_BUTTON')).toBeInTheDocument();
    });

    it('should render the table headers', async () => {
      await runSetup();
      expect(screen.getByText(/SERIES_TABLE.SERIE_NAME/i)).toBeInTheDocument();
      expect(screen.getByText(/SERIES_TABLE.EXECUTION_ORDER/i)).toBeInTheDocument();
      expect(screen.getByText(/SERIES_TABLE.OBSERVATIONS/i)).toBeInTheDocument();
      expect(screen.getByText(/SERIES_TABLE.ACTIONS/i)).toBeInTheDocument();
    });

    it('should render all series names', async () => {
      await runSetup();
      expect(screen.getByText('Serie A')).toBeInTheDocument();
      expect(screen.getByText('Serie B')).toBeInTheDocument();
      expect(screen.getByText('Serie C')).toBeInTheDocument();
    });

    it('should render actions for each series', async () => {
      await runSetup();
      expect(screen.getAllByLabelText(/Editar/i)).toHaveLength(3);
      expect(screen.getAllByLabelText(/Eliminar/i)).toHaveLength(3);
      expect(screen.getAllByTitle(/Arrastrar para reordenar/i)).toHaveLength(3);
    });
  });

  describe('Data interactions', () => {
    it('should load series on initialization', async () => {
      await runSetup();
      expect(mockSeriesStore.loadSeries).toHaveBeenCalled();
    });

    it('should not load series if trialId is missing', async () => {
      await runSetup([], null);
      expect(mockSeriesStore.loadSeries).not.toHaveBeenCalled();
      expect(screen.queryByText('Serie A')).not.toBeInTheDocument();
    });
  });

  describe('Expansion Panels', () => {
    it('should expand a panel', async () => {
      const { loader } = await runSetup();
      const panel = await expandPanelByIndex(loader, 0);

      expect(await panel.isExpanded()).toBe(true);
    });

    it('should collapse a previously expanded panel', async () => {
      const { loader } = await runSetup();
      const panel = await expandPanelByIndex(loader, 0);
      expect(await panel.isExpanded()).toBe(true);

      await panel.collapse();
      expect(await panel.isExpanded()).toBe(false);
    });

    it('should set openSerieId when opening a panel', async () => {
      const { view, loader } = await runSetup();
      await expandPanelByIndex(loader, 0);

      const instance = view.fixture.componentInstance as SeriesAndShots;
      expect(instance.openSerieId()).toBe('1');
    });
  });

  describe('Series Management', () => {
    it('should open create series dialog', async () => {
      const { user } = await runSetup();
      const createButton = screen
        .getByText('TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.CREATE_SERIE_BUTTON')
        .closest('button');

      expect(createButton).toBeTruthy();
      if (!createButton) return;

      await user.click(createButton);

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          data: expect.objectContaining({ isEditing: false }),
        }),
      );
    });

    it('should open edit series dialog', async () => {
      const { user } = await runSetup();
      const editButtons = screen.getAllByLabelText(/Editar/i);

      await user.click(editButtons[0]);

      expect(mockDialog.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          data: expect.objectContaining({
            isEditing: true,
            name: 'Serie A',
          }),
        }),
      );
    });

    it('should open delete series dialog on click', async () => {
      const { user } = await runSetup();
      const deleteButtons = screen.getAllByLabelText(/Eliminar/i);

      await user.click(deleteButtons[0]);

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('Shot Management', () => {
    it('should show shot table when series is expanded', async () => {
      const { loader } = await runSetup();
      const panel = await expandPanelByIndex(loader, 0);

      const content = await panel.getTextContent();
      expect(content).toContain('TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.SERIES_SHOTS');
    });

    it('should call addShotToSerie when clicking add shot button', async () => {
      const { user, container, loader } = await runSetup();
      await expandPanelByIndex(loader, 0);

      const expandedPanel = container.querySelector('mat-expansion-panel.mat-expanded');
      expect(expandedPanel).toBeTruthy();
      if (!expandedPanel) return;

      const addShotButton = within(expandedPanel as HTMLElement)
        .getByText('TRIAL_PLANNING.SERIES_AND_SHOTS_SECTION.ADD_SHOT_BUTTON')
        .closest('button');
      expect(addShotButton).toBeTruthy();
      if (!addShotButton) return;

      await user.click(addShotButton);

      expect(mockSeriesStore.addShotToSerie).toHaveBeenCalledWith({ serieId: '1' });
    });

    it('should allow editing a shot observation', async () => {
      const { container, view, loader } = await runSetup();
      await expandPanelByIndex(loader, 0);

      await waitFor(() => {
        const expandedPanel = container.querySelector('mat-expansion-panel.mat-expanded');
        expect(expandedPanel).toBeTruthy();
      });

      const expandedPanel = container.querySelector('mat-expansion-panel.mat-expanded');
      expect(expandedPanel).toBeTruthy();
      if (!expandedPanel) return;

      const panelQueries = within(expandedPanel as HTMLElement);

      const editButtons = panelQueries.getAllByTitle('Editar');
      expect(editButtons.length).toBeGreaterThan(0);
      await userEvent.setup().click(editButtons[0]);
      view.fixture.detectChanges();

      await waitFor(() => {
        const saveButton = panelQueries.getByTitle('Guardar');
        expect(saveButton).toBeInTheDocument();
      });

      const input = expandedPanel.querySelector('input:not([disabled])');
      expect(input).toBeTruthy();
      if (!input) return;

      const user = userEvent.setup();
      await user.clear(input as HTMLInputElement);
      await user.type(input as HTMLInputElement, 'New Observation');
      view.fixture.detectChanges();

      const saveButton = panelQueries.getByTitle('Guardar');
      await user.click(saveButton);
      view.fixture.detectChanges();

      expect(mockSeriesStore.updateShot).toHaveBeenCalledWith(
        expect.objectContaining({
          shotId: '1',
          observation: 'New Observation',
        }),
      );
    });

    it('should show empty state when no shots exist', async () => {
      const emptySeries = createSeriesData(1, 0);
      emptySeries[0].shots = [];
      emptySeries[0].shotQuantity = 0;

      const { loader } = await runSetup(emptySeries);
      const panel = await expandPanelByIndex(loader, 0);

      const content = await panel.getTextContent();
      expect(content).toContain('NOT_SHOTS_IN_SERIE');
    });
  });
});

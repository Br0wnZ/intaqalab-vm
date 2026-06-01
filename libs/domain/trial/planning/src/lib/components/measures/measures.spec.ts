/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import {
  createMockMeasuresService,
  createMockPlanningGeneralDataStore,
  createMockSeriesAndShotsService,
  createMockSeriesAndShotsStore,
} from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MeasuresStore } from '../../+state/measures.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import { MeasuresService } from '../../services/measures-service';
import { SeriesAndShotsService } from '../../services/series-and-shots-service';
import { Measures } from './measures';

// vi.mock hoisted by Vitest — must use synchronous factory (Issue #14: ng2-pdf-viewer crash)
vi.mock('ng2-pdf-viewer', () => ({
  PdfViewerModule: class PdfViewerModule {},
}));

const defaultImports = [TranslateModule.forRoot()];

const defaultCatalogData = [
  { id: 'cat-1', name: 'Presión', active: true },
  { id: 'cat-2', name: 'Velocidad', active: true },
];

describe('Measures', () => {
  let mockPlanningStore: ReturnType<typeof createMockPlanningGeneralDataStore>;
  let mockMeasuresService: ReturnType<typeof createMockMeasuresService>;
  let mockSeriesStore: ReturnType<typeof createMockSeriesAndShotsStore>;

  const runSetup = async (options?: {
    measuresData?: any;
    catalogData?: any;
    trialId?: string | null;
    seriesData?: any[];
  }) => {
    const measuresData = options?.measuresData ?? {
      series: [
        {
          seriesId: 'series-1',
          seriesName: 'Serie A',
          measures: {
            topographyMeasures: [],
            munitionsMeasures: [],
            armamentMeasures: [],
            ballisticsMeasures: [],
          },
        },
        {
          seriesId: 'series-2',
          seriesName: 'Serie B',
          measures: {
            topographyMeasures: [],
            munitionsMeasures: [],
            armamentMeasures: [],
            ballisticsMeasures: [],
          },
        },
      ],
    };
    const catalogData = options?.catalogData ?? defaultCatalogData;
    const seriesData = options?.seriesData ?? [
      { id: 'series-1', name: 'Serie A' },
      { id: 'series-2', name: 'Serie B' },
    ];
    const trialId = options && 'trialId' in options ? options.trialId : 'trial-123';

    mockPlanningStore = createMockPlanningGeneralDataStore({
      fireTrialId: trialId ?? undefined,
      fireTrial: { code: 'TRIAL-001' },
    });

    mockMeasuresService = createMockMeasuresService({
      measures: measuresData,
      measuresCatalog: catalogData,
    });

    mockSeriesStore = createMockSeriesAndShotsStore({
      series: seriesData,
    });

    const mockSeriesService = createMockSeriesAndShotsService({
      series: seriesData,
    });

    const view = await render(Measures, {
      imports: defaultImports,
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MeasuresStore,
        { provide: PlanningGeneralDataStore, useValue: mockPlanningStore },
        { provide: MeasuresService, useValue: mockMeasuresService },
        { provide: SeriesAndShotsService, useValue: mockSeriesService },
        { provide: SeriesAndShotsStore, useValue: mockSeriesStore },
      ],
    });

    const container = view.fixture.nativeElement as HTMLElement;
    const loader = TestbedHarnessEnvironment.loader(view.fixture);

    return { user: userEvent.setup(), view, container, loader };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render the trial code heading', async () => {
      await runSetup();
      expect(screen.getByText('TRIAL-001')).toBeInTheDocument();
    });

    it('should render the configuration toggle button', async () => {
      await runSetup();
      expect(screen.getByText(/Configurar por serie/i)).toBeInTheDocument();
    });

    it('should render global configuration fields by default', async () => {
      await runSetup();
      expect(screen.getByText('Magnitudes y registros de topografía')).toBeInTheDocument();
      expect(screen.getByText('Magnitudes y registros de municiones')).toBeInTheDocument();
      expect(screen.getByText('Magnitudes y registros de armamento')).toBeInTheDocument();
      expect(screen.getByText('Magnitudes y registros de balística')).toBeInTheDocument();
    });

    it('should NOT render expansion panels by default', async () => {
      const { loader } = await runSetup();
      const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
      expect(panels.length).toBe(0);
    });

    it('should render save and cancel buttons', async () => {
      await runSetup();
      expect(screen.getByRole('button', { name: /Guardar borrador/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });
  });

  describe('Toggle Configuration', () => {
    it('should switch to series configuration when toggle button is clicked', async () => {
      const { user, loader } = await runSetup();

      const toggleButton = screen.getByText(/Configurar por serie/i);
      await user.click(toggleButton);

      const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
      expect(panels.length).toBe(2);
    });

    it('should switch back to global configuration when clicked again', async () => {
      const { user, loader } = await runSetup();

      const toggleButton = screen.getByText(/Configurar por serie/i);
      await user.click(toggleButton);
      await user.click(toggleButton);

      const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
      expect(panels.length).toBe(0);
      expect(screen.getByText('Magnitudes y registros de topografía')).toBeInTheDocument();
    });
  });

  describe('Data Interactions', () => {
    it('should call updateMeasures on save with valid data', async () => {
      const { user } = await runSetup();

      const saveButton = screen.getByRole('button', { name: /Guardar borrador/i });
      await user.click(saveButton);

      expect(mockMeasuresService.updateMeasures).toHaveBeenCalled();
    });

    it('should reset data on cancel', async () => {
      const { user } = await runSetup();

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      expect(screen.getByText('Magnitudes y registros de topografía')).toBeInTheDocument();
      expect(screen.getByText('Magnitudes y registros de municiones')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', async () => {
      mockMeasuresService = createMockMeasuresService();
      mockMeasuresService._measuresResource._setLoading(true);

      const mockSeriesService = createMockSeriesAndShotsService();

      const { container } = await render(Measures, {
        imports: defaultImports,
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          MeasuresStore,
          { provide: PlanningGeneralDataStore, useValue: createMockPlanningGeneralDataStore({ fireTrialId: '123' }) },
          { provide: MeasuresService, useValue: mockMeasuresService },
          { provide: SeriesAndShotsService, useValue: mockSeriesService },
          { provide: SeriesAndShotsStore, useValue: createMockSeriesAndShotsStore() },
        ],
      });

      expect(container.querySelector('mat-spinner')).toBeInTheDocument();
    });
  });

  describe('Toggle Favorite Interaction', () => {
    it('should call addFavorite on store when triggered', async () => {
      const { view } = await runSetup();
      const store = view.fixture.debugElement.injector.get(MeasuresStore);
      const component = view.fixture.componentInstance;

      const addFavoriteSpy = vi.spyOn(store, 'addFavorite');

      component.onToggleFavorite({ id: 'cat-1', isFavorite: true });
      expect(addFavoriteSpy).toHaveBeenCalledWith('cat-1');
    });

    it('should call removeFavorite on store when triggered', async () => {
      const { view } = await runSetup();
      const store = view.fixture.debugElement.injector.get(MeasuresStore);
      const component = view.fixture.componentInstance;

      const removeFavoriteSpy = vi.spyOn(store, 'removeFavorite');

      component.onToggleFavorite({ id: 'cat-1', isFavorite: false });
      expect(removeFavoriteSpy).toHaveBeenCalledWith('cat-1');
    });
  });
});

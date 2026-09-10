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
import { formatMeasureOptionName, mapCatalogToMagnitudesOptions } from './measures.mapper';

const defaultImports = [TranslateModule.forRoot()];

const defaultCatalogData = [
  {
    id: 'cat-1',
    label: 'Presión',
    active: true,
    unit: 'TOPOGRAPHY',
    magnitude: 'Presión',
    favorite: true,
    qualificationType: 'QUANTITATIVE',
  },
  {
    id: 'cat-2',
    label: 'Velocidad',
    active: true,
    unit: 'MUNITIONS',
    magnitude: 'Velocidad',
    favorite: false,
    qualificationType: 'QUANTITATIVE',
  },
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
    readonly?: boolean;
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
      measuresCatalog: Array.isArray(catalogData)
        ? ({ page: 1, pageSize: 10, totalElements: catalogData.length, items: catalogData } as any)
        : catalogData,
    });

    mockSeriesStore = createMockSeriesAndShotsStore({
      series: seriesData,
    });

    const mockSeriesService = createMockSeriesAndShotsService({
      series: seriesData,
    });

    const view = await render(Measures, {
      imports: defaultImports,
      componentInputs: {
        readonly: options?.readonly ?? false,
      },
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

    it('should call updateMeasures propagating first series config to all series when by-series is disabled', async () => {
      const { user, view } = await runSetup();

      view.fixture.componentInstance.onCategoryChange('series-1', 'topografia', [
        { id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1, expanded: true },
      ]);

      const saveButton = screen.getByRole('button', { name: /Guardar borrador/i });
      await user.click(saveButton);

      expect(mockMeasuresService.updateMeasures).toHaveBeenCalledWith('trial-123', {
        series: [
          {
            seriesId: 'series-1',
            measures: {
              topographyMeasures: [{ id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1 }],
              munitionsMeasures: [],
              armamentMeasures: [],
              ballisticsMeasures: [],
            },
          },
          {
            seriesId: 'series-2',
            measures: {
              topographyMeasures: [{ id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1 }],
              munitionsMeasures: [],
              armamentMeasures: [],
              ballisticsMeasures: [],
            },
          },
        ],
      });
    });

    it('should call updateMeasures with separate configs when by-series is enabled', async () => {
      const { user, view } = await runSetup();

      // Enable series configuration
      const toggleButton = screen.getByText(/Configurar por serie/i);
      await user.click(toggleButton);

      view.fixture.componentInstance.onCategoryChange('series-1', 'topografia', [
        { id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1, expanded: true },
      ]);
      view.fixture.componentInstance.onCategoryChange('series-2', 'topografia', [
        { id: 'cat-2', minLimit: 2, maxLimit: 6, deviation: 0.2, expanded: true },
      ]);

      const saveButton = screen.getByRole('button', { name: /Guardar borrador/i });
      await user.click(saveButton);

      expect(mockMeasuresService.updateMeasures).toHaveBeenCalledWith('trial-123', {
        series: [
          {
            seriesId: 'series-1',
            measures: {
              topographyMeasures: [{ id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1 }],
              munitionsMeasures: [],
              armamentMeasures: [],
              ballisticsMeasures: [],
            },
          },
          {
            seriesId: 'series-2',
            measures: {
              topographyMeasures: [{ id: 'cat-2', minLimit: 2, maxLimit: 6, deviation: 0.2 }],
              munitionsMeasures: [],
              armamentMeasures: [],
              ballisticsMeasures: [],
            },
          },
        ],
      });
    });

    it('should reset data on cancel', async () => {
      const { user } = await runSetup();

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      expect(screen.getByText('Magnitudes y registros de topografía')).toBeInTheDocument();
      expect(screen.getByText('Magnitudes y registros de municiones')).toBeInTheDocument();
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

  describe('formatMeasureOptionName', () => {
    it('should remove trailing hyphen and preceding whitespace', () => {
      expect(formatMeasureOptionName('Presión -')).toBe('Presión');
      expect(formatMeasureOptionName('Presión - ')).toBe('Presión');
      expect(formatMeasureOptionName('Presión-')).toBe('Presión');
      expect(formatMeasureOptionName('Presión- ')).toBe('Presión');
    });

    it('should keep text intact when hyphen is in the middle', () => {
      expect(formatMeasureOptionName('Presión - Recámara')).toBe('Presión - Recámara');
    });

    it('should keep text intact when there is no trailing hyphen', () => {
      expect(formatMeasureOptionName('Presión')).toBe('Presión');
    });

    it('should return empty string for empty input', () => {
      expect(formatMeasureOptionName('')).toBe('');
    });
  });

  describe('mapCatalogToMagnitudesOptions', () => {
    it('should return empty arrays when catalog is empty', () => {
      const result = mapCatalogToMagnitudesOptions([]);
      expect(result).toEqual({
        topografia: [],
        municiones: [],
        armamento: [],
        balistica: [],
      });
    });

    it('should map catalog items by technical unit and format names', () => {
      const catalog = [
        {
          id: 'cat-1',
          label: 'Topografía -',
          active: true,
          unit: 'TOPOGRAPHY',
          magnitude: 'Topografía',
          favorite: true,
        },
        {
          id: 'cat-2',
          label: 'Balística - ',
          active: false,
          unit: 'BALLISTICS',
          magnitude: 'Balística',
          favorite: false,
        },
      ] as any;
      const result = mapCatalogToMagnitudesOptions(catalog);
      expect(result.topografia).toEqual([{ id: 'cat-1', name: 'Topografía', active: true, favorite: true }]);
      expect(result.balistica).toEqual([{ id: 'cat-2', name: 'Balística', active: false, favorite: false }]);
    });
  });

  describe('magnitudesOptions formatting', () => {
    it('should format option names omitting trailing hyphen and space in dropdown options', async () => {
      const customCatalog = [
        {
          id: 'cat-10',
          label: 'Cadencia de tiro - ',
          active: true,
          unit: 'ARMAMENT',
          magnitude: 'Cadencia',
          favorite: false,
        },
        {
          id: 'cat-11',
          label: 'Velocidad en boca -',
          active: true,
          unit: 'MUNITIONS',
          magnitude: 'Velocidad',
          favorite: false,
        },
        {
          id: 'cat-12',
          label: 'Presión - Recámara',
          active: true,
          unit: 'TOPOGRAPHY',
          magnitude: 'Presión',
          favorite: false,
        },
      ];
      const { view } = await runSetup({ catalogData: customCatalog });
      const component = view.fixture.componentInstance;

      expect(component.magnitudesOptions().armamento[0].name).toBe('Cadencia de tiro');
      expect(component.magnitudesOptions().municiones[0].name).toBe('Velocidad en boca');
      expect(component.magnitudesOptions().topografia[0].name).toBe('Presión - Recámara');
    });
  });

  describe('Category Card State Management', () => {
    it('should have balistica open by default and other categories closed', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      expect(component.isCategoryOpen('balistica')).toBe(true);
      expect(component.isCategoryOpen('topografia')).toBe(false);
      expect(component.isCategoryOpen('municiones')).toBe(false);
      expect(component.isCategoryOpen('armamento')).toBe(false);
    });

    it('should toggle category open state in global configuration', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.toggleCategory('topografia');
      expect(component.isCategoryOpen('topografia')).toBe(true);

      component.toggleCategory('topografia');
      expect(component.isCategoryOpen('topografia')).toBe(false);
    });

    it('should toggle category open state independently per serie in series configuration', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.toggleCategory('topografia', 'series-1');
      expect(component.isCategoryOpen('topografia', 'series-1')).toBe(true);
      expect(component.isCategoryOpen('topografia', 'series-2')).toBe(false);
    });
  });

  describe('Measure Limit Card Interactions', () => {
    it('should toggle measure expanded state via toggleMeasureExpanded', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.onCategoryChange('series-1', 'topografia', [
        { id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1, expanded: false },
      ]);

      component.toggleMeasureExpanded('series-1', 'topografia', 'cat-1');
      expect(component.seriesSignal()[0].topografia[0].expanded).toBe(true);

      component.toggleMeasureExpanded('series-1', 'topografia', 'cat-1');
      expect(component.seriesSignal()[0].topografia[0].expanded).toBe(false);
    });

    it('should not toggle expansion for qualitative measures via toggleMeasureExpanded', async () => {
      const customCatalog = [
        {
          id: 'cat-qual',
          label: 'Tipo',
          active: true,
          unit: 'MUNITIONS',
          magnitude: 'Tipo',
          qualificationType: 'QUALITATIVE',
        },
      ];
      const { view } = await runSetup({ catalogData: customCatalog });
      const component = view.fixture.componentInstance;

      component.onCategoryChange('series-1', 'municiones', [
        { id: 'cat-qual', minLimit: null, maxLimit: null, deviation: null, expanded: false },
      ]);

      component.toggleMeasureExpanded('series-1', 'municiones', 'cat-qual');
      expect(component.seriesSignal()[0].municiones[0].expanded).toBe(false);
    });

    it('should remove measure via removeMeasure', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.onCategoryChange('series-1', 'topografia', [
        { id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1, expanded: false },
        { id: 'cat-2', minLimit: 2, maxLimit: 6, deviation: 0.2, expanded: false },
      ]);

      component.removeMeasure('series-1', 'topografia', 'cat-1');
      expect(component.seriesSignal()[0].topografia.length).toBe(1);
      expect(component.seriesSignal()[0].topografia[0].id).toBe('cat-2');
    });

    it('should update limit field via updateLimit', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      component.onCategoryChange('series-1', 'topografia', [
        { id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1, expanded: true },
      ]);

      component.updateLimit('series-1', 'topografia', 'cat-1', 'maxLimit', 10);
      expect(component.seriesSignal()[0].topografia[0].maxLimit).toBe(10);

      component.updateLimit('series-1', 'topografia', 'cat-1', 'minLimit', 2);
      expect(component.seriesSignal()[0].topografia[0].minLimit).toBe(2);

      component.updateLimit('series-1', 'topografia', 'cat-1', 'deviation', 0.5);
      expect(component.seriesSignal()[0].topografia[0].deviation).toBe(0.5);
    });
  });

  describe('Helper functions', () => {
    it('should identify quantitative measures based on qualificationType in catalog', async () => {
      const customCatalog = [
        {
          id: 'cat-quant',
          label: 'Presión',
          active: true,
          unit: 'TOPOGRAPHY',
          magnitude: 'Presión',
          qualificationType: 'QUANTITATIVE',
        },
        {
          id: 'cat-qual',
          label: 'Tipo',
          active: true,
          unit: 'MUNITIONS',
          magnitude: 'Tipo',
          qualificationType: 'QUALITATIVE',
        },
      ];
      const { view } = await runSetup({ catalogData: customCatalog });
      const component = view.fixture.componentInstance;

      expect(component.isQuantitative('cat-quant')).toBe(true);
      expect(component.isQuantitative('cat-qual')).toBe(false);
      expect(component.isQuantitative('cat-non-existent')).toBe(false);
    });

    it('should return measure name from options or fallback to id', async () => {
      const { view } = await runSetup();
      const component = view.fixture.componentInstance;

      const options = [
        { id: 'cat-1', name: 'Presión cámara' },
        { id: 'cat-2', name: 'Velocidad inicial' },
      ];
      expect(component.getMeasureName('cat-1', options)).toBe('Presión cámara');
      expect(component.getMeasureName('unknown-id', options)).toBe('unknown-id');
    });
  });

  describe('Readonly Mode', () => {
    it('should not render save and cancel buttons when readonly is true', async () => {
      await runSetup({ readonly: true });
      expect(screen.queryByRole('button', { name: /Guardar borrador/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Cancelar/i })).not.toBeInTheDocument();
    });

    it('should prevent modifications when readonly is true', async () => {
      const { view } = await runSetup({ readonly: true });
      const component = view.fixture.componentInstance;
      const initialSeries = component.seriesSignal();

      component.onCategoryChange('series-1', 'topografia', [
        { id: 'cat-1', minLimit: 1, maxLimit: 5, deviation: 0.1, expanded: false },
      ]);
      expect(component.seriesSignal()).toEqual(initialSeries);

      component.removeMeasure('series-1', 'topografia', 'cat-1');
      expect(component.seriesSignal()).toEqual(initialSeries);

      component.updateLimit('series-1', 'topografia', 'cat-1', 'maxLimit', 100);
      expect(component.seriesSignal()).toEqual(initialSeries);

      component.toggleConfigBySerie();
      expect(component.seriesConfiguration()).toBe(false);

      const store = view.fixture.debugElement.injector.get(MeasuresStore);
      const addFavoriteSpy = vi.spyOn(store, 'addFavorite');
      component.onToggleFavorite({ id: 'cat-1', isFavorite: true });
      expect(addFavoriteSpy).not.toHaveBeenCalled();

      const updateMeasuresSpy = vi.spyOn(store, 'updateMeasures');
      component.save();
      expect(updateMeasuresSpy).not.toHaveBeenCalled();
    });
  });
});

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MunitionsStore } from '../../../+state/munitions.store';
import { PlanningGeneralDataStore } from '../../../+state/planning-general-data.store';
import type { Serie } from '../../../utils-models/munitions.model';
import { createEmptyConfiguration, createEmptySerie } from '../../../utils-models/munitions.model';
import { SeriePanelComponent } from './serie-panel.component';

const defaultImports = [TranslateModule.forRoot()];
const defaultProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideTestingEnvironment(),
  PlanningGeneralDataStore,
  MunitionsStore,
];

describe('SeriePanelComponent', () => {
  let fixture: ComponentFixture<SeriePanelComponent>;
  let seriesSignal: WritableSignal<Serie[]>;

  const defaultSerie: Serie = createEmptySerie('Test Serie');

  beforeEach(async () => {
    vi.clearAllMocks();
    seriesSignal = signal([defaultSerie]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render serie panel with its name', async () => {
      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

      expect(screen.getByText(/TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.TITLE/i)).toBeInTheDocument();
    });

    it('should render the add munition button', async () => {
      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

      const buttons = screen.getAllByRole('button');
      const addButton = buttons.find((btn) =>
        btn.textContent?.includes('TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.add_munition'),
      );
      expect(addButton).toBeInTheDocument();
    });

    it('should display message when there are no configurations', async () => {
      const emptySeriesSignal = signal([{ ...defaultSerie, configurations: [] }]);

      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: { ...defaultSerie, configurations: [] },
          serieIndex: 0,
          seriesSignal: emptySeriesSignal,
        },
      });

      expect(screen.getByText(/TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.EMPTY_CONFIGS/i)).toBeInTheDocument();
    });

    it('should render all configurations', async () => {
      const serieWithConfigs: Serie = {
        ...defaultSerie,
        configurations: [createEmptyConfiguration(), createEmptyConfiguration()],
      };

      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: serieWithConfigs,
          serieIndex: 0,
          seriesSignal: signal([serieWithConfigs]),
        },
      });

      const configTitles = screen.getAllByText(/TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.CONFIG_TITLE/i);
      expect(configTitles.length).toBe(2);
    });
  });

  describe('Adding munition', () => {
    it('should add a new configuration when button is clicked', async () => {
      const user = userEvent.setup();

      const renderResult = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      const initialConfigCount = seriesSignal()[0].configurations.length;

      component.onAddMunition();

      expect(seriesSignal()[0].configurations.length).toBe(initialConfigCount + 1);
    });

    it('should add multiple configurations', async () => {
      const user = userEvent.setup();

      const renderResult = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      component.onAddMunition();
      component.onAddMunition();
      component.onAddMunition();

      expect(seriesSignal()[0].configurations.length).toBe(3);
    });

    it('should disable the add button when all shots are assigned configurations', async () => {
      const shots = [
        { id: 'shot-1', globalNumber: 1, observation: '' },
        { id: 'shot-2', globalNumber: 2, observation: '' },
      ];
      const serieWithAllShotsAssigned: Serie = {
        ...defaultSerie,
        configurations: [
          { ...createEmptyConfiguration(), assignedShotIds: ['shot-1'] },
          { ...createEmptyConfiguration(), assignedShotIds: ['shot-2'] },
        ],
      };

      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: serieWithAllShotsAssigned,
          serieIndex: 0,
          seriesSignal: signal([serieWithAllShotsAssigned]),
          shots,
        },
      });

      const buttons = screen.getAllByRole('button');
      const addButton = buttons.find(
        (btn) =>
          btn.tagName === 'BUTTON' && btn.textContent?.includes('TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.add_munition'),
      );
      expect(addButton).toBeDisabled();
    });

    it('should NOT disable the add button when not all shots are assigned configurations', async () => {
      const shots = [
        { id: 'shot-1', globalNumber: 1, observation: '' },
        { id: 'shot-2', globalNumber: 2, observation: '' },
      ];
      const serieWithSomeShotsAssigned: Serie = {
        ...defaultSerie,
        configurations: [{ ...createEmptyConfiguration(), assignedShotIds: ['shot-1'] }],
      };

      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: serieWithSomeShotsAssigned,
          serieIndex: 0,
          seriesSignal: signal([serieWithSomeShotsAssigned]),
          shots,
        },
      });

      const buttons = screen.getAllByRole('button');
      const addButton = buttons.find(
        (btn) =>
          btn.tagName === 'BUTTON' && btn.textContent?.includes('TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.add_munition'),
      );
      expect(addButton).toBeEnabled();
    });
  });

  describe('Configuration updates', () => {
    it('should update seriesSignal when a configuration changes', async () => {
      const renderResult = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      const updatedConfig = { ...defaultSerie.configurations[0], batch: 'NEW-LOT' };
      component.onConfigChange(0, updatedConfig);

      expect(seriesSignal()[0].configurations[0].batch).toBe('NEW-LOT');
    });

    it('should update the correct configuration at the specified index', async () => {
      const serieWithConfigs: Serie = {
        ...defaultSerie,
        configurations: [createEmptyConfiguration(), createEmptyConfiguration()],
      };
      const localSeriesSignal = signal([serieWithConfigs]);

      const renderResult = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: serieWithConfigs,
          serieIndex: 0,
          seriesSignal: localSeriesSignal,
        },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      const updatedConfig = { ...serieWithConfigs.configurations[1], batch: 'SECOND-LOT' };
      component.onConfigChange(1, updatedConfig);

      expect(localSeriesSignal()[0].configurations[1].batch).toBe('SECOND-LOT');
      expect(localSeriesSignal()[0].configurations[0].batch).toBe('');
    });
  });

  describe('Panel expansion', () => {
    it('should allow expanding and collapsing the serie panel', async () => {
      const user = userEvent.setup();

      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

      const panelHeader = screen.getByText(/TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.TITLE/i);
      expect(panelHeader).toBeInTheDocument();

      await user.click(panelHeader);
    });

    it('should allow interaction with the panel', async () => {
      const user = userEvent.setup();

      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

      const panelHeader = screen.getByText(/TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.TITLE/i);
      expect(panelHeader).toBeInTheDocument();

      await user.click(panelHeader);

      expect(screen.getByText(/TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.TITLE/i)).toBeInTheDocument();
    });
  });
});

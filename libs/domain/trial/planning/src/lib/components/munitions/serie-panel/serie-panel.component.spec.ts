import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { provideTestingEnvironment } from '@intaqalab/config';
import { createMockMatDialog } from '@intaqalab/utils';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MunitionsStore } from '../../../+state/munitions.store';
import { PlanningGeneralDataStore } from '../../../+state/planning-general-data.store';
import type { Configuration, Serie } from '../../../utils-models/munitions.model';
import { createEmptyConfiguration, createEmptySerie } from '../../../utils-models/munitions.model';
import { ConfirmDeleteConfigurationDialog } from '../../confirm-delete-configuration-dialog/confirm-delete-configuration-dialog';
import { SeriePanelComponent } from './serie-panel.component';

const defaultImports = [TranslateModule.forRoot()];
const baseProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideTestingEnvironment(),
  PlanningGeneralDataStore,
  MunitionsStore,
];

describe('SeriePanelComponent', () => {
  let seriesSignal: WritableSignal<Serie[]>;
  let mockDialog: ReturnType<typeof createMockMatDialog>;

  const defaultSerie: Serie = createEmptySerie('Test Serie');
  const getProviders = () => [...baseProviders, { provide: MatDialog, useValue: mockDialog }];

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDialog = createMockMatDialog({ defaultResult: null });
    seriesSignal = signal([defaultSerie]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render serie panel with its name', async () => {
      await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
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
        providers: getProviders(),
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
        providers: getProviders(),
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
        providers: getProviders(),
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
      const { fixture } = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

      const component = fixture.componentInstance;

      const initialConfigCount = seriesSignal()[0].configurations.length;

      component.onAddMunition();

      expect(seriesSignal()[0].configurations.length).toBe(initialConfigCount + 1);
    });

    it('should add multiple configurations', async () => {
      const { fixture } = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

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
        providers: getProviders(),
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
        providers: getProviders(),
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
      const { fixture } = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: defaultSerie,
          serieIndex: 0,
          seriesSignal,
        },
      });

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

      const { fixture } = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: serieWithConfigs,
          serieIndex: 0,
          seriesSignal: localSeriesSignal,
        },
      });

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
        providers: getProviders(),
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
        providers: getProviders(),
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

  describe('Delete configuration', () => {
    const serieWithConfig: Serie = {
      ...defaultSerie,
      configurations: [createEmptyConfiguration()],
    };

    const setupTranslations = () => {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('es', {
        TRIAL_PLANNING: {
          DELETE_CONFIGURATION_DIALOG: {
            TITLE: 'Eliminar configuración',
            MESSAGE: '¿Deseas eliminar la configuración {{name}} para la serie {{serieName}}?',
            CONFIRM: 'Eliminar',
            CANCEL: 'Volver',
          },
          MUNITIONS: {
            SERIE_PANEL: {
              DELETE_CONFIG: 'Eliminar configuración',
            },
          },
        },
      });
      translate.use('es');
    };

    it('should open confirm delete dialog with correct data when delete button is clicked and emit on confirmation', async () => {
      const user = userEvent.setup();
      const deleteConfigSpy = vi.fn();

      mockDialog.open.mockReturnValueOnce({
        afterClosed: () => of(true),
        close: vi.fn(),
      } as unknown as MatDialogRef<unknown>);

      const view = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: serieWithConfig,
          serieIndex: 0,
          seriesSignal: signal([serieWithConfig]),
          expanded: true,
        },
      });

      setupTranslations();
      view.fixture.componentInstance.deleteConfiguration.subscribe(deleteConfigSpy);

      const deleteButton = screen.getByRole('button', {
        name: /TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.DELETE_CONFIG|Eliminar configuración/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDialog.open).toHaveBeenCalledWith(
          ConfirmDeleteConfigurationDialog,
          expect.objectContaining({
            data: expect.objectContaining({
              title: 'Eliminar configuración',
              message: '¿Deseas eliminar la configuración 1 para la serie Test Serie?',
              confirmText: 'Eliminar',
              cancelText: 'Volver',
            }),
          }),
        );
        expect(deleteConfigSpy).toHaveBeenCalledWith(0);
      });
    });

    it('should not emit deleteConfiguration when dialog is cancelled', async () => {
      const user = userEvent.setup();
      const deleteConfigSpy = vi.fn();

      mockDialog.open.mockReturnValueOnce({
        afterClosed: () => of(false),
        close: vi.fn(),
      } as unknown as MatDialogRef<unknown>);

      const view = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: serieWithConfig,
          serieIndex: 0,
          seriesSignal: signal([serieWithConfig]),
          expanded: true,
        },
      });

      setupTranslations();
      view.fixture.componentInstance.deleteConfiguration.subscribe(deleteConfigSpy);

      const deleteButton = screen.getByRole('button', {
        name: /TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.DELETE_CONFIG|Eliminar configuración/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDialog.open).toHaveBeenCalledWith(ConfirmDeleteConfigurationDialog, expect.anything());
        expect(deleteConfigSpy).not.toHaveBeenCalled();
      });
    });

    it('should not open dialog when readonly is true', async () => {
      const view = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: serieWithConfig,
          serieIndex: 0,
          seriesSignal: signal([serieWithConfig]),
          expanded: true,
          readonly: true,
        },
      });

      setupTranslations();

      const deleteButton = screen.getByRole('button', {
        name: /TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.DELETE_CONFIG|Eliminar configuración/i,
      });
      expect(deleteButton).toBeDisabled();

      const component = view.fixture.componentInstance;
      await component.onDeleteConfiguration(0);

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should pass custom configuration name if present on configuration', async () => {
      mockDialog.open.mockReturnValueOnce({
        afterClosed: () => of(false),
        close: vi.fn(),
      } as unknown as MatDialogRef<unknown>);

      const customSerie: Serie = {
        ...defaultSerie,
        configurations: [
          {
            ...createEmptyConfiguration(),
            name: 'CustomConfigAlpha',
          } as unknown as Configuration,
        ],
      };

      const view = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: customSerie,
          serieIndex: 0,
          seriesSignal: signal([customSerie]),
          expanded: true,
        },
      });

      setupTranslations();

      const component = view.fixture.componentInstance;
      await component.onDeleteConfiguration(0);

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmDeleteConfigurationDialog,
        expect.objectContaining({
          data: expect.objectContaining({
            message: '¿Deseas eliminar la configuración CustomConfigAlpha para la serie Test Serie?',
          }),
        }),
      );
    });

    it('should format configuration name in titlecase with first letter capitalized', async () => {
      mockDialog.open.mockReturnValueOnce({
        afterClosed: () => of(false),
        close: vi.fn(),
      } as unknown as MatDialogRef<unknown>);

      const lowercaseSerie: Serie = {
        ...defaultSerie,
        configurations: [
          {
            ...createEmptyConfiguration(),
            name: 'configuración especial',
          } as unknown as Configuration,
        ],
      };

      const view = await render(SeriePanelComponent, {
        imports: defaultImports,
        providers: getProviders(),
        componentInputs: {
          serie: lowercaseSerie,
          serieIndex: 0,
          seriesSignal: signal([lowercaseSerie]),
          expanded: true,
        },
      });

      setupTranslations();

      const component = view.fixture.componentInstance;
      await component.onDeleteConfiguration(0);

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmDeleteConfigurationDialog,
        expect.objectContaining({
          data: expect.objectContaining({
            message: '¿Deseas eliminar la configuración Configuración especial para la serie Test Serie?',
          }),
        }),
      );
    });
  });
});

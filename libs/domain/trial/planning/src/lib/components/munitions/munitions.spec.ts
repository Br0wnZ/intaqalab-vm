/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTestingEnvironment } from '@intaqalab/config';
import {
  createMockMunitionsService,
  createMockPlanningGeneralDataStore,
  createMockSeriesAndShotsService,
  createMunitionsCatalogTestData,
  createTrial,
} from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { MunitionsService } from '../../services/munitions-service';
import { SeriesAndShotsService } from '../../services/series-and-shots-service';
import type { Serie } from '../../utils-models/munitions.model';
import {
  createEmptyComponentDetail,
  createEmptyConfiguration,
  createEmptySerie,
} from '../../utils-models/munitions.model';
import { Munitions } from './munitions';

// Helpers

const defaultImports = [TranslateModule.forRoot()];

/** Serie con todos los campos requeridos por el formulario cubiertos */
function createValidSerie(name: string): Serie {
  return {
    ...createEmptySerie(name),
    configurations: [
      {
        ...createEmptyConfiguration(),
        denomination: 'Denom-1',
        batch: 'LOT-001',
        assignedShotIds: ['shot-1'],
      },
    ],
  };
}

// Setup

const runSetup = async (options?: { mockDialog?: Partial<MatDialog> }) => {
  const catalogData = createMunitionsCatalogTestData();

  const mockPlanningStore = createMockPlanningGeneralDataStore({
    fireTrialId: 'trial-123',
    fireTrial: { ...createTrial(), status: 'PLANNED' },
  });

  const mockMunitionsService = createMockMunitionsService({
    componentTypes: catalogData.componentTypes,
    denominations: catalogData.denominations,
    fuseWorkingModes: catalogData.fuseWorkingModes,
  });

  const mockSeriesService = createMockSeriesAndShotsService({
    series: [
      { id: 'series-1', name: 'Serie A', shots: [{ id: 'shot-1', globalNumber: 1, observation: '' }] },
      { id: 'series-2', name: 'Serie B', shots: [] },
    ],
  });

  const providers = [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideAnimationsAsync(),
    provideTestingEnvironment(),
    { provide: PlanningGeneralDataStore, useValue: mockPlanningStore },
    { provide: MunitionsService, useValue: mockMunitionsService },
    { provide: SeriesAndShotsService, useValue: mockSeriesService },
    ...(options?.mockDialog ? [{ provide: MatDialog, useValue: options.mockDialog }] : []),
  ];

  const view = await render(Munitions, { imports: defaultImports, providers });
  const component = view.fixture.componentInstance;
  const user = userEvent.setup();

  return { view, component, user, mockPlanningStore, mockMunitionsService };
};

// Tests

describe('Munitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Initial rendering

  describe('Initial rendering', () => {
    it('should create the component', async () => {
      const { component } = await runSetup();
      expect(component).toBeTruthy();
    });

    it('should render the trial code in the header', async () => {
      await runSetup();
      expect(screen.getByText(createTrial().code)).toBeInTheDocument();
    });

    it('should render the massive configuration button', async () => {
      await runSetup();
      // Known Issue #4: getByText preferred over getByRole for Angular Material buttons
      expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.MASSIVE_CONFIG_BUTTON')).toBeInTheDocument();
    });

    it('should render save and cancel buttons', async () => {
      await runSetup();
      expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON')).toBeInTheDocument();
      expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.CANCEL_BUTTON')).toBeInTheDocument();
    });

    it('should display series panels when seriesSignal has data', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([createValidSerie('Serie 1'), createValidSerie('Serie 2')]);
      view.fixture.detectChanges();

      const seriesHeaders = screen.getAllByText(/TRIAL_PLANNING.MUNITIONS.SERIE_PANEL.TITLE/i);
      expect(seriesHeaders.length).toBe(2);
    });

    it('should display the empty-state message when there are no series', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([]);
      view.fixture.detectChanges();

      expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.EMPTY_STATE')).toBeInTheDocument();
    });
  });

  // Form state

  describe('Form state', () => {
    it('should report the form as valid when all required fields are filled', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([createValidSerie('Serie 1')]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(true);
    });

    it('should report the form as invalid when denomination is empty', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([
        {
          ...createEmptySerie('Serie 1'),
          configurations: [
            { ...createEmptyConfiguration(), denomination: '', batch: 'LOT', assignedShotIds: ['shot-1'] },
          ],
        },
      ]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(false);
    });

    it('should report the form as valid when denomination is empty but valid components are selected', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([
        {
          ...createEmptySerie('Serie 1'),
          configurations: [
            {
              ...createEmptyConfiguration(),
              denomination: '',
              batch: 'LOT',
              assignedShotIds: ['shot-1'],
              selectedComponents: ['espoleta'],
              components: [
                {
                  ...createEmptyComponentDetail('espoleta'),
                  denomination: { id: 'denom-123', name: 'Espoleta 1' },
                },
              ],
            },
          ],
        },
      ]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(true);
    });

    it('should report the form as invalid when denomination is empty and components are selected but invalid (e.g. missing denomination)', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([
        {
          ...createEmptySerie('Serie 1'),
          configurations: [
            {
              ...createEmptyConfiguration(),
              denomination: '',
              batch: 'LOT',
              assignedShotIds: ['shot-1'],
              selectedComponents: ['espoleta'],
              components: [
                {
                  ...createEmptyComponentDetail('espoleta'),
                  denomination: { id: '', name: '' },
                },
              ],
            },
          ],
        },
      ]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(false);
    });

    it('should report the form as valid when batch is empty (batch is optional)', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([
        {
          ...createEmptySerie('Serie 1'),
          configurations: [
            { ...createEmptyConfiguration(), denomination: 'Denom', batch: '', assignedShotIds: ['shot-1'] },
          ],
        },
      ]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      // The form validates: denomination (required), assignedShotIds (non-empty). batch is NOT required.
      expect(component.isFormValid()).toBe(true);
    });

    it('should report the form as invalid when no shots are assigned', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([
        {
          ...createEmptySerie('Serie 1'),
          configurations: [
            { ...createEmptyConfiguration(), denomination: 'Denom', batch: 'LOT', assignedShotIds: null },
          ],
        },
      ]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(false);
    });

    it('should disable save button when form is invalid', async () => {
      const { component, view } = await runSetup();

      // An empty configuration (denomination='', batch='') triggers required validators
      component.seriesSignal.set([{ ...createEmptySerie('Serie 1'), configurations: [createEmptyConfiguration()] }]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      const saveButton = screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON').closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form is valid', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([createValidSerie('Serie 1')]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      const saveButton = screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    describe('Reconditioning validation', () => {
      it('should report the form as invalid when config-level reconditioning is enabled but numeric fields are undefined', async () => {
        const { component, view } = await runSetup();

        component.seriesSignal.set([
          {
            ...createValidSerie('Serie 1'),
            configurations: [
              {
                ...createEmptyConfiguration(),
                denomination: 'Denom-1',
                batch: 'LOT-001',
                assignedShotIds: ['shot-1'],
                reconditioning: {
                  temperature: undefined as any,
                  tolerance: undefined as any,
                  timeMin: undefined as any,
                  timeMax: undefined as any,
                },
              },
            ],
          },
        ]);
        component.seriesForm().markAsTouched();
        view.fixture.detectChanges();

        expect(component.isFormValid()).toBe(false);
      });

      it('should report the form as valid when config-level reconditioning is enabled and all numeric fields are filled', async () => {
        const { component, view } = await runSetup();

        component.seriesSignal.set([
          {
            ...createValidSerie('Serie 1'),
            configurations: [
              {
                ...createEmptyConfiguration(),
                denomination: 'Denom-1',
                batch: 'LOT-001',
                assignedShotIds: ['shot-1'],
                reconditioning: {
                  temperature: 20,
                  tolerance: 2,
                  timeMin: 12,
                  timeMax: 24,
                },
              },
            ],
          },
        ]);
        component.seriesForm().markAsTouched();
        view.fixture.detectChanges();

        expect(component.isFormValid()).toBe(true);
      });

      it('should report the form as invalid when component-level reconditioning is enabled but numeric fields are undefined', async () => {
        const { component, view } = await runSetup();

        component.seriesSignal.set([
          {
            ...createValidSerie('Serie 1'),
            configurations: [
              {
                ...createEmptyConfiguration(),
                denomination: 'Denom-1',
                batch: 'LOT-001',
                assignedShotIds: ['shot-1'],
                selectedComponents: ['espoleta'],
                components: [
                  {
                    ...createEmptyComponentDetail('espoleta'),
                    denomination: { id: 'denom-1', name: 'Espoleta 1' },
                    reconditioning: {
                      temperature: undefined as any,
                      tolerance: undefined as any,
                      timeMin: undefined as any,
                      timeMax: undefined as any,
                    },
                  },
                ],
              },
            ],
          },
        ]);
        component.seriesForm().markAsTouched();
        view.fixture.detectChanges();

        expect(component.isFormValid()).toBe(false);
      });

      it('should report the form as valid when component-level reconditioning is enabled and all numeric fields are filled', async () => {
        const { component, view } = await runSetup();

        component.seriesSignal.set([
          {
            ...createValidSerie('Serie 1'),
            configurations: [
              {
                ...createEmptyConfiguration(),
                denomination: 'Denom-1',
                batch: 'LOT-001',
                assignedShotIds: ['shot-1'],
                selectedComponents: ['espoleta'],
                components: [
                  {
                    ...createEmptyComponentDetail('espoleta'),
                    denomination: { id: 'denom-1', name: 'Espoleta 1' },
                    reconditioning: {
                      temperature: 20,
                      tolerance: 2,
                      timeMin: 12,
                      timeMax: 24,
                    },
                  },
                ],
              },
            ],
          },
        ]);
        component.seriesForm().markAsTouched();
        view.fixture.detectChanges();

        expect(component.isFormValid()).toBe(true);
      });

      it('should disable save button when reconditioning fields are invalid', async () => {
        const { component, view } = await runSetup();

        component.seriesSignal.set([
          {
            ...createValidSerie('Serie 1'),
            configurations: [
              {
                ...createEmptyConfiguration(),
                denomination: 'Denom-1',
                batch: 'LOT-001',
                assignedShotIds: ['shot-1'],
                reconditioning: {
                  temperature: undefined as any,
                  tolerance: undefined as any,
                  timeMin: undefined as any,
                  timeMax: undefined as any,
                },
              },
            ],
          },
        ]);
        component.seriesForm().markAsTouched();
        view.fixture.detectChanges();

        const saveButton = screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON').closest('button');
        expect(saveButton).toBeDisabled();
      });
    });
  });

  // Series management

  describe('Series management', () => {
    it('should add a new serie', async () => {
      const { component } = await runSetup();

      const initialCount = component.seriesSignal().length;
      component.addSerie();

      expect(component.seriesSignal().length).toBe(initialCount + 1);
    });

    it('should remove a serie', async () => {
      const { component } = await runSetup();

      component.seriesSignal.set([createEmptySerie('Serie 1'), createEmptySerie('Serie 2')]);
      component.removeSerie(0);

      expect(component.seriesSignal().length).toBe(1);
    });

    it('should remove the correct serie by index', async () => {
      const { component } = await runSetup();

      component.seriesSignal.set([
        createEmptySerie('Serie 1'),
        createEmptySerie('Serie 2'),
        createEmptySerie('Serie 3'),
      ]);
      component.removeSerie(1);

      const remaining = component.seriesSignal();
      expect(remaining.length).toBe(2);
      expect(remaining[0].seriesName).toBe('Serie 1');
      expect(remaining[1].seriesName).toBe('Serie 3');
    });
  });

  // Save configuration

  describe('Save configuration', () => {
    it('should call saveForm without error when form is valid', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([createValidSerie('Serie 1')]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(true);
      expect(() => component.saveForm()).not.toThrow();
    });

    it('should log an error and not save when form is invalid', async () => {
      const { component, view } = await runSetup();
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // An empty configuration (denomination='', batch='') triggers required validators
      component.seriesSignal.set([{ ...createEmptySerie('Serie 1'), configurations: [createEmptyConfiguration()] }]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      component.saveForm();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Formulario inválido');
    });
  });

  // Reset configuration

  describe('Reset configuration', () => {
    it('should restore initial series after manual modification', async () => {
      const { component } = await runSetup();
      const originalSeries = [createValidSerie('Original')];
      component.loadConfiguration(originalSeries);

      component.seriesSignal.set([createEmptySerie('Modified')]);
      expect(component.seriesSignal()[0].seriesName).toBe('Modified');

      component.resetForm();

      expect(component.seriesSignal().length).toBe(1);
      expect(component.seriesSignal()[0].seriesName).toBe('Original');
    });

    it('should reset to default single-serie configuration', async () => {
      const { component } = await runSetup();

      component.seriesSignal.set([createEmptySerie('A'), createEmptySerie('B')]);
      component.resetConfiguration();

      expect(component.seriesSignal().length).toBe(1);
      expect(component.seriesSignal()[0].seriesName).toBe('Serie 1');
    });
  });

  // Export / Import

  describe('Export/Import configuration', () => {
    it('should export the current series as a JSON string', async () => {
      const { component } = await runSetup();

      component.seriesSignal.set([createEmptySerie('Serie A'), createEmptySerie('Serie B')]);
      const json = component.exportToJSON();
      const parsed: Serie[] = JSON.parse(json);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed.length).toBe(2);
      expect(parsed[0].seriesName).toBe('Serie A');
    });

    it('should import series from a valid JSON string', async () => {
      const { component } = await runSetup();

      const testData: Serie[] = [createEmptySerie('Imported Serie')];
      component.importFromJSON(JSON.stringify(testData));

      expect(component.seriesSignal().length).toBe(1);
      expect(component.seriesSignal()[0].seriesName).toBe('Imported Serie');
    });

    it('should log an error when importing invalid JSON', async () => {
      const { component } = await runSetup();
      const consoleErrorSpy = vi.spyOn(console, 'error');

      component.importFromJSON('invalid json');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al importar configuración:', expect.any(Error));
    });
  });

  // Massive configuration dialog

  describe('Massive configuration dialog', () => {
    it('should open the dialog when the massive config button is clicked', async () => {
      const mockDialog = {
        open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
      };

      const { user } = await runSetup({ mockDialog: mockDialog as unknown as MatDialog });

      const button = screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.MASSIVE_CONFIG_BUTTON');
      await user.click(button);

      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should close dialog and reset state when dialog is closed without result', async () => {
      const mockDialog = {
        open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
      };

      const { user } = await runSetup({ mockDialog: mockDialog as unknown as MatDialog });

      const button = screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.MASSIVE_CONFIG_BUTTON');
      await user.click(button);

      // Dialog was opened and closed with null — no error
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  // validateConfiguration

  describe('validateConfiguration', () => {
    it('should return true when the form is valid', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([createValidSerie('Serie 1')]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.validateConfiguration()).toBe(true);
    });

    it('should return false when the form is invalid', async () => {
      const { component, view } = await runSetup();

      // An empty configuration (denomination='', batch='') triggers required validators
      component.seriesSignal.set([{ ...createEmptySerie('Serie 1'), configurations: [createEmptyConfiguration()] }]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.validateConfiguration()).toBe(false);
    });
  });
});

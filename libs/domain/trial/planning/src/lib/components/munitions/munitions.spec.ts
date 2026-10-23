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
import type { Serie, SeriesMunitionsData } from '../../utils-models/munitions.model';
import {
  createEmptyComponentDetail,
  createEmptyConfiguration,
  createEmptySerie,
} from '../../utils-models/munitions.model';
import { Munitions } from './munitions';
import { mapBackendToLocal, mapLocalToRequest } from './munitions.mapper';

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

function createBackendSeries(series: Serie[]): SeriesMunitionsData[] {
  return series.map((serie) => ({
    ...serie,
    configurations: serie.configurations.map((config) => ({
      ...config,
      seriesId: serie.seriesId,
      denomination: config.denomination ? { id: config.denomination, name: config.denomination } : null,
    })),
  }));
}

// Setup

const runSetup = async (options?: { mockDialog?: Partial<MatDialog>; munitions?: SeriesMunitionsData[] }) => {
  const catalogData = createMunitionsCatalogTestData();

  const mockPlanningStore = createMockPlanningGeneralDataStore({
    fireTrialId: 'trial-123',
    fireTrial: { ...createTrial(), status: 'PLANNED' },
  });

  const mockMunitionsService = createMockMunitionsService({
    munitions: options?.munitions ? { series: options.munitions } : undefined,
    componentTypes: catalogData.componentTypes,
    denominations: catalogData.denominations,
    fuseWorkingModes: catalogData.fuseWorkingModes,
  });
  if (options?.munitions) {
    mockMunitionsService.munitionsResource._setStatus('resolved');
  }

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

    it('should restore an empty initial configuration for an unsaved series after reloading saved series', async () => {
      const savedSerie = { ...createValidSerie('Serie A'), seriesId: 'series-1' };
      const { component, view } = await runSetup({ munitions: createBackendSeries([savedSerie]) });

      const unsavedSerie = component.seriesSignal().find((serie) => serie.seriesId === 'series-2');
      expect(unsavedSerie?.configurations).toHaveLength(1);
      expect(unsavedSerie?.configurations[0]).toMatchObject({
        seriesId: 'series-2',
        denomination: '',
        batch: '',
        clientNumber: '',
        components: [],
      });
      expect(component.seriesSignal()[0]?.configurations[0]?.denomination).toBe('Denom-1');
      expect(component.hasToBeDisabled()).toBe(true);

      component.resetForm();
      view.fixture.detectChanges();

      expect(component.seriesSignal().find((serie) => serie.seriesId === 'series-2')?.configurations).toHaveLength(1);
    });

    it('should preserve an explicitly empty configuration list returned for a series', async () => {
      const { component } = await runSetup({
        munitions: [{ seriesId: 'series-2', seriesName: 'Serie B', configurations: [] }],
      });

      expect(component.seriesSignal().find((serie) => serie.seriesId === 'series-2')?.configurations).toEqual([]);
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
    it('should disable saving when only an invalid unsaved series has changes', async () => {
      const savedSerie = { ...createValidSerie('Serie A'), seriesId: 'series-1' };
      const { component, view } = await runSetup({ munitions: createBackendSeries([savedSerie]) });

      component.seriesSignal.update((series) =>
        series.map((serie) =>
          serie.seriesId === 'series-2'
            ? { ...serie, configurations: serie.configurations.map((config) => ({ ...config, batch: 'LOT-002' })) }
            : serie,
        ),
      );
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(true);
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeDisabled();
    });

    it('should enable saving when an unsaved series becomes valid', async () => {
      const savedSerie = { ...createValidSerie('Serie A'), seriesId: 'series-1' };
      const { component, view } = await runSetup({ munitions: createBackendSeries([savedSerie]) });

      component.seriesSignal.update((series) =>
        series.map((serie) =>
          serie.seriesId === 'series-2' ? { ...createValidSerie('Serie B'), seriesId: serie.seriesId } : serie,
        ),
      );
      view.fixture.detectChanges();

      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeEnabled();
    });

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

    it('should disable save button when form data is unchanged', async () => {
      const { component, view } = await runSetup();

      const validSerie = createValidSerie('Serie 1');
      component.loadConfiguration([validSerie]);
      view.fixture.detectChanges();

      const saveButton = screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON').closest('button');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form is valid and changed', async () => {
      const { component, view } = await runSetup();

      component.seriesSignal.set([createValidSerie('Serie 1')]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      const saveButton = screen.getByText('TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON').closest('button');
      expect(saveButton).toBeEnabled();
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

      it('should report the form as valid when config-level reconditioning is enabled and timeMax is omitted', async () => {
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

      it('should report the form as valid when component-level reconditioning is enabled and timeMax is omitted', async () => {
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
    it.each([false, true])(
      'should discard local selections when an invalid series is returned empty: %s',
      async (returnsEmptySeries) => {
        const { component, view, mockMunitionsService } = await runSetup({ munitions: [] });
        const validSerie = { ...createValidSerie('Serie A'), seriesId: 'series-1' };
        const draftSerie: Serie = {
          seriesId: 'series-2',
          seriesName: 'Serie B',
          configurations: [
            {
              ...createEmptyConfiguration('series-2'),
              selectedComponents: ['espoleta'],
              observations: 'Pending draft',
            },
          ],
        };
        component.seriesSignal.set([validSerie, draftSerie]);
        view.fixture.detectChanges();
        component.saveForm();

        expect(mockMunitionsService.updateMunitions).toHaveBeenCalledWith('trial-123', {
          configurations: mapLocalToRequest([validSerie]),
        });

        const editedSerie = {
          ...validSerie,
          configurations: validSerie.configurations.map((config) => ({ ...config, observations: 'Edited during PUT' })),
        };
        component.seriesSignal.set([editedSerie, draftSerie]);
        mockMunitionsService.updateMunitionsResource._setStatus('resolved');
        view.fixture.detectChanges();

        expect(mockMunitionsService.munitionsResource.reload).toHaveBeenCalledOnce();
        mockMunitionsService.munitionsResource._setStatus('reloading');
        view.fixture.detectChanges();
        expect(structuredClone(component.seriesSignal())).toEqual(structuredClone([editedSerie, draftSerie]));

        const savedSeries = createBackendSeries([validSerie]);
        if (returnsEmptySeries) {
          savedSeries.push({ seriesId: 'series-2', seriesName: 'Serie B', configurations: [] });
        }
        mockMunitionsService.munitionsResource._setValue({ series: savedSeries });
        mockMunitionsService.munitionsResource._setStatus('resolved');
        view.fixture.detectChanges();

        expect(component.seriesSignal()[1]?.configurations).toHaveLength(returnsEmptySeries ? 0 : 1);
        expect(
          component.seriesSignal()[1]?.configurations.map((configuration) => ({
            selectedComponents: configuration.selectedComponents,
            observations: configuration.observations,
          })),
        ).toEqual(returnsEmptySeries ? [] : [{ selectedComponents: [], observations: '' }]);
        expect(component.seriesSignal()[0]?.configurations[0]?.observations).toBe('');
        expect(component.isFormValid()).toBe(true);
        expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeDisabled();
        component.resetForm();
        view.fixture.detectChanges();

        expect(component.seriesSignal()[0]?.configurations[0]?.id).toBe(validSerie.configurations[0]?.id);
        expect(component.seriesSignal()[0]?.configurations[0]?.observations).toBe('');
        expect(component.seriesSignal()[1]?.configurations).toHaveLength(returnsEmptySeries ? 0 : 1);
        if (!returnsEmptySeries) {
          expect(component.seriesSignal()[1]?.configurations[0]).toMatchObject({
            seriesId: 'series-2',
            denomination: '',
            observations: '',
          });
        }
        expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeDisabled();
      },
    );

    it.each([
      { maxAllowedErrors: 0, clientNumber: '1,' },
      { maxAllowedErrors: 0, clientNumber: '1,2' },
      { maxAllowedErrors: 0, clientNumber: '', denomination: { id: '', name: '' } },
    ])('should block a series without a main denomination or valid selected components: %j', async (invalidFields) => {
      const { component, view, mockMunitionsService } = await runSetup();
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const serie = createValidSerie('Serie 1');
      serie.configurations[0].selectedComponents = ['espoleta'];
      serie.configurations[0].components = [
        { ...createEmptyComponentDetail('espoleta'), denomination: { id: 'denom-1', name: 'Espoleta' } },
      ];
      component.loadConfiguration([serie]);
      component.seriesSignal.update((series) =>
        series.map((current) => ({
          ...current,
          configurations: current.configurations.map((config) => ({
            ...config,
            denomination: '',
            components: config.components.map((detail) => ({ ...detail, ...invalidFields })),
          })),
        })),
      );
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(false);
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeDisabled();

      component.saveForm();

      expect(mockMunitionsService.updateMunitions).not.toHaveBeenCalled();
    });

    it.each([
      { maxAllowedErrors: -1, clientNumber: '', componentDenomination: 'denom-1' },
      { maxAllowedErrors: 100, clientNumber: '', componentDenomination: 'denom-1' },
      { maxAllowedErrors: 0, clientNumber: '1,', componentDenomination: 'denom-1' },
      { maxAllowedErrors: 0, clientNumber: '1,2', componentDenomination: 'denom-1' },
      { maxAllowedErrors: 0, clientNumber: '', componentDenomination: '' },
    ])('should preserve original validation when the main denomination is filled: %j', async (fields) => {
      const { component, view, mockMunitionsService } = await runSetup();
      const serie = createValidSerie('Serie 1');
      const updatedSeries = [
        {
          ...serie,
          configurations: serie.configurations.map((config) => ({
            ...config,
            maxAllowedErrors: fields.maxAllowedErrors,
            selectedComponents: ['espoleta'],
            components: [
              {
                ...createEmptyComponentDetail('espoleta'),
                maxAllowedErrors: fields.maxAllowedErrors,
                clientNumber: fields.clientNumber,
                denomination: { id: fields.componentDenomination, name: 'Espoleta' },
              },
            ],
          })),
        },
      ];
      component.loadConfiguration([serie]);
      component.seriesSignal.set(updatedSeries);
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(true);
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeEnabled();

      component.saveForm();

      expect(mockMunitionsService.updateMunitions).toHaveBeenCalledWith('trial-123', {
        configurations: mapLocalToRequest(updatedSeries),
      });
    });

    it('should keep save disabled when every series is invalid', async () => {
      const { component, view, mockMunitionsService } = await runSetup();
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      component.seriesSignal.set([
        { ...createEmptySerie('Serie 1'), configurations: [createEmptyConfiguration()] },
        { ...createEmptySerie('Serie 2'), configurations: [createEmptyConfiguration()] },
      ]);
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(false);
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeDisabled();

      component.saveForm();

      expect(mockMunitionsService.updateMunitions).not.toHaveBeenCalled();
    });

    it.each(['empty', 'partial'])('should save only valid new series alongside an %s configuration', async (state) => {
      const { component, view, mockMunitionsService } = await runSetup();
      const validSerie = createValidSerie('Serie 1');
      const invalidSerie: Serie = {
        ...createEmptySerie('Serie 2'),
        configurations: [{ ...createEmptyConfiguration(), denomination: state === 'partial' ? 'Denom-2' : '' }],
      };
      component.seriesSignal.set([validSerie, invalidSerie]);
      view.fixture.detectChanges();

      expect(component.seriesForm().valid()).toBe(false);
      expect(component.isFormValid()).toBe(true);
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeEnabled();

      component.saveForm();

      expect(mockMunitionsService.updateMunitions).toHaveBeenCalledWith('trial-123', {
        configurations: mapLocalToRequest([validSerie]),
      });
    });

    it('should exclude an entire new series when one of its configurations is invalid', async () => {
      const { component, view, mockMunitionsService } = await runSetup();
      const validSerie = createValidSerie('Serie 1');
      const invalidSerie = createValidSerie('Serie 2');
      invalidSerie.configurations.push(createEmptyConfiguration());
      component.seriesSignal.set([validSerie, invalidSerie]);
      view.fixture.detectChanges();

      component.saveForm();

      expect(mockMunitionsService.updateMunitions).toHaveBeenCalledWith('trial-123', {
        configurations: mapLocalToRequest([validSerie]),
      });
    });

    it('should save only valid loaded series and send all series once every series is valid', async () => {
      const loadedSeries = [
        { ...createValidSerie('Serie A'), seriesId: 'series-1' },
        { ...createValidSerie('Serie B'), seriesId: 'series-2' },
      ];
      const { component, view, mockMunitionsService } = await runSetup({
        munitions: createBackendSeries(loadedSeries),
      });

      component.seriesSignal.update((series) =>
        series.map((serie, index) =>
          index === 0
            ? { ...serie, configurations: serie.configurations.map((config) => ({ ...config, denomination: '' })) }
            : {
                ...serie,
                configurations: serie.configurations.map((config) => ({ ...config, observations: 'Updated' })),
              },
        ),
      );
      view.fixture.detectChanges();

      expect(component.seriesForm().valid()).toBe(false);
      expect(component.isFormValid()).toBe(true);
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeEnabled();

      component.saveForm();

      expect(mockMunitionsService.updateMunitions).toHaveBeenCalledWith('trial-123', {
        configurations: mapLocalToRequest(component.seriesSignal().filter((serie) => serie.seriesId === 'series-2')),
      });

      component.seriesSignal.set(
        loadedSeries.map((serie) => ({
          ...serie,
          configurations: serie.configurations.map((config) => ({ ...config, observations: 'Updated' })),
        })),
      );
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(true);
      expect(screen.getByRole('button', { name: 'TRIAL_PLANNING.MUNITIONS.HEADER.SAVE_BUTTON' })).toBeEnabled();

      component.saveForm();

      expect(mockMunitionsService.updateMunitions).toHaveBeenLastCalledWith('trial-123', {
        configurations: mapLocalToRequest(component.seriesSignal()),
      });
    });

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

    it('should include clientNumber when saving valid form', async () => {
      const { component, view, mockMunitionsService } = await runSetup();

      const serie = createValidSerie('Serie 1');
      serie.configurations[0].clientNumber = '101,102';
      serie.configurations[0].assignedShotIds = ['shot-1', 'shot-2'];
      component.seriesSignal.set([serie]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      component.saveForm();

      expect(mockMunitionsService.updateMunitions).toHaveBeenCalledWith(
        'trial-123',
        expect.objectContaining({
          configurations: [
            expect.objectContaining({
              clientNumber: '101,102',
            }),
          ],
        }),
      );
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

  // ClientNumber validation and mapping

  describe('ClientNumber validation and mapping', () => {
    it('should mark form invalid when configuration clientNumber has trailing comma', async () => {
      const { component, view } = await runSetup();

      const serie = createValidSerie('Serie 1');
      serie.configurations[0].clientNumber = '1,';
      component.seriesSignal.set([serie]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(false);
    });

    it('should mark form invalid when configuration clientNumber exceeds assigned shots count', async () => {
      const { component, view } = await runSetup();

      const serie = createValidSerie('Serie 1');
      serie.configurations[0].assignedShotIds = ['shot-1'];
      serie.configurations[0].clientNumber = '1,2';
      component.seriesSignal.set([serie]);
      component.seriesForm().markAsTouched();
      view.fixture.detectChanges();

      expect(component.isFormValid()).toBe(false);
    });

    it('should map clientNumber correctly between backend and local', () => {
      const backendData = [
        {
          seriesId: 'ser-1',
          seriesName: 'Serie 1',
          configurations: [
            {
              id: 'cfg-1',
              seriesId: 'ser-1',
              denomination: { id: 'd-1', name: 'Denom 1' },
              batch: 'LOT-1',
              clientNumber: 42,
              components: [],
              assignedShotIds: ['shot-1'],
            },
          ],
        },
      ];

      const local = mapBackendToLocal(backendData as any, [], [], []);
      expect(local[0].configurations[0].clientNumber).toBe('42');

      const request = mapLocalToRequest(local);
      expect(request[0].clientNumber).toBe('42');
    });

    it('should map loading zone values and supplement quantity according to component type', () => {
      const backendSeries: SeriesMunitionsData[] = [
        {
          seriesId: 'series-1',
          seriesName: 'Serie 1',
          configurations: [
            {
              id: 'configuration-1',
              seriesId: 'series-1',
              denomination: null,
              components: [
                {
                  id: 'charge-1',
                  type: { id: 'type-charge', type: 'PROPELLANT_CHARGE', label: 'Carga de proyección' },
                  denomination: { id: 'denomination-charge', name: 'Charge' },
                  loadingZoneValue: '3G',
                },
                {
                  id: 'supplement-1',
                  type: { id: 'type-supplement', type: 'SUPPLEMENT', label: 'Suplemento' },
                  denomination: { id: 'denomination-supplement', name: 'Supplement' },
                  quantity: 2,
                },
                {
                  id: 'fuse-1',
                  type: { id: 'type-fuse', type: 'FUZE', label: 'Espoleta' },
                  denomination: { id: 'denomination-fuse', name: 'Fuse' },
                  quantity: 4,
                },
              ],
            },
          ],
        },
      ];

      const local = mapBackendToLocal(backendSeries, [], [], []);
      const localComponents = local[0]?.configurations[0]?.components ?? [];

      expect(localComponents[0]?.loadingZoneValue).toBe('3G');
      expect(localComponents[1]?.quantity).toBe(2);
      expect(localComponents[2]?.quantity).toBeUndefined();

      const requestComponents = mapLocalToRequest(local)[0]?.components ?? [];
      expect(requestComponents[0]).toHaveProperty('loadingZoneValue', '3G');
      expect(requestComponents[0]).not.toHaveProperty('quantity');
      expect(requestComponents[1]).toHaveProperty('quantity', 2);
      expect(requestComponents[2]).not.toHaveProperty('quantity');
    });
  });
});

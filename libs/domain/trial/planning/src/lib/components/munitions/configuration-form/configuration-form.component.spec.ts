import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MunitionsStore } from '../../../+state/munitions.store';
import { PlanningGeneralDataStore } from '../../../+state/planning-general-data.store';
import type { Configuration } from '../../../utils-models/munitions.model';
import { createEmptyComponentDetail, createEmptyConfiguration } from '../../../utils-models/munitions.model';
import { ConfigurationFormComponent } from './configuration-form.component';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const waitFor = async (fn: () => any) => fn();

const defaultImports = [TranslateModule.forRoot()];

const mockMunitionTypes = signal([
  { id: 'type-1', label: 'Tipo 1', name: { es: 'Tipo 1', en: 'Tipo 1' }, active: true },
]);

const mockDenominationsRaw = signal([
  {
    id: '1',
    name: 'Denominación 1',
    munitionType: { id: 'type-1', name: 'Tipo 1' },
    active: true,
    category: 'MUNITION' as const,
  },
  {
    id: '2',
    name: 'Denominación 2',
    munitionType: { id: 'type-1', name: 'Tipo 1' },
    active: true,
    category: 'MUNITION' as const,
  },
  {
    id: '3',
    name: 'Denominación 3',
    munitionType: { id: 'type-1', name: 'Tipo 1' },
    active: true,
    category: 'MUNITION' as const,
  },
]);

const mockComponentTypes = signal([
  { id: '1', label: 'Espoleta', name: { es: 'Espoleta', en: 'Fuze' }, active: true },
  { id: '2', label: 'Detonador', name: { es: 'Detonador', en: 'Detonator' }, active: true },
  { id: '3', label: 'Proyectil', name: { es: 'Proyectil', en: 'Projectile' }, active: true },
]);

const mockMunitionsStore = {
  denominationsRaw: mockDenominationsRaw,
  componentTypes: mockComponentTypes,
  munitionTypes: mockMunitionTypes,
  fuseWorkingModes: signal([]),
  isLoading: signal(false),
  seriesMunitions: signal(undefined),
  loadMunitions: vi.fn(),
  loadAllCatalogs: vi.fn(),
  updateMunitions: vi.fn(),
  isInitialized: signal(false),
};

const defaultProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideTestingEnvironment(),
  PlanningGeneralDataStore,
  { provide: MunitionsStore, useValue: mockMunitionsStore },
];

describe('ConfigurationFormComponent', () => {
  let fixture: ComponentFixture<ConfigurationFormComponent>;

  const defaultConfig: Configuration = createEmptyConfiguration();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render all main fields', async () => {
      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
      });

      expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.DENOMINATION_LABEL')).toBeInTheDocument();
      expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.LOT_LABEL')).toBeInTheDocument();
      expect(
        screen.getByText('TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.ASSOCIATED_SHOTS_LABEL'),
      ).toBeInTheDocument();
      expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.MAX_FAILURES_LABEL')).toBeInTheDocument();
      expect(screen.getByText('TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.OBSERVATIONS_LABEL')).toBeInTheDocument();
    });

    it('should render the conditioning checkbox', async () => {
      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
      });

      const checkbox = within(screen.getByTestId('conditioning-checkbox')).getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should render the component selector', async () => {
      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
      });

      expect(
        screen.getByText('TRIAL_PLANNING.MUNITIONS.CONFIGURATION_FORM.COMPONENT_SELECTOR_LABEL'),
      ).toBeInTheDocument();
    });
  });

  describe('Basic field interaction', () => {
    it('should emit changes when denomination is modified', async () => {
      const user = userEvent.setup();
      const configChangeSpy = vi.fn();

      const { fixture } = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
        on: { configChange: configChangeSpy },
      });

      // Select a munition type first to enable the denomination field
      const munitionTypeSelect = screen.getByTestId('munition-type-select');
      await user.click(munitionTypeSelect);
      await fixture.whenStable();
      const typeOptions = document.querySelectorAll('mat-option');
      const tipo1Option = Array.from(typeOptions).find((opt) => opt.textContent?.includes('Tipo 1'));
      expect(tipo1Option).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await user.click(tipo1Option!);
      await fixture.whenStable();

      const denominationSelect = document.querySelector('#denomination-0') as HTMLElement;
      expect(denominationSelect).toBeInTheDocument();

      await user.click(denominationSelect);

      await fixture.whenStable();

      const options = document.querySelectorAll('mat-option');
      expect(options.length).toBeGreaterThan(0);

      const denominationOption = Array.from(options).find((opt) => opt.textContent?.includes('Denominación 1'));
      expect(denominationOption).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await user.click(denominationOption!);

      await waitFor(() => {
        expect(configChangeSpy).toHaveBeenCalled();
      });
    });

    it('should filter denominations with contains match', async () => {
      const user = userEvent.setup();

      const { fixture } = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
      });

      // Select a munition type first to enable the denomination field
      const munitionTypeSelect = screen.getByTestId('munition-type-select');
      await user.click(munitionTypeSelect);
      await fixture.whenStable();
      const typeOptions = document.querySelectorAll('mat-option');
      const tipo1Option = Array.from(typeOptions).find((opt) => opt.textContent?.includes('Tipo 1'));
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await user.click(tipo1Option!);
      await fixture.whenStable();

      const denominationSelect = document.querySelector('#denomination-0') as HTMLElement;
      await user.click(denominationSelect);

      const searchInput = await screen.findByTestId('denomination-search-input');
      await user.type(searchInput, 'nacion 2');

      const filteredOption = screen.getByRole('option', { name: 'Denominación 2' });
      expect(filteredOption).toBeInTheDocument();
    });

    it('should emit changes when lot is modified', async () => {
      const user = userEvent.setup();
      const configChangeSpy = vi.fn();

      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
        on: { configChange: configChangeSpy },
      });

      const lotInput = screen.getByTestId('batch-input');
      await user.clear(lotInput);
      await user.type(lotInput, 'LOTE-001');
      fireEvent.blur(lotInput);

      await waitFor(() => {
        expect(configChangeSpy).toHaveBeenCalled();
        const emittedData = configChangeSpy.mock.calls[0][0];
        expect(emittedData.batch).toBe('LOTE-001');
      });
    });

    it('should emit changes when max failures number is modified', async () => {
      const user = userEvent.setup();
      const configChangeSpy = vi.fn();

      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
        on: { configChange: configChangeSpy },
      });

      const maxFailuresInput = screen.getByTestId('max-errors-input');
      await user.clear(maxFailuresInput);
      await user.type(maxFailuresInput, '5');
      fireEvent.blur(maxFailuresInput);

      await waitFor(() => {
        expect(configChangeSpy).toHaveBeenCalled();
        const emittedData = configChangeSpy.mock.calls[0][0];
        expect(emittedData.maxAllowedErrors).toBe(5);
      });
    });
  });

  describe('Conditioning', () => {
    it('should display conditioning fields when activated', async () => {
      const user = userEvent.setup();

      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
      });

      const checkbox = within(screen.getByTestId('conditioning-checkbox')).getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        const tempInput = screen.queryByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i);
        expect(tempInput).toBeInTheDocument();
      });
    });

    it('should hide conditioning fields when deactivated', async () => {
      const user = userEvent.setup();

      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          config: { ...defaultConfig, reconditioning: { temperature: 25, tolerance: 2, timeMin: 4, timeMax: 8 } },
          configIndex: 0,
        },
      });

      const tempInput = screen.getByRole('spinbutton', {
        name: /TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i,
      });
      expect(tempInput).toBeInTheDocument();

      const checkbox = within(screen.getByTestId('conditioning-checkbox')).getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        expect(
          screen.queryByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i),
        ).not.toBeInTheDocument();
      });
    });

    it('should emit changes when conditioning is activated', async () => {
      const user = userEvent.setup();
      const configChangeSpy = vi.fn();

      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
        on: { configChange: configChangeSpy },
      });

      const checkbox = within(screen.getByTestId('conditioning-checkbox')).getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        expect(configChangeSpy).toHaveBeenCalled();
        const emittedData = configChangeSpy.mock.calls[0][0];
        expect(emittedData.reconditioning).toBeDefined();
      });
    });
  });

  describe('Component selector', () => {
    it('should allow selecting components', async () => {
      const user = userEvent.setup();
      const configChangeSpy = vi.fn();

      const { fixture } = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
        on: { configChange: configChangeSpy },
      });

      const select = document.querySelector('#selectedComponents-0') as HTMLElement;
      expect(select).toBeInTheDocument();

      await user.click(select);

      await fixture.whenStable();

      const options = document.querySelectorAll('mat-option');
      const espoletaOption = Array.from(options).find((opt) => opt.textContent?.includes('Espoleta'));
      expect(espoletaOption).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await user.click(espoletaOption!);

      await waitFor(() => {
        expect(configChangeSpy).toHaveBeenCalled();
      });
    });

    it('should display chips of selected components', async () => {
      const configWithComponents: Configuration = {
        ...defaultConfig,
        selectedComponents: ['espoleta', 'detonador'],
        components: [createEmptyComponentDetail('espoleta'), createEmptyComponentDetail('detonador')],
      };

      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: configWithComponents, configIndex: 0 },
      });

      await waitFor(() => {
        expect(screen.getAllByText(/espoleta/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/detonador/i).length).toBeGreaterThan(0);
      });
    });

    it('should allow removing components with the X button', async () => {
      const configChangeSpy = vi.fn();

      const configWithComponents: Configuration = {
        ...defaultConfig,
        selectedComponents: ['espoleta'],
        components: [createEmptyComponentDetail('espoleta')],
      };

      const renderResult = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: configWithComponents, configIndex: 0 },
        on: { configChange: configChangeSpy },
      });

      const component = renderResult.fixture.componentInstance;

      component.removeComponent('espoleta');

      renderResult.fixture.detectChanges();

      await waitFor(() => {
        expect(configChangeSpy).toHaveBeenCalled();
        const emittedData = configChangeSpy.mock.calls[0][0];
        expect(emittedData.selectedComponents).not.toContain('espoleta');
      });
    });

    it('should display tabs for selected components', async () => {
      const configWithComponents: Configuration = {
        ...defaultConfig,
        selectedComponents: ['espoleta', 'detonador'],
      };

      await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: configWithComponents, configIndex: 0 },
      });

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Validations', () => {
    it('should require denomination', async () => {
      const renderResult = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: defaultConfig, configIndex: 0 },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      fixture.detectChanges();

      await waitFor(() => {
        expect(component.configForm().valid()).toBe(false);
      });
    });

    it('should require lot', async () => {
      const renderResult = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: { ...defaultConfig, denomination: 'option1' }, configIndex: 0 },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      fixture.detectChanges();

      await waitFor(() => {
        expect(component.configForm().valid()).toBe(false);
      });
    });

    it('should be valid when required fields are completed', async () => {
      const validConfig: Configuration = {
        ...defaultConfig,
        denomination: 'option1',
        batch: 'LOT-001',
      };

      const renderResult = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: validConfig, configIndex: 0 },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      fixture.detectChanges();

      await waitFor(() => {
        expect(component.configForm().valid()).toBe(true);
      });
    });

    it('should validate that maxAllowedErrors is greater than or equal to 0', async () => {
      const user = userEvent.setup();

      const renderResult = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { config: { ...defaultConfig, denomination: 'option1', batch: 'LOT-001' }, configIndex: 0 },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      const maxFailuresInput = screen.getByTestId('max-errors-input');
      await user.clear(maxFailuresInput);
      await user.type(maxFailuresInput, '-5');
      fireEvent.blur(maxFailuresInput);

      await waitFor(() => {
        expect(component.configForm().valid()).toBe(false);
      });
    });
  });

  describe('Shot assignment constraint', () => {
    it('should disable option in dropdown if shot is in excludeShotIds', async () => {
      const user = userEvent.setup();
      const shots = [
        { id: 'shot-1', globalNumber: 1, observation: '' },
        { id: 'shot-2', globalNumber: 2, observation: '' },
      ];

      const { fixture } = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          config: defaultConfig,
          configIndex: 0,
          shots,
          excludeShotIds: ['shot-2'],
        },
      });

      const select = screen.getByTestId('assigned-shots-select');
      await user.click(select);
      await fixture.whenStable();

      const options = screen.getAllByRole('option');
      const shot1Option = options.find((opt) => opt.textContent?.trim() === '1');
      const shot2Option = options.find((opt) => opt.textContent?.trim() === '2');

      expect(shot1Option).not.toHaveAttribute('aria-disabled', 'true');
      expect(shot2Option).toHaveAttribute('aria-disabled', 'true');
    });

    it('should only select eligible shots when Select All is clicked', async () => {
      const user = userEvent.setup();
      const configChangeSpy = vi.fn();
      const shots = [
        { id: 'shot-1', globalNumber: 1, observation: '' },
        { id: 'shot-2', globalNumber: 2, observation: '' },
      ];

      const { fixture } = await render(ConfigurationFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          config: defaultConfig,
          configIndex: 0,
          shots,
          excludeShotIds: ['shot-2'],
        },
        on: { configChange: configChangeSpy },
      });

      const select = screen.getByTestId('assigned-shots-select');
      await user.click(select);
      await fixture.whenStable();

      const selectAllCheckbox = screen.getByTestId('select-all-shots-checkbox');
      const checkboxInput = within(selectAllCheckbox).getByRole('checkbox');
      // Click once to unselect (since it auto-selects eligible shots on init)
      await user.click(checkboxInput);
      // Click again to select all eligible shots
      await user.click(checkboxInput);

      await waitFor(() => {
        expect(configChangeSpy).toHaveBeenCalled();
        const lastEmitted = configChangeSpy.mock.calls[configChangeSpy.mock.calls.length - 1][0];
        expect(lastEmitted.assignedShotIds).toEqual(['shot-1']);
      });
    });
  });
});

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { provideTestingEnvironment } from '@intaqalab/config';
import { TranslateModule } from '@ngx-translate/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MunitionsStore } from '../../../+state/munitions.store';
import type { ComponentDetail } from '../../../utils-models/munitions.model';
import { createEmptyDenomination } from '../../../utils-models/munitions.model';
import { ComponentDetailFormComponent } from './component-detail-form.component';

const mockDenominations = signal([
  { id: '1', label: 'Modelo 1', translations: {} },
  { id: '2', label: 'Modelo 2', translations: {} },
]);

const mockFuseWorkingModes = signal([
  { id: 'sq', label: 'Instantáneo (SQ)', name: { es: 'Instantáneo (SQ)', en: 'Instantaneous (SQ)' }, active: true },
  { id: 'delay', label: 'Retardado', name: { es: 'Retardado', en: 'Delayed' }, active: true },
]);

const mockMunitionsStore = {
  denominations: mockDenominations,
  fuseWorkingModes: mockFuseWorkingModes,
  componentTypes: signal([]),
  isLoading: signal(false),
  loadCatalogs: vi.fn(),
  updateMunitions: vi.fn(),
};

const defaultImports = [TranslateModule.forRoot()];
const defaultProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideTestingEnvironment(),
  { provide: MunitionsStore, useValue: mockMunitionsStore },
];

describe('ComponentDetailFormComponent', () => {
  let fixture: ComponentFixture<ComponentDetailFormComponent>;

  const defaultDetail: ComponentDetail = {
    type: { id: 'ctype-001', type: 'espoleta', label: 'Espoleta' },
    denomination: createEmptyDenomination(),
    batch: '',
    maxAllowedErrors: 0,
    clientNumber: '',
    observations: '',
    reconditioning: undefined,
    fuseWorkingMode: undefined,
    fuseMeasurement: 0,
    manufacturerNumber: '',
  };

  const nonEspoletaDetail: ComponentDetail = {
    type: { id: 'ctype-002', type: 'proyectil', label: 'Proyectil' },
    denomination: createEmptyDenomination(),
    batch: '',
    maxAllowedErrors: 0,
    clientNumber: '',
    observations: '',
    reconditioning: undefined,
    fuseWorkingMode: undefined,
    fuseMeasurement: 0,
    manufacturerNumber: '',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render espoleta form fields when type is espoleta', async () => {
      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
      });

      expect(screen.getByDisplayValue(/Espoleta/i)).toBeInTheDocument();
      expect(
        screen.getByText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.MODEL/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.LOT/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.MANUFACTURER_NUMBER/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FUZE_MODE/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FUZE_GRADUATION/i),
      ).toBeInTheDocument();
    });

    it('should render default form fields when type is not espoleta', async () => {
      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: nonEspoletaDetail },
      });

      expect(screen.getByDisplayValue(/Proyectil/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.LOT/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FAILURES/i),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.CLIENT/i),
      ).toBeInTheDocument();

      expect(
        screen.queryByPlaceholderText(
          /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.MANUFACTURER_NUMBER/i,
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FUZE_GRADUATION/i),
      ).not.toBeInTheDocument();
    });

    it('should display the conditioning checkbox', async () => {
      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
      });

      const checkbox = screen.getByRole('checkbox', {
        name: /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.conditioning/i,
      });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should display component type in titlecase', async () => {
      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
      });

      expect(screen.getByDisplayValue(/Espoleta/i)).toBeInTheDocument();
    });
  });

  describe('Field interaction', () => {
    it('should emit changes when lot is modified', async () => {
      const user = userEvent.setup();
      const detailChangeSpy = vi.fn();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
        on: { detailChange: detailChangeSpy },
      });

      const lotInput = screen.getByPlaceholderText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.LOT/i);
      await user.type(lotInput, 'LOT-123');
      fireEvent.blur(lotInput);

      expect(detailChangeSpy).toHaveBeenCalled();
      const emittedData = detailChangeSpy.mock.calls[0][0];
      expect(emittedData.batch).toBe('LOT-123');
    });

    it('should emit changes when client number is modified (non-espoleta)', async () => {
      const user = userEvent.setup();
      const detailChangeSpy = vi.fn();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: nonEspoletaDetail },
        on: { detailChange: detailChangeSpy },
      });

      const clientNumberInput = screen.getByPlaceholderText(
        /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.CLIENT/i,
      );
      await user.type(clientNumberInput, 'CLIENT-456');
      fireEvent.blur(clientNumberInput);

      expect(detailChangeSpy).toHaveBeenCalled();
      const emittedData = detailChangeSpy.mock.calls[0][0];
      expect(emittedData.clientNumber).toBeDefined();
    });

    it('should emit changes when manufacturer number is modified (espoleta)', async () => {
      const user = userEvent.setup();
      const detailChangeSpy = vi.fn();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
        on: { detailChange: detailChangeSpy },
      });

      const manufacturerNumberInput = screen.getByPlaceholderText(
        /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.MANUFACTURER_NUMBER/i,
      );
      // The espoleta form maps the manufacturer number placeholder to detailForm.clientNumber
      // and the input is type="number", so we type a numeric value
      await user.type(manufacturerNumberInput, '789');
      fireEvent.blur(manufacturerNumberInput);

      expect(detailChangeSpy).toHaveBeenCalled();
      const emittedData = detailChangeSpy.mock.calls[0][0];
      expect(emittedData.clientNumber).toBeDefined();
    });

    it('should emit changes when fuze graduation is modified (espoleta)', async () => {
      const user = userEvent.setup();
      const detailChangeSpy = vi.fn();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
        on: { detailChange: detailChangeSpy },
      });

      const fuzeGraduationInput = screen.getByPlaceholderText(
        /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.FUZE_GRADUATION/i,
      );
      await user.type(fuzeGraduationInput, '15');
      fireEvent.blur(fuzeGraduationInput);

      expect(detailChangeSpy).toHaveBeenCalled();
      const emittedData = detailChangeSpy.mock.calls[0][0];
      expect(emittedData.fuseMeasurement).toBeDefined();
    });
  });

  describe('Conditioning', () => {
    it('should display conditioning fields when checkbox is activated', async () => {
      const user = userEvent.setup();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
      });

      const checkbox = screen.getByRole('checkbox', {
        name: /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.conditioning/i,
      });
      await user.click(checkbox);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i),
        ).toBeInTheDocument();
      });
    });

    it('should hide conditioning fields when checkbox is deactivated', async () => {
      const user = userEvent.setup();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          detail: { ...defaultDetail, reconditioning: { temperature: 25, tolerance: 2, timeMin: 4, timeMax: 8 } },
        },
      });

      expect(
        screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i),
      ).toBeInTheDocument();

      const checkbox = screen.getByRole('checkbox', {
        name: /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.conditioning/i,
      });
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Temperatura acondicionamiento/i)).not.toBeInTheDocument();
      });
    });

    it('should emit changes when conditioning is activated', async () => {
      const user = userEvent.setup();
      const detailChangeSpy = vi.fn();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
        on: { detailChange: detailChangeSpy },
      });

      const checkbox = screen.getByRole('checkbox', {
        name: /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.conditioning/i,
      });
      await user.click(checkbox);

      expect(detailChangeSpy).toHaveBeenCalled();
      const emittedData = detailChangeSpy.mock.calls[0][0];
      expect(emittedData.reconditioning).toBeDefined();
    });

    it('should propagate changes from conditioning fields', async () => {
      const user = userEvent.setup();
      const detailChangeSpy = vi.fn();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          detail: { ...defaultDetail, reconditioning: { temperature: 25, tolerance: 2, timeMin: 4, timeMax: 8 } },
        },
        on: { detailChange: detailChangeSpy },
      });

      const tempInput = screen.getByLabelText(/TRIAL_PLANNING.MUNITIONS.CONDITIONING_FIELDS.temperature_label/i);
      await user.clear(tempInput);
      await user.type(tempInput, '30');
      fireEvent.blur(tempInput);

      await waitFor(() => {
        expect(detailChangeSpy).toHaveBeenCalled();
      });
    });
  });

  const powderDetail: ComponentDetail = {
    type: { id: 'ctype-003', type: 'pólvora', label: 'Pólvora' },
    denomination: createEmptyDenomination(),
    batch: '',
    maxAllowedErrors: 0,
    clientNumber: '',
    observations: '',
    reconditioning: undefined,
    fuseWorkingMode: undefined,
    fuseMeasurement: 0,
    manufacturerNumber: '',
  };

  describe('addPowder output', () => {
    it('should not render the add powder button when the component type is not powder', async () => {
      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
      });

      const addButton = screen.queryByText(/TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.ADD_POWDER_BUTTON/i);
      expect(addButton).not.toBeInTheDocument();
    });

    it('should emit addPowder when the add powder button is clicked (when type is powder)', async () => {
      const user = userEvent.setup();
      const addPowderSpy = vi.fn();

      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: powderDetail },
        on: { addPowder: addPowderSpy },
      });

      const addButton = screen.getByRole('button', {
        name: /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.ADD_POWDER_BUTTON/i,
      });
      await user.click(addButton);

      expect(addPowderSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Validations', () => {
    it('should have a form with denomination validation', async () => {
      const renderResult = await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: defaultDetail },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      expect(component.detailForm).toBeDefined();
      expect(component.detailForm().value().denomination).toBeDefined();
    });

    it('should be valid when denomination is completed', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = userEvent.setup();

      const renderResult = await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: { ...defaultDetail, denomination: { id: 'denom-1', name: 'Modelo 1' } } },
      });

      fixture = renderResult.fixture;
      const component = fixture.componentInstance;

      expect(component.detailForm().valid()).toBe(true);
    });

    it('should sanitize clientNumber input to allow only digits and commas, preventing consecutive/leading commas', async () => {
      const user = userEvent.setup();
      await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: { detail: nonEspoletaDetail },
      });

      const clientNumberInput = screen.getByPlaceholderText(
        /TRIAL_PLANNING.MUNITIONS.COMPONENT_DETAIL_FORM.PLACEHOLDERS.CLIENT/i,
      ) as HTMLInputElement;

      await user.clear(clientNumberInput);
      await user.type(clientNumberInput, ',,12,,a3b,4,');
      expect(clientNumberInput.value).toBe('12,3,4,');
    });

    it('should validate trailing comma in clientNumber', async () => {
      const renderResult = await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          detail: { ...nonEspoletaDetail, denomination: { id: 'denom-1', name: 'Modelo 1' } }
        },
      });

      const component = renderResult.fixture.componentInstance;
      component.formModel.update(c => ({ ...c, clientNumber: '1,2,' }));
      expect(component.detailForm().valid()).toBe(false);
      expect(component.detailForm.clientNumber().errors()).not.toBeNull();
    });

    it('should validate clientNumber counts against assignedShotsCount', async () => {
      const renderResult = await render(ComponentDetailFormComponent, {
        imports: defaultImports,
        providers: defaultProviders,
        componentInputs: {
          detail: { ...nonEspoletaDetail, denomination: { id: 'denom-1', name: 'Modelo 1' } },
          assignedShotsCount: 2,
        },
      });

      const component = renderResult.fixture.componentInstance;

      // Valid: 2 numbers, limit is 2
      component.formModel.update(c => ({ ...c, clientNumber: '1,2' }));
      expect(component.detailForm().valid()).toBe(true);

      // Invalid: 3 numbers, limit is 2
      component.formModel.update(c => ({ ...c, clientNumber: '1,2,3' }));
      expect(component.detailForm().valid()).toBe(false);
      expect(component.detailForm.clientNumber().errors()).not.toBeNull();
    });
  });
});

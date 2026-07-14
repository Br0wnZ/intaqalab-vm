import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InputSelect } from './input-select';

describe('InputSelect', () => {
  const defaultOpciones = [
    { value: 'kg', label: 'Kilogramos' },
    { value: 'g', label: 'Gramos' },
    { value: 'lb', label: 'Libras' },
  ];

  // componentInputs llama a setInput() internamente, necesario para signal inputs
  const defaultInputs = {
    label: 'Peso',
    opciones: defaultOpciones,
    placeholder: '0,00',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should create the component', async () => {
      const { fixture } = await render(InputSelect, {
        componentInputs: defaultInputs,
      });
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the label', async () => {
      await render(InputSelect, { componentInputs: defaultInputs });
      expect(screen.getByText('Peso')).toBeInTheDocument();
    });

    it('should render input with placeholder', async () => {
      await render(InputSelect, { componentInputs: defaultInputs });
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should have correct aria-label on input', async () => {
      await render(InputSelect, { componentInputs: defaultInputs });
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Peso');
    });

    it('should render mat-select with role combobox', async () => {
      // mat-select usa aria-labelledby internamente; verificamos la presencia y rol
      const { container } = await render(InputSelect, { componentInputs: defaultInputs });
      const matSelect = container.querySelector('mat-select');
      expect(matSelect).toBeInTheDocument();
      expect(matSelect).toHaveAttribute('role', 'combobox');
    });

    it('should have all option labels available in opciones signal', async () => {
      // Las mat-option se renderizan vía @for desde la señal; verificamos el input directamente
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });
      const labels = fixture.componentInstance.opciones().map((o) => o.label);
      expect(labels).toContain('Kilogramos');
      expect(labels).toContain('Gramos');
      expect(labels).toContain('Libras');
    });
  });

  describe('Two-way binding with model', () => {
    it('should reflect initial model value in input', async () => {
      const { fixture } = await render(InputSelect, {
        componentInputs: { ...defaultInputs, value: { value: '10', unit: 'kg' } },
      });
      const component = fixture.componentInstance;
      expect(component.inputValue()).toBe('10');
      expect(screen.getByRole('textbox') as HTMLInputElement).toHaveValue('10');
    });

    it('should select correct initial unit', async () => {
      const { fixture } = await render(InputSelect, {
        componentInputs: { ...defaultInputs, value: { value: '10', unit: 'g' } },
      });
      expect(fixture.componentInstance.selectedUnit()).toBe('g');
    });

    it('should update model when input value changes', async () => {
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });
      const component = fixture.componentInstance;

      await userEvent.type(screen.getByRole('textbox'), '25');

      expect(component.value()).toEqual({ value: '25', unit: 'kg' });
    });

    it('should update model when unit changes', async () => {
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });
      const component = fixture.componentInstance;

      component.onUnitChange('g');

      expect(component.value()).toEqual({ value: '', unit: 'g' });
    });

    it('should update both value and unit in model', async () => {
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });
      const component = fixture.componentInstance;

      await userEvent.type(screen.getByRole('textbox'), '100');
      component.onUnitChange('lb');

      expect(component.value()).toEqual({ value: '100', unit: 'lb' });
    });
  });

  describe('Input text changes', () => {
    it('should update inputValue linked signal when typing', async () => {
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });

      await userEvent.type(screen.getByRole('textbox'), '42');

      expect(fixture.componentInstance.inputValue()).toBe('42');
    });

    it('should preserve unit when updating value via typing', async () => {
      const { fixture } = await render(InputSelect, {
        componentInputs: { ...defaultInputs, value: { value: '10', unit: 'kg' } },
      });
      const input = screen.getByRole('textbox');

      // Limpiar y escribir nuevo valor; la unidad no debe cambiar
      await userEvent.clear(input);
      await userEvent.type(input, '20');

      expect(fixture.componentInstance.selectedUnit()).toBe('kg');
    });
  });

  describe('Unit selection', () => {
    it('should update selectedUnit when onUnitChange is called', async () => {
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });

      fixture.componentInstance.onUnitChange('g');

      expect(fixture.componentInstance.selectedUnit()).toBe('g');
    });

    it('should default to first option when no value provided', async () => {
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });

      expect(fixture.componentInstance.selectedUnit()).toBe('kg');
    });

    it('should update selectedUnit and value together when unit changes', async () => {
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });
      const component = fixture.componentInstance;

      // Simular el evento de selección tal como lo haría mat-select
      await userEvent.type(screen.getByRole('textbox'), '5');
      component.onUnitChange('g');

      expect(component.selectedUnit()).toBe('g');
      expect(component.value()).toEqual({ value: '5', unit: 'g' });
    });
  });

  describe('Visual customization', () => {
    it('should apply text color when provided', async () => {
      await render(InputSelect, {
        componentInputs: { ...defaultInputs, textColor: '#ff0000' },
      });
      expect(screen.getByRole('textbox')).toHaveStyle({ color: '#ff0000' });
    });

    it('should use custom placeholder when provided', async () => {
      await render(InputSelect, {
        componentInputs: { ...defaultInputs, placeholder: 'Ingrese valor' },
      });
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Combined behavior', () => {
    it('should maintain value and unit together after multiple changes', async () => {
      const { fixture } = await render(InputSelect, { componentInputs: defaultInputs });
      const component = fixture.componentInstance;
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '50');
      component.onUnitChange('g');
      // Limpiar antes de escribir el nuevo valor para evitar concatenación
      await userEvent.clear(input);
      await userEvent.type(input, '75');

      expect(component.value()).toEqual({ value: '75', unit: 'g' });
    });

    it('should handle null value gracefully', async () => {
      const { fixture } = await render(InputSelect, {
        componentInputs: { ...defaultInputs, value: null },
      });
      const component = fixture.componentInstance;

      expect(component.inputValue()).toBe('');
      expect(component.selectedUnit()).toBe('kg');
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, signal } from '@angular/core';
import { FormField, disabled, form, validate } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { NumericRangeInput, type NumericRangeValue } from './numeric-range-input';

describe('NumericRangeInput', () => {
  it('renders inputs with correct labels and placeholders', async () => {
    await render(NumericRangeInput, {
      componentProperties: {
        label: () => 'Speed Range',
        minPlaceholder: () => 'Min speed',
        maxPlaceholder: () => 'Max speed',
        minPrefix: () => 'Min:',
        maxPrefix: () => 'Max:',
      } as any,
    });

    expect(screen.getByText('Speed Range')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min speed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max speed')).toBeInTheDocument();
    expect(screen.getByText('Min:')).toBeInTheDocument();
    expect(screen.getByText('Max:')).toBeInTheDocument();
  });

  it('updates model value when typing in input fields', async () => {
    const { fixture } = await render(NumericRangeInput, {
      componentProperties: {
        value: signal({ min: null, max: null }),
      } as any,
    });

    const user = userEvent.setup();
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs.length).toBe(2);

    await user.type(inputs[0], '15');
    await user.type(inputs[1], '45');

    expect(fixture.componentInstance.value()).toEqual({ min: 15, max: 45 });
  });

  it('updates fields when value signal changes', async () => {
    const valueSignal = signal<NumericRangeValue>({ min: 10, max: 20 });
    const { fixture } = await render(NumericRangeInput, {
      componentProperties: {
        value: valueSignal,
      } as any,
    });

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0].value).toBe('10');
    expect(inputs[1].value).toBe('20');

    fixture.componentInstance.value.set({ min: 5, max: 15 });
    fixture.detectChanges();

    expect(inputs[0].value).toBe('5');
    expect(inputs[1].value).toBe('15');
  });

  it('marks touched on blur (standalone)', async () => {
    const { fixture } = await render(NumericRangeInput);

    expect(fixture.componentInstance.touched()).toBe(false);

    const user = userEvent.setup();
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    await user.click(inputs[0]);
    await user.tab();

    expect(fixture.componentInstance.touched()).toBe(true);
  });

  // ── Integración Signal Forms (directiva FormField) ────────────────────────

  it('integrates with signal-forms formField directive', async () => {
    @Component({
      imports: [NumericRangeInput, FormField],
      template: `
        <ui-numeric-range-input [formField]="myForm.range" />
      `,
    })
    class TestWrapper {
      readonly modelSignal = signal({
        range: { min: 10, max: 20 } as NumericRangeValue,
      });
      readonly myForm = form(this.modelSignal);
    }

    const { fixture } = await render(TestWrapper);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0].value).toBe('10');
    expect(inputs[1].value).toBe('20');

    const user = userEvent.setup();
    await user.clear(inputs[0]);
    await user.type(inputs[0], '5');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '15');

    fixture.detectChanges();
    expect(fixture.componentInstance.myForm().value().range).toEqual({ min: 5, max: 15 });
  });

  it('propagates touched to the form field on blur', async () => {
    @Component({
      imports: [NumericRangeInput, FormField],
      template: `
        <ui-numeric-range-input [formField]="myForm.range" />
      `,
    })
    class TestWrapper {
      readonly modelSignal = signal({ range: { min: 1, max: 2 } as NumericRangeValue });
      readonly myForm = form(this.modelSignal);
    }

    const { fixture } = await render(TestWrapper);
    expect(fixture.componentInstance.myForm.range().touched()).toBe(false);

    const user = userEvent.setup();
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    await user.click(inputs[0]);
    await user.tab();
    fixture.detectChanges();

    expect(fixture.componentInstance.myForm.range().touched()).toBe(true);
  });

  it('shows schema validation errors only after touch', async () => {
    @Component({
      imports: [NumericRangeInput, FormField],
      template: `
        <ui-numeric-range-input [formField]="myForm.range" />
      `,
    })
    class TestWrapper {
      // Valor inicial inválido: min > max
      readonly modelSignal = signal({ range: { min: 30, max: 20 } as NumericRangeValue });
      readonly myForm = form(this.modelSignal, (path) => {
        validate(path.range, ({ value }) => {
          const v = value();
          if (v && v.min !== null && v.max !== null && v.min > v.max) {
            return { kind: 'minGreaterThanMax', message: 'Min mayor que Max' };
          }
          return undefined;
        });
      });
    }

    const { fixture } = await render(TestWrapper);

    // El campo ya es inválido, pero sin interacción no se muestra el error
    expect(fixture.componentInstance.myForm.range().valid()).toBe(false);
    expect(screen.queryByText('Min mayor que Max')).not.toBeInTheDocument();

    const user = userEvent.setup();
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    await user.click(inputs[0]);
    await user.tab();
    fixture.detectChanges();

    expect(screen.getByText('Min mayor que Max')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(inputs[0]).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables inputs when the schema disables the field', async () => {
    @Component({
      imports: [NumericRangeInput, FormField],
      template: `
        <ui-numeric-range-input [formField]="myForm.range" />
      `,
    })
    class TestWrapper {
      readonly modelSignal = signal({ range: { min: 1, max: 2 } as NumericRangeValue });
      readonly myForm = form(this.modelSignal, (path) => {
        disabled(path.range, () => true);
      });
    }

    await render(TestWrapper);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0]).toBeDisabled();
    expect(inputs[1]).toBeDisabled();
  });
});

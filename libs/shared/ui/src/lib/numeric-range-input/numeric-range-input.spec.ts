/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { NumericRangeInput } from './numeric-range-input';

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

    expect(screen.getByText('Speed Range')).toBeTruthy();
    expect(screen.getByPlaceholderText('Min speed')).toBeTruthy();
    expect(screen.getByPlaceholderText('Max speed')).toBeTruthy();
    expect(screen.getByText('Min:')).toBeTruthy();
    expect(screen.getByText('Max:')).toBeTruthy();
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

    const minInputEl = inputs[0];
    const maxInputEl = inputs[1];

    await user.type(minInputEl, '15');
    await user.type(maxInputEl, '45');

    const component = fixture.componentInstance;
    expect(component.value()).toEqual({ min: 15, max: 45 });
  });

  it('updates fields when value signal changes', async () => {
    const valueSignal = signal<{ min: number | null; max: number | null } | null>({ min: 10, max: 20 });
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

  it('integrates with signal-forms formField directive', async () => {
    @Component({
      imports: [NumericRangeInput, FormField],
      template: `
        <ui-numeric-range-input [formField]="myForm.range" />
      `,
    })
    class TestWrapper {
      readonly modelSignal = signal({
        range: { min: 10, max: 20 } as { min: number | null; max: number | null } | null,
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
});

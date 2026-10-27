import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { ShotDifferentialPressureData } from '../../../models';
import { PiezoPressureDifferentialTab } from './piezo-pressure-differential-tab';

describe('PiezoPressureDifferentialTab', () => {
  const initialModel = (): ShotDifferentialPressureData => ({
    positiveDifferentialPressure: null,
    positiveDifferentialPressureUnit: 'BAR',
    negativeDifferentialPressure: null,
    negativeDifferentialPressureUnit: 'BAR',
    observations: null,
  });

  const renderTab = () =>
    render(PiezoPressureDifferentialTab, {
      componentInputs: { model: initialModel(), pressureUnitOptions: [] },
      imports: [TranslateModule.forRoot()],
    });

  const getInput = (index: number): HTMLInputElement => {
    const textbox = screen.getAllByRole('textbox')[index];
    if (!(textbox instanceof HTMLInputElement)) throw new Error(`Textbox ${index} is not an input`);
    return textbox;
  };

  it('should reject pressure values with the wrong sign in the input and model', async () => {
    const { fixture } = await renderTab();
    const user = userEvent.setup();

    await user.type(getInput(0), '-5');
    await user.tab();
    await user.type(getInput(1), '15');
    await user.tab();

    expect(fixture.componentInstance.model().negativeDifferentialPressure).toBeNull();
    expect(getInput(0)).toHaveValue('');
    expect(getInput(1)).toHaveValue('');
    expect(fixture.componentInstance.model().positiveDifferentialPressure).toBeNull();
    expect(fixture.componentInstance.model().negativeDifferentialPressure).toBeNull();

    await user.click(getInput(0));
    await user.click(getInput(1));

    expect(getInput(0)).toHaveValue('');
    expect(getInput(1)).toHaveValue('');
  });

  it('should accept zero and values with the allowed sign', async () => {
    const { fixture } = await renderTab();
    const tab = fixture.componentInstance;
    const user = userEvent.setup();

    await user.type(getInput(0), '0');
    await user.type(getInput(1), '0');

    expect(tab.model().positiveDifferentialPressure).toBe(0);
    expect(tab.model().negativeDifferentialPressure).toBe(0);

    await user.clear(getInput(0));
    await user.type(getInput(0), '3');
    await user.clear(getInput(1));
    await user.type(getInput(1), '-2');

    expect(tab.model().positiveDifferentialPressure).toBe(3);
    expect(tab.model().negativeDifferentialPressure).toBe(-2);
  });
});

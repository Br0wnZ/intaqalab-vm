import { signal } from '@angular/core';
import { LOCALE_SIGNAL } from '@intaqalab/utils';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SoundLevelMeterInput } from './sound-level-meter-input';

describe('SoundLevelMeterInput', () => {
  const axes = ['x', 'y', 'z'] as const;

  it.each(axes)('keeps the latest loaded %s coordinate when focused', async (axis) => {
    const user = userEvent.setup();
    const { fixture } = await render(SoundLevelMeterInput, {
      inputs: { value: { x: 10, y: 20, z: 30, unit: 'm' } },
      providers: [{ provide: LOCALE_SIGNAL, useValue: signal('es-ES') }],
    });
    const coordinate = screen.getByRole('textbox', { name: axis.toUpperCase() });

    await user.click(coordinate);
    await user.tab();
    const loadedValue = { x: 1234.5, y: 2345.5, z: 3456.5, unit: 'm' };
    fixture.componentRef.setInput('value', loadedValue);
    fixture.detectChanges();
    await user.click(coordinate);

    expect(coordinate).toHaveValue(String(loadedValue[axis]).replace('.', ','));
    expect(fixture.componentInstance.value()).toEqual(loadedValue);
  });

  it.each(axes)('updates only the edited %s coordinate with a locale decimal', async (axis) => {
    const user = userEvent.setup();
    const initialValue = { x: 10, y: 20, z: 30, unit: 'm' };
    const { fixture } = await render(SoundLevelMeterInput, {
      inputs: { value: initialValue },
      providers: [{ provide: LOCALE_SIGNAL, useValue: signal('es-ES') }],
    });
    const coordinate = screen.getByRole('textbox', { name: axis.toUpperCase() });

    await user.clear(coordinate);
    await user.type(coordinate, '-12,75');
    await user.tab();
    await user.click(coordinate);

    expect(coordinate).toHaveValue('-12,75');
    expect(fixture.componentInstance.value()).toEqual({ ...initialValue, [axis]: -12.75 });

    await user.clear(coordinate);
    expect(fixture.componentInstance.value()).toEqual({ ...initialValue, [axis]: null });
  });

  it('renders backend decimal values like 1000.5 and preserves decimals across focus and blur', async () => {
    const user = userEvent.setup();
    const backendValue = { x: 1000.5, y: 2000.5, z: 300, unit: 'm' };
    const { fixture } = await render(SoundLevelMeterInput, {
      inputs: { value: backendValue },
      providers: [{ provide: LOCALE_SIGNAL, useValue: signal('es-ES') }],
    });

    const xCoord = screen.getByRole('textbox', { name: 'X' });
    const yCoord = screen.getByRole('textbox', { name: 'Y' });
    const zCoord = screen.getByRole('textbox', { name: 'Z' });

    expect(xCoord).toHaveValue('1000,5');
    expect(yCoord).toHaveValue('2000,5');
    expect(zCoord).toHaveValue('300');

    // Focus and blur coordinate X
    await user.click(xCoord);
    expect(xCoord).toHaveValue('1000,5');

    await user.tab();
    expect(xCoord).toHaveValue('1000,5');
    expect(fixture.componentInstance.value()).toEqual(backendValue);
  });

  it('supports string coordinates and preserves string type on user update', async () => {
    const user = userEvent.setup();
    const stringValue = { x: '1000.5', y: '2000.5', z: '300', unit: 'm' };
    const { fixture } = await render(SoundLevelMeterInput, {
      inputs: { value: stringValue },
      providers: [{ provide: LOCALE_SIGNAL, useValue: signal('es-ES') }],
    });

    const xCoord = screen.getByRole('textbox', { name: 'X' });
    expect(xCoord).toHaveValue('1000,5');

    await user.clear(xCoord);
    await user.type(xCoord, '15000,75');
    await user.tab();

    expect(fixture.componentInstance.value()?.x).toBe('15000.75');
    expect(typeof fixture.componentInstance.value()?.x).toBe('string');
  });

  it('respects minDecimals input for displaying trailing zeros', async () => {
    const { fixture } = await render(SoundLevelMeterInput, {
      inputs: {
        value: { x: 15000, y: 20, z: 30, unit: 'm' },
        minDecimals: 2,
        decimals: 2,
      },
      providers: [{ provide: LOCALE_SIGNAL, useValue: signal('es-ES') }],
    });
    fixture.detectChanges();

    const xCoord = screen.getByRole('textbox', { name: 'X' });
    expect(xCoord).toHaveValue('15.000,00');
  });
});

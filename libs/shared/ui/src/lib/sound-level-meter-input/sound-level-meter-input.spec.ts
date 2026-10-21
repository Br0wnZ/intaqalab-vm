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
});

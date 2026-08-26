import { Component, viewChild } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { FormTouchDirective } from './form-touch.directive';

@Component({
  imports: [FormTouchDirective],
  template: `
    <div intaFormTouch #touch="intaFormTouch">
      <input data-testid="field" />
      <textarea data-testid="area"></textarea>
    </div>
  `,
})
class HostComponent {
  readonly touch = viewChild.required('touch', { read: FormTouchDirective });
}

@Component({
  imports: [FormTouchDirective],
  template: `<div intaFormTouch [intaFormTouchDisabled]="true"><input data-testid="field" /></div>`,
})
class DisabledHostComponent {
  readonly touch = viewChild.required(FormTouchDirective);
}

describe('FormTouchDirective', () => {
  it('starts untouched', async () => {
    const { fixture } = await render(HostComponent);
    expect(fixture.componentInstance.touch().touched()).toBe(false);
  });

  it('marks touched after focus and blur on an input', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(HostComponent);

    await user.click(screen.getByTestId('field'));
    await user.tab();

    expect(fixture.componentInstance.touch().touched()).toBe(true);
  });

  it('marks touched from textarea too', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(HostComponent);

    await user.click(screen.getByTestId('area'));
    await user.tab();

    expect(fixture.componentInstance.touch().touched()).toBe(true);
  });

  it('does not mark touched on programmatic value changes', async () => {
    const { fixture } = await render(HostComponent);

    const input = screen.getByTestId('field') as HTMLInputElement;
    input.value = 'patched';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(fixture.componentInstance.touch().touched()).toBe(false);
  });

  it('reset() returns to untouched', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(HostComponent);

    const directive = fixture.componentInstance.touch();
    await user.click(screen.getByTestId('field'));
    await user.tab();
    expect(directive.touched()).toBe(true);

    directive.reset();
    expect(directive.touched()).toBe(false);
  });

  it('respects disabled state', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(DisabledHostComponent);

    await user.click(screen.getByTestId('field'));
    await user.tab();

    expect(fixture.componentInstance.touch().touched()).toBe(false);
  });
});

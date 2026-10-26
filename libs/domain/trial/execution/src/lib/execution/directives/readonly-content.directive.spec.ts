import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { ExecutionStore } from '../../+state/execution.store';
import { ReadonlyContentDirective } from './readonly-content.directive';

@Component({
  imports: [ReadonlyContentDirective],
  template: `
    <div data-testid="target" [intaReadonlyContent]="isReadOnly()">
      <button data-testid="inner-btn">Action</button>
    </div>
  `,
})
class BindingHostComponent {
  readonly isReadOnly = signal(false);
}

@Component({
  imports: [ReadonlyContentDirective],
  template: `
    <div data-testid="unbound-target" intaReadonlyContent>
      <button>Action</button>
    </div>
  `,
})
class UnboundHostComponent {}

describe('ReadonlyContentDirective', () => {
  it('applies inert and readonly class when explicit input is true', async () => {
    const { fixture } = await render(BindingHostComponent);
    const target = screen.getByTestId('target');

    expect(target).not.toHaveAttribute('inert');
    expect(target).not.toHaveClass('inta-readonly-content');

    fixture.componentInstance.isReadOnly.set(true);
    fixture.detectChanges();

    expect(target).toHaveAttribute('inert');
    expect(target).toHaveClass('inta-readonly-content');
  });

  it('falls back to store isTrialReadOnly when used as plain attribute without binding', async () => {
    const isTrialReadOnly = signal(true);
    const mockStore = {
      isTrialReadOnly: isTrialReadOnly.asReadonly(),
    };

    const { fixture } = await render(UnboundHostComponent, {
      providers: [{ provide: ExecutionStore, useValue: mockStore }],
    });

    const target = screen.getByTestId('unbound-target');
    expect(target).toHaveAttribute('inert');
    expect(target).toHaveClass('inta-readonly-content');

    isTrialReadOnly.set(false);
    fixture.detectChanges();

    expect(target).not.toHaveAttribute('inert');
    expect(target).not.toHaveClass('inta-readonly-content');
  });
});

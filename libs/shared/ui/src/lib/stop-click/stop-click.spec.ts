import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StopClick } from './stop-click';

@Component({
  template: `
    <div role="button" tabindex="0" data-testid="parent" (click)="onParentClick()" (keydown.enter)="onParentClick()">
      <button
        uiStopClick
        data-testid="child-button"
        [stopPropagation]="stopPropagation()"
        [preventDefault]="preventDefault()"
        (click)="onChildClick($event)"
      >
        Click Me
      </button>

      <button stopClick data-testid="alias-button" (click)="onAliasChildClick($event)">Alias Button</button>
    </div>
  `,
  imports: [StopClick],
})
class TestHostComponent {
  readonly stopPropagation = signal<boolean>(true);
  readonly preventDefault = signal<boolean>(true);

  readonly onParentClick = vi.fn();
  readonly onChildClick = vi.fn();
  readonly onAliasChildClick = vi.fn();
}

describe('StopClick', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute child click handler and stop propagation to parent by default', async () => {
    const user = userEvent.setup();
    const view = await render(TestHostComponent);
    const host = view.fixture.componentInstance;

    const childBtn = screen.getByTestId('child-button');
    await user.click(childBtn);

    expect(host.onChildClick).toHaveBeenCalledTimes(1);
    expect(host.onParentClick).not.toHaveBeenCalled();
  });

  it('should prevent default event action by default', async () => {
    const user = userEvent.setup();
    const view = await render(TestHostComponent);
    const host = view.fixture.componentInstance;

    const childBtn = screen.getByTestId('child-button');
    await user.click(childBtn);

    expect(host.onChildClick).toHaveBeenCalledTimes(1);
    const event = host.onChildClick.mock.calls[0][0] as MouseEvent;
    expect(event.defaultPrevented).toBe(true);
  });

  it('should allow propagation when stopPropagation is false', async () => {
    const user = userEvent.setup();
    const view = await render(TestHostComponent);
    const host = view.fixture.componentInstance;

    host.stopPropagation.set(false);
    view.fixture.detectChanges();

    const childBtn = screen.getByTestId('child-button');
    await user.click(childBtn);

    expect(host.onChildClick).toHaveBeenCalledTimes(1);
    expect(host.onParentClick).toHaveBeenCalledTimes(1);
  });

  it('should not prevent default when preventDefault is false', async () => {
    const user = userEvent.setup();
    const view = await render(TestHostComponent);
    const host = view.fixture.componentInstance;

    host.preventDefault.set(false);
    view.fixture.detectChanges();

    const childBtn = screen.getByTestId('child-button');
    await user.click(childBtn);

    expect(host.onChildClick).toHaveBeenCalledTimes(1);
    const event = host.onChildClick.mock.calls[0][0] as MouseEvent;
    expect(event.defaultPrevented).toBe(false);
    expect(host.onParentClick).not.toHaveBeenCalled();
  });

  it('should work with alias selector [stopClick]', async () => {
    const user = userEvent.setup();
    const view = await render(TestHostComponent);
    const host = view.fixture.componentInstance;

    const aliasBtn = screen.getByTestId('alias-button');
    await user.click(aliasBtn);

    expect(host.onAliasChildClick).toHaveBeenCalledTimes(1);
    expect(host.onParentClick).not.toHaveBeenCalled();
  });
});

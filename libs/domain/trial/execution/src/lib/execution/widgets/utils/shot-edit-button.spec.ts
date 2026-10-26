import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ShotEditButton } from './shot-edit-button';
import type { ShotFormLock } from './shot-form-lock';

@Component({
  imports: [ShotEditButton, TranslateModule],
  template: `
    <inta-shot-edit-button [canEnable]="canEnable()" (edit)="onEdit()" />
  `,
})
class TestHostComponent {
  readonly canEnable = signal(true);
  edited = false;

  onEdit(): void {
    this.edited = true;
  }
}

describe('ShotEditButton', () => {
  it('renders edit button when canEnable is true', async () => {
    await render(TestHostComponent);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('hides edit button when canEnable is false', async () => {
    const { fixture } = await render(TestHostComponent);
    fixture.componentInstance.canEnable.set(false);
    fixture.detectChanges();

    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('emits edit output when clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(TestHostComponent);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(fixture.componentInstance.edited).toBe(true);
  });

  it('interacts with ShotFormLock directly', async () => {
    let unlocked = false;
    const mockLock = {
      canEnableHistoricalEdit: signal(true),
      enableHistoricalEdit: () => {
        unlocked = true;
      },
    } as unknown as ShotFormLock;

    @Component({
      imports: [ShotEditButton, TranslateModule],
      template: `
        <inta-shot-edit-button [lock]="lock" />
      `,
    })
    class LockHostComponent {
      readonly lock = mockLock;
    }

    const user = userEvent.setup();
    await render(LockHostComponent);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(unlocked).toBe(true);
  });
});

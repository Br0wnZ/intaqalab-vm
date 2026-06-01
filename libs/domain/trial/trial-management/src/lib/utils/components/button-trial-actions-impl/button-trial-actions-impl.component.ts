import { Component, effect, input, output, signal } from '@angular/core';
import type { HasStatus, TrialActions } from '@intaqalab/models';

import { ButtonTrialActionsComponent } from '../button-trial-actions/button-trial-actions.component';
import type { ButtonTrialActionsInput } from '../button-trial-actions/button-trial-actions.model';
import { config } from './button-trial-actions-imp.constants';

@Component({
  selector: 'inta-button-trial-actions-impl',
  imports: [ButtonTrialActionsComponent],
  template: `
    @if (config()) {
      <inta-trial-actions [config]="config()!" (clicked)="actionClicked($event)" />
    }
  `,
})
export class ButtonTrialActionsImplComponent {
  readonly clicked = output<TrialActions>();
  readonly trial = input.required<HasStatus>();

  protected config = signal<ButtonTrialActionsInput | undefined>(undefined);

  constructor() {
    effect(() => {
      const trial = this.trial();
      if (trial) {
        this.config.set({
          label: 'UTILS_TRIALS.TRIAL_ACTIONS_LABEL',
          list: config,
          trial,
        });
      }
    });
  }

  actionClicked($event: string) {
    this.clicked.emit($event as TrialActions);
  }
}

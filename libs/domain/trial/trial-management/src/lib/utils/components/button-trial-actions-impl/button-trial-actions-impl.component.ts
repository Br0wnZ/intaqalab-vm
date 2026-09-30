import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonTrialActionsImplComponent {
  readonly clicked = output<TrialActions>();
  readonly trial = input.required<HasStatus>();

  protected readonly config = computed<ButtonTrialActionsInput | undefined>(() => {
    const trial = this.trial();
    if (!trial) return undefined;

    return {
      label: 'UTILS_TRIALS.TRIAL_ACTIONS_LABEL',
      list: config,
      trial,
    };
  });

  actionClicked($event: string) {
    this.clicked.emit($event as TrialActions);
  }
}

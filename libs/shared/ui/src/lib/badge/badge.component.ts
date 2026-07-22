import { ChangeDetectionStrategy, Component, HostBinding, ViewEncapsulation, input } from '@angular/core';
import type { TrialStatus } from '@intaqalab/models';

import { getTrialStatusToneClass } from './trial-status-tone';

@Component({
  selector: 'ui-badge, [uiBadge]',
  template: `
    <ng-content />
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  readonly status = input<TrialStatus | string>();
  readonly class = input<string>('');

  @HostBinding('class') get elementClass(): string {
    const base =
      'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    const variant = getTrialStatusToneClass(this.status());
    return [base, variant, this.class()].filter(Boolean).join(' ');
  }
}

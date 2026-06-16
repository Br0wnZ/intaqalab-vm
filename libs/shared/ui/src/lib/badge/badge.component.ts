import { ChangeDetectionStrategy, Component, HostBinding, ViewEncapsulation, input } from '@angular/core';
import type { TrialStatus } from '@intaqalab/models';

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
    const statusClass: Record<string, string> = {
      UNDER_REVIEW: 'bg-orange-100 text-orange-700 border-orange-200',
      PLANNED: 'bg-blue-100 text-blue-700 border-blue-200',
      PREPARED: 'bg-blue-100 text-blue-700 border-blue-200',
      IN_PROGRESS: 'bg-green-100 text-green-700 border-green-200',
      INTERRUPTED: 'bg-red-100 text-red-700 border-red-200',
      STARTED: 'bg-green-100 text-green-700 border-green-200',
      EXECUTED: 'bg-green-100 text-green-700 border-green-200',
      ANALYZING: 'bg-orange-100 text-orange-700 border-orange-200',
      FINALIZING: 'bg-green-100 text-green-700 border-green-200',
      CLOSED: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
      VOIDED: 'bg-red-100 text-red-700 border-red-200',
    };
    const currentStatus = this.status();
    const variant =
      currentStatus && statusClass[currentStatus]
        ? statusClass[currentStatus]
        : 'bg-primary text-primary-foreground border-transparent';
    return [base, variant, this.class()].filter(Boolean).join(' ');
  }
}

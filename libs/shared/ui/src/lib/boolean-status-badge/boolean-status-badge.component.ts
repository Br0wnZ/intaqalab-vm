import { ChangeDetectionStrategy, Component, HostBinding, ViewEncapsulation, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ui-boolean-status-badge, [uiBooleanStatusBadge]',
  imports: [TranslateModule],
  template: `
    @if (label() === '') {
      <span>● {{ (isActive() ? 'MASTER_DATA.STATUS.ACTIVE' : 'MASTER_DATA.STATUS.INACTIVE') | translate }}</span>
    } @else {
      <span>{{ label() | translate }}</span>
    }
  `,
  styles: ``,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooleanStatusBadge {
  isActive = input.required<boolean>();
  class = input<string>('');
  label = input<string>('');

  @HostBinding('class') get elementClass(): string {
    const base =
      'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap';
    const statusStyles = this.isActive()
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200';

    return [base, statusStyles, this.class()].filter(Boolean).join(' ');
  }
}

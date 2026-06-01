import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '@intaqalab/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { ButtonTrialActionsInput } from './button-trial-actions.model';
import { filterTrialActions } from './button-trial-actions.utils';

@Component({
  selector: 'inta-trial-actions',
  imports: [MatButtonModule, MatMenuModule, MatIconModule, TranslatePipe],
  template: `
    <button mat-flat-button [matMenuTriggerFor]="menu" (menuOpened)="opened.set(true)" (menuClosed)="opened.set(false)">
      {{ label() | translate }}
      <mat-icon>
        @if (opened()) {
          expand_less
        } @else {
          expand_more
        }
      </mat-icon>
    </button>
    <mat-menu #menu="matMenu">
      @for (item of list(); track item; let idx = $index) {
        <button mat-menu-item (click)="clicked.emit(item.option)">
          {{ item.label | translate }}
        </button>
      }
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonTrialActionsComponent {
  readonly config = input.required<ButtonTrialActionsInput>();
  readonly rolesUser = inject(AuthService).userRoles;

  readonly opened = signal(false);
  readonly clicked = output<string>();

  readonly label = computed(() => {
    return this.config().label;
  });

  readonly list = computed(() => {
    const config = this.config();
    const trialStatus = config.trial.status;
    const actions = config.list;
    const userRoles = this.rolesUser();

    return filterTrialActions(actions, trialStatus, userRoles);
  });
}

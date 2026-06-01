import { Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';

import { HasRoleDirective } from '../../directives/has-role/has-role.directive';
import type { Role } from '../../models/role.model';

export type ButtonActionsConfiguration<Option = string> = ButtonActions<Option>[];

type ButtonActions<Option = string> = {
  label: string;
  option: Option;
  roles?: Role[];
};

@Component({
  selector: 'lib-button-role-actions',
  imports: [MatButtonModule, MatMenuModule, MatIconModule, HasRoleDirective, TranslatePipe],
  template: `
    <button
      matButton="filled"
      [matMenuTriggerFor]="menu"
      (menuOpened)="opened.set(true)"
      (menuClosed)="opened.set(false)"
    >
      {{ label() | translate }}
      <mat-icon>
        @if (opened()) {
          arrow_upward
        } @else {
          arrow_downward
        }
      </mat-icon>
    </button>
    <mat-menu #menu="matMenu">
      @for (option of options(); track option) {
        @if (option.roles) {
          <button *libHasRole="option.roles" mat-menu-item (click)="clicked.emit(option.option)">
            {{ option.label | translate }}
          </button>
        } @else {
          <button mat-menu-item (click)="clicked.emit(option.option)">
            {{ option.label | translate }}
          </button>
        }
      }
    </mat-menu>
  `,
  styleUrl: './button-role-actions.component.scss',
})
export class ButtonRoleActionsComponent {
  label = input.required<string>();
  options = input.required<ButtonActionsConfiguration>();

  opened = signal(false);
  clicked = output<ButtonActions['option']>();
}

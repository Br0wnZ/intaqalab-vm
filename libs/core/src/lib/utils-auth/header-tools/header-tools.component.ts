import { Component, inject, isDevMode, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../auth-service';

@Component({
  selector: 'lib-header-tools',
  imports: [MatButtonModule, IntaIconComponent, TranslateModule],
  template: `
    @if (isDevMode) {
      <div class="relative">
        @if (hidden()) {
          <button type="button" class="inta-icon-btn" (click)="hidden.set(false)">
            <ui-inta-icon name="user" size="md" />
          </button>
        } @else {
          <div class="absolute right-0 top-12 z-50 bg-white rounded-lg shadow-xl p-6 w-96">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-lg font-semibold text-gray-800">{{ 'HEADER_TOOLS.TITLE' | translate }}</h2>
              <button type="button" mat-icon-button class="hover:bg-gray-100 -mr-2" (click)="hidden.set(true)">
                <ui-inta-icon name="close" size="xl" [label]="'HEADER_TOOLS.TITLE' | translate" />
              </button>
            </div>

            <div class="space-y-6">
              <div class="mb-4">
                <label for="currentRole" class="block text-sm font-medium text-gray-700 mb-2">
                  {{ 'HEADER_TOOLS.CURRENT_ROLES' | translate }}
                </label>
                <ul>
                  @for (userRole of currentUserRoles(); track userRole) {
                    <li>{{ 'ROLES.' + userRole | translate }}</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './header-tools.component.scss',
})
export class HeaderToolsComponent {
  readonly hidden = signal(true);
  readonly isDevMode = isDevMode();

  readonly #authService = inject(AuthService);

  readonly currentUserRoles = this.#authService.userRoles;
}

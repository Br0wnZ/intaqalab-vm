import { Component, computed, inject, signal } from '@angular/core';
import { disabled, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LanguageService, type SupportedLanguage } from '@intaqalab/data-access';
import { IntaIconComponent } from '@intaqalab/ui';

import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../auth-service';
import { Role } from '../models/role.model';

@Component({
  selector: 'lib-header-tools',
  imports: [
    MatButtonModule,
    MatSelectModule,
    IntaIconComponent,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
  ],
  template: `
    <div class="relative">
      @if (hidden()) {
        <button type="button" class="inta-icon-btn" (click)="hidden.set(false)">
          <ui-inta-icon name="user" size="md" />
        </button>
      } @else {
        <div class="absolute right-0 top-12 z-50 bg-white rounded-lg shadow-xl p-6 w-96">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-semibold text-gray-800">{{'HEADER_TOOLS.TITLE' | translate}}</h2>
            <button type="button" mat-icon-button class="hover:bg-gray-100 -mr-2" (click)="hidden.set(true)">
              <ui-inta-icon name="close" [label]="'HEADER_TOOLS.TITLE' | translate" size="xl" />
            </button>
          </div>

          <div class="space-y-6">
            <div class="mb-4">
              <label for="currentRole" class="block text-sm font-medium text-gray-700 mb-2">{{'HEADER_TOOLS.CURRENT_ROLES' | translate}}</label>
              <ul>

                @for(userRole of currentUserRoles(); track userRole){
                  <li>{{ 'ROLES.' + userRole | translate }}</li>
                }
              </ul>
              <!-- <mat-form-field appearance="outline" class="w-full">
                <input id="currentRole" matInput type="text" [formField]="form.currentRole" />
              </mat-form-field> -->
            </div>

            <!-- <ui-inta-signal-select
              appearance="outline"
              [id]="'trial-status'"
              [valueKey]="'id'"
              [labelKey]="'label'"
              [formField]="form.roles"
              [label]="'Seleccionar Roles'"
              [placeholder]="'Elige uno o más roles'"
              [options]="userRoles()"
              [multiple]="true"
            /> -->

            <!-- <div class="flex justify-end py-2">
              <button mat-flat-button color="primary" (click)="send()">Cambiar permisos</button>
            </div> -->
          </div>
          <!-- <mat-form-field appearance="outline">
            <mat-select [value]="languageService.currentLanguage()" (selectionChange)="changeLanguage($event.value)">
              @for (lang of languageService.supportedLanguages; track $index) {
                <mat-option [value]="lang">
                  <span class="flex items-center gap-2">{{ getFlag(lang) }} {{ getLanguageName(lang) }}</span>
                </mat-option>
              }
            </mat-select>
          </mat-form-field> -->
        </div>
      }
    </div>
  `,
  styleUrl: './header-tools.component.scss',
})
export class HeaderToolsComponent {
  readonly languageService = inject(LanguageService);
  readonly hidden = signal(true);

  readonly #authService = inject(AuthService);

  readonly roles = Object.values(Role);

  readonly currentUserRoles = this.#authService.userRoles;
  readonly userRoles = computed(() => this.roles.map((role) => ({ id: role, label: role })));

  readonly formModel = signal({
    currentRole: '',
    roles: [] as Role[],
  });

  changeLanguage(lang: SupportedLanguage) {
    this.languageService.setLanguage(lang);
  }

  readonly form = form(this.formModel, (f) => {
    disabled(f.currentRole);
  });

  constructor() {
    const sessionPermissions = sessionStorage.getItem('permissions');
    if (sessionPermissions !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.#authService.setRoles(sessionPermissions.split(',') as any);
    }
    this.formModel().currentRole = this.#authService.userRoles().join(', ');
    this.formModel().roles = this.#authService.userRoles();
  }

  getFlag(lang: SupportedLanguage): string {
    const flags: Record<SupportedLanguage, string> = {
      es: '🇪🇸',
      en: '🇬🇧',
    };
    return flags[lang];
  }

  getLanguageName(lang: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
      es: 'Español',
      en: 'English',
    };
    return names[lang];
  }

  send() {
    const rolesToSet = this.form.roles().value();
    sessionStorage.setItem('permissions', rolesToSet.join(','));
    location.reload();
  }
}

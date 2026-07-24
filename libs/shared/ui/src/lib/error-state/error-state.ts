import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ui-error-state',
  imports: [TranslateModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8 text-center w-full max-w-md mx-auto">
      <div class="mb-6 relative w-32 h-32 flex items-center justify-center text-client-error">
        <!-- Abstract Technical Error SVG -->
        <svg width="100%" height="100%" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Subtle Data Grid -->
          <path d="M10 10H110V110H10V10Z" stroke-width="1" stroke-dasharray="4 4" class="stroke-client-neutral-200" />
          <path
            d="M35 10V110M60 10V110M85 10V110"
            stroke-width="1"
            stroke-dasharray="4 4"
            class="stroke-client-neutral-200"
          />
          <path
            d="M10 35H110M10 60H110M10 85H110"
            stroke-width="1"
            stroke-dasharray="4 4"
            class="stroke-client-neutral-200"
          />

          <!-- Radiating Alert Backgrounds -->
          <circle cx="60" cy="60" r="40" class="fill-client-error/5" />
          <circle cx="60" cy="60" r="28" stroke-width="1" class="fill-client-error/10 stroke-client-error/20" />

          <!-- Disconnected Network Nodes -->
          <!-- Left Node -->
          <path d="M25 60H45" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="25" cy="60" r="3.5" fill="currentColor" />
          <circle cx="45" cy="60" r="2.5" stroke-width="1.5" class="fill-white stroke-current" />

          <!-- Right Node -->
          <path d="M75 60H95" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="95" cy="60" r="3.5" fill="currentColor" />
          <circle cx="75" cy="60" r="2.5" stroke-width="1.5" class="fill-white stroke-current" />

          <!-- Center Warning Triangle -->
          <path d="M60 46L72 68H48L60 46Z" stroke-width="2.5" stroke-linejoin="round" class="stroke-current" />
          <path d="M60 54V60" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <circle cx="60" cy="64" r="1.2" fill="currentColor" />
        </svg>
      </div>

      <h3 class="text-lg font-semibold text-slate-800 mb-2">
        {{ title() ?? ('HTTP_ERRORS.DEFAULT' | translate) }}
      </h3>

      @if (message()) {
        <p class="text-[14px] text-slate-500 mb-6 leading-relaxed">
          {{ message() }}
        </p>
      }

      <div class="empty:hidden mt-2">
        <ng-content />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorState {
  /** Título principal del error (si no se provee, usa un genérico i18n) */
  readonly title = input<string>();

  /** Mensaje descriptivo opcional */
  readonly message = input<string>();
}

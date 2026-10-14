import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';

import { MutationLoaderService } from '../../services/mutation-loader.service';

/**
 * Barra de progreso indeterminada en el top de la aplicación.
 * Se activa automáticamente para todas las peticiones PUT/POST/DELETE
 * via loaderInterceptor + MutationLoaderService.
 *
 * Colocar en app.html sobre el <main> una única vez.
 */
@Component({
  selector: 'lib-mutation-progress-bar',
  imports: [MatProgressBarModule, TranslatePipe],
  template: `
    @if (mutationLoader.isMutating()) {
      <mat-progress-bar
        mode="indeterminate"
        aria-live="polite"
        class="mutation-progress-bar"
        [attr.aria-label]="'COMMONS.SAVING_CHANGES' | translate"
      />
    }
  `,
  styles: `
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1200;
      pointer-events: none;
    }

    .mutation-progress-bar {
      height: 3px !important;

      --mdc-linear-progress-active-indicator-color: var(--inta-button, #7f56d9);
      --mdc-linear-progress-track-color: transparent;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MutationProgressBar {
  protected readonly mutationLoader = inject(MutationLoaderService);
}

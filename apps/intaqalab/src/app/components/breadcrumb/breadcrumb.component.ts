import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslatePipe } from '@ngx-translate/core';

import { BreadcrumbService } from '../../services/breadcrumb/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, TranslatePipe, IntaIconComponent],
  template: `
    <nav aria-label="Ruta de navegación" data-testid="breadcrumb" class="flex items-center justify-between gap-4 mb-6">
      <div class="flex min-w-0 items-center gap-3">
        <ui-inta-icon name="hamburguer" size="xl" />

        @if (items().length > 0) {
          <ol class="flex min-w-0 items-center text-base">
            @for (item of items(); track item.url; let last = $last) {
              <li class="flex min-w-0 items-center">
                @if (last) {
                  <span aria-current="page" class="truncate font-medium text-gray-700">
                    {{ item.label | translate }}
                  </span>
                } @else {
                  <a class="truncate text-gray-400 hover:text-gray-600 transition-colors" [routerLink]="item.url">
                    {{ item.label | translate }}
                  </a>
                  <span aria-hidden="true" class="px-2 text-gray-400">/</span>
                }
              </li>
            }
          </ol>
        }
      </div>
    </nav>
  `,
})
export class BreadcrumbComponent {
  protected readonly items = inject(BreadcrumbService).items;
}

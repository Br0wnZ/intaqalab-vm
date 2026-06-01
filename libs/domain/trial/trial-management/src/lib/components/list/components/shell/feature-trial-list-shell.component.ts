import { Component, Injector, inject, signal } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { injectionTokenTabCommand } from '@intaqalab/core';
import type { TrialSearchFilters } from '@intaqalab/models';
import { IntaIconComponent } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { TrialListFilter } from '../trial-list-filter/trial-list-filter';
import { TrialListComponent } from '../trial-list/trial-list.component';

@Component({
  selector: 'inta-feature-trial-list-shell',
  imports: [TrialListComponent, TrialListFilter, TranslateModule, MatAnchor, IntaIconComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-x-4 my-6">
      <h2 class="text-base font-semibold text-gray-900">{{ 'MENU_LEFT.GESTION_TRIALS_LIST' | translate }}</h2>
    </div>
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 class="text-lg text-gray-900 font-medium mb-6">Listado de pruebas de fuego</h3>
      <inta-trial-list-filter (filtersChange)="onFiltersChange($event)" />
      <inta-trial-list [filters]="filters()" (goTrialDetail)="handleNavigation($event)"></inta-trial-list>
    </div>
  `,
  styles: ``,
})
export class FeatureTrialListShellComponent {
  readonly #injector = inject(Injector);
  readonly onAction = this.#injector.get(injectionTokenTabCommand);

  readonly filters = signal<Partial<TrialSearchFilters>>({});

  onFiltersChange(filters: Partial<TrialSearchFilters>) {
    this.filters.set(filters);
  }

  handleNavigation(event: { id: string }) {
    this.onAction({ command: 'TRIAL_DETAIL', argument: `${event.id}` });
  }
}

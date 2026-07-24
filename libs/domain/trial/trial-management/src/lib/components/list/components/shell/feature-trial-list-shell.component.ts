import { Component, Injector, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { injectionTokenTabCommand } from '@intaqalab/core';
import type { TrialSearchFilters } from '@intaqalab/models';
import { ErrorState, Skeleton, SkeletonForm, SkeletonTable } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { TrialStore } from '../../+state/trial-list.store';
import { TrialListFilter } from '../trial-list-filter/trial-list-filter';
import { TrialListComponent } from '../trial-list/trial-list.component';

@Component({
  selector: 'inta-feature-trial-list-shell',
  imports: [
    TrialListComponent,
    TrialListFilter,
    TranslateModule,
    Skeleton,
    SkeletonForm,
    SkeletonTable,
    ErrorState,
    MatIconModule,
  ],
  providers: [TrialStore],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-x-4 my-6">
      <h2 class="text-base font-semibold text-gray-900">{{ 'MENU_LEFT.GESTION_TRIALS_LIST' | translate }}</h2>
    </div>

    @if (isLoading()) {
      <!-- ESTADO 1: LOADING (Skeletons replicando la disposición de la vista) -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-6">
        <ui-skeleton-form layout="multi" [fields]="8" />
        <ui-skeleton-table [rows]="10" [columns]="7" />
      </div>
    } @else if (error()) {
      <!-- ESTADO 2: ERROR (Mensaje traducido accesible) -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <ui-error-state [message]="'TRIALS_LIST.ERROR' | translate" />
      </div>
    } @else {
      <!-- ESTADO 3: ÉXITO / NORMAL (Componentes reales con datos) -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 class="text-lg text-gray-900 font-medium mb-6">Listado de pruebas de fuego</h3>
        <inta-trial-list-filter (filtersChange)="onFiltersChange($event)" />
        <inta-trial-list [filters]="filters()" (goTrialDetail)="handleNavigation($event)"></inta-trial-list>
      </div>
    }
  `,
  styles: ``,
})
export class FeatureTrialListShellComponent {
  readonly #store = inject(TrialStore);
  readonly #injector = inject(Injector);
  readonly onAction = this.#injector.get(injectionTokenTabCommand);

  readonly isLoading = computed(() => this.#store.isLoading());
  readonly error = computed(() => this.#store.error());

  readonly filters = signal<Partial<TrialSearchFilters>>({});

  onFiltersChange(filters: Partial<TrialSearchFilters>) {
    this.filters.set(filters);
  }

  handleNavigation(event: { id: string }) {
    this.onAction({ command: 'TRIAL_DETAIL', argument: `${event.id}` });
  }
}

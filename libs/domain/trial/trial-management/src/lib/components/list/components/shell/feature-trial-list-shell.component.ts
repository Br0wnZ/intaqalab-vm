import { Component, Injector, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { injectionTokenTabCommand } from '@intaqalab/core';
import { type TrialSearchFilters, TrialStatus } from '@intaqalab/models';
import { ErrorState, SkeletonForm, SkeletonTable } from '@intaqalab/ui';
import { TranslateModule } from '@ngx-translate/core';

import { TrialStore } from '../../+state/trial-list.store';
import { DataTrialCreateModifyService } from '../../../../services/data-trial-create-modify-service';
import { TrialListFilter } from '../trial-list-filter/trial-list-filter';
import { TrialListComponent } from '../trial-list/trial-list.component';

@Component({
  selector: 'inta-feature-trial-list-shell',
  imports: [
    TrialListComponent,
    TrialListFilter,
    TranslateModule,
    SkeletonForm,
    SkeletonTable,
    ErrorState,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [TrialStore],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-x-4 my-6">
      <h2 class="text-base font-semibold text-gray-900">
        {{ (isPlanningView() ? 'TAPS_TOP.TRIAL_PLANIFICATION' : 'MENU_LEFT.GESTION_TRIALS_LIST') | translate }}
      </h2>
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
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-lg text-gray-900 font-medium">
            {{ (isPlanningView() ? 'TRIALS_LIST.PLANNING_TITLE' : 'TAPS_TOP.TRIAL_LIST') | translate }}
          </h3>
        </div>
        <inta-trial-list-filter
          [allowedStatuses]="isPlanningView() ? planningStatuses : null"
          (filtersChange)="onFiltersChange($event)"
        />
        <div class="my-4 flex justify-end">
          <button mat-stroked-button type="button" [disabled]="isExporting()" (click)="exportToExcel()">
            <mat-icon>download</mat-icon>
            {{ 'TRIALS_LIST.EXPORT_EXCEL_BUTTON' | translate }}
          </button>
        </div>
        <inta-trial-list
          [filters]="filters()"
          (sortChange)="onSortChange($event)"
          (goTrialDetail)="handleNavigation($event)"
        ></inta-trial-list>
      </div>
    }
  `,
  styles: ``,
})
export class FeatureTrialListShellComponent {
  readonly planningStatuses = [TrialStatus.UNDER_REVIEW, TrialStatus.PLANNED] as const;
  readonly #route = inject(ActivatedRoute);
  readonly #store = inject(TrialStore);
  readonly #injector = inject(Injector);
  readonly #exportService = inject(DataTrialCreateModifyService);
  readonly onAction = this.#injector.get(injectionTokenTabCommand);

  readonly isLoading = computed(() => this.#store.isLoading());
  readonly error = computed(() => this.#store.error());
  readonly isPlanningView = signal(this.#route.snapshot.queryParamMap.get('planning') === 'true');

  readonly filters = signal<Partial<TrialSearchFilters>>(
    this.isPlanningView() ? { status: [...this.planningStatuses] } : {},
  );
  readonly #sort = signal<string[]>([]);
  readonly isExporting = computed(() => this.#exportService.exportFireTrialsResource.isLoading());

  constructor() {
    effect(() => {
      const response = this.#exportService.exportFireTrialsResource.value();
      if (!(response?.body instanceof Blob)) return;

      this.#downloadBlob(response.body, this.#getFileName(response.headers.get('Content-Disposition')));
      untracked(() => this.#exportService.resetExportFireTrials());
    });
  }

  onFiltersChange(filters: Partial<TrialSearchFilters>) {
    this.filters.set(
      this.isPlanningView() && !filters.status?.length ? { ...filters, status: [...this.planningStatuses] } : filters,
    );
  }

  onSortChange(sort: string): void {
    this.#sort.set([sort]);
  }

  exportToExcel(): void {
    this.#exportService.exportFireTrials(this.filters(), this.#sort());
  }

  handleNavigation(event: { id: string }) {
    this.onAction({
      command: 'TRIAL_DETAIL',
      argument: event.id,
      ...(this.isPlanningView() ? { queryParams: { tab: '1' } } : {}),
    });
  }

  #getFileName(contentDisposition: string | null): string {
    const encodedFileName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (encodedFileName) {
      try {
        return decodeURIComponent(encodedFileName);
      } catch {
        return 'fire-trials.xlsx';
      }
    }

    return contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]?.trim() ?? 'fire-trials.xlsx';
  }

  #downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
  }
}

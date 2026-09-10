import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { applyEach, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Badge, ErrorState, Skeleton } from '@intaqalab/ui';
import { RangePipe, TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { MeasuresStore } from '../../+state/measures.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import type {
  MagnitudesOptions,
  MeasureCategoryDef,
  MeasureSelectionData,
} from '../../utils-models/measure-serie.model';
import { MeasureCategoryCard } from './measure-category-card';
import { mapCatalogToMagnitudesOptions, mapLocalToRequest, mapResponseToLocal } from './measures.mapper';

@Component({
  selector: 'inta-measures',
  imports: [
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    Badge,
    TrialStatusLabelPipe,
    MatCheckbox,
    Skeleton,
    ErrorState,
    RangePipe,
    MeasureCategoryCard,
  ],
  providers: [MeasuresStore, SeriesAndShotsStore],
  template: `
    <div class="py-6">
      @if (isLoadingView()) {
        <div class="space-y-6">
          <!-- Top header skeleton -->
          <div class="flex justify-between items-center mb-6">
            <div class="flex gap-2">
              <ui-skeleton variant="rectangle" width="100px" height="36px" animation="wave" />
              <ui-skeleton variant="rectangle" width="100px" height="36px" animation="wave" />
            </div>
            <ui-skeleton variant="rectangle" width="180px" height="24px" animation="wave" />
          </div>

          <!-- Category Cards Skeleton -->
          <div class="space-y-4">
            @for (cat of 4 | range; track cat) {
              <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <ui-skeleton variant="rectangle" width="48px" height="48px" animation="wave" />
                    <div class="space-y-1.5">
                      <ui-skeleton variant="text" width="120px" height="1rem" animation="wave" />
                      <ui-skeleton variant="text" width="220px" height="0.75rem" animation="wave" />
                    </div>
                  </div>
                  <ui-skeleton variant="circle" width="24px" height="24px" animation="wave" />
                </div>
                @if (cat === 3) {
                  <div class="pt-2 space-y-3">
                    <ui-skeleton variant="rectangle" width="100%" height="48px" animation="wave" />
                    <div class="border border-purple-200 rounded-xl p-4 space-y-3">
                      <div class="flex justify-between items-center">
                        <ui-skeleton variant="text" width="280px" height="1.25rem" animation="wave" />
                        <div class="flex items-center gap-2">
                          <ui-skeleton variant="circle" width="24px" height="24px" animation="wave" />
                          <ui-skeleton variant="circle" width="24px" height="24px" animation="wave" />
                        </div>
                      </div>
                      <div class="grid grid-cols-3 gap-4">
                        <ui-skeleton variant="rectangle" width="100%" height="44px" animation="wave" />
                        <ui-skeleton variant="rectangle" width="100%" height="44px" animation="wave" />
                        <ui-skeleton variant="rectangle" width="100%" height="44px" animation="wave" />
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Bottom buttons skeleton -->
          <div class="flex justify-end gap-3 mt-6">
            <ui-skeleton variant="button" width="100px" height="40px" animation="wave" />
            <ui-skeleton variant="button" width="150px" height="40px" animation="wave" />
          </div>
        </div>
      } @else if (viewError()) {
        <ui-error-state
          [title]="'TRIAL_PLANNING.MEASURES.ERRORS.LOAD_FAILED_TITLE' | translate"
          [message]="'TRIAL_PLANNING.MEASURES.ERRORS.LOAD_FAILED_DETAIL' | translate"
        />
      } @else {
        <div class="flex justify-between items-center mb-6">
          <div class="flex gap-2">
            <h2 class="bg-purple-200/50 text-purple-700 p-2 rounded-lg font-medium">
              {{ trialCode() }}
            </h2>
            @if (trialStatus(); as status) {
              <ui-badge [status]="status">
                {{ status | trialStatusLabel }}
              </ui-badge>
            }
          </div>
          <mat-checkbox
            data-testid="conditioning-checkbox"
            class="!text-gray-700"
            [checked]="seriesConfiguration()"
            [disabled]="readonly()"
            (change)="toggleConfigBySerie()"
          >
            Configurar por serie
          </mat-checkbox>
        </div>

        @if (!seriesConfiguration() && seriesSignal().length > 0) {
          <div class="flex flex-col gap-4">
            @for (cat of categories; track cat.key) {
              <inta-measure-category-card
                [category]="cat"
                [isOpen]="isCategoryOpen(cat.key)"
                [options]="magnitudesOptions()[cat.key]"
                [selectedValues]="seriesSignal()[0][cat.key]"
                [readonly]="readonly()"
                [measuresCatalog]="measuresCatalog()"
                (toggleOpen)="toggleCategory(cat.key)"
                (selectedValuesChange)="onCategoryChange(seriesSignal()[0].id, cat.key, $event)"
                (toggleFavorite)="onToggleFavorite($event)"
                (removeMeasure)="removeMeasure(seriesSignal()[0].id, cat.key, $event)"
                (toggleMeasureExpanded)="toggleMeasureExpanded(seriesSignal()[0].id, cat.key, $event)"
                (updateLimit)="updateLimit(seriesSignal()[0].id, cat.key, $event.measureId, $event.field, $event.value)"
              />
            }
          </div>
        }

        <!-- Series Expansion Panels (Configuración por serie) -->
        @if (seriesConfiguration()) {
          <mat-accordion class="flex gap-6 flex-col" [multi]="true">
            @for (serie of seriesSignal(); track serie.id) {
              <mat-expansion-panel
                class="!shadow-sm !border !border-slate-200 !rounded-xl overflow-hidden !m-0 !bg-gray-200"
                [expanded]="serie.expanded"
              >
                <mat-expansion-panel-header class="!bg-gray-200">
                  <mat-panel-title class="!font-medium !text-sm !text-gray-900">
                    {{ serie.nombre }}
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="flex flex-col gap-4 p-2">
                  @for (cat of categories; track cat.key) {
                    <inta-measure-category-card
                      [category]="cat"
                      [isOpen]="isCategoryOpen(cat.key, serie.id)"
                      [options]="magnitudesOptions()[cat.key]"
                      [selectedValues]="serie[cat.key]"
                      [readonly]="readonly()"
                      [measuresCatalog]="measuresCatalog()"
                      (toggleOpen)="toggleCategory(cat.key, serie.id)"
                      (selectedValuesChange)="onCategoryChange(serie.id, cat.key, $event)"
                      (toggleFavorite)="onToggleFavorite($event)"
                      (removeMeasure)="removeMeasure(serie.id, cat.key, $event)"
                      (toggleMeasureExpanded)="toggleMeasureExpanded(serie.id, cat.key, $event)"
                      (updateLimit)="updateLimit(serie.id, cat.key, $event.measureId, $event.field, $event.value)"
                    />
                  }
                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>
        }

        <div class="flex justify-end gap-3 mt-6">
          @if (!readonly()) {
            <button
              mat-stroked-button
              class="!rounded-lg !border-slate-300 !text-gray-700 !px-5"
              [disabled]="isSaving()"
              (click)="cancel()"
            >
              Cancelar
            </button>
            <button
              mat-flat-button
              class="!bg-purple-600 hover:!bg-purple-700 !text-white !rounded-lg !px-5"
              [disabled]="isSaving() || !seriesForm().valid()"
              (click)="save()"
            >
              @if (isSaving()) {
                <mat-icon class="animate-spin mr-2">sync</mat-icon>
              }
              {{ isSaving() ? 'Guardando...' : 'Guardar borrador' }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Measures {
  /** Si true, el componente está en modo solo lectura (el usuario no puede editar) */
  readonly readonly = input<boolean>(false);

  readonly #measuresStore = inject(MeasuresStore);
  readonly #planningGeneralDataStore = inject(PlanningGeneralDataStore);
  readonly #seriesStore = inject(SeriesAndShotsStore);

  readonly measuresCatalog = computed(() => this.#measuresStore.measuresCatalog());

  readonly isLoadingView = computed(
    () =>
      this.#measuresStore.isLoadingMeasures() ||
      this.#planningGeneralDataStore.isLoadingPlanningInfo() ||
      this.#seriesStore.isLoadingSeries(),
  );

  readonly viewError = computed(
    () =>
      !!this.#measuresStore.measuresError() ||
      !!this.#planningGeneralDataStore.planningInfoError() ||
      !!this.#seriesStore.seriesError(),
  );

  readonly seriesConfiguration = signal<boolean>(false);

  readonly categories = [
    { key: 'topografia', title: 'Topografía', subtitle: 'Magnitudes y registros de topografía' },
    { key: 'municiones', title: 'Municiones', subtitle: 'Magnitudes y registros de municiones' },
    { key: 'armamento', title: 'Armamento', subtitle: 'Magnitudes y registros de armamento' },
    { key: 'balistica', title: 'Balística', subtitle: 'Magnitudes y registros de balística' },
  ] as const;

  readonly openCategories = signal<Record<string, boolean>>({
    topografia: false,
    municiones: false,
    armamento: false,
    balistica: true,
  });

  isCategoryOpen(category: string, serieId?: string): boolean {
    const key = serieId ? `${serieId}_${category}` : category;
    const current = this.openCategories()[key];
    if (current !== undefined) {
      return current;
    }
    return category === 'balistica';
  }

  toggleCategory(category: string, serieId?: string): void {
    const key = serieId ? `${serieId}_${category}` : category;
    const currentState = this.isCategoryOpen(category, serieId);
    this.openCategories.update((prev) => ({
      ...prev,
      [key]: !currentState,
    }));
  }

  readonly #backendData = computed(() => {
    const planningSeries = this.#seriesStore.series();
    const measuresSeries = this.#measuresStore.seriesMeasures();
    return { planningSeries, measuresSeries };
  });

  readonly seriesSignal = linkedSignal({
    source: () => this.#backendData(),
    computation: (data) => {
      if (!data.planningSeries) return [];
      return mapResponseToLocal(data.planningSeries, data.measuresSeries);
    },
  });

  readonly isLoading = this.#measuresStore.isLoading;
  readonly isSaving = this.#measuresStore.isUpdatingMeasures;
  readonly updateStatus = this.#measuresStore.updateMeasuresStatus;

  readonly isAddingFavorite = this.#measuresStore.isAddingFavorite;
  readonly addFavoriteStatus = this.#measuresStore.addFavoriteStatus;
  readonly isRemovingFavorite = this.#measuresStore.isRemovingFavorite;
  readonly removeFavoriteStatus = this.#measuresStore.removeFavoriteStatus;

  readonly trialCode = computed(() => this.#planningGeneralDataStore.fireTrialCode());
  readonly trialStatus = computed(() => this.#planningGeneralDataStore.fireTrial()?.status);

  readonly magnitudesOptions = computed<MagnitudesOptions>(() =>
    mapCatalogToMagnitudesOptions(this.#measuresStore.measuresCatalog()),
  );

  constructor() {
    effect(() => {
      const trialId = this.#planningGeneralDataStore.fireTrialId();
      if (trialId) {
        if (!this.#measuresStore.isInitialized()) {
          this.#measuresStore.loadMeasures();
          this.#measuresStore.loadMeasuresCatalog({ active: true, pageSize: 100 });
        }
        if (!this.#seriesStore.isInitialized()) {
          this.#seriesStore.loadSeries();
        }
      }
    });

    effect(() => {
      const status = this.updateStatus();
      if (status === 'resolved') {
        console.info('Measures saved successfully');
        this.#measuresStore.resetUpdateMeasures();
        this.#measuresStore.reloadMeasures();
      } else if (status === 'error') {
        console.error('Error saving measures');
        this.#measuresStore.resetUpdateMeasures();
      }
    });

    effect(() => {
      const addStatus = this.addFavoriteStatus();
      if (addStatus === 'resolved') {
        this.#measuresStore.resetAddFavorite();
        this.#measuresStore.loadMeasuresCatalog({ active: true, pageSize: 100 });
      } else if (addStatus === 'error') {
        console.error('Error adding favorite');
        this.#measuresStore.resetAddFavorite();
      }
    });

    effect(() => {
      const rmStatus = this.removeFavoriteStatus();
      if (rmStatus === 'resolved') {
        this.#measuresStore.resetRemoveFavorite();
        this.#measuresStore.loadMeasuresCatalog({ active: true, pageSize: 100 });
      } else if (rmStatus === 'error') {
        console.error('Error removing favorite');
        this.#measuresStore.resetRemoveFavorite();
      }
    });
  }

  seriesForm = form(this.seriesSignal, (formPath) => {
    applyEach(formPath, () => {
      // Form validations
    });
  });

  onCategoryChange(
    serieId: string,
    category: 'topografia' | 'municiones' | 'armamento' | 'balistica',
    newValues: MeasureSelectionData[],
  ): void {
    if (this.readonly()) {
      return;
    }
    this.seriesSignal.update((series) => series.map((s) => (s.id === serieId ? { ...s, [category]: newValues } : s)));
  }

  getMeasureName(id: string, options: { id: string; name: string }[]): string {
    return options.find((o) => o.id === id)?.name ?? id;
  }

  isQuantitative(measureId: string): boolean {
    const catalogItem = this.#measuresStore.measuresCatalog().find((item) => item.id === measureId);
    return catalogItem?.qualificationType === 'QUANTITATIVE';
  }

  toggleMeasureExpanded(
    serieId: string,
    category: 'topografia' | 'municiones' | 'armamento' | 'balistica',
    measureId: string,
  ): void {
    if (!this.isQuantitative(measureId)) {
      return;
    }
    this.seriesSignal.update((series) =>
      series.map((s) => {
        if (s.id !== serieId) return s;
        return {
          ...s,
          [category]: (s[category] as MeasureSelectionData[]).map((m) =>
            m.id === measureId ? { ...m, expanded: !m.expanded } : m,
          ),
        };
      }),
    );
  }

  removeMeasure(
    serieId: string,
    category: 'topografia' | 'municiones' | 'armamento' | 'balistica',
    measureId: string,
  ): void {
    if (this.readonly()) {
      return;
    }
    this.seriesSignal.update((series) =>
      series.map((s) => {
        if (s.id !== serieId) return s;
        return {
          ...s,
          [category]: (s[category] as MeasureSelectionData[]).filter((m) => m.id !== measureId),
        };
      }),
    );
  }

  updateLimit(
    serieId: string,
    category: 'topografia' | 'municiones' | 'armamento' | 'balistica',
    measureId: string,
    field: 'minLimit' | 'maxLimit' | 'deviation',
    value: number | null,
  ): void {
    if (this.readonly()) {
      return;
    }
    this.seriesSignal.update((series) =>
      series.map((s) => {
        if (s.id !== serieId) return s;
        return {
          ...s,
          [category]: (s[category] as MeasureSelectionData[]).map((m) =>
            m.id === measureId ? { ...m, [field]: value } : m,
          ),
        };
      }),
    );
  }

  onToggleFavorite(event: { id: string; isFavorite: boolean }): void {
    if (this.readonly()) {
      return;
    }
    if (event.isFavorite) {
      this.#measuresStore.addFavorite(event.id);
    } else {
      this.#measuresStore.removeFavorite(event.id);
    }
  }

  toggleConfigBySerie(): void {
    if (this.readonly()) {
      return;
    }
    const newStatus = !this.seriesConfiguration();
    this.seriesConfiguration.set(newStatus);
  }

  save(): void {
    if (this.readonly()) {
      return;
    }
    if (!this.seriesForm().valid()) {
      return;
    }
    const request = mapLocalToRequest(this.seriesSignal(), this.seriesConfiguration());
    this.#measuresStore.updateMeasures(request);
  }

  cancel(): void {
    if (this.readonly()) {
      return;
    }
    const data = this.#backendData();
    if (data.planningSeries) {
      this.seriesSignal.set(mapResponseToLocal(data.planningSeries, data.measuresSeries));
    }
  }
}

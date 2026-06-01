import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { applyEach, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Badge } from '@intaqalab/ui';
import { TrialStatusLabelPipe } from '@intaqalab/utils';
import { TranslateModule } from '@ngx-translate/core';

import { MeasuresStore } from '../../+state/measures.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import type { MagnitudesOptions, MeasureSelectionData, SerieData } from '../../utils-models/measure-serie.model';
import type { MeasuresBulkUpdateRequest } from '../../utils-models/measures.model';
import { MultiSelectSearchableComponent } from './multi-select-searchable';

@Component({
  selector: 'inta-measures',
  imports: [
    NgTemplateOutlet,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MultiSelectSearchableComponent,
    TranslateModule,
    Badge,
    TrialStatusLabelPipe,
    MatCheckbox,
  ],
  providers: [MeasuresStore, SeriesAndShotsStore],
  template: `
    <div class="py-6">
      @if (isLoading()) {
        <div class="flex justify-center items-center h-64">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="flex justify-between items-center mb-6">
          <div class="flex gap-2">
            <h2 class="bg-purple-200/50 text-purple-700 p-2 rounded-lg">
              {{ trialCode() }}
            </h2>
            <ui-badge [status]="trialStatus()">
              {{ trialStatus()! | trialStatusLabel }}
            </ui-badge>
          </div>
          <mat-checkbox
            data-testid="conditioning-checkbox"
            class="!text-gray-700"
            [checked]="seriesConfiguration()"
            (change)="toggleConfigBySerie()"
          >
            Configurar por serie
          </mat-checkbox>
        </div>

        @if (!seriesConfiguration() && seriesSignal().length > 0) {
          <div class="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div class="flex flex-col space-y-4">
              <!-- Magnitudes y registros de topografía -->
              <inta-multi-select-searchable
                [label]="'Magnitudes y registros de topografía'"
                [placeholder]="'Selecciona magnitudes y/o registros'"
                [options]="magnitudesOptions().topografia"
                [selectedValues]="seriesSignal()[0].topografia"
                (selectedValuesChange)="onCategoryChange(seriesSignal()[0].id, 'topografia', $event)"
                (toggleFavorite)="onToggleFavorite($event)"
              />
              @for (measure of seriesSignal()[0].topografia; track measure.id) {
                <ng-container
                  *ngTemplateOutlet="
                    measureLimitCard;
                    context: {
                      $implicit: measure,
                      serieId: seriesSignal()[0].id,
                      category: 'topografia',
                      options: magnitudesOptions().topografia,
                    }
                  "
                />
              }

              <!-- Magnitudes y registros de municiones -->
              <inta-multi-select-searchable
                [label]="'Magnitudes y registros de municiones'"
                [placeholder]="'Selecciona magnitudes y/o registros'"
                [options]="magnitudesOptions().municiones"
                [selectedValues]="seriesSignal()[0].municiones"
                (selectedValuesChange)="onCategoryChange(seriesSignal()[0].id, 'municiones', $event)"
                (toggleFavorite)="onToggleFavorite($event)"
              />
              @for (measure of seriesSignal()[0].municiones; track measure.id) {
                <ng-container
                  *ngTemplateOutlet="
                    measureLimitCard;
                    context: {
                      $implicit: measure,
                      serieId: seriesSignal()[0].id,
                      category: 'municiones',
                      options: magnitudesOptions().municiones,
                    }
                  "
                />
              }

              <!-- Magnitudes y registros de armamento -->
              <inta-multi-select-searchable
                [label]="'Magnitudes y registros de armamento'"
                [placeholder]="'Selecciona magnitudes y/o registros'"
                [options]="magnitudesOptions().armamento"
                [selectedValues]="seriesSignal()[0].armamento"
                (selectedValuesChange)="onCategoryChange(seriesSignal()[0].id, 'armamento', $event)"
                (toggleFavorite)="onToggleFavorite($event)"
              />
              @for (measure of seriesSignal()[0].armamento; track measure.id) {
                <ng-container
                  *ngTemplateOutlet="
                    measureLimitCard;
                    context: {
                      $implicit: measure,
                      serieId: seriesSignal()[0].id,
                      category: 'armamento',
                      options: magnitudesOptions().armamento,
                    }
                  "
                />
              }

              <!-- Magnitudes y registros de balística -->
              <inta-multi-select-searchable
                [label]="'Magnitudes y registros de balística'"
                [placeholder]="'Selecciona magnitudes y/o registros'"
                [options]="magnitudesOptions().balistica"
                [selectedValues]="seriesSignal()[0].balistica"
                (selectedValuesChange)="onCategoryChange(seriesSignal()[0].id, 'balistica', $event)"
                (toggleFavorite)="onToggleFavorite($event)"
              />
              @for (measure of seriesSignal()[0].balistica; track measure.id) {
                <ng-container
                  *ngTemplateOutlet="
                    measureLimitCard;
                    context: {
                      $implicit: measure,
                      serieId: seriesSignal()[0].id,
                      category: 'balistica',
                      options: magnitudesOptions().balistica,
                    }
                  "
                />
              }
            </div>
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
                  <!-- Magnitudes y registros de topografía -->
                  <inta-multi-select-searchable
                    [label]="'Magnitudes y registros de topografía'"
                    [placeholder]="'Selecciona magnitudes y/o registros'"
                    [options]="magnitudesOptions().topografia"
                    [selectedValues]="serie.topografia"
                    (selectedValuesChange)="onCategoryChange(serie.id, 'topografia', $event)"
                    (toggleFavorite)="onToggleFavorite($event)"
                  />
                  @for (measure of serie.topografia; track measure.id) {
                    <ng-container
                      *ngTemplateOutlet="
                        measureLimitCard;
                        context: {
                          $implicit: measure,
                          serieId: serie.id,
                          category: 'topografia',
                          options: magnitudesOptions().topografia,
                        }
                      "
                    />
                  }

                  <!-- Magnitudes y registros de municiones -->
                  <inta-multi-select-searchable
                    [label]="'Magnitudes y registros de municiones'"
                    [placeholder]="'Selecciona magnitudes y/o registros'"
                    [options]="magnitudesOptions().municiones"
                    [selectedValues]="serie.municiones"
                    (selectedValuesChange)="onCategoryChange(serie.id, 'municiones', $event)"
                    (toggleFavorite)="onToggleFavorite($event)"
                  />
                  @for (measure of serie.municiones; track measure.id) {
                    <ng-container
                      *ngTemplateOutlet="
                        measureLimitCard;
                        context: {
                          $implicit: measure,
                          serieId: serie.id,
                          category: 'municiones',
                          options: magnitudesOptions().municiones,
                        }
                      "
                    />
                  }

                  <!-- Magnitudes y registros de armamento -->
                  <inta-multi-select-searchable
                    [label]="'Magnitudes y registros de armamento'"
                    [placeholder]="'Selecciona magnitudes y/o registros'"
                    [options]="magnitudesOptions().armamento"
                    [selectedValues]="serie.armamento"
                    (selectedValuesChange)="onCategoryChange(serie.id, 'armamento', $event)"
                    (toggleFavorite)="onToggleFavorite($event)"
                  />
                  @for (measure of serie.armamento; track measure.id) {
                    <ng-container
                      *ngTemplateOutlet="
                        measureLimitCard;
                        context: {
                          $implicit: measure,
                          serieId: serie.id,
                          category: 'armamento',
                          options: magnitudesOptions().armamento,
                        }
                      "
                    />
                  }

                  <!-- Magnitudes y registros de balística -->
                  <inta-multi-select-searchable
                    [label]="'Magnitudes y registros de balística'"
                    [placeholder]="'Selecciona magnitudes y/o registros'"
                    [options]="magnitudesOptions().balistica"
                    [selectedValues]="serie.balistica"
                    (selectedValuesChange)="onCategoryChange(serie.id, 'balistica', $event)"
                    (toggleFavorite)="onToggleFavorite($event)"
                  />
                  @for (measure of serie.balistica; track measure.id) {
                    <ng-container
                      *ngTemplateOutlet="
                        measureLimitCard;
                        context: {
                          $implicit: measure,
                          serieId: serie.id,
                          category: 'balistica',
                          options: magnitudesOptions().balistica,
                        }
                      "
                    />
                  }
                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>
        }

        <div class="flex justify-end gap-3 mt-6">
          <button mat-stroked-button [disabled]="isSaving()" (click)="cancel()">Cancelar</button>
          <button mat-flat-button [disabled]="isSaving() || !seriesForm().valid()" (click)="save()">
            @if (isSaving()) {
              <ng-container>
                <mat-icon class="animate-spin mr-2">sync</mat-icon>
              </ng-container>
            }
            {{ isSaving() ? 'Guardando...' : 'Guardar borrador' }}
          </button>
        </div>
      }

      <!-- Measure limit card template -->
      <ng-template let-measure let-serieId="serieId" let-category="category" let-options="options" #measureLimitCard>
        <div>
          <div class="flex items-center justify-between py-1">
            <span class="font-semibold text-sm text-gray-900">
              {{ getMeasureName(measure.id, options) }}
            </span>
            <div class="flex items-center">
              <button
                mat-icon-button
                type="button"
                class="!text-gray-500 hover:!text-red-500"
                (click)="removeMeasure(serieId, category, measure.id)"
              >
                <mat-icon>delete</mat-icon>
              </button>
              <button
                mat-icon-button
                type="button"
                class="!text-gray-500"
                (click)="toggleMeasureExpanded(serieId, category, measure.id)"
              >
                <mat-icon>{{ measure.expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            </div>
          </div>
          @if (measure.expanded) {
            <div class="grid grid-cols-3 gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Límite máximo</mat-label>
                <input
                  placeholder="Escribe aquí el límite máximo"
                  matInput
                  type="number"
                  [ngModel]="measure.maxLimit"
                  (ngModelChange)="updateLimit(serieId, category, measure.id, 'maxLimit', $event)"
                />
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Límite mínimo</mat-label>
                <input
                  placeholder="Escribe aquí el límite mínimo"
                  matInput
                  type="number"
                  [ngModel]="measure.minLimit"
                  (ngModelChange)="updateLimit(serieId, category, measure.id, 'minLimit', $event)"
                />
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Desviación</mat-label>
                <input
                  placeholder="Escribe aquí la desviación"
                  matInput
                  type="number"
                  [ngModel]="measure.deviation"
                  (ngModelChange)="updateLimit(serieId, category, measure.id, 'deviation', $event)"
                />
              </mat-form-field>
            </div>
          }
        </div>
      </ng-template>
    </div>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Measures {
  readonly #measuresStore = inject(MeasuresStore);
  readonly #planningGeneralDataStore = inject(PlanningGeneralDataStore);
  readonly #seriesStore = inject(SeriesAndShotsStore);

  readonly seriesConfiguration = signal<boolean>(false);
  readonly seriesSignal = signal<SerieData[]>([]);

  readonly isLoading = this.#measuresStore.isLoading;
  readonly isSaving = this.#measuresStore.isUpdatingMeasures;
  readonly updateStatus = this.#measuresStore.updateMeasuresStatus;

  readonly isAddingFavorite = this.#measuresStore.isAddingFavorite;
  readonly addFavoriteStatus = this.#measuresStore.addFavoriteStatus;
  readonly isRemovingFavorite = this.#measuresStore.isRemovingFavorite;
  readonly removeFavoriteStatus = this.#measuresStore.removeFavoriteStatus;

  readonly trialCode = computed(() => this.#planningGeneralDataStore.fireTrialCode());
  readonly trialStatus = computed(() => this.#planningGeneralDataStore.fireTrial()?.status);

  readonly magnitudesOptions = computed<MagnitudesOptions>(() => {
    const catalog = this.#measuresStore.measuresCatalog();

    if (catalog.length > 0) {
      const options = catalog.map((item) => ({
        id: item.id,
        name: item.label ?? (typeof item.name === 'string' ? item.name : ''),
        active: item.active,
        favorite: item.favorite,
      }));
      return {
        topografia: options,
        municiones: options,
        armamento: options,
        balistica: options,
      };
    }

    return {
      topografia: [],
      municiones: [],
      armamento: [],
      balistica: [],
    };
  });

  #initialSeriesData: SerieData[] = [];
  #isLocalInitialized = false;

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
      const planningSeries = this.#seriesStore.series();
      const measuresSeries = this.#measuresStore.seriesMeasures();

      if (planningSeries) {
        const mergedSeries = planningSeries.map((pSerie) => {
          const config = measuresSeries?.find((mSerie) => mSerie.seriesId === pSerie.id);

          return {
            id: pSerie.id,
            nombre: pSerie.name,
            expanded: false,
            topografia:
              config?.measures.topographyMeasures.map((m) => ({
                id: m.id,
                minLimit: m.minLimit ?? null,
                maxLimit: m.maxLimit ?? null,
                deviation: m.deviation ?? null,
                expanded: true,
              })) ?? [],
            municiones:
              config?.measures.munitionsMeasures.map((m) => ({
                id: m.id,
                minLimit: m.minLimit ?? null,
                maxLimit: m.maxLimit ?? null,
                deviation: m.deviation ?? null,
                expanded: true,
              })) ?? [],
            armamento:
              config?.measures.armamentMeasures.map((m) => ({
                id: m.id,
                minLimit: m.minLimit ?? null,
                maxLimit: m.maxLimit ?? null,
                deviation: m.deviation ?? null,
                expanded: true,
              })) ?? [],
            balistica:
              config?.measures.ballisticsMeasures.map((m) => ({
                id: m.id,
                minLimit: m.minLimit ?? null,
                maxLimit: m.maxLimit ?? null,
                deviation: m.deviation ?? null,
                expanded: true,
              })) ?? [],
          };
        });

        if (!this.#isLocalInitialized) {
          this.seriesSignal.set(mergedSeries);
          this.#initialSeriesData = this.#deepClone(mergedSeries);
          this.#isLocalInitialized = true;
        } else {
          this.seriesSignal.update((current) => {
            return mergedSeries.map((newSerie) => {
              const existing = current.find((c) => c.id === newSerie.id);
              if (existing) return existing;
              return newSerie;
            });
          });
          this.#initialSeriesData = this.#deepClone(mergedSeries);
        }
      }
    });

    effect(() => {
      const status = this.updateStatus();
      if (status === 'resolved') {
        console.log('Measures saved successfully');
        this.#measuresStore.resetUpdateMeasures();
        this.#measuresStore.reloadMeasures();
        this.#initialSeriesData = this.#deepClone(this.seriesSignal());
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
    this.seriesSignal.update((series) => series.map((s) => (s.id === serieId ? { ...s, [category]: newValues } : s)));
  }

  getMeasureName(id: string, options: { id: string; name: string }[]): string {
    return options.find((o) => o.id === id)?.name ?? id;
  }

  toggleMeasureExpanded(
    serieId: string,
    category: 'topografia' | 'municiones' | 'armamento' | 'balistica',
    measureId: string,
  ): void {
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
    if (event.isFavorite) {
      this.#measuresStore.addFavorite(event.id);
    } else {
      this.#measuresStore.removeFavorite(event.id);
    }
  }

  toggleConfigBySerie(): void {
    const newStatus = !this.seriesConfiguration();
    this.seriesConfiguration.set(newStatus);
  }

  save(): void {
    if (!this.seriesForm().valid()) {
      return;
    }
    const request = this.#mapLocalToRequest(this.seriesSignal());
    this.#measuresStore.updateMeasures(request);
  }

  cancel(): void {
    this.seriesSignal.set(this.#deepClone(this.#initialSeriesData));
  }

  #deepClone(data: SerieData[]): SerieData[] {
    return JSON.parse(JSON.stringify(data));
  }

  #mapLocalToRequest(data: SerieData[]): MeasuresBulkUpdateRequest {
    return {
      series: data.map((item) => ({
        seriesId: item.id,
        measures: {
          topographyMeasures: item.topografia.map((m) => ({
            id: m.id,
            minLimit: m.minLimit,
            maxLimit: m.maxLimit,
            deviation: m.deviation,
          })),
          munitionsMeasures: item.municiones.map((m) => ({
            id: m.id,
            minLimit: m.minLimit,
            maxLimit: m.maxLimit,
            deviation: m.deviation,
          })),
          armamentMeasures: item.armamento.map((m) => ({
            id: m.id,
            minLimit: m.minLimit,
            maxLimit: m.maxLimit,
            deviation: m.deviation,
          })),
          ballisticsMeasures: item.balistica.map((m) => ({
            id: m.id,
            minLimit: m.minLimit,
            maxLimit: m.maxLimit,
            deviation: m.deviation,
          })),
        },
      })),
    };
  }
}

import { NgTemplateOutlet } from '@angular/common';
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

import { type MasterDataMeasureItem, MeasuresStore } from '../../+state/measures.store';
import { PlanningGeneralDataStore } from '../../+state/planning-general-data.store';
import { SeriesAndShotsStore } from '../../+state/series-and-shots.store';
import type { MagnitudesOptions, MeasureSelectionData, SerieData } from '../../utils-models/measure-serie.model';
import type { MeasureData, MeasuresBulkUpdateRequest, SeriesMeasuresData } from '../../utils-models/measures.model';
import type { Serie } from '../../utils-models/series-and-shots.model';
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
          <div class="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <div class="flex flex-col space-y-4">
              <!-- Magnitudes y registros de topografía -->
              <inta-multi-select-searchable
                [label]="'Magnitudes y registros de topografía'"
                [placeholder]="'Selecciona magnitudes y/o registros'"
                [options]="magnitudesOptions().topografia"
                [selectedValues]="seriesSignal()[0].topografia"
                [disabled]="readonly()"
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
                [disabled]="readonly()"
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
                [disabled]="readonly()"
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
                [disabled]="readonly()"
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
                    [disabled]="readonly()"
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
                    [disabled]="readonly()"
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
                    [disabled]="readonly()"
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
                    [disabled]="readonly()"
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
          @if (!readonly()) {
            <button mat-stroked-button [disabled]="isSaving()" (click)="cancel()">Cancelar</button>
            <button mat-flat-button [disabled]="isSaving() || !seriesForm().valid()" (click)="save()">
              @if (isSaving()) {
                <ng-container>
                  <mat-icon class="animate-spin mr-2">sync</mat-icon>
                </ng-container>
              }
              {{ isSaving() ? 'Guardando...' : 'Guardar borrador' }}
            </button>
          }
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
                [disabled]="readonly()"
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
          @if (measure.expanded && isQuantitative(measure.id)) {
            <div class="grid grid-cols-3 gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Límite máximo</mat-label>
                <input
                  placeholder="Escribe aquí el límite máximo"
                  matInput
                  type="number"
                  [ngModel]="measure.maxLimit"
                  [disabled]="readonly()"
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
                  [disabled]="readonly()"
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
                  [disabled]="readonly()"
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
  /** Si true, el componente está en modo solo lectura (el usuario no puede editar) */
  readonly readonly = input<boolean>(false);

  readonly #measuresStore = inject(MeasuresStore);
  readonly #planningGeneralDataStore = inject(PlanningGeneralDataStore);
  readonly #seriesStore = inject(SeriesAndShotsStore);

  readonly seriesConfiguration = signal<boolean>(false);

  readonly #backendData = computed(() => {
    const planningSeries = this.#seriesStore.series();
    const measuresSeries = this.#measuresStore.seriesMeasures();
    return { planningSeries, measuresSeries };
  });

  readonly seriesSignal = linkedSignal({
    source: () => this.#backendData(),
    computation: (data) => {
      if (!data.planningSeries) return [];
      return this.#mapResponseToLocal(data.planningSeries, data.measuresSeries);
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

  readonly magnitudesOptions = computed<MagnitudesOptions>(() => {
    const catalog = this.#measuresStore.measuresCatalog();

    if (catalog.length > 0) {
      const mapItem = (item: MasterDataMeasureItem) => ({
        id: item.id,
        name:
          item.label ??
          (typeof item.magnitude === 'object'
            ? item.magnitude['es'] || item.magnitude['en'] || ''
            : item.magnitude || ''),
        active: item.active,
        favorite: item.favorite,
      });

      return {
        topografia: catalog.filter((item) => item.unit === 'TOPOGRAPHY').map(mapItem),
        municiones: catalog.filter((item) => item.unit === 'MUNITIONS').map(mapItem),
        armamento: catalog.filter((item) => item.unit === 'ARMAMENT').map(mapItem),
        balistica: catalog.filter((item) => item.unit === 'BALLISTICS').map(mapItem),
      };
    }

    return {
      topografia: [],
      municiones: [],
      armamento: [],
      balistica: [],
    };
  });

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
    const request = this.#mapLocalToRequest(this.seriesSignal());
    this.#measuresStore.updateMeasures(request);
  }

  cancel(): void {
    if (this.readonly()) {
      return;
    }
    const data = this.#backendData();
    if (data.planningSeries) {
      this.seriesSignal.set(this.#mapResponseToLocal(data.planningSeries, data.measuresSeries));
    }
  }

  #mapResponseToLocal(planningSeries: Serie[], measuresSeries?: SeriesMeasuresData[]): SerieData[] {
    return planningSeries.map((pSerie) => {
      const config = measuresSeries?.find((mSerie) => mSerie.seriesId === pSerie.id);

      return {
        id: pSerie.id,
        nombre: pSerie.name,
        expanded: false,
        topografia:
          config?.measures?.topographyMeasures?.map((m: MeasureData) => ({
            id: m.id,
            minLimit: m.minLimit ?? null,
            maxLimit: m.maxLimit ?? null,
            deviation: m.deviation ?? null,
            expanded: true,
          })) ?? [],
        municiones:
          config?.measures?.munitionsMeasures?.map((m: MeasureData) => ({
            id: m.id,
            minLimit: m.minLimit ?? null,
            maxLimit: m.maxLimit ?? null,
            deviation: m.deviation ?? null,
            expanded: true,
          })) ?? [],
        armamento:
          config?.measures?.armamentMeasures?.map((m: MeasureData) => ({
            id: m.id,
            minLimit: m.minLimit ?? null,
            maxLimit: m.maxLimit ?? null,
            deviation: m.deviation ?? null,
            expanded: true,
          })) ?? [],
        balistica:
          config?.measures?.ballisticsMeasures?.map((m: MeasureData) => ({
            id: m.id,
            minLimit: m.minLimit ?? null,
            maxLimit: m.maxLimit ?? null,
            deviation: m.deviation ?? null,
            expanded: true,
          })) ?? [],
      };
    });
  }

  #mapLocalToRequest(data: SerieData[]): MeasuresBulkUpdateRequest {
    const useCommonConfig = !this.seriesConfiguration();
    const commonSource = useCommonConfig && data.length > 0 ? data[0] : null;

    return {
      series: data.map((item) => {
        const source = commonSource ?? item;
        return {
          seriesId: item.id,
          measures: {
            topographyMeasures: source.topografia.map((m) => ({
              id: m.id,
              minLimit: m.minLimit,
              maxLimit: m.maxLimit,
              deviation: m.deviation,
            })),
            munitionsMeasures: source.municiones.map((m) => ({
              id: m.id,
              minLimit: m.minLimit,
              maxLimit: m.maxLimit,
              deviation: m.deviation,
            })),
            armamentMeasures: source.armamento.map((m) => ({
              id: m.id,
              minLimit: m.minLimit,
              maxLimit: m.maxLimit,
              deviation: m.deviation,
            })),
            ballisticsMeasures: source.balistica.map((m) => ({
              id: m.id,
              minLimit: m.minLimit,
              maxLimit: m.maxLimit,
              deviation: m.deviation,
            })),
          },
        };
      }),
    };
  }
}

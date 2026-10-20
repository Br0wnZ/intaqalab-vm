import { type Signal, computed, inject } from '@angular/core';

import type { PlanningSeriesItem, PlanningSeriesShotItem } from '../models/planning-series.model';
import { PlanningSeriesService } from '../queries/planning-series.service';
import { flattenSeriesShots, getSeriesById } from './planning-selectors';

/**
 * Handle expuesto por `injectTrialShots()`.
 * Representa las series de la prueba con todos sus disparos.
 */
export interface TrialShotsHandle {
  /** Todas las series de la prueba (null hasta que llegue la respuesta). */
  series: Signal<PlanningSeriesItem[] | null>;
  /** Todos los disparos de la prueba aplanados y ordenados por `globalNumber` ascendente. */
  shots: Signal<PlanningSeriesShotItem[]>;
  /** Disparo actual visible en la ejecución (globalNumber = current + 1 = numeración 1..N). */
  isLoading: Signal<boolean>;
  /** Error HTTP de la query de series, si lo hay. */
  error: Signal<Error | null>;
  /** Busca una serie por su id. */
  findSeries: (seriesId: string) => PlanningSeriesItem | undefined;
  /** Busca un disparo por su id en todas las series. */
  findShot: (shotId: string) => PlanningSeriesShotItem | undefined;
  /** Disparos de una serie concreta, ordenados por `globalNumber`. */
  shotsOfSeries: (seriesId: string) => PlanningSeriesShotItem[];
}

/**
 * Helper inyectable que aplica el patrón "selector de serie y disparo" definido en el
 * análisis funcional: las series y sus disparos provienen del GET de series de planning y se
 * identifican por `globalNumber`.
 *
 * Reemplaza la duplicación de este patrón en los componentes de ejecución.
 *
 * @example
 * ```ts
 * readonly shotsHandle = injectTrialShots();
 * // template: this.shotsHandle.shots() para poblar <mat-select> de disparos
 * // this.shotsHandle.findShot(shotId) para resolver el disparo seleccionado
 * ```
 */
export function injectTrialShots(seriesService?: PlanningSeriesService): TrialShotsHandle {
  const service = seriesService ?? inject(PlanningSeriesService);

  const series = computed<PlanningSeriesItem[] | null>(() => {
    if (!service.seriesResource.hasValue()) return null;
    const value = service.seriesResource.value();
    return Array.isArray(value) ? value : null;
  });

  const shots = computed<PlanningSeriesShotItem[]>(() => flattenSeriesShots(series()));

  return {
    series,
    shots,
    isLoading: computed(() => service.seriesResource.isLoading()),
    error: computed<Error | null>(() => service.seriesResource.error() ?? null),
    findSeries: (seriesId: string) => getSeriesById(series(), seriesId),
    findShot: (shotId: string) => shots().find((shot) => shot.id === shotId),
    shotsOfSeries: (seriesId: string) => {
      const serie = getSeriesById(series(), seriesId);
      return flattenSeriesShots(serie ? [serie] : []);
    },
  };
}

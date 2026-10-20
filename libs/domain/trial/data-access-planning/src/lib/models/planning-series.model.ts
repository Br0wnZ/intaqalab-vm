/**
 * Modelos del GET `/fire-trials/{fireTrialId}/planning/series` (Swagger planning-api v1.3.0 → SeriesResponse).
 * Fuente única compartida por los dominios de planning y execution.
 */
export type PlanningSeriesShotItem = {
  id: string;
  /** Número global del disparo en la prueba (secuencia 1..N entre todas las series). */
  globalNumber?: number;
  observation?: string | null;
};

export type PlanningSeriesItem = {
  id: string;
  name: string;
  shotQuantity?: number;
  executionOrder?: number;
  observations?: string;
  shots?: PlanningSeriesShotItem[] | null;
};

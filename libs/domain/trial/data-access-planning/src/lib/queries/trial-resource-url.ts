import type { PlanningTrialContext } from '../context/trial-context.service';

/**
 * Construye la URL de un recurso por prueba a partir del contexto compartido.
 * Si el contexto aporta `centerId`, antepone el prefijo estándar `centers/{centerId}`
 * del API OpenAPI; si no, mantiene la URL base vigente de `injectPlanningEndpoint`.
 *
 * @param planningUrl URL base del planning endpoint (p. ej. `injectPlanningEndpoint()`).
 * @param context contexto compartido de la prueba.
 * @param relativePath ruta relativa tras el trial, p. ej. `planning/series`.
 */
export function buildTrialResourceUrl(
  planningUrl: string,
  context: PlanningTrialContext,
  relativePath: string,
): string {
  const centerPrefix = context.centerId ? `centers/${context.centerId}/` : '';
  return `${planningUrl}/${centerPrefix}fire-trials/${context.fireTrialId}/${relativePath}`;
}

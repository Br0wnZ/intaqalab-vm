/**
 * Constructores puros de URLs para los servicios de acceso a datos de ejecución.
 * Centralizan el contrato de rutas y permiten probarlas sin `TestBed`.
 */

export type PathSegment = string | number;

function joinSegments(baseUrl: string, segments: readonly PathSegment[]): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const path = segments
    .map((segment) => String(segment).replace(/^\/+|\/+$/g, ''))
    .filter((segment) => segment.length > 0)
    .join('/');

  return path.length > 0 ? `${normalizedBase}/${path}` : normalizedBase;
}

/** URL bajo `fire-trials/{fireTrialId}/execution/...`. */
export function executionTrialUrl(baseUrl: string, fireTrialId: string, ...segments: readonly PathSegment[]): string {
  return joinSegments(baseUrl, ['fire-trials', fireTrialId, 'execution', ...segments]);
}

/** URL bajo `{fireTrialId}/...` sobre una base que ya incluye `/fire-trials`. */
export function fireTrialUrl(baseUrl: string, fireTrialId: string, ...segments: readonly PathSegment[]): string {
  return joinSegments(baseUrl, [fireTrialId, ...segments]);
}

/** URL bajo el endpoint de planificación. */
export function planningUrl(baseUrl: string, ...segments: readonly PathSegment[]): string {
  return joinSegments(baseUrl, segments);
}

/** URL bajo el endpoint de almacén. */
export function warehouseUrl(baseUrl: string, ...segments: readonly PathSegment[]): string {
  return joinSegments(baseUrl, segments);
}

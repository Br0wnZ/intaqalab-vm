import type { BackendMunitionComponent, TrialMunitionsRawItem } from '@intaqalab/data-access-planning';

const FUSE_TYPE_TOKENS = new Set(['FUZE', 'FUSE', 'ESPOLETA']);

/**
 * Determina si un componente de munición corresponde a una espoleta.
 * Acepta referencias hidratadas (`type`) o id-planas (`typeId`), y cae al
 * label o a la presencia de datos de espoleta cuando no hay tipo.
 */
export function isEspoletaComponent(component: BackendMunitionComponent): boolean {
  const typeStr = (component.type?.type ?? component.typeId?.type ?? '').toUpperCase();
  const label = (component.type?.label ?? component.typeId?.label ?? '').toLowerCase();

  if (typeStr) {
    return FUSE_TYPE_TOKENS.has(typeStr);
  }

  if (label) {
    return label.includes('espoleta') || label.includes('fuze') || label.includes('fuse');
  }

  return typeof component.fuseMeasurement === 'number' || Boolean(component.fuseWorkingModeId);
}

/**
 * Devuelve la graduación de espoleta planificada para un disparo concreto.
 * Las configuraciones sin `assignedShotIds` aplican a todos los disparos de la serie.
 */
export function selectFuseMeasurement(
  response: TrialMunitionsRawItem,
  seriesId: string,
  shotId: string,
): number | null {
  const series = response.series.find((item) => item.seriesId === seriesId);
  if (!series) return null;

  for (const configuration of series.configurations) {
    const assignedShotIds = configuration.assignedShotIds ?? [];
    if (assignedShotIds.length > 0 && !assignedShotIds.includes(shotId)) {
      continue;
    }

    for (const component of configuration.components) {
      if (isEspoletaComponent(component) && typeof component.fuseMeasurement === 'number') {
        return component.fuseMeasurement;
      }
    }
  }

  return null;
}

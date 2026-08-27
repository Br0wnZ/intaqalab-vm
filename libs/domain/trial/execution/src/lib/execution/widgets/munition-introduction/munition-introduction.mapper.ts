import type { TimeUnitEnum, WeightUnitEnum } from '@intaqalab/models';

import type {
  MunitionIntroAcondicionamientoState,
  MunitionIntroIdentificationState,
  MunitionIntroPesosState,
} from '../../../+state/execution-state.models';
import type {
  ShotMunitionComponentRequest,
  ShotMunitionComponentResponse,
  ShotMunitionRequest,
  ShotMunitionResponse,
} from '../../models';

export type InputFieldValue = { value: string; unit: string } | null;

/**
 * Convierte un número y unidad a la estructura de InputSelect.
 */
export function numToField(value: number | null | undefined, unit = 'g'): InputFieldValue {
  if (value === null || value === undefined) return null;
  return { value: value.toString(), unit };
}

/**
 * Parsea el valor string de un InputSelect a número o null.
 */
export function parseNum(field: InputFieldValue): number | null {
  if (!field || (!field.value && field.value !== '0')) return null;
  const n = parseFloat(field.value.toString().replace(',', '.'));
  return isNaN(n) ? null : n;
}

/**
 * Mapea las series de planificación a opciones para el selector.
 */
export function mapPlanningSeriesToOptions(
  planningSeries?: Array<{ id: string; name?: string | null }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> {
  if (planningSeries?.length) {
    return planningSeries.map((serie, index) => ({
      value: serie.id,
      label: serie.name?.trim() || `Serie ${index + 1}`,
    }));
  }
  return fallbackOptions;
}

/**
 * Mapea los disparos de una serie a opciones para el selector.
 */
export function mapShotsToDisparoOptions(
  shots?: Array<{ shotId?: string; id?: string }> | null,
  fallbackOptions: Array<{ value: string; label: string }> = [],
): Array<{ value: string; label: string }> {
  if (shots?.length) {
    return shots.map((shot, index) => ({
      value: shot.shotId ?? shot.id ?? `disparo-${index + 1}`,
      label: `Disparo ${index + 1}`,
    }));
  }
  return fallbackOptions;
}

function resolveBalanzaValue(balanceId: number | string | null | undefined): string | null {
  if (balanceId === null || balanceId === undefined) return null;
  const str = String(balanceId);
  if (str === '21031' || str === 'bal-01') return 'bal-01';
  if (str === '21032' || str === 'bal-02') return 'bal-02';
  return str;
}

function resolveCamaraValue(climaticChamberId: number | string | null | undefined): string | null {
  if (climaticChamberId === null || climaticChamberId === undefined) return null;
  const str = String(climaticChamberId);
  if (str === '21045' || str === 'camara-01') return 'camara-01';
  if (str === '21046' || str === 'camara-02') return 'camara-02';
  if (str === 'sala-01') return 'sala-01';
  return str;
}

/**
 * Mapea la respuesta remota ShotMunitionResponse al estado de los 3 tabs.
 */
export function mapRemoteToMunitionState(
  response: ShotMunitionResponse | null | undefined,
  fallbackComponentId?: string | null,
): {
  identificacion: Partial<MunitionIntroIdentificationState>;
  pesos: Partial<MunitionIntroPesosState>;
  acondicionamiento: Partial<MunitionIntroAcondicionamientoState>;
} {
  const components = response?.munitionData ?? [];
  if (components.length === 0) {
    return {
      identificacion: {},
      pesos: {},
      acondicionamiento: {},
    };
  }

  // Si se pasa fallbackComponentId, buscamos ese componente; si no, tomamos el primero
  const targetComponent: ShotMunitionComponentResponse =
    (fallbackComponentId ? components.find((c) => c.componentId === fallbackComponentId) : null) ?? components[0];

  const ident = targetComponent.identificationData;
  const weights = targetComponent.weightData;
  const cond = targetComponent.conditioningData;

  return {
    identificacion: {
      componente: targetComponent.componentId,
      denominacion: ident?.denominationId ?? null,
      lote: ident?.batch ?? null,
      numeroCliente: ident?.clientNumber ?? null,
      modoFuncionamiento: ident?.fuseWorkingModeId ?? null,
      graduacionEspoleta: ident?.fuseGraduation ?? null,
      observaciones: ident?.observations ?? null,
    },
    pesos: {
      componente: targetComponent.componentId,
      balanza: resolveBalanzaValue(weights?.balanceId),
      peso: weights?.weight ?? null,
      pesoAnadido: weights?.weightAdded ?? null,
      pesoRetirado: weights?.weightRemoved ?? null,
      fechaHora: weights?.weighingDateTime ?? null,
      rangoPesada: weights?.weighingRange ?? null,
      observaciones: weights?.observations ?? null,
    },
    acondicionamiento: {
      camara: resolveCamaraValue(cond?.climaticChamberId),
      componente: targetComponent.componentId,
      fechaHoraEntrada: cond?.chamberEntryDateTime ? cond.chamberEntryDateTime.substring(0, 16) : null,
      fechaHoraSalida: cond?.chamberExitDateTime ? cond.chamberExitDateTime.substring(0, 16) : null,
      temperatura: cond?.temperature ?? null,
      temperaturaCorregida: cond?.programmedTemperature ?? null,
      observaciones: cond?.observations ?? null,
    },
  };
}

/**
 * Convierte el estado actual de las tabs en una petición ShotMunitionRequest.
 */
export function mapMunitionStateToRequest(params: {
  componentId: string;
  identificacion: Partial<MunitionIntroIdentificationState>;
  pesos: Partial<MunitionIntroPesosState>;
  acondicionamiento: Partial<MunitionIntroAcondicionamientoState>;
  existingComponents?: ShotMunitionComponentRequest[];
}): ShotMunitionRequest {
  const { componentId, identificacion, pesos, acondicionamiento, existingComponents = [] } = params;

  let balanceId: number | null = null;
  if (pesos.balanza === 'bal-01') {
    balanceId = 21031;
  } else if (pesos.balanza === 'bal-02') {
    balanceId = 21032;
  } else if (pesos.balanza) {
    balanceId = Number(pesos.balanza) || null;
  }

  let climaticChamberId: number | null = null;
  if (acondicionamiento.camara === 'camara-01') {
    climaticChamberId = 21045;
  } else if (acondicionamiento.camara === 'camara-02') {
    climaticChamberId = 21046;
  } else if (acondicionamiento.camara) {
    climaticChamberId = Number(acondicionamiento.camara) || null;
  }

  const currentComponent: ShotMunitionComponentRequest = {
    componentId,
    identificationData: {
      denominationId: identificacion.denominacion ?? null,
      batch: identificacion.lote ?? null,
      clientNumber: identificacion.numeroCliente ?? null,
      fuseWorkingModeId: identificacion.modoFuncionamiento ?? null,
      fuseGraduation: identificacion.graduacionEspoleta ?? null,
      fuseGraduationUnit: 'S' as TimeUnitEnum,
      observations: identificacion.observaciones ?? null,
    },
    weightData: {
      balanceId,
      weight: pesos.peso ?? null,
      weightUnit: 'G' as WeightUnitEnum,
      weightAdded: pesos.pesoAnadido ?? null,
      weightAddedUnit: 'G' as WeightUnitEnum,
      weightRemoved: pesos.pesoRetirado ?? null,
      weightRemovedUnit: 'G' as WeightUnitEnum,
      weighingDateTime: pesos.fechaHora ?? null,
      observations: pesos.observaciones ?? null,
    },
    conditioningData: {
      climaticChamberId,
      chamberEntryDateTime: acondicionamiento.fechaHoraEntrada ?? null,
      chamberExitDateTime: acondicionamiento.fechaHoraSalida ?? null,
      observations: acondicionamiento.observaciones ?? null,
    },
  };

  const otherComponents = existingComponents.filter((c) => c.componentId !== componentId);

  return {
    components: [currentComponent, ...otherComponents],
  };
}

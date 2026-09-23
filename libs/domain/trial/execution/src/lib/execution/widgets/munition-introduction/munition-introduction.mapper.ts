import type { TimeUnitEnum, WeightUnitEnum } from '@intaqalab/models';

import type {
  MunitionIntroAcondicionamientoState,
  MunitionIntroIdentificationState,
  MunitionIntroWeightState,
} from '../../../+state/execution-state.models';
import type {
  ShotMunitionComponentRequest,
  ShotMunitionComponentResponse,
  ShotMunitionRequest,
  ShotMunitionResponse,
} from '../../models';

export type InputFieldValue = { value: string; unit: string } | null;

/**
 * Converts a number + unit to InputSelect structure.
 */
export function numToField(value: number | null | undefined, unit = 'g'): InputFieldValue {
  if (value === null || value === undefined) return null;
  return { value: value.toString(), unit };
}

/**
 * Parses the string value of an InputSelect to number or null.
 */
export function parseNum(field: InputFieldValue): number | null {
  if (!field || (!field.value && field.value !== '0')) return null;
  const n = parseFloat(field.value.toString().replace(',', '.'));
  return isNaN(n) ? null : n;
}

/**
 * Maps planning series to selector options.
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
 * Maps shots in a series to selector options.
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

// ─── ID resolution helpers ────────────────────────────────────────────────────

/**
 * Resolves a numeric Calibry balanceId (or an existing string key) to the
 * frontend option key used in balanzaOptions (e.g. 'bal-01').
 */
export function resolveBalanceKey(balanceId: number | string | null | undefined): string | null {
  if (balanceId === null || balanceId === undefined) return null;
  const str = String(balanceId);
  if (str === '21031' || str === 'bal-01') return 'bal-01';
  if (str === '21032' || str === 'bal-02') return 'bal-02';
  return str;
}

/**
 * Resolves a frontend balance key to the Calibry numeric balanceId for the PUT.
 */
function resolveBalanceId(balanceKey: string | null | undefined): number | null {
  if (!balanceKey) return null;
  if (balanceKey === 'bal-01') return 21031;
  if (balanceKey === 'bal-02') return 21032;
  return Number(balanceKey) || null;
}

function resolveCamaraValue(climaticChamberId: number | string | null | undefined): string | null {
  if (climaticChamberId === null || climaticChamberId === undefined) return null;
  const str = String(climaticChamberId);
  if (str === '21045' || str === 'camara-01') return 'camara-01';
  if (str === '21046' || str === 'camara-02') return 'camara-02';
  if (str === 'sala-01') return 'sala-01';
  return str;
}

function resolveCamaraId(camaraKey: string | null | undefined): number | null {
  if (!camaraKey) return null;
  if (camaraKey === 'camara-01') return 21045;
  if (camaraKey === 'camara-02') return 21046;
  return Number(camaraKey) || null;
}

// ─── mapRemoteToMunitionState ──────────────────────────────────────────────────

/**
 * Maps a ShotMunitionResponse (GET) to the three-tab state.
 *
 * For the Pesos tab, `weightData` is now an array (one entry per balance).
 * Returns `weightDataByBalance` — a map from balance key → MunitionIntroWeightState —
 * and `weight` as the first entry (or empty if none).
 */
export function mapRemoteToMunitionState(
  response: ShotMunitionResponse | null | undefined,
  fallbackComponentId?: string | null,
): {
  identificacion: Partial<MunitionIntroIdentificationState>;
  weight: Partial<MunitionIntroWeightState>;
  weightDataByBalance: Record<string, MunitionIntroWeightState>;
  acondicionamiento: Partial<MunitionIntroAcondicionamientoState>;
} {
  const components = response?.munitionData ?? [];
  if (components.length === 0) {
    return {
      identificacion: fallbackComponentId ? { componente: fallbackComponentId } : {},
      weight: fallbackComponentId ? { componente: fallbackComponentId, balance: null } : {},
      weightDataByBalance: {},
      acondicionamiento: fallbackComponentId ? { componente: fallbackComponentId } : {},
    };
  }

  const targetComponent =
    (fallbackComponentId ? components.find((c) => c.componentId === fallbackComponentId) : null) ??
    (fallbackComponentId ? null : components[0]);

  if (!targetComponent) {
    return {
      identificacion: {
        componente: fallbackComponentId ?? null,
        denominacion: null,
        lote: null,
        numeroCliente: null,
        modoFuncionamiento: null,
        graduacionEspoleta: null,
        observaciones: null,
      },
      weight: {
        componente: fallbackComponentId ?? null,
        balance: null,
        weight: null,
        weightAdded: null,
        weightRemoved: null,
        weighingDateTime: null,
        weighingRange: null,
        observations: null,
      },
      weightDataByBalance: {},
      acondicionamiento: {
        camara: null,
        componente: fallbackComponentId ?? null,
        fechaHoraEntrada: null,
        fechaHoraSalida: null,
        temperatura: null,
        temperaturaCorregida: null,
        observaciones: null,
      },
    };
  }

  const ident = targetComponent.identificationData;
  const cond = targetComponent.conditioningData;

  // Build weightDataByBalance from the array of weight entries
  const weightEntries = targetComponent.weightData ?? [];
  const weightDataByBalance: Record<string, MunitionIntroWeightState> = {};
  for (const entry of weightEntries) {
    const balanceKey = resolveBalanceKey(entry.balanceId);
    if (!balanceKey) continue;
    weightDataByBalance[balanceKey] = {
      componente: targetComponent.componentId,
      balance: balanceKey,
      weight: entry.weight ?? null,
      weightAdded: entry.weightAdded ?? null,
      weightRemoved: entry.weightRemoved ?? null,
      weighingDateTime: entry.weighingDateTime ?? null,
      weighingRange: entry.weighingRange ?? null,
      observations: entry.observations ?? null,
    };
  }

  // Active weight = first balance entry (or empty with null balance)
  const firstKey = Object.keys(weightDataByBalance)[0] ?? null;
  const activeWeight: Partial<MunitionIntroWeightState> = firstKey
    ? weightDataByBalance[firstKey]
    : { componente: targetComponent.componentId, balance: null };

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
    weight: activeWeight,
    weightDataByBalance,
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

// ─── mapMunitionStateToRequest ─────────────────────────────────────────────────

/**
 * Converts the current tab state into a ShotMunitionRequest (PUT body).
 *
 * `weightDataByBalance` contains all in-memory weight entries (one per balance)
 * and is serialized into a `weightData` array for the PUT request.
 */
export function mapMunitionStateToRequest(params: {
  componentId: string;
  identificacion: Partial<MunitionIntroIdentificationState>;
  weightDataByBalance: Record<string, MunitionIntroWeightState>;
  acondicionamiento: Partial<MunitionIntroAcondicionamientoState>;
  existingComponents?: (ShotMunitionComponentRequest | ShotMunitionComponentResponse)[];
}): ShotMunitionRequest {
  const { componentId, identificacion, weightDataByBalance, acondicionamiento, existingComponents = [] } = params;

  const normalizeDenominationId = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const denominationId = Number(value);
    return Number.isFinite(denominationId) ? denominationId : null;
  };

  // Build the weightData array from all in-memory balance entries
  const weightData = Object.values(weightDataByBalance).map((entry) => ({
    balanceId: resolveBalanceId(entry.balance),
    weight: entry.weight ?? null,
    weightUnit: 'G' as WeightUnitEnum,
    weightAdded: entry.weightAdded ?? null,
    weightAddedUnit: 'G' as WeightUnitEnum,
    weightRemoved: entry.weightRemoved ?? null,
    weightRemovedUnit: 'G' as WeightUnitEnum,
    weighingDateTime: entry.weighingDateTime ?? null,
    observations: entry.observations ?? null,
  }));

  const currentComponent: ShotMunitionComponentRequest = {
    componentId,
    identificationData: {
      denominationId: normalizeDenominationId(identificacion.denominacion),
      batch: identificacion.lote ?? null,
      clientNumber: identificacion.numeroCliente ?? null,
      fuseWorkingModeId: identificacion.modoFuncionamiento ?? null,
      fuseGraduation: identificacion.graduacionEspoleta ?? null,
      fuseGraduationUnit: 'S' as TimeUnitEnum,
      observations: identificacion.observaciones ?? null,
    },
    weightData: weightData.length > 0 ? weightData : null,
    conditioningData: {
      climaticChamberId: resolveCamaraId(acondicionamiento.camara),
      chamberEntryDateTime: acondicionamiento.fechaHoraEntrada ?? null,
      chamberExitDateTime: acondicionamiento.fechaHoraSalida ?? null,
      observations: acondicionamiento.observaciones ?? null,
    },
  };

  const otherComponents: ShotMunitionComponentRequest[] = existingComponents
    .filter((c) => c.componentId !== componentId)
    .map((c) => ({
      componentId: c.componentId,
      identificationData: c.identificationData
        ? {
            ...c.identificationData,
            denominationId: normalizeDenominationId(c.identificationData.denominationId),
          }
        : null,
      weightData:
        c.weightData?.map((w) => ({
          balanceId: w.balanceId,
          weight: w.weight,
          weightUnit: w.weightUnit,
          weightAdded: w.weightAdded,
          weightAddedUnit: w.weightAddedUnit,
          weightRemoved: w.weightRemoved,
          weightRemovedUnit: w.weightRemovedUnit,
          weighingDateTime: w.weighingDateTime,
          observations: w.observations,
        })) ?? null,
      conditioningData: c.conditioningData
        ? {
            climaticChamberId: c.conditioningData.climaticChamberId,
            chamberEntryDateTime: c.conditioningData.chamberEntryDateTime,
            chamberExitDateTime: c.conditioningData.chamberExitDateTime,
            observations: c.conditioningData.observations,
          }
        : null,
    }));

  return {
    components: [currentComponent, ...otherComponents],
  };
}

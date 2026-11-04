import { TrialStatus } from '@intaqalab/models';

/**
 * Capacidades de edición de la ejecución según el estado de la prueba.
 * Función pura y sin dependencias de Angular para poder testearla de forma aislada.
 */
export interface TrialExecutionCapabilities {
  /** Datos previos a la ejecución: configuración, equipos, medios, MAO, parámetros iniciales. */
  readonly canEditSetup: boolean;
  /** Actualización de los equipos participantes. */
  readonly canUpdateParticipatingEquipment: boolean;
  /** Registro de datos de nuevos disparos (solo con ejecución activa). */
  readonly canRegisterNewShots: boolean;
  /** Consulta, edición y completado de disparos ya ejecutados. */
  readonly canEditExecutedShots: boolean;
  /** Estado de consulta completa (todos los widgets en solo lectura). */
  readonly isReadOnly: boolean;
}

export interface TrialExecutionContext {
  /** `true` cuando hay un disparo activo en la store (`activeSerieId` y `activeShotId`). */
  readonly executionActive: boolean;
}

const PRE_EXECUTION: TrialExecutionCapabilities = {
  canEditSetup: true,
  canUpdateParticipatingEquipment: false,
  canRegisterNewShots: false,
  canEditExecutedShots: false,
  isReadOnly: false,
};

const READ_ONLY: TrialExecutionCapabilities = {
  canEditSetup: false,
  canUpdateParticipatingEquipment: false,
  canRegisterNewShots: false,
  canEditExecutedShots: false,
  isReadOnly: true,
};

const SHOTS_EDITABLE_ONLY: TrialExecutionCapabilities = {
  canEditSetup: false,
  canUpdateParticipatingEquipment: false,
  canRegisterNewShots: false,
  canEditExecutedShots: true,
  isReadOnly: false,
};

const CAPABILITIES_BY_STATUS: Partial<Record<TrialStatus, TrialExecutionCapabilities>> = {
  [TrialStatus.PLANNED]: PRE_EXECUTION,
  [TrialStatus.PREPARED]: PRE_EXECUTION,
  [TrialStatus.UNDER_REVIEW]: PRE_EXECUTION,
  [TrialStatus.IN_PROGRESS]: {
    canEditSetup: true,
    canUpdateParticipatingEquipment: true,
    canRegisterNewShots: true,
    canEditExecutedShots: true,
    isReadOnly: false,
  },
  [TrialStatus.INTERRUPTED]: SHOTS_EDITABLE_ONLY,
  [TrialStatus.EXECUTED]: SHOTS_EDITABLE_ONLY,
  [TrialStatus.CANCELLED]: SHOTS_EDITABLE_ONLY,
  [TrialStatus.ANALYZING]: READ_ONLY,
  [TrialStatus.FINALIZING]: READ_ONLY,
  [TrialStatus.CLOSED]: READ_ONLY,
};

/**
 * Resuelve las capacidades de ejecución para un estado de prueba.
 * - `STARTED` (Iniciada): solo permite registrar disparos si hay ejecución activa.
 * - Estados sin entrada conocida (p. ej. prueba aún no cargada) no permiten editar disparos.
 */
export function resolveTrialExecutionCapabilities(
  status: TrialStatus | string | null | undefined,
  context: TrialExecutionContext,
): TrialExecutionCapabilities {
  if (status === TrialStatus.STARTED) {
    return {
      canEditSetup: false,
      canUpdateParticipatingEquipment: false,
      canRegisterNewShots: context.executionActive,
      canEditExecutedShots: true,
      isReadOnly: false,
    };
  }

  if (!status) {
    return READ_ONLY;
  }

  return CAPABILITIES_BY_STATUS[status as TrialStatus] ?? READ_ONLY;
}

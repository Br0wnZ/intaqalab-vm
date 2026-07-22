import type { TrialStatus } from '@intaqalab/models';

type TrialStatusLike = TrialStatus | string | undefined;

const DEFAULT_TONE = 'bg-primary text-primary-foreground border-transparent';

const TRIAL_STATUS_TONES: Record<string, string> = {
  // Pre-ejecucion (azules)
  UNDER_REVIEW: 'bg-sky-100 text-sky-800 border-sky-300',
  PLANNED: 'bg-blue-100 text-blue-800 border-blue-300',
  PREPARED: 'bg-blue-100 text-blue-800 border-blue-300',

  // Durante ejecucion (naranjas)
  STARTED: 'bg-amber-100 text-amber-800 border-amber-300',
  IN_PROGRESS: 'bg-orange-100 text-orange-800 border-orange-300',
  INTERRUPTED: 'bg-orange-200 text-orange-900 border-orange-400',

  // Finalizada (verdes)
  EXECUTED: 'bg-green-100 text-green-800 border-green-300',
  ANALYZING: 'bg-lime-100 text-lime-800 border-lime-300',
  FINALIZING: 'bg-emerald-100 text-emerald-800 border-emerald-300',

  // Estados administrativos
  CLOSED: 'bg-gray-100 text-gray-700 border-gray-300',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
  VOIDED: 'bg-red-100 text-red-700 border-red-300',
};

const SPANISH_STATUS_ALIASES: Record<string, string> = {
  'En estudio': 'UNDER_REVIEW',
  Planificada: 'PLANNED',
  'En curso': 'IN_PROGRESS',
  Interrumpida: 'INTERRUPTED',
  Iniciada: 'STARTED',
  Ejecutada: 'EXECUTED',
  Analizando: 'ANALYZING',
  Finalizando: 'FINALIZING',
  Cerrada: 'CLOSED',
  Cancelada: 'CANCELLED',
  Anulada: 'VOIDED',
};

export function getTrialStatusToneClass(status: TrialStatusLike): string {
  if (!status) {
    return DEFAULT_TONE;
  }

  const canonicalStatus = SPANISH_STATUS_ALIASES[status] ?? status;
  return TRIAL_STATUS_TONES[canonicalStatus] ?? DEFAULT_TONE;
}

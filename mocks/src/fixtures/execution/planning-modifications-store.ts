import { randomUUID } from 'node:crypto';

import { getFixture } from '../../utils';

export type ModificationAction = 'Alta' | 'Baja' | 'Modificación';
export type ModificationStatus = 'BORRADOR' | 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';
export type ModificationClassification = 'acepta' | 'solicita' | 'none';

export interface PlanningModification {
  id: string;
  parameter: string;
  action: ModificationAction;
  previousValue: string | number | null;
  newValue: string | number | null;
  affectedShots: string[] | null;
  status: ModificationStatus;
  classification: ModificationClassification;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DraftModificationInput {
  id?: string;
  parameter: string;
  action: ModificationAction;
  previousValue: string | number | null;
  newValue: string | number | null;
  affectedShots: string[] | null;
  classification?: ModificationClassification;
}

export interface SubmitModificationsInput {
  modificationIds?: string[];
  modifications?: Array<{
    id: string;
    classification?: ModificationClassification;
  }>;
}

export interface ResolutionResult {
  modification?: PlanningModification;
  error?: 'NOT_FOUND' | 'INVALID_STATUS';
}

const VALID_ACTIONS: readonly ModificationAction[] = ['Alta', 'Baja', 'Modificación'];
const VALID_STATUSES: readonly ModificationStatus[] = ['BORRADOR', 'PENDIENTE', 'ACEPTADO', 'RECHAZADO'];
const VALID_CLASSIFICATIONS: readonly ModificationClassification[] = ['acepta', 'solicita', 'none'];

const modificationsByTrial = new Map<string, PlanningModification[]>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isModificationAction(value: unknown): value is ModificationAction {
  return typeof value === 'string' && VALID_ACTIONS.includes(value as ModificationAction);
}

export function isModificationStatus(value: unknown): value is ModificationStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value as ModificationStatus);
}

export function isModificationClassification(value: unknown): value is ModificationClassification {
  return typeof value === 'string' && VALID_CLASSIFICATIONS.includes(value as ModificationClassification);
}

function isScalarOrNull(value: unknown): value is string | number | null {
  return value === null || typeof value === 'string' || typeof value === 'number';
}

function isAffectedShots(value: unknown): value is string[] | null {
  if (value === null || value === undefined) {
    return true;
  }
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseSingleDraftItem(value: unknown): DraftModificationInput | null {
  if (!isRecord(value)) {
    return null;
  }

  const parameter = value['parameter'];
  const action = value['action'];
  const previousValue = value['previousValue'] ?? null;
  const newValue = value['newValue'] ?? null;
  const affectedShots = value['affectedShots'] ?? null;
  const classification = value['classification'];
  const id = value['id'];

  if (typeof parameter !== 'string' || parameter.trim().length === 0) {
    return null;
  }
  if (!isModificationAction(action)) {
    return null;
  }
  if (!isScalarOrNull(previousValue) || !isScalarOrNull(newValue)) {
    return null;
  }
  if (!isAffectedShots(affectedShots)) {
    return null;
  }
  if (classification !== undefined && !isModificationClassification(classification)) {
    return null;
  }
  if (id !== undefined && typeof id !== 'string') {
    return null;
  }

  return {
    id,
    parameter,
    action,
    previousValue,
    newValue,
    affectedShots: affectedShots === undefined ? null : affectedShots,
    classification: classification ?? 'none',
  };
}

export function parseDraftPayload(
  body: unknown,
): { items: DraftModificationInput[]; wasSingle: boolean; wasWrapped: boolean } | null {
  if (Array.isArray(body)) {
    const parsed = body.map(parseSingleDraftItem);
    if (parsed.some((item) => item === null)) {
      return null;
    }
    return {
      items: parsed.filter((item): item is DraftModificationInput => item !== null),
      wasSingle: false,
      wasWrapped: false,
    };
  }

  if (isRecord(body) && Array.isArray(body['modifications'])) {
    const parsed = body['modifications'].map(parseSingleDraftItem);
    if (parsed.some((item) => item === null)) {
      return null;
    }
    return {
      items: parsed.filter((item): item is DraftModificationInput => item !== null),
      wasSingle: false,
      wasWrapped: true,
    };
  }

  const single = parseSingleDraftItem(body);
  if (!single) {
    return null;
  }

  return { items: [single], wasSingle: true, wasWrapped: false };
}

export function isUpdateClassificationRequest(body: unknown): body is { classification: ModificationClassification } {
  return isRecord(body) && isModificationClassification(body['classification']);
}

export function isSubmitModificationsRequest(body: unknown): body is SubmitModificationsInput {
  if (body === undefined || body === null) {
    return true;
  }
  if (!isRecord(body)) {
    return false;
  }

  const modificationIds = body['modificationIds'];
  if (
    modificationIds !== undefined &&
    (!Array.isArray(modificationIds) || !modificationIds.every((id) => typeof id === 'string'))
  ) {
    return false;
  }

  const modifications = body['modifications'];
  if (modifications !== undefined) {
    if (!Array.isArray(modifications)) {
      return false;
    }
    for (const entry of modifications) {
      if (!isRecord(entry) || typeof entry['id'] !== 'string') {
        return false;
      }
      if (entry['classification'] !== undefined && !isModificationClassification(entry['classification'])) {
        return false;
      }
    }
  }

  return true;
}

function getOrInitTrialModifications(fireTrialId: string): PlanningModification[] {
  const existing = modificationsByTrial.get(fireTrialId);
  if (existing) {
    return existing;
  }

  // Pre-seed with pending modifications only for a specific trial to allow testing blocked modal
  if (fireTrialId === 'c6c5fbc6-with-pending' || fireTrialId === 'trial-with-pending') {
    const seed = getFixture<PlanningModification[]>('fixtures/execution', 'planning-modifications-fixture.json');
    const cloned = structuredClone(seed);
    modificationsByTrial.set(fireTrialId, cloned);
    return cloned;
  }

  const initial: PlanningModification[] = [];
  modificationsByTrial.set(fireTrialId, initial);
  return initial;
}

export function getPlanningModifications(
  fireTrialId: string,
  statusFilter?: ModificationStatus,
): PlanningModification[] {
  const list = getOrInitTrialModifications(fireTrialId);
  const filtered = statusFilter ? list.filter((item) => item.status === statusFilter) : list;
  return structuredClone(filtered);
}

export function saveDraftModifications(fireTrialId: string, inputs: DraftModificationInput[]): PlanningModification[] {
  const list = getOrInitTrialModifications(fireTrialId);
  const now = new Date().toISOString();
  const saved: PlanningModification[] = [];

  for (const input of inputs) {
    const id = input.id && input.id.trim().length > 0 ? input.id : randomUUID();
    const existingIndex = list.findIndex((entry) => entry.id === id);

    const record: PlanningModification = {
      id,
      parameter: input.parameter,
      action: input.action,
      previousValue: input.previousValue,
      newValue: input.newValue,
      affectedShots: input.affectedShots ? [...input.affectedShots] : null,
      status: 'BORRADOR',
      classification: input.classification ?? 'none',
      updatedAt: now,
      updatedBy: 'ingeniero.ensayos@inta.es',
    };

    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }

    saved.push(structuredClone(record));
  }

  return saved;
}

export function updateModificationClassification(
  fireTrialId: string,
  modId: string,
  classification: ModificationClassification,
): PlanningModification | null {
  const list = getOrInitTrialModifications(fireTrialId);
  const entry = list.find((item) => item.id === modId);
  if (!entry) {
    return null;
  }

  entry.classification = classification;
  entry.updatedAt = new Date().toISOString();
  return structuredClone(entry);
}

export function submitModifications(fireTrialId: string, payload?: SubmitModificationsInput): PlanningModification[] {
  const list = getOrInitTrialModifications(fireTrialId);
  const now = new Date().toISOString();

  if (payload?.modifications) {
    for (const update of payload.modifications) {
      const target = list.find((item) => item.id === update.id);
      if (target && update.classification) {
        target.classification = update.classification;
      }
    }
  }

  const targetIds = payload?.modificationIds
    ? new Set(payload.modificationIds)
    : payload?.modifications
      ? new Set(payload.modifications.map((item) => item.id))
      : null;

  for (const item of list) {
    if (item.status !== 'BORRADOR') {
      continue;
    }
    if (targetIds && !targetIds.has(item.id)) {
      continue;
    }

    item.status = item.classification === 'none' ? 'ACEPTADO' : 'PENDIENTE';
    item.updatedAt = now;
  }

  return structuredClone(list);
}

export function approveModification(fireTrialId: string, modId: string): ResolutionResult {
  const list = getOrInitTrialModifications(fireTrialId);
  const entry = list.find((item) => item.id === modId);
  if (!entry) {
    return { error: 'NOT_FOUND' };
  }
  if (entry.status !== 'PENDIENTE') {
    return { error: 'INVALID_STATUS' };
  }

  entry.status = 'ACEPTADO';
  entry.updatedAt = new Date().toISOString();
  entry.updatedBy = 'cliente@empresa.es';
  return { modification: structuredClone(entry) };
}

export function rejectModification(fireTrialId: string, modId: string): ResolutionResult {
  const list = getOrInitTrialModifications(fireTrialId);
  const entry = list.find((item) => item.id === modId);
  if (!entry) {
    return { error: 'NOT_FOUND' };
  }
  if (entry.status !== 'PENDIENTE') {
    return { error: 'INVALID_STATUS' };
  }

  entry.status = 'RECHAZADO';
  entry.updatedAt = new Date().toISOString();
  entry.updatedBy = 'cliente@empresa.es';
  return { modification: structuredClone(entry) };
}

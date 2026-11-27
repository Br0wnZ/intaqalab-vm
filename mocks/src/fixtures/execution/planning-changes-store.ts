import { randomUUID } from 'node:crypto';

export type PlanningChangeResourceType =
  'PLANNING_INFO' | 'SHOT_CONDITIONS' | 'MUNITION' | 'MUNITION_COMPONENT' | 'ARMAMENT';

export type PlanningChangeStatus = 'DRAFT' | 'ACCEPTED' | 'PENDING' | 'REJECTED';

export interface PlanningChange {
  id: string;
  resourceType: PlanningChangeResourceType;
  resourceId: string;
  seriesId: string | null;
  shotId: string | null;
  field: string;
  parameter?: string;
  operation: 'UPDATE';
  oldValue: string | null;
  newValue: string | null;
  affectedShots?: string[] | null;
  status: PlanningChangeStatus;
  requiresApproval: boolean;
  requestClient: boolean;
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface CreatePlanningChange {
  resourceType: PlanningChangeResourceType;
  resourceId: string;
  field: string;
  operation: 'UPDATE';
  oldValue?: string | null;
  newValue: string | null;
}

// In-memory store: fireTrialId → PlanningChange[]
const changesByTrial = new Map<string, PlanningChange[]>();

function buildSeedChanges(): PlanningChange[] {
  const now = new Date().toISOString();
  const planningInfoId = 'c6c5fbc6-5f6e-8a7b-2c5d-5e6f7a8b9c0d';
  const shotOneId = '3fa85f64-5717-4562-b3fc-2c963f66bfa1';
  const shotTwoId = '3fa85f64-5717-4562-b3fc-2c963f66bfa2';
  const firstMunitionSeriesId = '03d42240-b0cf-4036-a1b3-548867838cc0';
  const firstMunitionId = '48b93b36-07ba-4cb7-b562-085a40d668e1';
  const secondMunitionId = 'e3c80288-76d8-48a6-9496-6be0149417b3';
  const firstArmamentId = '850e8400-e29b-41d4-a716-446655440001';
  const secondArmamentId = '850e8400-e29b-41d4-a716-446655440002';

  return [
    // 1. DRAFT - Sin seleccionar (false/false) -> Se puede probar activar "Acepta" o "Solicita"
    {
      id: '44444444-4444-4444-8444-000000000001',
      resourceType: 'SHOT_CONDITIONS',
      resourceId: shotOneId,
      seriesId: null,
      shotId: shotOneId,
      field: 'elevation',
      parameter: 'elevation',
      operation: 'UPDATE',
      oldValue: '45',
      newValue: '46',
      affectedShots: [shotOneId],
      status: 'DRAFT',
      requiresApproval: false,
      requestClient: false,
      createdBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      createdAt: now,
      decidedBy: null,
      decidedAt: null,
    },
    // 2. DRAFT - Con "Acepta" activado (true/false) -> Probar desmarcar o cambiar a "Solicita"
    {
      id: '44444444-4444-4444-8444-000000000002',
      resourceType: 'MUNITION',
      resourceId: firstMunitionId,
      seriesId: firstMunitionSeriesId,
      shotId: null,
      field: 'batch',
      parameter: 'batch',
      operation: 'UPDATE',
      oldValue: 'LOT-GM-003',
      newValue: 'LOT-GM-004',
      affectedShots: ['D1', 'D2', 'D3', 'D4'],
      status: 'DRAFT',
      requiresApproval: true,
      requestClient: false,
      createdBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      createdAt: now,
      decidedBy: null,
      decidedAt: null,
    },
    // 3. DRAFT - Con "Solicita" activado (false/true) -> Probar desmarcar o cambiar a "Acepta"
    {
      id: '44444444-4444-4444-8444-000000000003',
      resourceType: 'PLANNING_INFO',
      resourceId: planningInfoId,
      seriesId: null,
      shotId: null,
      field: 'goal',
      parameter: 'goal',
      operation: 'UPDATE',
      oldValue: 'Evaluar comportamiento del material en condiciones estándar',
      newValue: 'Objetivo ajustado por cliente',
      affectedShots: ['D1', 'D2', 'D3', 'D4', 'D5'],
      status: 'DRAFT',
      requiresApproval: false,
      requestClient: true,
      createdBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      createdAt: now,
      decidedBy: null,
      decidedAt: null,
    },
    // 4. DRAFT - Update with null old value -> Test client classification.
    {
      id: '44444444-4444-4444-8444-000000000004',
      resourceType: 'ARMAMENT',
      resourceId: firstArmamentId,
      seriesId: null,
      shotId: shotOneId,
      field: 'observations',
      parameter: 'Observaciones de tubo',
      operation: 'UPDATE',
      oldValue: null,
      newValue: 'Inspección previa requerida',
      affectedShots: [shotOneId],
      status: 'DRAFT',
      requiresApproval: false,
      requestClient: false,
      createdBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      createdAt: now,
      decidedBy: null,
      decidedAt: null,
    },
    // 5. ACCEPTED - Ya aceptado (sliders deshabilitados para verificar protección)
    {
      id: '44444444-4444-4444-8444-000000000005',
      resourceType: 'SHOT_CONDITIONS',
      resourceId: shotOneId,
      seriesId: null,
      shotId: shotOneId,
      field: 'elevation',
      parameter: 'Elevación',
      operation: 'UPDATE',
      oldValue: '45',
      newValue: '47',
      affectedShots: [shotOneId],
      status: 'ACCEPTED',
      requiresApproval: false,
      requestClient: false,
      createdBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      createdAt: now,
      decidedBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      decidedAt: now,
    },
    // 6. PENDING - Pendiente de aprobación externa (sliders deshabilitados)
    {
      id: '44444444-4444-4444-8444-000000000006',
      resourceType: 'ARMAMENT',
      resourceId: secondArmamentId,
      seriesId: null,
      shotId: shotTwoId,
      field: 'lifeUsefulPercentage',
      parameter: 'lifeUsefulPercentage',
      operation: 'UPDATE',
      oldValue: '75.5',
      newValue: '52',
      affectedShots: [shotTwoId],
      status: 'PENDING',
      requiresApproval: true,
      requestClient: false,
      createdBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      createdAt: now,
      decidedBy: null,
      decidedAt: null,
    },
    // 7. REJECTED - Rechazado (sliders deshabilitados)
    {
      id: '44444444-4444-4444-8444-000000000007',
      resourceType: 'MUNITION',
      resourceId: secondMunitionId,
      seriesId: null,
      shotId: null,
      field: 'batch',
      parameter: 'batch',
      operation: 'UPDATE',
      oldValue: 'LOT-DO-001',
      newValue: 'LOT-DO-002',
      affectedShots: ['D1', 'D2', 'D3'],
      status: 'REJECTED',
      requiresApproval: false,
      requestClient: true,
      createdBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      createdAt: now,
      decidedBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
      decidedAt: now,
    },
  ];
}

function getOrInitChanges(fireTrialId: string): PlanningChange[] {
  if (!changesByTrial.has(fireTrialId)) {
    // Seed the well-known interrupted trial with realistic data
    const seed = fireTrialId === 'c6c5fbc6-5f6e-8a7b-2c5d-5e6f7a8b9c0d' ? buildSeedChanges() : [];
    changesByTrial.set(fireTrialId, seed);
  }
  return changesByTrial.get(fireTrialId) ?? [];
}

export function getPlanningChanges(fireTrialId: string): PlanningChange[] {
  return structuredClone(getOrInitChanges(fireTrialId));
}

export function createPlanningChanges(
  fireTrialId: string,
  inputs: ReadonlyArray<CreatePlanningChange>,
): PlanningChange[] | null {
  if (inputs.length === 0) return null;
  const existing = getOrInitChanges(fireTrialId);
  if (existing.some((change) => change.status === 'PENDING')) return null;

  const batchKeys = new Set<string>();
  for (const input of inputs) {
    const key = `${input.resourceType}:${input.resourceId}:${input.field}`;
    if (batchKeys.has(key)) return null;
    batchKeys.add(key);
    if (input.oldValue === input.newValue) return null;
    if (
      existing.some(
        (change) =>
          change.status === 'DRAFT' &&
          change.resourceType === input.resourceType &&
          change.resourceId === input.resourceId &&
          change.field === input.field,
      )
    ) {
      return null;
    }
  }

  const now = new Date().toISOString();
  const created = inputs.map((input): PlanningChange => ({
    id: randomUUID(),
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    seriesId: null,
    shotId: input.resourceType === 'SHOT_CONDITIONS' ? input.resourceId : null,
    field: input.field,
    operation: 'UPDATE',
    oldValue: input.oldValue ?? null,
    newValue: input.newValue,
    status: 'DRAFT',
    requiresApproval: false,
    requestClient: false,
    createdBy: 'a1b2c3d4-0001-4001-8001-aabbccddeeff',
    createdAt: now,
    decidedBy: null,
    decidedAt: null,
  }));

  existing.push(...created);
  return structuredClone(created);
}

export function applyPlanningChanges(
  fireTrialId: string,
  itemsToApply: Array<{ id: string; requiresApproval: boolean; requestClient: boolean }>,
): PlanningChange[] {
  const list = getOrInitChanges(fireTrialId);
  const now = new Date().toISOString();
  const applied: PlanningChange[] = [];

  for (const item of itemsToApply) {
    const existing = list.find((c) => c.id === item.id);
    if (existing?.status === 'DRAFT') {
      existing.requiresApproval = item.requiresApproval;
      existing.requestClient = item.requestClient;
      // Per spec: false/false -> ACCEPTED; true/false or false/true -> PENDING
      existing.status = !item.requiresApproval && !item.requestClient ? 'ACCEPTED' : 'PENDING';
      existing.decidedAt = now;
      existing.decidedBy = 'a1b2c3d4-0001-4001-8001-aabbccddeeff';
      applied.push(structuredClone(existing));
    }
  }

  return applied;
}

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

// In-memory store: fireTrialId → PlanningChange[]
const changesByTrial = new Map<string, PlanningChange[]>();

function buildSeedChanges(): PlanningChange[] {
  const now = new Date().toISOString();
  const planningInfoId = '22222222-2222-4222-8222-222222222222';

  return [
    // 1. DRAFT - Sin seleccionar (false/false) -> Se puede probar activar "Acepta" o "Solicita"
    {
      id: '44444444-4444-4444-8444-000000000001',
      resourceType: 'SHOT_CONDITIONS',
      resourceId: planningInfoId,
      seriesId: null,
      shotId: null,
      field: 'minTime',
      parameter: 'Tiempo mínimo',
      operation: 'UPDATE',
      oldValue: '10',
      newValue: '20',
      affectedShots: ['D1', 'D2'],
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
      resourceId: 'aaaa1111-bbbb-4111-8111-ccccddddeeee',
      seriesId: 'series1111-1111-4111-8111-111111111111',
      shotId: null,
      field: 'projectileLot',
      parameter: 'Lote proyectil',
      operation: 'UPDATE',
      oldValue: 'LOT-2023-A',
      newValue: 'LOT-2024-B',
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
      resourceId: 'bbbb2222-bbbb-4222-8222-ccccddddeeee',
      seriesId: null,
      shotId: null,
      field: 'goal',
      parameter: 'Objetivo de prueba',
      operation: 'UPDATE',
      oldValue: 'Objetivo inicial',
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
    // 4. DRAFT - Alta/Añadido sin valor previo -> Probar con sliders
    {
      id: '44444444-4444-4444-8444-000000000004',
      resourceType: 'ARMAMENT',
      resourceId: 'cccc3333-cccc-4333-8333-ccccddddeeee',
      seriesId: null,
      shotId: null,
      field: 'observations',
      parameter: 'Observaciones de tubo',
      operation: 'UPDATE',
      oldValue: null,
      newValue: 'Inspección previa requerida',
      affectedShots: ['D1', 'D2', 'D3', 'D4'],
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
      resourceId: planningInfoId,
      seriesId: null,
      shotId: null,
      field: 'elevation',
      parameter: 'Elevación',
      operation: 'UPDATE',
      oldValue: '45 º',
      newValue: '47 º',
      affectedShots: ['D1'],
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
      resourceId: 'cccc3333-cccc-4333-8333-ccccddddeeee',
      seriesId: null,
      shotId: null,
      field: 'elevation',
      parameter: 'Elevación de afuste',
      operation: 'UPDATE',
      oldValue: '45º',
      newValue: '52º',
      affectedShots: ['D2', 'D3'],
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
      resourceId: 'aaaa1111-bbbb-4111-8111-ccccddddeeee',
      seriesId: null,
      shotId: null,
      field: 'powderWeight',
      parameter: 'Peso de pólvora',
      operation: 'UPDATE',
      oldValue: '3.5 kg',
      newValue: '4.2 kg',
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

export function applyPlanningChanges(
  fireTrialId: string,
  itemsToApply: Array<{ id: string; requiresApproval: boolean; requestClient: boolean }>,
): PlanningChange[] {
  const list = getOrInitChanges(fireTrialId);
  const now = new Date().toISOString();
  const applied: PlanningChange[] = [];

  for (const item of itemsToApply) {
    const existing = list.find((c) => c.id === item.id);
    if (existing) {
      existing.requiresApproval = item.requiresApproval;
      existing.requestClient = item.requestClient;
      // Per spec: false/false -> ACCEPTED; true/false or false/true -> PENDING
      existing.status = !item.requiresApproval && !item.requestClient ? 'ACCEPTED' : 'PENDING';
      existing.decidedAt = now;
      applied.push(structuredClone(existing));
    }
  }

  return applied;
}

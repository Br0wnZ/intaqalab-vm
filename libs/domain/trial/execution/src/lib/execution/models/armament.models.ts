import type { TrialArmamentResponse } from '@intaqalab/data-access-planning';

/** Modelos de planning/armament: fuente única en @intaqalab/data-access-planning. */
export type PlanningArmamentResponse = TrialArmamentResponse;

/** Modelos de planning/munitions (shape raw del backend): fuente única en @intaqalab/data-access-planning. */
export type { TrialMunitionsRawItem } from '@intaqalab/data-access-planning';

export interface ArmamentEquipmentItem {
  id: number | string;
  tag: string;
  serialNumber: string;
  denominationId: number;
  denominationName: string;
  modelName: string;
}

export interface LoadEquipmentByTypeParams {
  itemType: 'WEAPON' | 'MORTAR' | 'TUBE';
}

export interface ShotArmamentRequest {
  weaponId: number | null;
  tubeId: number | null;
  observations: string | null;
}

export interface ArmamentBulkConfigurationRequest {
  assignedSeriesIds: string[];
  weaponId?: number | null;
  tubeId?: number | null;
  observations?: string | null;
}

export interface ShotArmamentResponse {
  armamentData?: {
    weapon?: ArmamentEquipmentItem | null;
    tube?: ArmamentEquipmentItem | null;
    observations?: string | null;
  };
}

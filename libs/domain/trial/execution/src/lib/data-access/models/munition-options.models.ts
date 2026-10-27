import type { MunitionCategoryEnum } from './warehouse-api.models';

export type MunitionComponentSource = 'CONFIGURATION' | 'COMPONENT';

export interface PlannedComponentData {
  denominationId: string | null;
  denominationName: string | null;
  batch: string | null;
  clientNumber: string | null;
  fuseWorkingModeId: string | null;
  fuseMeasurement: number | null;
  loadingZoneValue: string | null;
  loadingZones: string[];
  quantity: number | null;
}

export interface ShotMunitionComponentOption {
  value: string; // componentTypeId (munitionTypeId)
  label: string;
  category: string; // 'granada' | 'espoleta' | 'polvo' | 'carga' | 'munition' | 'componente'
  rawCategory: MunitionCategoryEnum | null;
  source: MunitionComponentSource;
  configurationId: string;
  isFuse: boolean;
  planned: PlannedComponentData;
}

export interface NormalizedMunitionComponent {
  id: string;
  componentTypeId: string;
  label: string;
  category: string;
  rawCategory: MunitionCategoryEnum | null;
  denominationId: string | null;
  denominationName: string | null;
  batch: string | null;
  clientNumber: string | null;
  fuseWorkingModeId: string | null;
  fuseMeasurement: number | null;
  loadingZoneValue: string | null;
  loadingZones: string[];
  isFuse: boolean;
  quantity: number | null;
}

export interface NormalizedMunitionConfig {
  id: string;
  seriesId: string;
  assignedShotIds: string[] | null;
  mainComponent: NormalizedMunitionComponent | null;
  subComponents: NormalizedMunitionComponent[];
}

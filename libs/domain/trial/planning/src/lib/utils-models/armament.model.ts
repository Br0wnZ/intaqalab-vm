import type { SpecimenItem } from './catalog.model';

export type ArmamentData = {
  weaponName?: string;
  weaponExternalId?: string;
  tubeName?: string;
  tubeExternalId?: string;
  isInstrumented?: boolean;
  tubeLifePercentage?: number;
  observations?: string;
};

export type ShotArmamentData = {
  shotId: string;
  armament?: ArmamentData;
};

export type SeriesArmamentData = {
  seriesId: string;
  seriesName: string;
  shots: ShotArmamentData[];
};

export type TrialArmamentResponse = {
  series: SeriesArmamentData[];
};

export type ShotArmamentUpdateRequest = {
  shotId: string;
  weaponExternalId?: string;
  tubeExternalId?: string;
  isInstrumented?: boolean;
  lifeUsefulPercentage?: number;
  observations?: string;
};

export type ArmamentBulkUpdateRequest = {
  shots: ShotArmamentUpdateRequest[];
};

export type ArmamentSerie = {
  seriesId: string;
  seriesName: string;
  shots: ArmamentSerieShot[];
};

export type ArmamentSerieShot = {
  shotId: string;
  armament: ArmamentSerieShotDetail;
};

export type ArmamentSerieShotDetail = {
  weaponName: string;
  weaponExternalId: string;
  tubeName: string;
  tubeExternalId: string;
  isInstrumented: boolean;
  tubeLifePercentage: number;
  observations: string;
};

export type ArmamentWeapon = {
  id: string;
  name: ArmamentItem;
  label: string;
  active: boolean;
};

export type ArmamentTube = {
  id: string;
  name: ArmamentItem;
  label: string;
  active: boolean;
};

export type ArmamentItem = {
  en: string;
  es: string;
};

export type UpdateArmamentDialogData = {
  trialId: string;
  shotNumber: number;
  shotId: string;
  armament: ArmamentSerieShotDetail;
  weapons: SpecimenItem[];
  tubes: SpecimenItem[];
};

export type UpdateArmamentDialogResult = {
  weaponExternalId: string;
  tubeExternalId: string;
  isInstrumented: boolean;
  tubeLifePercentage: number;
  observations: string;
};

export type MassiveConfigData = {
  series: string[];
  denominacionArma: string;
  denominacionTubo: string;
  instrumentado: string;
  vidaUtil: string;
  observaciones: string;
};

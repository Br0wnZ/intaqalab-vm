import type { SpecimenItem } from './catalog.model';
import type { SpecimenType } from './specimen.model';

export type ArmamentData = {
  weaponType?: SpecimenType | '';
  /** Alias que devuelve el backend en el GET en lugar de weaponType */
  itemType?: string;
  weaponName?: string;
  /** ID numérico del arma en Calibry (integer según contrato Swagger) */
  weaponExternalId?: number;
  tubeName?: string;
  /** ID numérico del tubo en Calibry (integer según contrato Swagger) */
  tubeExternalId?: number;
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
  weaponType?: SpecimenType | '';
  /** ID numérico del arma en Calibry (integer según contrato Swagger) */
  weaponExternalId?: number;
  /** ID numérico del tubo en Calibry (integer según contrato Swagger) */
  tubeExternalId?: number;
  isInstrumented?: boolean;
  lifeUsefulPercentage?: number;
  observations?: string;
  itemType?: string;
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
  globalNumber?: number;
};

export type ArmamentSerieShotDetail = {
  weaponType: SpecimenType | '';
  weaponName: string;
  /** ID de catálogo usado en el select — se convierte a number al enviar al API */
  weaponExternalId: string;
  tubeName: string;
  /** ID de catálogo usado en el select — se convierte a number al enviar al API */
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
  /** ID de catálogo del arma (string en el form, se convierte a integer al enviar al API) */
  weaponExternalId: string;
  /** ID de catálogo del tubo (string en el form, se convierte a integer al enviar al API) */
  tubeExternalId: string;
  isInstrumented: boolean;
  tubeLifePercentage: number;
  observations: string;
};

export type MassiveConfigData = {
  series: string[];
  tipo: SpecimenType | '';
  denominacionArma: string;
  denominacionTubo: string;
  instrumentado: string;
  vidaUtil: string;
  observaciones: string;
};

export type MassiveShotsConfigurationDialogData = {
  series?: { id: string; name: string }[];
};

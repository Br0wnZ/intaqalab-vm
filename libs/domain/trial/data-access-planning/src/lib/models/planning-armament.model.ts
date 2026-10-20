/**
 * Enum de tipos de espécimen usado por el armamento asignado.
 * Fuente única compartida (deberá reexportarse desde planning en la migración).
 */
export enum SpecimenType {
  Weapon = 'weapon',
  Tube = 'tube',
  Mortar = 'mortar',
  Bundle = 'bundle',
  Munition = 'denomination',
}

/**
 * Modelos del GET `/fire-trials/{fireTrialId}/planning/armament`
 * (Swagger planning-api v1.3.0 → TrialArmamentResponse).
 */
export type ArmamentData = {
  weaponType?: SpecimenType | '';
  /** Alias que devuelve el backend en el GET en lugar de weaponType. */
  itemType?: string;
  weaponName?: string;
  /** ID numérico del arma en Calibry (integer según contrato Swagger). */
  weaponExternalId?: number;
  tubeName?: string;
  /** ID numérico del tubo en Calibry (integer según contrato Swagger). */
  tubeExternalId?: number;
  isInstrumented?: boolean;
  tubeLifePercentage?: number;
  observations?: string;
};

export type ShotArmamentData = {
  shotId: string;
  globalNumber?: number | null;
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

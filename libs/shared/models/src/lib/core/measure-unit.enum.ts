/** Unidad de medida aplicable a cualquier magnitud. Fuente única de verdad (≡ MeasureUnitEnum del swagger). */
export enum MeasureUnitEnum {
  M_S = 'M_S',
  KM_H = 'KM_H',
  RPS = 'RPS',
  RPM = 'RPM',
  BAR = 'BAR',
  MPA = 'MPA',
  KG_CM2 = 'KG_CM2',
  CELSIUS = 'CELSIUS',
  KELVIN = 'KELVIN',
  MS = 'MS',
  S = 'S',
  G = 'G',
  KG = 'KG',
  DEGREES = 'DEGREES',
  MILS = 'MILS',
  RAD = 'RAD',
  UM = 'UM',
  MM = 'MM',
  M = 'M',
  KM = 'KM',
  DB = 'DB',
  SPM = 'SPM',
  QUANTITY = 'QUANTITY',
}

// ── Sub-enums por magnitud (≡ *UnitEnum del swagger) ─────────────────────────

export type SpeedUnitEnum = MeasureUnitEnum.M_S | MeasureUnitEnum.KM_H;
export const SpeedUnitEnum = {
  M_S: MeasureUnitEnum.M_S,
  KM_H: MeasureUnitEnum.KM_H,
} as const;

export type PressureUnitEnum = MeasureUnitEnum.BAR | MeasureUnitEnum.MPA | MeasureUnitEnum.KG_CM2;
export const PressureUnitEnum = {
  BAR: MeasureUnitEnum.BAR,
  MPA: MeasureUnitEnum.MPA,
  KG_CM2: MeasureUnitEnum.KG_CM2,
} as const;

export type TemperatureUnitEnum = MeasureUnitEnum.CELSIUS | MeasureUnitEnum.KELVIN;
export const TemperatureUnitEnum = {
  CELSIUS: MeasureUnitEnum.CELSIUS,
  KELVIN: MeasureUnitEnum.KELVIN,
} as const;

export type TimeUnitEnum = MeasureUnitEnum.MS | MeasureUnitEnum.S;
export const TimeUnitEnum = {
  MS: MeasureUnitEnum.MS,
  S: MeasureUnitEnum.S,
} as const;

export type WeightUnitEnum = MeasureUnitEnum.G | MeasureUnitEnum.KG;
export const WeightUnitEnum = {
  G: MeasureUnitEnum.G,
  KG: MeasureUnitEnum.KG,
} as const;

export type AngleUnitEnum = MeasureUnitEnum.DEGREES | MeasureUnitEnum.MILS | MeasureUnitEnum.RAD;
export const AngleUnitEnum = {
  DEGREES: MeasureUnitEnum.DEGREES,
  MILS: MeasureUnitEnum.MILS,
  RAD: MeasureUnitEnum.RAD,
} as const;

export type DistanceUnitEnum = MeasureUnitEnum.UM | MeasureUnitEnum.MM | MeasureUnitEnum.M | MeasureUnitEnum.KM;
export const DistanceUnitEnum = {
  UM: MeasureUnitEnum.UM,
  MM: MeasureUnitEnum.MM,
  M: MeasureUnitEnum.M,
  KM: MeasureUnitEnum.KM,
} as const;

// ── Labels legibles para el usuario ──────────────────────────────────────────

/**
 * Mapa de código de enum → etiqueta legible para mostrar en selectores.
 * Extiende con nuevas unidades si el swagger crece.
 */
export const MEASURE_UNIT_LABELS: Record<MeasureUnitEnum, string> = {
  [MeasureUnitEnum.M_S]: 'm/s',
  [MeasureUnitEnum.KM_H]: 'km/h',
  [MeasureUnitEnum.RPS]: 'rps',
  [MeasureUnitEnum.RPM]: 'rpm',
  [MeasureUnitEnum.BAR]: 'bar',
  [MeasureUnitEnum.MPA]: 'MPa',
  [MeasureUnitEnum.KG_CM2]: 'kg/cm²',
  [MeasureUnitEnum.CELSIUS]: '°C',
  [MeasureUnitEnum.KELVIN]: 'K',
  [MeasureUnitEnum.MS]: 'ms',
  [MeasureUnitEnum.S]: 's',
  [MeasureUnitEnum.G]: 'g',
  [MeasureUnitEnum.KG]: 'kg',
  [MeasureUnitEnum.DEGREES]: '°',
  [MeasureUnitEnum.MILS]: 'mil',
  [MeasureUnitEnum.RAD]: 'rad',
  [MeasureUnitEnum.UM]: 'μm',
  [MeasureUnitEnum.MM]: 'mm',
  [MeasureUnitEnum.M]: 'm',
  [MeasureUnitEnum.KM]: 'km',
  [MeasureUnitEnum.DB]: 'dB',
  [MeasureUnitEnum.SPM]: 'spm',
  [MeasureUnitEnum.QUANTITY]: 'ud',
};

// ── Utilidad para construir opciones para InputSelect ────────────────────────

/**
 * Convierte un array de valores de {@link MeasureUnitEnum} a opciones
 * consumibles por el componente `ui-input-select`.
 *
 * @example
 * toUnitOptions([MeasureUnitEnum.M, MeasureUnitEnum.KM])
 * // → [{ value: 'M', label: 'm' }, { value: 'KM', label: 'km' }]
 */
export function toUnitOptions(units: MeasureUnitEnum[]): { value: string; label: string }[] {
  return units.map((u) => ({ value: u, label: MEASURE_UNIT_LABELS[u] }));
}

// ── Mapa magnitud → opciones de unidad (≡ ShotConditionsUnits del swagger) ──

/**
 * Para cada campo numérico de las condiciones de disparo, define qué unidades
 * son aplicables. Se usa en el componente de condiciones de disparo para
 * alimentar los selectores de unidad de `ui-input-select`.
 */
export const SHOT_CONDITIONS_UNIT_OPTIONS = {
  distance: toUnitOptions([MeasureUnitEnum.UM, MeasureUnitEnum.MM, MeasureUnitEnum.M, MeasureUnitEnum.KM]),
  orientation: toUnitOptions([MeasureUnitEnum.DEGREES, MeasureUnitEnum.MILS, MeasureUnitEnum.RAD]),
  targetInclination: toUnitOptions([MeasureUnitEnum.DEGREES, MeasureUnitEnum.MILS, MeasureUnitEnum.RAD]),
  elevation: toUnitOptions([MeasureUnitEnum.DEGREES, MeasureUnitEnum.MILS, MeasureUnitEnum.RAD]),
  angle: toUnitOptions([MeasureUnitEnum.DEGREES, MeasureUnitEnum.MILS, MeasureUnitEnum.RAD]),
  range: toUnitOptions([MeasureUnitEnum.UM, MeasureUnitEnum.MM, MeasureUnitEnum.M, MeasureUnitEnum.KM]),
  functioningHeight: toUnitOptions([MeasureUnitEnum.UM, MeasureUnitEnum.MM, MeasureUnitEnum.M, MeasureUnitEnum.KM]),
  nominalSpeed: toUnitOptions([MeasureUnitEnum.M_S, MeasureUnitEnum.KM_H]),
  powderWeight: toUnitOptions([MeasureUnitEnum.G, MeasureUnitEnum.KG]),
  projectileWeight: toUnitOptions([MeasureUnitEnum.G, MeasureUnitEnum.KG]),
} as const;

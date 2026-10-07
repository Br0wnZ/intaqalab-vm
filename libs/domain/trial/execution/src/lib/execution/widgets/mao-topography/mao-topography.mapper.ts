import { DistanceUnitEnum } from '@intaqalab/models';
import type { SoundLevelMeterValue } from '@intaqalab/ui';

import type { MaoTopographyBulkConfigurationRequest } from '../../models/shot-mao-topography.models';

export type InputFieldValue = { value: string; unit: string } | null;

export type MaoTopographyMassConfigField = 'xPieza' | 'yPieza' | 'zPieza' | 'xBlanco' | 'yBlanco' | 'zBlanco';
export type MaoTopographyMassConfigValues = Partial<Record<MaoTopographyMassConfigField, InputFieldValue>>;

export const toPosition = (x: InputFieldValue, y: InputFieldValue, z: InputFieldValue): SoundLevelMeterValue | null => {
  if (!x && !y && !z) return null;

  return {
    x: x?.value ? parseFloat(x.value.replace(',', '.')) : null,
    y: y?.value ? parseFloat(y.value.replace(',', '.')) : null,
    z: z?.value ? parseFloat(z.value.replace(',', '.')) : null,
    unit: x?.unit ?? y?.unit ?? z?.unit ?? 'm',
  };
};

export const fromPosition = (
  position: SoundLevelMeterValue | null,
): { x: InputFieldValue; y: InputFieldValue; z: InputFieldValue } => {
  if (!position) {
    return { x: null, y: null, z: null };
  }

  const unit = position.unit ?? 'm';
  return {
    x: position.x !== null ? { value: position.x.toFixed(1), unit } : null,
    y: position.y !== null ? { value: position.y.toFixed(1), unit } : null,
    z: position.z !== null ? { value: position.z.toFixed(1), unit } : null,
  };
};

export const numToField = (value: number | null, unit: string, decimals: number): InputFieldValue =>
  value !== null ? { value: value.toFixed(decimals), unit } : null;

export const parseNum = (field: InputFieldValue): number | null => {
  if (!field?.value) return null;
  const parsed = parseFloat(field.value.replace(',', '.'));
  return isNaN(parsed) ? null : parsed;
};

function valueToApply(value: InputFieldValue | undefined, current: InputFieldValue | undefined): number | null | undefined {
  if (value === undefined) return undefined;
  const parsedValue = parseNum(value);
  if (parsedValue === null && parseNum(current ?? null) === null) return undefined;
  return parsedValue;
}

export function mapMaoTopographyMassConfigToRequest(
  values: MaoTopographyMassConfigValues,
  current: MaoTopographyMassConfigValues,
  assignedShotIds: string[],
): MaoTopographyBulkConfigurationRequest | null {
  const body: MaoTopographyBulkConfigurationRequest = { assignedShotIds: [...new Set(assignedShotIds)] };

  const pieceX = valueToApply(values.xPieza, current.xPieza);
  const pieceY = valueToApply(values.yPieza, current.yPieza);
  const pieceZ = valueToApply(values.zPieza, current.zPieza);
  const targetX = valueToApply(values.xBlanco, current.xBlanco);
  const targetY = valueToApply(values.yBlanco, current.yBlanco);
  const targetZ = valueToApply(values.zBlanco, current.zBlanco);

  if (pieceX !== undefined) {
    body.pieceX = pieceX;
    if (pieceX !== null) body.pieceXUnit = DistanceUnitEnum.M;
  }
  if (pieceY !== undefined) {
    body.pieceY = pieceY;
    if (pieceY !== null) body.pieceYUnit = DistanceUnitEnum.M;
  }
  if (pieceZ !== undefined) {
    body.pieceZ = pieceZ;
    if (pieceZ !== null) body.pieceZUnit = DistanceUnitEnum.M;
  }
  if (targetX !== undefined) {
    body.targetX = targetX;
    if (targetX !== null) body.targetXUnit = DistanceUnitEnum.M;
  }
  if (targetY !== undefined) {
    body.targetY = targetY;
    if (targetY !== null) body.targetYUnit = DistanceUnitEnum.M;
  }
  if (targetZ !== undefined) {
    body.targetZ = targetZ;
    if (targetZ !== null) body.targetZUnit = DistanceUnitEnum.M;
  }

  const hasFieldToApply = [pieceX, pieceY, pieceZ, targetX, targetY, targetZ].some((value) => value !== undefined);
  return body.assignedShotIds.length > 0 && hasFieldToApply ? body : null;
}

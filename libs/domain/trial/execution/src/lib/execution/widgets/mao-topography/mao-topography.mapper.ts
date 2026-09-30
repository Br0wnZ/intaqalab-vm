import type { SoundLevelMeterValue } from '@intaqalab/ui';

export type InputFieldValue = { value: string; unit: string } | null;

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

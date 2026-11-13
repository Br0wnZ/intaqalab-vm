import { type SchemaPath, maxError, minError, validate } from '@angular/forms/signals';

/**
 * Parses numeric bounds on string or union (`string | number`) Signal Form fields,
 * where Angular 22 built-in `min`/`max` restrict the path to `SchemaPath<number>`.
 */
export function numericMin(path: SchemaPath<string | number>, minValue: number): void {
  validate(path, ({ value }) => {
    const raw = value();
    if (raw === '' || raw === null || raw === undefined) return null;
    const num = Number(raw);
    return !Number.isNaN(num) && num < minValue ? minError(minValue) : null;
  });
}

/** Validates an upper numeric bound on string or union (`string | number`) Signal Form fields. */
export function numericMax(path: SchemaPath<string | number>, maxValue: number): void {
  validate(path, ({ value }) => {
    const raw = value();
    if (raw === '' || raw === null || raw === undefined) return null;
    const num = Number(raw);
    return !Number.isNaN(num) && num > maxValue ? maxError(maxValue) : null;
  });
}

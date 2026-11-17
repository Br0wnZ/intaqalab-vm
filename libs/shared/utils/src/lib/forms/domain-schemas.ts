import { max, min, schema } from '@angular/forms/signals';

/**
 * Signal Forms validation schema restricting a numeric field to percentage bounds [0, 100].
 */
export const percentageSchema = schema<number | null>((p) => {
  min(p, 0);
  max(p, 100);
});

/**
 * Signal Forms validation schema restricting a numeric field to non-negative values (>= 0).
 */
export const nonNegativeSchema = schema<number | null>((p) => {
  min(p, 0);
});

/**
 * Creates a reusable Signal Forms validation schema restricting a numeric field to [minVal, maxVal].
 */
export function boundedNumberSchema(minVal: number, maxVal: number) {
  return schema<number | null>((p) => {
    min(p, minVal);
    max(p, maxVal);
  });
}

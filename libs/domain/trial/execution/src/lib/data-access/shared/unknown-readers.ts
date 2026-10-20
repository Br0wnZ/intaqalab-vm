/**
 * Defensive type-guard readers for untyped or variably-shaped API responses.
 * Zero `any`, pure functions, highly testable.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

export function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

export function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const parsed = Number(trimmed);
    return !Number.isNaN(parsed) && Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readStringOrNumber(value: unknown): string | null {
  const str = readString(value);
  if (str !== null) return str;
  const num = readNumber(value);
  return num !== null ? String(num) : null;
}

/**
 * Reads an ID that may be provided as:
 * - A direct string: "123"
 * - A nested object: { id: "123" }
 * - A double-nested object: { id: { value: "123" } }
 * - A value-wrapped object: { value: "123" }
 */
export function readNestedId(value: unknown): string | null {
  const directStr = readString(value);
  if (directStr !== null) return directStr;

  const rec = readRecord(value);
  if (!rec) return null;

  if ('value' in rec && typeof rec['value'] === 'string') {
    const val = readString(rec['value']);
    if (val !== null) return val;
  }

  if ('id' in rec) {
    const idVal = rec['id'];
    const idStr = readString(idVal);
    if (idStr !== null) return idStr;
    const idRec = readRecord(idVal);
    if (idRec && 'value' in idRec) {
      const nestedVal = readString(idRec['value']);
      if (nestedVal !== null) return nestedVal;
    }
  }

  return null;
}

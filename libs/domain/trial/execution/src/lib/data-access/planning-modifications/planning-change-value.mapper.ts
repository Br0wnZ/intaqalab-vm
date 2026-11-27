import type { PlanningFormSnapshotEvent, PlanningValueReference, PlanningValueReferences } from '@intaqalab/planning';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function referenceName(value: unknown, language: string): string | undefined {
  if (typeof value === 'string') return value.trim() ? value : undefined;
  if (!isRecord(value)) return undefined;
  return referenceName(value[language] ?? value[language.split('-')[0]] ?? value['es'] ?? value['en'], language);
}

function isReference(value: unknown): value is PlanningValueReference {
  return (
    isRecord(value) &&
    (typeof value['id'] === 'string' || typeof value['id'] === 'number') &&
    (typeof value['name'] === 'string' ||
      (isRecord(value['name']) && Object.values(value['name']).every((name) => typeof name === 'string')))
  );
}

/** Accumulates names while paginated/dependent catalogs change, without altering snapshots or wire values. */
export function collectPlanningValueReferences(
  event: PlanningFormSnapshotEvent,
  previous: PlanningValueReferences = {},
): PlanningValueReferences {
  const fields = new Map(
    Object.entries(previous).map(([field, references]) => [
      field,
      new Map(references.map((reference) => [String(reference.id), reference])),
    ]),
  );
  const add = (field: string, reference: PlanningValueReference): void => {
    if (!referenceName(reference.name, 'es')) return;
    const references = fields.get(field) ?? new Map<string, PlanningValueReference>();
    references.set(String(reference.id), reference);
    fields.set(field, references);
  };
  const visit = (value: unknown, field = ''): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item, field);
      return;
    }
    if (!isRecord(value)) return;
    if (field && isReference(value)) {
      add(field, value);
      if (!field.endsWith('Id')) add(`${field}Id`, value);
    }
    for (const [key, child] of Object.entries(value)) {
      if (key.endsWith('ExternalId') || key.endsWith('Id')) {
        const name = value[key.replace(/(?:External)?Id$/, 'Name')];
        if ((typeof child === 'string' || typeof child === 'number') && typeof name === 'string' && name.trim()) {
          add(key, { id: child, name });
        }
      }
      visit(child, key);
    }
  };
  visit(event.baseline);
  visit(event.current);
  for (const [field, references] of Object.entries(event.valueReferences ?? {})) {
    for (const reference of references) add(field, reference);
  }
  return Object.fromEntries([...fields].map(([field, references]) => [field, [...references.values()]]));
}

/** Resolves display names only; returned strings must never be reused as persistence values. */
export function formatPlanningChangeValue(
  value: unknown,
  field: string,
  references: PlanningValueReferences,
  language: string,
): string {
  if (value === null || value === undefined || value === '') return '-';
  if (isReference(value)) return referenceName(value.name, language) ?? String(value.id);
  if (typeof value === 'string' || typeof value === 'number') {
    const reference = references[field]?.find((item) => String(item.id) === String(value));
    const name = referenceName(reference?.name, language);
    if (name) return name;
  }
  if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (isReference(parsed) || Array.isArray(parsed)) {
        return formatPlanningChangeValue(parsed, field, references, language);
      }
    } catch {
      // Free text that resembles JSON remains unchanged.
    }
  }
  if (Array.isArray(value)) {
    const labels = value.map((item) => formatPlanningChangeValue(item, field, references, language));
    return value.some((item, index) => isReference(item) || labels[index] !== String(item))
      ? labels.join(', ')
      : JSON.stringify(value);
  }
  return isRecord(value) ? JSON.stringify(value) : String(value);
}

import type { AppLocale } from '../tokens/locale-signal.token';

type TextRecord = Record<string, unknown>;

function isTextRecord(value: unknown): value is TextRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstNonEmptyText(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0) ?? '';
}

export function resolveLocalizedText(value: unknown, locale: AppLocale = 'es-ES') {
  if (typeof value === 'string') return value.trim() ? value : '';
  if (!isTextRecord(value)) return '';

  const preferredLanguage = locale === 'es-ES' ? 'es' : 'en';
  const name = isTextRecord(value['name']) ? value['name'] : {};

  return firstNonEmptyText(
    value['label'],
    name[preferredLanguage],
    name['es'],
    name['en'],
    value[preferredLanguage],
    value['es'],
    value['en'],
  );
}

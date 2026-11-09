import { resolveLocalizedText } from './resolve-localized-text';

describe('resolveLocalizedText', () => {
  it('should prefer label when it is available', () => {
    expect(resolveLocalizedText({ label: 'Displayed label', name: { es: 'Nombre', en: 'Name' } }, 'en-US')).toBe(
      'Displayed label',
    );
  });

  it('should use Spanish when English translation is missing', () => {
    expect(resolveLocalizedText({ name: { es: 'Nombre' } }, 'en-US')).toBe('Nombre');
  });

  it('should fall back to the localized name when label is null', () => {
    expect(resolveLocalizedText({ label: null, name: { es: 'Nombre' } }, 'en-US')).toBe('Nombre');
  });

  it('should use English when Spanish translation is missing', () => {
    expect(resolveLocalizedText({ name: { en: 'Name' } }, 'es-ES')).toBe('Name');
  });

  it('should resolve a direct localized value', () => {
    expect(resolveLocalizedText({ es: 'Nombre', en: 'Name' }, 'en-US')).toBe('Name');
  });

  it('should return an empty string when no display text exists', () => {
    expect(resolveLocalizedText({ label: ' ', name: { es: '', en: null } }, 'en-US')).toBe('');
    expect(resolveLocalizedText(null)).toBe('');
  });
});

import type { PlanningFormSnapshotEvent, PlanningValueReferences } from '@intaqalab/planning';
import { describe, expect, it } from 'vitest';

import { collectPlanningValueReferences, formatPlanningChangeValue } from './planning-change-value.mapper';

const references: PlanningValueReferences = {
  weaponExternalId: [
    { id: 12, name: 'Weapon Alpha' },
    { id: 19, name: 'Weapon Beta' },
  ],
  denominationId: [{ id: 'denomination-1', name: { es: 'Proyectil', en: 'Projectile' } }],
  typeId: [{ id: 12, name: 'Primer' }],
};

describe('formatPlanningChangeValue', () => {
  it('should display the name of any identified object without changing its ID', () => {
    const value = { id: 'entity-1', name: 'Identifiable entity', active: true };

    expect(formatPlanningChangeValue(value, 'customField', {}, 'es')).toBe('Identifiable entity');
    expect(value).toEqual({ id: 'entity-1', name: 'Identifiable entity', active: true });
  });

  it('should resolve string and numeric IDs using the matching field catalog', () => {
    expect(formatPlanningChangeValue('12', 'weaponExternalId', references, 'en')).toBe('Weapon Alpha');
    expect(formatPlanningChangeValue(12, 'typeId', references, 'en')).toBe('Primer');
    expect(formatPlanningChangeValue('12', 'goal', references, 'en')).toBe('12');
  });

  it('should display localized names for objects and catalog IDs', () => {
    const value = { id: 'type-1', name: { es: 'Espoleta', en: 'Fuse' } };
    expect(formatPlanningChangeValue(value, 'typeId', references, 'es')).toBe('Espoleta');
    expect(formatPlanningChangeValue(value, 'typeId', references, 'en')).toBe('Fuse');
    expect(formatPlanningChangeValue('denomination-1', 'denominationId', references, 'es')).toBe('Proyectil');
    expect(formatPlanningChangeValue('denomination-1', 'denominationId', references, 'en')).toBe('Projectile');
  });

  it('should resolve serialized remote objects and collections of identified objects', () => {
    expect(formatPlanningChangeValue('{"id":"a","name":"Original weapon"}', 'weaponExternalId', {}, 'en')).toBe(
      'Original weapon',
    );
    expect(
      formatPlanningChangeValue('[{"id":"a","name":"First"},{"id":"b","name":"Second"}]', 'typeId', {}, 'en'),
    ).toBe('First, Second');
    expect(formatPlanningChangeValue(['12', '19'], 'weaponExternalId', references, 'en')).toBe(
      'Weapon Alpha, Weapon Beta',
    );
  });

  it.each([
    [null, '-'],
    [undefined, '-'],
    ['', '-'],
    [0, '0'],
    [false, 'false'],
    [3.456789, '3.456789'],
    ['unknown-id', 'unknown-id'],
    ['{invalid JSON', '{invalid JSON'],
    [['a', 'b'], '["a","b"]'],
  ])('should preserve primitive values and safe fallbacks for %j', (value, expected) => {
    expect(formatPlanningChangeValue(value, 'goal', references, 'es')).toBe(expected);
  });
});

describe('collectPlanningValueReferences', () => {
  it('should collect original names and current catalogs without changing snapshots', () => {
    const event: PlanningFormSnapshotEvent = {
      section: 'armament',
      baseline: { series: [{ shots: [{ armament: { weaponExternalId: '12', weaponName: 'Original weapon' } }] }] },
      current: [{ shots: [{ armament: { weaponExternalId: '19', weaponName: 'Stale weapon name' } }] }],
      valueReferences: { weaponExternalId: [{ id: 19, name: 'New weapon' }] },
    };
    const original = structuredClone(event);
    const collected = collectPlanningValueReferences(event);

    expect(formatPlanningChangeValue('12', 'weaponExternalId', collected, 'es')).toBe('Original weapon');
    expect(formatPlanningChangeValue('19', 'weaponExternalId', collected, 'es')).toBe('New weapon');
    expect(event).toEqual(original);
  });

  it('should retain names when dependent catalogs are replaced and collect nested id/name objects', () => {
    const collected = collectPlanningValueReferences(
      {
        section: 'munitions',
        baseline: { rawConfigurations: [{ denomination: { id: 'old', name: 'Old denomination' } }] },
        current: { components: [{ type: { id: 'type-1', name: { es: 'Espoleta', en: 'Fuse' } } }] },
        valueReferences: { denominationId: [{ id: 'new', name: 'New denomination' }] },
      },
      references,
    );

    expect(formatPlanningChangeValue('old', 'denominationId', collected, 'es')).toBe('Old denomination');
    expect(formatPlanningChangeValue('new', 'denominationId', collected, 'es')).toBe('New denomination');
    expect(formatPlanningChangeValue('denomination-1', 'denominationId', collected, 'en')).toBe('Projectile');
    expect(formatPlanningChangeValue('type-1', 'typeId', collected, 'en')).toBe('Fuse');
    expect(references.denominationId).toHaveLength(1);
  });
});

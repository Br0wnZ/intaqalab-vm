import { describe, expect, it } from 'vitest';

import { PlanningChangeDetector } from './planning-change-detector';

describe('PlanningChangeDetector', () => {
  it('captures a deep-cloned baseline snapshot isolated from external mutations', () => {
    const detector = new PlanningChangeDetector();
    const initial = { 'shooting-conditions::elevation::D2': 10 };

    detector.captureBaseline(initial);
    initial['shooting-conditions::elevation::D2'] = 999;

    expect(detector.hasBaseline()).toBe(true);
    expect(detector.getBaselineValue('shooting-conditions::elevation::D2')).toBe(10);
  });

  it('registers a draft modification when a field value differs from baseline', () => {
    const detector = new PlanningChangeDetector();
    const key = detector.buildModificationKey('shooting-conditions', 'elevation', ['D2']);
    detector.captureBaseline({ [key]: 10 });

    const result = detector.detectFieldChange({
      section: 'shooting-conditions',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
    });

    expect(result.type).toBe('upsert');
    if (result.type !== 'upsert') {
      throw new Error('Expected upsert result');
    }
    expect(result.modification).toEqual({
      id: key,
      key,
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 20,
      affectedShots: ['D2'],
      status: 'BORRADOR',
      classification: 'none',
    });
  });

  it('returns remove when a modified field is reverted to its baseline value', () => {
    const detector = new PlanningChangeDetector();
    const key = detector.buildModificationKey('shooting-conditions', 'elevation', ['D2']);
    detector.captureBaseline({ [key]: 10 });

    const first = detector.detectFieldChange({
      section: 'shooting-conditions',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 10,
      newValue: 25,
      affectedShots: ['D2'],
    });
    expect(first.type).toBe('upsert');

    const reverted = detector.detectFieldChange({
      section: 'shooting-conditions',
      parameter: 'elevation',
      action: 'Modificación',
      previousValue: 25,
      newValue: 10,
      affectedShots: ['D2'],
    });
    expect(reverted).toEqual({ type: 'remove', key });
  });

  it('preserves the original baseline value across consecutive edits to the same field', () => {
    const detector = new PlanningChangeDetector();

    const first = detector.detectFieldChange({
      section: 'shooting-conditions',
      parameter: 'orientation',
      action: 'Modificación',
      previousValue: 45,
      newValue: 60,
      affectedShots: ['D2'],
    });
    expect(first.type).toBe('upsert');

    const second = detector.detectFieldChange({
      section: 'shooting-conditions',
      parameter: 'orientation',
      action: 'Modificación',
      previousValue: 60,
      newValue: 90,
      affectedShots: ['D2'],
    });

    expect(second.type).toBe('upsert');
    if (second.type !== 'upsert') {
      throw new Error('Expected upsert result');
    }
    expect(second.modification.previousValue).toBe(45);
    expect(second.modification.newValue).toBe(90);
  });

  it('registers Alta for a new series and each explicitly configured field without inheritance', () => {
    const detector = new PlanningChangeDetector();

    const mods = detector.detectNewSeries('S3', [
      { parameter: 'Temperatura', value: 25, unit: 'ºC', affectedShots: ['S3-D1'] },
      { parameter: 'Distancia', value: 500, unit: 'm', affectedShots: ['S3-D1'] },
    ]);

    expect(mods).toHaveLength(3);
    expect(mods[0]).toMatchObject({
      parameter: 'Nueva serie',
      action: 'Alta',
      previousValue: null,
      newValue: 'S3',
      status: 'BORRADOR',
      classification: 'none',
    });
    expect(mods[1]).toMatchObject({
      parameter: 'Temperatura',
      action: 'Alta',
      previousValue: null,
      newValue: '25 ºC',
      affectedShots: ['S3-D1'],
    });
    expect(mods[2]).toMatchObject({
      parameter: 'Distancia',
      action: 'Alta',
      previousValue: null,
      newValue: '500 m',
      affectedShots: ['S3-D1'],
    });
  });

  it('inherits previous shot values for a new shot and only registers diffs from inherited values', () => {
    const detector = new PlanningChangeDetector();

    const mods = detector.detectNewShotWithInheritance({
      shotLabel: 'D3',
      inheritedValues: {
        Temperatura: 20,
        Distancia: 1000,
        Elevación: 15,
      },
      currentValues: {
        Temperatura: 40,
        Distancia: 1000,
        Elevación: 15,
      },
      units: {
        Temperatura: 'ºC',
        Distancia: 'm',
      },
    });

    expect(mods).toHaveLength(1);
    expect(mods[0]).toMatchObject({
      parameter: 'Temperatura',
      action: 'Modificación',
      previousValue: '20 ºC',
      newValue: 'Temperatura: 40 ºC',
      affectedShots: ['D3'],
      status: 'BORRADOR',
      classification: 'none',
    });

    const reverted = detector.detectFieldChange({
      section: 'shooting-conditions',
      parameter: 'Temperatura',
      action: 'Modificación',
      previousValue: 40,
      newValue: 20,
      affectedShots: ['D3'],
    });
    expect(reverted.type).toBe('remove');
  });

  it('registers a new measure as a single indivisible Alta grouping all acceptance criteria', () => {
    const detector = new PlanningChangeDetector();

    const mod = detector.detectNewMeasure({
      measureName: 'Velocidad inicial',
      criteria: [
        { label: 'Límite inferior', value: 780, unit: 'm/s' },
        { label: 'Límite superior', value: 820, unit: 'm/s' },
        { label: 'Desviación máxima', value: 5, unit: 'm/s' },
      ],
      affectedShots: ['D2', 'D3'],
    });

    expect(mod).toMatchObject({
      parameter: 'Velocidad inicial',
      action: 'Alta',
      previousValue: null,
      newValue: 'Límite inferior: 780 m/s. Límite superior: 820 m/s. Desviación máxima: 5 m/s',
      affectedShots: ['D2', 'D3'],
      status: 'BORRADOR',
      classification: 'none',
    });
  });

  it('registers a deletion as a single Baja modification with null newValue', () => {
    const detector = new PlanningChangeDetector();

    const mod = detector.detectDeletion('series-and-shots', 'Disparo D4', 'D4', ['D4']);

    expect(mod).toMatchObject({
      parameter: 'Disparo D4',
      action: 'Baja',
      previousValue: 'D4',
      newValue: null,
      affectedShots: ['D4'],
      status: 'BORRADOR',
      classification: 'none',
    });
  });
});

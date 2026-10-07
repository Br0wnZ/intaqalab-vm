import { describe, expect, it } from 'vitest';

import {
    fromPosition,
    mapMaoTopographyMassConfigToRequest,
    numToField,
    parseNum,
    toPosition,
} from './mao-topography.mapper';

describe('mao-topography.mapper', () => {
  it('converts field values to a position using locale decimals', () => {
    expect(toPosition({ value: '10,5', unit: 'm' }, { value: '20.25', unit: 'm' }, { value: '30', unit: 'm' })).toEqual(
      { x: 10.5, y: 20.25, z: 30, unit: 'm' },
    );
  });

  it('formats a position for the form', () => {
    expect(fromPosition({ x: 10.5, y: null, z: 30, unit: 'm' })).toEqual({
      x: { value: '10.5', unit: 'm' },
      y: null,
      z: { value: '30.0', unit: 'm' },
    });
  });

  it('parses numeric fields and preserves empty values as null', () => {
    expect(parseNum({ value: '12,50', unit: 'm' })).toBe(12.5);
    expect(parseNum(null)).toBeNull();
    expect(numToField(null, 'm', 1)).toBeNull();
  });

  it('applies prefilled and changed coordinates in a deduplicated bulk request', () => {
    const current = {
      xPieza: { value: '10', unit: 'm' },
      yPieza: { value: '20', unit: 'm' },
      zPieza: null,
      xBlanco: null,
      yBlanco: null,
      zBlanco: null,
    };

    expect(
      mapMaoTopographyMassConfigToRequest(
        {
          ...current,
          xPieza: { value: '10.0', unit: 'm' },
          yPieza: { value: '25,5', unit: 'm' },
        },
        current,
        ['shot-1', 'shot-1', 'shot-2'],
      ),
    ).toEqual({
      assignedShotIds: ['shot-1', 'shot-2'],
      pieceX: 10,
      pieceXUnit: 'M',
      pieceY: 25.5,
      pieceYUnit: 'M',
    });
  });

  it('sends null when a populated coordinate is cleared', () => {
    const current = { xPieza: { value: '10', unit: 'm' } };

    expect(mapMaoTopographyMassConfigToRequest({ xPieza: null }, current, ['shot-1'])).toEqual({
      assignedShotIds: ['shot-1'],
      pieceX: null,
    });
  });

  it('does not submit when there are no populated fields or target shots', () => {
    const empty = { xPieza: null };

    expect(mapMaoTopographyMassConfigToRequest(empty, empty, ['shot-1'])).toBeNull();
    expect(mapMaoTopographyMassConfigToRequest({ xPieza: { value: '11', unit: 'm' } }, empty, [])).toBeNull();
  });
});

import { PressureUnitEnum } from '@intaqalab/models';
import { describe, expect, it } from 'vitest';

import { mapOverpressureFormToRequest, mapRemoteToOverpressureState } from './overpressure-info.mapper';

describe('Overpressure info mapper', () => {
  const model = {
    presionMaxima: 300.123456789,
    presionMinima: 0,
    presionRef: 233.971234567,
    unidadPresion: PressureUnitEnum.MPA,
  };

  it('preserves precision and sends only editable fields', () => {
    expect(mapOverpressureFormToRequest(model)).toEqual({
      maximumPressure: 300.123456789,
      minimumPressure: 0,
      referencePressure: 233.971234567,
      pressureUnit: PressureUnitEnum.MPA,
    });
  });

  it.each([null, -1, NaN, Infinity])('rejects invalid pressure %s', (value) => {
    expect(() => mapOverpressureFormToRequest({ ...model, presionRef: value })).toThrow();
  });

  it('rejects a minimum greater than the maximum', () => {
    expect(() => mapOverpressureFormToRequest({ ...model, presionMinima: 400 })).toThrow();
  });

  it('preserves unavailable safety pressure without substituting a limit', () => {
    expect(
      mapRemoteToOverpressureState({
        overpressureInfo: {
          ...mapOverpressureFormToRequest(model),
          safetyPressure: null,
          targetPressure: 150.0617283945,
        },
        warnings: [{ code: 'TUBE_UNAVAILABLE', message: 'Tube unavailable' }],
      }).presionSeguridad,
    ).toBeNull();
  });
});

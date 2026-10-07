import { describe, expect, it } from 'vitest';

import type { JltMaoMassConfigFields } from './jlt-mao-mass-config.mapper';
import { canApplyJltMaoMassConfig, mapJltMaoMassConfigToRequest } from './jlt-mao-mass-config.mapper';

const emptyFields: JltMaoMassConfigFields = {
  velocidadInicial: null,
  distanciaPique: null,
  derivaTabular: null,
  tiempoVuelo: null,
  diferenciaAngular: null,
  anguloTiro: null,
  graduacionEspoleta: null,
  alturaFuncionamiento: null,
  distanciaFuncionamiento: null,
};

describe('JltMaoMassConfigMapper', () => {
  it('maps selected values to a deduplicated partial request and omits unchanged planning values', () => {
    const current: JltMaoMassConfigFields = {
      ...emptyFields,
      anguloTiro: { value: '15', unit: 'oo' },
      graduacionEspoleta: { value: '8', unit: 's' },
    };

    const request = mapJltMaoMassConfigToRequest(
      {
        ...current,
        velocidadInicial: { value: '800,5', unit: 'm/s' },
      },
      current,
      ['shot-1', 'shot-1', 'shot-2'],
    );

    expect(request).toEqual({ assignedShotIds: ['shot-1', 'shot-2'], theoreticalInitialVelocity: 800.5 });
  });

  it('sends null when a previously populated value is explicitly cleared', () => {
    const current: JltMaoMassConfigFields = {
      ...emptyFields,
      velocidadInicial: { value: '800', unit: 'm/s' },
    };

    const request = mapJltMaoMassConfigToRequest({ ...current, velocidadInicial: null }, current, ['shot-1']);

    expect(request).toEqual({ assignedShotIds: ['shot-1'], theoreticalInitialVelocity: null });
  });

  it('does not submit when no schema-supported field or target shot is present', () => {
    expect(mapJltMaoMassConfigToRequest(emptyFields, emptyFields, ['shot-1'])).toBeNull();
    expect(
      mapJltMaoMassConfigToRequest(
        { ...emptyFields, velocidadInicial: { value: '800', unit: 'm/s' } },
        emptyFields,
        [],
      ),
    ).toBeNull();
  });

  it('does not treat unchanged planned angle and fuse values as bulk edits', () => {
    const current: JltMaoMassConfigFields = {
      ...emptyFields,
      anguloTiro: { value: '15', unit: 'oo' },
      graduacionEspoleta: { value: '8', unit: 's' },
    };

    expect(canApplyJltMaoMassConfig(current, current)).toBe(false);
  });
});

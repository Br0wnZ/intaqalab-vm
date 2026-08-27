import { describe, expect, it } from 'vitest';

import type { ShotMunitionResponse } from '../../models';
import {
  mapMunitionStateToRequest,
  mapPlanningSeriesToOptions,
  mapRemoteToMunitionState,
  mapShotsToDisparoOptions,
  numToField,
  parseNum,
} from './munition-introduction.mapper';

describe('munition-introduction.mapper', () => {
  describe('numToField & parseNum', () => {
    it('should convert numbers to InputFieldValue and parse them back', () => {
      expect(numToField(null)).toBeNull();
      expect(numToField(undefined)).toBeNull();
      expect(numToField(42.5, 'g')).toEqual({ value: '42.5', unit: 'g' });

      expect(parseNum(null)).toBeNull();
      expect(parseNum({ value: '42.5', unit: 'g' })).toBe(42.5);
      expect(parseNum({ value: '42,5', unit: 'g' })).toBe(42.5);
      expect(parseNum({ value: '', unit: 'g' })).toBeNull();
      expect(parseNum({ value: 'abc', unit: 'g' })).toBeNull();
    });
  });

  describe('mapPlanningSeriesToOptions & mapShotsToDisparoOptions', () => {
    it('should map planning series and fallback', () => {
      const series = [{ id: 's-1', name: 'Calentamiento' }];
      expect(mapPlanningSeriesToOptions(series)).toEqual([{ value: 's-1', label: 'Calentamiento' }]);
      expect(mapPlanningSeriesToOptions(null, [{ value: 'fb', label: 'FB' }])).toEqual([{ value: 'fb', label: 'FB' }]);
    });

    it('should map shots and fallback', () => {
      const shots = [{ shotId: 'sh-1' }, { shotId: 'sh-2' }];
      expect(mapShotsToDisparoOptions(shots)).toEqual([
        { value: 'sh-1', label: 'Disparo 1' },
        { value: 'sh-2', label: 'Disparo 2' },
      ]);
      expect(mapShotsToDisparoOptions(null, [{ value: 'fb', label: 'FB' }])).toEqual([{ value: 'fb', label: 'FB' }]);
    });
  });

  describe('mapRemoteToMunitionState', () => {
    it('should return empty objects if response has no components', () => {
      const res: ShotMunitionResponse = { munitionData: [] };
      expect(mapRemoteToMunitionState(res)).toEqual({
        identificacion: {},
        pesos: {},
        acondicionamiento: {},
      });
      expect(mapRemoteToMunitionState(null)).toEqual({
        identificacion: {},
        pesos: {},
        acondicionamiento: {},
      });
    });

    it('should map component data to state pieces', () => {
      const res: ShotMunitionResponse = {
        munitionData: [
          {
            componentId: 'comp-1',
            identificationData: {
              denominationId: 'den-1',
              batch: 'LOT-1',
              clientNumber: 'CL-1',
              fuseWorkingModeId: 'fwm-1',
              fuseGraduation: 5.5,
              observations: 'Ident OK',
            },
            weightData: {
              balanceId: 101,
              weight: 120.5,
              weightAdded: 10,
              weightRemoved: 2,
              weighingDateTime: '2026-08-27T10:00:00Z',
              weighingRange: '0-500g',
              observations: 'Peso OK',
            },
            conditioningData: {
              climaticChamberId: 202,
              chamberEntryDateTime: '2026-08-27T08:00:00Z',
              chamberExitDateTime: '2026-08-27T10:00:00Z',
              temperature: 20,
              programmedTemperature: 21,
              chamberTime: '02:00:00',
              observations: 'Camara OK',
            },
          },
        ],
      };

      const mapped = mapRemoteToMunitionState(res);

      expect(mapped.identificacion).toEqual({
        componente: 'comp-1',
        denominacion: 'den-1',
        lote: 'LOT-1',
        numeroCliente: 'CL-1',
        modoFuncionamiento: 'fwm-1',
        graduacionEspoleta: 5.5,
        observaciones: 'Ident OK',
      });

      expect(mapped.pesos).toEqual({
        componente: 'comp-1',
        balanza: '101',
        peso: 120.5,
        pesoAnadido: 10,
        pesoRetirado: 2,
        fechaHora: '2026-08-27T10:00:00Z',
        rangoPesada: '0-500g',
        observaciones: 'Peso OK',
      });

      expect(mapped.acondicionamiento).toEqual({
        camara: '202',
        componente: 'comp-1',
        fechaHoraEntrada: '2026-08-27T08:00',
        fechaHoraSalida: '2026-08-27T10:00',
        temperatura: 20,
        temperaturaCorregida: 21,
        observaciones: 'Camara OK',
      });
    });
  });

  describe('mapMunitionStateToRequest', () => {
    it('should convert tab states into ShotMunitionRequest', () => {
      const req = mapMunitionStateToRequest({
        componentId: 'comp-1',
        identificacion: {
          denominacion: 'den-1',
          lote: 'LOT-1',
          numeroCliente: 'CL-1',
          modoFuncionamiento: 'fwm-1',
          graduacionEspoleta: 5.5,
          observaciones: 'Ident obs',
        },
        pesos: {
          balanza: '101',
          peso: 150,
          pesoAnadido: 5,
          pesoRetirado: 1,
          fechaHora: '2026-08-27T10:00:00Z',
          observaciones: 'Peso obs',
        },
        acondicionamiento: {
          camara: '202',
          fechaHoraEntrada: '2026-08-27T08:00:00Z',
          fechaHoraSalida: '2026-08-27T10:00:00Z',
          observaciones: 'Acond obs',
        },
      });

      expect(req.components).toHaveLength(1);
      expect(req.components[0].componentId).toBe('comp-1');
      expect(req.components[0].identificationData?.denominationId).toBe('den-1');
      expect(req.components[0].weightData?.balanceId).toBe(101);
      expect(req.components[0].weightData?.weight).toBe(150);
      expect(req.components[0].conditioningData?.climaticChamberId).toBe(202);
    });
  });
});

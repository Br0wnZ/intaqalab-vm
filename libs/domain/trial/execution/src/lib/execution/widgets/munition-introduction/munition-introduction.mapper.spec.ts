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
        weight: {},
        weightDataByBalance: {},
        acondicionamiento: {},
      });
      expect(mapRemoteToMunitionState(null)).toEqual({
        identificacion: {},
        weight: {},
        weightDataByBalance: {},
        acondicionamiento: {},
      });
    });

    it('should map a single-balance weightData array to weightDataByBalance', () => {
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
            weightData: [
              {
                balanceId: 101,
                weight: 120.5,
                weightAdded: 10,
                weightRemoved: 2,
                weighingDateTime: '2026-08-27T10:00:00Z',
                weighingRange: '0-500',
                observations: 'Weight OK',
              },
            ],
            conditioningData: {
              climaticChamberId: 202,
              chamberEntryDateTime: '2026-08-27T08:00:00Z',
              chamberExitDateTime: '2026-08-27T10:00:00Z',
              temperature: 20,
              programmedTemperature: 21,
              chamberTime: '02:00:00',
              observations: 'Chamber OK',
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

      // weightDataByBalance: key is '101' (unknown balanceId → kept as string)
      expect(mapped.weightDataByBalance['101']).toEqual({
        componente: 'comp-1',
        balance: '101',
        weight: 120.5,
        weightAdded: 10,
        weightRemoved: 2,
        weighingDateTime: '2026-08-27T10:00:00Z',
        weighingRange: '0-500',
        observations: 'Weight OK',
      });

      // Active weight = first entry
      expect(mapped.weight).toEqual(mapped.weightDataByBalance['101']);

      expect(mapped.acondicionamiento).toEqual({
        camara: '202',
        componente: 'comp-1',
        fechaHoraEntrada: '2026-08-27T08:00',
        fechaHoraSalida: '2026-08-27T10:00',
        temperatura: 20,
        temperaturaCorregida: 21,
        observaciones: 'Chamber OK',
      });
    });

    it('should map known balanceIds to frontend keys (bal-01, bal-02)', () => {
      const res: ShotMunitionResponse = {
        munitionData: [
          {
            componentId: 'comp-1',
            weightData: [
              { balanceId: 21031, weight: 40 },
              { balanceId: 21032, weight: 41 },
            ],
          },
        ],
      };

      const mapped = mapRemoteToMunitionState(res);

      expect(Object.keys(mapped.weightDataByBalance)).toEqual(['bal-01', 'bal-02']);
      expect(mapped.weightDataByBalance['bal-01'].weight).toBe(40);
      expect(mapped.weightDataByBalance['bal-02'].weight).toBe(41);
      // Active weight = first balance (bal-01)
      expect(mapped.weight.balance).toBe('bal-01');
    });

    it('should return empty weightDataByBalance if weightData is null or empty', () => {
      const res: ShotMunitionResponse = {
        munitionData: [{ componentId: 'comp-1', weightData: null }],
      };
      const mapped = mapRemoteToMunitionState(res);
      expect(mapped.weightDataByBalance).toEqual({});
      expect(mapped.weight).toEqual({ componente: 'comp-1', balance: null });
    });

    it('should map specific component when targetComponentId is passed and reset balance', () => {
      const res: ShotMunitionResponse = {
        munitionData: [
          {
            componentId: 'granada-01',
            identificationData: { denominationId: 'den-01' },
            weightData: [{ balanceId: 21031, weight: 43.5 }],
          },
          {
            componentId: 'espoleta-01',
            identificationData: { denominationId: 'den-02' },
            weightData: [{ balanceId: 21032, weight: 520 }],
          },
        ],
      };

      const mappedGranada = mapRemoteToMunitionState(res, 'granada-01');
      expect(mappedGranada.identificacion.denominacion).toBe('den-01');
      expect(mappedGranada.weight.balance).toBe('bal-01');
      expect(mappedGranada.weight.weight).toBe(43.5);

      const mappedEspoleta = mapRemoteToMunitionState(res, 'espoleta-01');
      expect(mappedEspoleta.identificacion.denominacion).toBe('den-02');
      expect(mappedEspoleta.weight.balance).toBe('bal-02');
      expect(mappedEspoleta.weight.weight).toBe(520);
    });
  });

  describe('mapMunitionStateToRequest', () => {
    it('should build weightData array from weightDataByBalance', () => {
      const req = mapMunitionStateToRequest({
        componentId: 'comp-1',
        identificacion: {
          denominacion: '1',
          lote: 'LOT-1',
          numeroCliente: 'CL-1',
          modoFuncionamiento: 'fwm-1',
          graduacionEspoleta: 5.5,
          observaciones: 'Ident obs',
        },
        weightDataByBalance: {
          'bal-01': {
            componente: 'comp-1',
            balance: 'bal-01',
            weight: 40,
            weightAdded: null,
            weightRemoved: null,
            weighingDateTime: '2026-08-27T10:00:00Z',
            weighingRange: '0-500',
            observations: 'Weight bal-01',
          },
          'bal-02': {
            componente: 'comp-1',
            balance: 'bal-02',
            weight: 41,
            weightAdded: null,
            weightRemoved: null,
            weighingDateTime: '2026-08-27T10:05:00Z',
            weighingRange: '0-2000',
            observations: 'Weight bal-02',
          },
        },
        acondicionamiento: {
          camara: 'camara-01',
          fechaHoraEntrada: '2026-08-27T08:00:00Z',
          fechaHoraSalida: '2026-08-27T10:00:00Z',
          observaciones: 'Conditioning obs',
        },
      });

      expect(req.components).toHaveLength(1);
      const comp = req.components[0];
      expect(comp.componentId).toBe('comp-1');
      expect(comp.identificationData?.denominationId).toBe(1);

      // weightData is now an array
      expect(Array.isArray(comp.weightData)).toBe(true);
      expect(comp.weightData).toHaveLength(2);

      const bal01Entry = comp.weightData?.find((e) => e.balanceId === 21031);
      expect(bal01Entry?.weight).toBe(40);

      const bal02Entry = comp.weightData?.find((e) => e.balanceId === 21032);
      expect(bal02Entry?.weight).toBe(41);

      expect(comp.conditioningData?.climaticChamberId).toBe(21045);
    });

    it('should set weightData to null if weightDataByBalance is empty', () => {
      const req = mapMunitionStateToRequest({
        componentId: 'comp-1',
        identificacion: {},
        weightDataByBalance: {},
        acondicionamiento: {},
      });
      expect(req.components[0].weightData).toBeNull();
    });

    it('should preserve other components in mapMunitionStateToRequest', () => {
      const req = mapMunitionStateToRequest({
        componentId: 'granada-01',
        identificacion: { denominacion: '1' },
        weightDataByBalance: {
          'bal-01': {
            componente: 'granada-01',
            balance: 'bal-01',
            weight: 45,
            weightAdded: null,
            weightRemoved: null,
            weighingDateTime: null,
            weighingRange: null,
            observations: null,
          },
        },
        acondicionamiento: {},
        existingComponents: [
          {
            componentId: 'granada-01',
            identificationData: { denominationId: '1' },
          },
          {
            componentId: 'espoleta-01',
            identificationData: { denominationId: '2' },
            weightData: [{ balanceId: 21032, weight: 520 }],
          },
        ],
      });

      expect(req.components).toHaveLength(2);
      expect(req.components[0].componentId).toBe('granada-01');
      expect(req.components[0].identificationData?.denominationId).toBe(1);
      expect(req.components[1].componentId).toBe('espoleta-01');
      expect(req.components[1].identificationData?.denominationId).toBe(2);
      expect(req.components[1].weightData?.[0].weight).toBe(520);
    });
  });
});

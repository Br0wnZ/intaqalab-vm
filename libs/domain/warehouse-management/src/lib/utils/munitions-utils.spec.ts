/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayloadMunition, getPayloadMunitionComponents } from './munitions-utils';

describe('munitions-utils', () => {
  it('should be getPayloadMunition create a MunitionStockPostModel', () => {
    const componentValue: any = {
      batch: 'batchCompo',
      denominationId: { id: 'some IdY' } as any,
      munitionTypeId: 'munitionTypeIdCompo',
    };

    const form: any = {
      batch: 'batch',
      denominationId: { id: 'some IdX' } as any,
      munitionTypeId: 'munitionTypeId',
      quantity: 1,
      generalData: {
        clientId: 'client',
        entryDate: '2026-06-09T14:30:55.661Z',
        observations: 'observations',
        plannedFireTrialId: 'plannedFireTrialId',
      },
      location: {
        cellName: 'cellName',
        munitionDumpId: 'munitionDumpId',
      },
      associatedComponents: [componentValue],
    };

    const result = getPayloadMunition(form);
    expect(result).toStrictEqual({
      associatedComponents: [
        {
          batch: componentValue.batch,
          denominationId: componentValue.denominationId.id,
          munitionTypeId: componentValue.munitionTypeId,
        },
      ],
      batch: form.batch,
      denominationId: form.denominationId.id,
      generalData: {
        clientId: form.generalData.clientId,
        entryDate: form.generalData.entryDate,
        observations: form.generalData.observations,
        plannedFireTrialId: form.generalData.plannedFireTrialId,
      },
      location: {
        cellName: form.location.cellName,
        munitionDumpId: form.location.munitionDumpId,
      },
      munitionTypeId: form.munitionTypeId,
      quantity: form.quantity,
    });
  });

  it('should be getPayloadMunitionComponents create a MunitionComponentStockPostModel', () => {
    const componentValue: any = {
      batch: 'batchCompo',
      denominationId: { id: 'some IdY' } as any,
      munitionTypeId: 'munitionTypeIdCompo',
      quantity: 2,
    };

    const form: any = {
      generalData: {
        clientId: 'client',
        entryDate: '2026-06-09T14:30:55.661Z',
        observations: 'observations',
        plannedFireTrialId: 'plannedFireTrialId',
      },
      location: {
        cellName: 'cellName',
        munitionDumpId: 'munitionDumpId',
      },
      multipleComponentsData: [componentValue],
    };

    const result = getPayloadMunitionComponents(form);
    expect(result).toStrictEqual([
      {
        batch: componentValue.batch,
        denominationId: componentValue.denominationId.id,
        generalData: {
          clientId: form.generalData.clientId,
          entryDate: form.generalData.entryDate,
          observations: form.generalData.observations,
          plannedFireTrialId: form.generalData.plannedFireTrialId,
        },
        location: {
          cellName: form.location.cellName,
          munitionDumpId: form.location.munitionDumpId,
        },
        munitionTypeId: componentValue.munitionTypeId,
        quantity: componentValue.quantity,
      },
    ]);
  });
});

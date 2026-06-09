/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ComponentListMunitionForm,
  MunitionGeneralDataForm,
  MunitionIdentificationForm,
  MunitionLocationForm,
} from '../models/munition-stock.model';
import { getPayloadMunition, getPayloadMunitionComponents } from './munitions-utils';

describe('munitions-utils', () => {
  it('should be getPayloadMunition create a MunitionStockPostModel', () => {
    const locationForm: MunitionLocationForm = {
      cellName: 'cellName',
      munitionDumpId: 'munitionDumpId',
    };
    const identificationForm: MunitionIdentificationForm = {
      batch: 'batch',
      denominationId: { id: 'some IdX' } as any,
      munitionTypeId: 'munitionTypeId',
      quantity: 1,
    };

    const generalDataForm: MunitionGeneralDataForm = {
      client: 'client',
      entryDate: new Date('2026-06-09T14:30:55.661Z'),
      observations: 'observations',
      plannedFireTrialId: 'plannedFireTrialId',
      plannedFireTrialView: '',
    };
    const componentValue: ComponentListMunitionForm = {
      batch: 'batchCompo',
      cellName: 'cellNameCompo',
      denominationId: { id: 'some IdY' } as any,
      munitionDumpId: 'munitionDumpIdCompo',
      munitionTypeId: 'munitionTypeIdCompo',
      quantity: 2,
      showUbication: true,
    };

    const result = getPayloadMunition(locationForm, identificationForm, generalDataForm, [componentValue]);
    expect(result).toStrictEqual({
      associatedComponents: [
        {
          batch: componentValue.batch,
          denominationId: (componentValue.denominationId as any).id,
          munitionTypeId: componentValue.munitionTypeId,
        },
      ],
      batch: identificationForm.batch,
      denominationId: (identificationForm.denominationId as any).id,
      generalData: {
        clientId: generalDataForm.client,
        entryDate: '2026-06-09T14:30:55.661Z',
        observations: generalDataForm.observations,
        plannedFireTrialId: generalDataForm.plannedFireTrialId,
      },
      location: {
        cellName: locationForm.cellName,
        munitionDumpId: locationForm.munitionDumpId,
      },
      munitionTypeId: identificationForm.munitionTypeId,
      quantity: identificationForm.quantity,
    });
  });

  it('should be getPayloadMunitionComponents create a MunitionComponentStockPostModel  ', () => {
    const locationForm: MunitionLocationForm = {
      cellName: 'cellName',
      munitionDumpId: 'munitionDumpId',
    };
    const generalDataForm: MunitionGeneralDataForm = {
      client: 'client',
      entryDate: new Date('2026-06-09T14:30:55.661Z'),
      observations: 'observations',
      plannedFireTrialId: 'plannedFireTrialId',
      plannedFireTrialView: '',
    };
    const componentValue: ComponentListMunitionForm = {
      batch: 'batchCompo',
      cellName: 'cellNameCompo',
      denominationId: { id: 'some IdY' } as any,
      munitionDumpId: 'munitionDumpIdCompo',
      munitionTypeId: 'munitionTypeIdCompo',
      quantity: 2,
      showUbication: true,
    };

    const result = getPayloadMunitionComponents(locationForm, generalDataForm, [componentValue]);
    expect(result).toStrictEqual([
      {
        batch: componentValue.batch,
        denominationId: (componentValue.denominationId as any).id,
        generalData: {
          clientId: generalDataForm.client,
          entryDate: '2026-06-09T14:30:55.661Z',
          observations: generalDataForm.observations,
          plannedFireTrialId: generalDataForm.plannedFireTrialId,
        },
        location: {
          cellName: locationForm.cellName,
          munitionDumpId: locationForm.munitionDumpId,
        },
        munitionTypeId: componentValue.munitionTypeId,
        quantity: componentValue.quantity,
      },
    ]);
  });
});

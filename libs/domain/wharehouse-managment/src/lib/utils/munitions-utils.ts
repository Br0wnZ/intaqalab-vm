import type { DenominationModel } from '../models/denominations.model';
import type { MunitionComponentPostModel, MunitionStockFormModel } from '../models/munition-stock.model';

export function getPayloadMunition(form: MunitionStockFormModel) {
  const associatedComponents = form.associatedComponents.map((component) => ({
    ...component,
    denominationId: (component.denominationId as DenominationModel).id.toString(),
  }));

  return {
    batch: form.batch,
    denominationId: (form.denominationId as unknown as DenominationModel).id.toString(),
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
    quantity: form.quantity || 1,
    associatedComponents,
  };
}

export function getPayloadMunitionComponents(form: MunitionStockFormModel) {
  const result: MunitionComponentPostModel[] = [];

  for (const component of form.multipleComponentsData) {
    const valueToAdd: MunitionComponentPostModel = {
      batch: component.batch,
      denominationId: (component.denominationId as DenominationModel).id.toString(),
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
      munitionTypeId: component.munitionTypeId,
      quantity: component.quantity || 1,
    };

    result.push(valueToAdd);
  }

  return result;
}

import type {
  ComponentListMunitionForm,
  MunitionComponentPostModel,
  MunitionComponentStockPostModel,
  MunitionGeneralDataForm,
  MunitionIdentificationForm,
  MunitionLocationForm,
  MunitionStockAssociadtedComponentPost,
  MunitionStockPostModel,
} from '../models/munition-stock.model';

export function getPayloadMunition(
  locationForm: MunitionLocationForm | undefined,
  itentificationForm: MunitionIdentificationForm | undefined,
  generalDataForm: MunitionGeneralDataForm | undefined,
  componentValues: ComponentListMunitionForm[],
): MunitionStockPostModel | undefined {
  if (locationForm === undefined || itentificationForm === undefined || generalDataForm === undefined) {
    return;
  } else {
    const associatedComponents: MunitionStockAssociadtedComponentPost[] = [];
    for (const componentType of componentValues || []) {
      const denomination = componentType.denominationId;
      if (typeof denomination === 'string') {
        return;
      }
      const componentValue: MunitionStockAssociadtedComponentPost = {
        batch: componentType.batch,
        denominationId: denomination.id,
        munitionTypeId: componentType.munitionTypeId,
      };
      associatedComponents.push(componentValue);
    }
    const denomination = itentificationForm.denominationId;
    if (typeof denomination === 'string') {
      return;
    } else {
      const result: MunitionStockPostModel = {
        associatedComponents,
        batch: itentificationForm.batch,
        denominationId: denomination.id,
        generalData: {
          clientId: generalDataForm.client,
          entryDate: generalDataForm.entryDate.toISOString(),
          observations: generalDataForm.observations,
          plannedFireTrialId: generalDataForm.plannedFireTrialId,
        },
        location: locationForm,
        munitionTypeId: itentificationForm.munitionTypeId,
        quantity: itentificationForm.quantity,
      };
      return result;
    }
  }
}

export function getPayloadMunitionComponents(
  locationForm: MunitionLocationForm | undefined,
  generalDataForm: MunitionGeneralDataForm | undefined,
  componentValues: ComponentListMunitionForm[],
): MunitionComponentStockPostModel | undefined {
  if (locationForm === undefined || generalDataForm === undefined || componentValues === undefined) {
    return;
  } else {
    const result: MunitionComponentStockPostModel = [];

    for (const component of componentValues) {
      const denomination = component.denominationId;
      if (typeof denomination === 'string') {
        return;
      }

      const valueToAdd: MunitionComponentPostModel = {
        batch: component.batch,
        denominationId: denomination.id,
        generalData: {
          clientId: generalDataForm.client,
          entryDate: generalDataForm.entryDate.toISOString(),
          observations: generalDataForm.observations,
          plannedFireTrialId: generalDataForm.plannedFireTrialId,
        },
        location: {
          cellName: locationForm.cellName,
          munitionDumpId: locationForm.munitionDumpId,
        },
        munitionTypeId: component.munitionTypeId,
        quantity: component.quantity,
      };
      if (component.munitionDumpId === '' || component.cellName === '') {
        valueToAdd.location.munitionDumpId = locationForm.munitionDumpId;
        valueToAdd.location.cellName = locationForm.cellName;
      }
      result.push(valueToAdd);
    }
    return result;
  }
}

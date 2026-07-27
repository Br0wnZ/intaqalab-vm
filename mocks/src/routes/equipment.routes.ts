import { Router } from 'express';

import { getEquipmentDenominationsDispatcher, getEquipmentItemsDispatcher } from '../fixtures/equipment/equipment-dispatcher';

export const equipmentRouter = Router({ mergeParams: true });

equipmentRouter.get('/equipment/denominations', (req, res) => {
  const data = getEquipmentDenominationsDispatcher(req);
  res.status(200).json(data);
});

equipmentRouter.get('/equipment/items', (req, res) => {
  const data = getEquipmentItemsDispatcher(req);
  res.status(200).json(data);
});

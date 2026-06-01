import { Router } from 'express';

import { wharehouseManagmentComponentTypesDispatcher } from '../fixtures/wharehouse-managment/component-types/component-types-dispatcher';
import { wharehouseManagmentDenominationsDispatcher } from '../fixtures/wharehouse-managment/denominations/denominations-dispatcher';
import { wharehouseManagmentMunitionsDumpsDispatcher } from '../fixtures/wharehouse-managment/munitions-dumps/munitions-dumps-dispatcher';
import { getFixture } from '../utils';

export const whareHouseRouter = Router();

whareHouseRouter.get('/:centerId/warehouse/component-types', (req, res) => {
  const { pageSize = 10, page = 1, category = '' } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);
  const dataToSend = wharehouseManagmentComponentTypesDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
    category: category as string | undefined,
  });

  res.status(200).send(dataToSend);
});

whareHouseRouter.get('/:centerId/warehouse/denominations', (req, res) => {
  const { pageSize = 10, page = 1, name = '', category = '', munitionTypeId = '' } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  const dataToSend = wharehouseManagmentDenominationsDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
    name: name as string | undefined,
    category: category as string | undefined,
    munitionTypeId: munitionTypeId as string | undefined,
  });
  res.status(200).send(dataToSend);
});

// Endpoints usados por componentTypesResource y denominationsResource de munitions-service
// GET ${warehouseUrl}/munition-types → /:centerId/warehouse/munition-types
whareHouseRouter.get('/:centerId/warehouse/munition-types', (req, res) => {
  const { pageSize = 100, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);
  const dataToSend = wharehouseManagmentComponentTypesDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
  });
  res.status(200).send(dataToSend);
});

// GET ${warehouseUrl}/denominations → /:centerId/warehouse/denominations (ya existe, pero se registra
// antes de la ruta genérica para garantizar prioridad con los params de munitions-service)

whareHouseRouter.get('/:centerId/warehouse/munitions-dumps', (req, res) => {
  const { pageSize = 10, page = 1 } = req.query;
  const pageSizeNumber = parseInt(pageSize as string, 10);
  const pageNumber = parseInt(page as string, 10);

  const dataToSend = wharehouseManagmentMunitionsDumpsDispatcher({
    pageSize: pageSizeNumber,
    page: pageNumber,
  });
  res.status(200).send(dataToSend);
});

whareHouseRouter.post('/:centerId/warehouse/:entiy(munition-components|denominations|munitions-dumps)', (req, res) => {
  res.status(200).send(req.body);
});

whareHouseRouter.put(
  '/:centerId/warehouse/:entiy(munition-components|denominations|munitions-dumps)/:id',
  (req, res) => {
    res.status(200).send(req.body);
  },
);

whareHouseRouter.delete(
  '/:centerId/warehouse/:entiy(munition-components|denominations|munitions-dumps)/:id',
  (req, res) => {
    res.status(200).send(null);
  },
);

whareHouseRouter.post('/:centerId/warehouse/stock/munitions', (req, res) => {
  // res.status(200).send({ id: 'rretrewtrer453543535', ...req.body });
  res.status(400).send({ foo: 'bar' });
});

whareHouseRouter.get('/:centerId/warehouse/stock/munitions/:id', (req, res) => {
  const data = getFixture('fixtures/wharehouse-managment/munition-detail', 'munition-detail-fixture.json');
  res.status(200).send(data);
});

whareHouseRouter.patch('/:centerId/warehouse/stock/munitions/:id', (req, res) => {
  const data = getFixture('fixtures/wharehouse-managment/munition-detail', 'munition-detail-fixture.json');
  res.status(200).send(data);
});

whareHouseRouter.get('/:centerId/warehouse/stock/munition-components/:id', (req, res) => {
  const data = getFixture('fixtures/wharehouse-managment/munition-detail', 'munition-component-detail-fixture.json');
  res.status(200).send(data);
});

whareHouseRouter.get('/:centerId/warehouse/stock/:id/certificates', (req, res) => {
  const data = getFixture('fixtures/wharehouse-managment/certificates', 'certificate-fixture.json');
  res.status(200).send(data);
  // res.status(200).send({
  //   page: 1,
  //   pageSize: 25,
  //   totalElements: 0,
  //   items: [],
  // });
});

whareHouseRouter.get('/:centerId/warehouse/stock/', (req, res) => {
  const data = getFixture('fixtures/wharehouse-managment/stock-list', 'stock-list-fixture.json');
  res.status(200).send(data);
});

whareHouseRouter.get('/:centerId/warehouse/movements/', (req, res) => {
  const data = getFixture('fixtures/wharehouse-managment/movements', 'movements-list-fixture.json');
  res.status(200).send(data);
});

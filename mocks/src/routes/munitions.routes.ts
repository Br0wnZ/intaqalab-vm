import { Router } from 'express';

import type { MasterDataIItem } from '../fixtures/munitions/catalog-dispatcher';
import { createSimpleCatalogDispatcher } from '../fixtures/munitions/catalog-dispatcher';
import { getMunitionsDispatcher, updateMunitionsDispatcher } from '../fixtures/munitions/trial-munitions-dispatcher';

export const munitionsRouter = Router();

const fuseWorkingModesDispatcher = createSimpleCatalogDispatcher<MasterDataIItem>(
  'fixtures/munitions',
  'fuse-working-modes-fixture.json',
);

// Obtener configuraciones de munición de la prueba
munitionsRouter.get('/fire-trials/:fireTrialId/planning/munitions', (req, res) => {
  const data = getMunitionsDispatcher(req);
  res.status(200).json(data);
});

// Actualizar configuraciones de munición de la prueba
munitionsRouter.put('/fire-trials/:fireTrialId/planning/munitions', (req, res) => {
  const data = updateMunitionsDispatcher(req);
  res.status(200).json(data);
});

// Listar modos de funcionamiento de espoleta
munitionsRouter.get('/fuse-working-modes', (req, res) => {
  const data = fuseWorkingModesDispatcher.getAll(req);
  res.status(200).json(data);
});

// Crear modo de funcionamiento de espoleta
munitionsRouter.post('/fuse-working-modes', (req, res) => {
  const data = fuseWorkingModesDispatcher.create(req);
  res.status(201).json(data);
});

// Modificar modo de funcionamiento de espoleta
munitionsRouter.put('/fuse-working-modes/:id', (req, res) => {
  const data = fuseWorkingModesDispatcher.update(req);

  if (!data) {
    res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: `Fuse working mode with id ${req.params.id} not found`,
    });
    return;
  }

  res.status(200).json(data);
});

// Eliminar modo de funcionamiento de espoleta
munitionsRouter.delete('/fuse-working-modes/:id', (req, res) => {
  const success = fuseWorkingModesDispatcher.remove(req);

  if (!success) {
    res.status(404).json({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: `Fuse working mode with id ${req.params.id} not found`,
    });
    return;
  }

  res.status(204).send();
});

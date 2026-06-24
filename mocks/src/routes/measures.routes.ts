import { Router } from 'express';
import type { Request, Response } from 'express';

import { MEASURES_CATALOG, TRIAL_MEASURES } from '../fixtures/measures';
import { getPagination } from '../utils';

const measuresRouter = Router({ mergeParams: true });

// --- Catalog Routes ---

measuresRouter.get('/measures', (req: Request, res: Response) => {
  const { page, pageSize } = getPagination(req);
  const { magnitude, name, unit, active } = req.query;

  let filtered = [...MEASURES_CATALOG];

  const searchVal = magnitude || name;
  if (searchVal) {
    const term = (searchVal as string).toLowerCase();
    filtered = filtered.filter((m) => m.label.toLowerCase().includes(term));
  }

  if (unit) {
    filtered = filtered.filter((m) => m.unit === unit);
  }

  if (active !== undefined && active !== null) {
    const isActive = active === 'true';
    filtered = filtered.filter((m) => m.active === isActive);
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filtered.slice(start, end);

  res.json({
    page,
    pageSize,
    totalElements: filtered.length,
    items,
  });
});

measuresRouter.post('/measures', (req: Request, res: Response) => {
  const newItem = {
    id: crypto.randomUUID(),
    ...req.body,
  };
  MEASURES_CATALOG.push(newItem);
  res.status(201).json(newItem);
});

measuresRouter.put('/measures/:measureId', (req: Request, res: Response) => {
  const { measureId } = req.params;
  const index = MEASURES_CATALOG.findIndex((m) => m.id === measureId);

  if (index !== -1) {
    MEASURES_CATALOG[index] = { ...MEASURES_CATALOG[index], ...req.body };
    res.json(MEASURES_CATALOG[index]);
  } else {
    res.status(404).json({ title: 'Not found', status: 404 });
  }
});

measuresRouter.delete('/measures/:measureId', (req: Request, res: Response) => {
  const { measureId } = req.params;
  const index = MEASURES_CATALOG.findIndex((m) => m.id === measureId);

  if (index !== -1) {
    MEASURES_CATALOG.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ title: 'Not found', status: 404 });
  }
});

measuresRouter.post('/measures/:measureId/favorite', (req: Request, res: Response) => {
  const { measureId } = req.params;
  const index = MEASURES_CATALOG.findIndex((m) => m.id === measureId);

  if (index !== -1) {
    MEASURES_CATALOG[index] = { ...MEASURES_CATALOG[index], favorite: true };
    res.status(200).send();
  } else {
    res.status(404).json({ title: 'Not found', status: 404 });
  }
});

measuresRouter.delete('/measures/:measureId/favorite', (req: Request, res: Response) => {
  const { measureId } = req.params;
  const index = MEASURES_CATALOG.findIndex((m) => m.id === measureId);

  if (index !== -1) {
    MEASURES_CATALOG[index] = { ...MEASURES_CATALOG[index], favorite: false };
    res.status(200).send();
  } else {
    res.status(404).json({ title: 'Not found', status: 404 });
  }
});

// --- Planning Routes ---

measuresRouter.get('/fire-trials/:fireTrialId/planning/measures', (req: Request, res: Response) => {
  // En un mock real, filtraríamos por fireTrialId si tuviéramos múltiples fixtures
  res.json(TRIAL_MEASURES);
});

measuresRouter.put('/fire-trials/:fireTrialId/planning/measures', (req: Request, res: Response) => {
  const { series } = req.body;

  if (!series || !Array.isArray(series)) {
    return res.status(400).json({ title: 'Invalid data', status: 400 });
  }

  // Actualizamos el mock en memoria
  // Nota: Esto es una simplificación. En un caso real, updatearíamos TRIAL_MEASURES basándonos en los IDs recibidos.
  // Como los response types son diferentes a los request types (ids vs objects), aquí simulamos que se guarda
  // y devolvemos 200 OK.

  // Para que el mock sea algo consistente, podríamos actualizar TRIAL_MEASURES
  // reconstruyendo los objetos a partir de los IDs, pero para simular el éxito basta con:

  console.log('Updating trial measures', JSON.stringify(series, null, 2));

  res.status(200).send();
});

export { measuresRouter };

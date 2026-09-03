import { Router } from 'express';
import type { Request, Response } from 'express';

import type { MeasureCatalogItem } from '../fixtures/measures';
import { MEASURES_CATALOG, TRIAL_MEASURES } from '../fixtures/measures';
import { getPagination } from '../utils';

const measuresRouter = Router({ mergeParams: true });

function toCatalogItem(item: Partial<MeasureCatalogItem> & Pick<MeasureCatalogItem, 'id'>): MeasureCatalogItem {
  const magnitudeLabel = item.magnitudeLabel ?? item.magnitude?.es ?? item.magnitudeCode ?? '';
  const procedureLabel = item.procedureLabel ?? item.procedure?.es ?? '';
  return {
    unit: 'BALLISTICS',
    measurementAreaCode: '',
    measurements: [],
    magnitudeCode: '',
    magnitude: { es: magnitudeLabel, en: magnitudeLabel },
    label: [magnitudeLabel, procedureLabel].filter(Boolean).join(' - '),
    measureUnit: '',
    qualificationType: 'QUANTITATIVE',
    minValue: 0,
    maxValue: 0,
    values: [],
    equipmentTypes: [],
    procedure: { es: procedureLabel, en: procedureLabel },
    accreditation: false,
    grubbs: false,
    builtIn: false,
    uncertainty: '',
    magnitudeLabel,
    procedureLabel,
    active: true,
    favorite: false,
    ...item,
  };
}

// --- Catalog Routes ---

measuresRouter.get('/measures', (req: Request, res: Response) => {
  const { page, pageSize } = getPagination(req);
  const { magnitude, name, unit, active, measurementAreaCode, sortField, sortDirection } = req.query;

  let filtered = [...MEASURES_CATALOG];

  const searchVal = magnitude || name;
  if (searchVal) {
    const term = (searchVal as string).toLowerCase();
    filtered = filtered.filter((m) => m.label.toLowerCase().includes(term));
  }

  if (unit) {
    filtered = filtered.filter((m) => m.unit === unit);
  }

  if (typeof measurementAreaCode === 'string' && measurementAreaCode.trim()) {
    const requestedAreas = new Set(
      measurementAreaCode
        .split(',')
        .map((area) => area.trim())
        .filter(Boolean),
    );
    filtered = filtered.filter((measure) => requestedAreas.has(measure.measurementAreaCode));
  }

  if (active !== undefined && active !== null) {
    const isActive = active === 'true';
    filtered = filtered.filter((m) => m.active === isActive);
  }

  if (typeof sortField === 'string' && (sortDirection === 'asc' || sortDirection === 'desc')) {
    filtered.sort((left, right) => {
      const leftValue = String(left[sortField as keyof MeasureCatalogItem] ?? '');
      const rightValue = String(right[sortField as keyof MeasureCatalogItem] ?? '');
      return leftValue.localeCompare(rightValue) * (sortDirection === 'asc' ? 1 : -1);
    });
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
  const newItem = toCatalogItem({
    id: crypto.randomUUID(),
    ...req.body,
  });
  MEASURES_CATALOG.push(newItem);
  res.status(201).json(newItem);
});

measuresRouter.put('/measures/:measureId', (req: Request, res: Response) => {
  const { measureId } = req.params;
  const index = MEASURES_CATALOG.findIndex((m) => m.id === measureId);

  if (
    !Array.isArray(req.body.measurements) ||
    req.body.measurements.some((measurement: unknown) => typeof measurement !== 'string')
  ) {
    return res.status(400).json({ title: 'measurements must be an array of strings', status: 400 });
  }

  if (index !== -1) {
    MEASURES_CATALOG[index] = toCatalogItem({ ...MEASURES_CATALOG[index], ...req.body, id: measureId });
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

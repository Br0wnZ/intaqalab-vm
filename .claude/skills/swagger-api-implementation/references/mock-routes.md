# Mock Routes (`mocks/src/routes/`)

Las rutas mock simulan la API en el servidor Express local. Se usan para desarrollo sin depender del backend real.

## Arquitectura del Mock Server

```
mocks/src/
├── main.ts              ← Express server entry point
├── utils.ts             ← Funciones compartidas (getFixture, paginate, etc.)
├── utils.model.ts       ← Tipos compartidos del mock server
├── routes/
│   ├── index.ts         ← Router central (registra todos los sub-routers)
│   └── *.routes.ts      ← Routers por dominio
├── fixtures/
│   ├── <domain>/
│   │   ├── *-fixture.json        ← Datos estáticos
│   │   └── *-dispatcher.ts       ← Lógica dinámica
│   └── ...
└── db/
    └── db.json          ← Base de datos de json-server
```

## Registro Central de Routers

Archivo: `mocks/src/routes/index.ts`

```typescript
import { Router } from 'express';

import { armamentRouter } from './armament.route';
import { calendarRouter } from './calendar.routes';
import { documentsRouter } from './documents.routes';
import { measuresRouter } from './measures.routes';
import { munitionsRouter } from './munitions.routes';
import { trialsRouter } from './trials.routes';
import { whareHouseRouter } from './warehouse.routes';

const router = Router();

router.use('/centers', trialsRouter);
router.use('/centers', documentsRouter);
router.use('/centers', calendarRouter);
router.use('/centers/:centerId', munitionsRouter);
router.use('/centers/:centerId', armamentRouter);
router.use('/centers/:centerId', measuresRouter);

export default router;
```

> **IMPORTANTE:** Siempre que generes un nuevo router, DEBES añadirlo aquí.

## Ejemplo Real: Route con Dispatchers

Archivo: `mocks/src/routes/armament.route.ts`

```typescript
import { Router } from 'express';

import { createTubesCatalogDispatcher, createWeaponsCatalogDispatcher } from '../fixtures/armament/catalog-dispatcher';
import { getArmamentDispatcher, updateArmamentDispatcher } from '../fixtures/armament/trial-armament-dispatcher';

export const armamentRouter = Router();

const weaponsDispatcher = createWeaponsCatalogDispatcher();
const tubesDispatcher = createTubesCatalogDispatcher();

armamentRouter.get('/fire-trials/:fireTrialId/planning/armament', (req, res) => {
  const data = getArmamentDispatcher(req);
  res.status(200).json(data);
});

armamentRouter.put('/fire-trials/:fireTrialId/planning/armament', (req, res) => {
  const data = updateArmamentDispatcher(req);
  res.status(200).json(data);
});

armamentRouter.get('/weapons', (req, res) => {
  const data = weaponsDispatcher.getAll(req);
  res.status(200).json(data);
});

armamentRouter.get('/tubes', (req, res) => {
  const data = tubesDispatcher.getAll(req);
  res.status(200).json(data);
});
```

## Ejemplo Real: Route con CRUD In-line

Archivo: `mocks/src/routes/measures.routes.ts`

```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';

import { getPagination } from '../utils';

const measuresRouter = Router({ mergeParams: true });

// GET list (con paginación y filtros)
measuresRouter.get('/measures', (req: Request, res: Response) => {
  const { page, pageSize } = getPagination(req);
  const { name, active } = req.query;

  let filtered = [...MEASURES_CATALOG];

  if (name) {
    const term = (name as string).toLowerCase();
    filtered = filtered.filter((m) => m.name.toLowerCase().includes(term));
  }

  if (active !== undefined && active !== null) {
    const isActive = active === 'true';
    filtered = filtered.filter((m) => m.active === isActive);
  }

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  res.json({
    page,
    pageSize,
    totalElements: filtered.length,
    items,
  });
});

// POST create
measuresRouter.post('/measures', (req: Request, res: Response) => {
  const newItem = { id: crypto.randomUUID(), ...req.body };
  MEASURES_CATALOG.push(newItem);
  res.status(201).json(newItem);
});

// PUT update
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

// DELETE
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

export { measuresRouter };
```

## Ejemplo Real: Route con Catálogos Simples (fixture directo)

Archivo: fragmentos de `mocks/src/routes/trials.routes.ts`

```typescript
// --- Target Types ---
trialsRouter.get('/:centerId/target-types', (_req, res) => {
  const data = getFixture('fixtures/trial-planning', 'target-types-fixture.json');
  res.status(200).send(data);
});

trialsRouter.post('/:centerId/target-types', (req, res) => {
  res.status(201).send({ id: 'new-target-type-id', ...req.body, label: req.body?.name?.es ?? '' });
});

trialsRouter.put('/:centerId/target-types/:targetTypeId', (req, res) => {
  res.status(200).send({ id: req.params['targetTypeId'], ...req.body, label: req.body?.name?.es ?? '' });
});

trialsRouter.delete('/:centerId/target-types/:targetTypeId', (req, res) => {
  res.status(204).send({});
});
```

## HTTP Status Codes Utilizados

| Operación     | Código | Body                                                   |
| ------------- | ------ | ------------------------------------------------------ |
| GET (list)    | 200    | `{ page, pageSize, totalElements, items }`             |
| GET (single)  | 200    | El objeto                                              |
| POST (create) | 201    | El objeto creado con `id` generado                     |
| PUT (update)  | 200    | El objeto actualizado                                  |
| DELETE        | 204    | Sin body                                               |
| Not found     | 404    | `{ title: 'Not found', status: 404 }`                  |
| Bad request   | 400    | `{ title: 'Bad Request', status: 400, detail: '...' }` |

## Reglas Clave

1. **`mergeParams: true`** — Usar cuando el router se monta bajo un path con params
2. **`getFixture(path, filename)`** — Para datos estáticos desde JSON
3. **`getPagination(req)`** — Extrae `page` y `pageSize` de query params
4. **Registrar en `index.ts`** — Nunca olvidar el `router.use()`
5. **Usar `crypto.randomUUID()`** — Para generar IDs en POST
6. **Siempre devolver paginated response para listas** — `{ page, pageSize, totalElements, items }`

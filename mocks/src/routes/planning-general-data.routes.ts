import { Router } from 'express';
import type { Request, Response } from 'express';

/**
 * Ruta migrada desde json-server (antes servía la colección `planning-general-data`
 * de db.json). Consumida por DataPlanningService.loadGeneralData().
 */
interface PlanningGeneralData {
  id: string;
  trialId: string;
  observation: string;
}

const PLANNING_GENERAL_DATA: PlanningGeneralData[] = [
  { id: '1', trialId: '1', observation: 'Planning General Data 1' },
  { id: '2', trialId: '2', observation: 'Planning General Data 2' },
  { id: '3', trialId: '3', observation: 'Planning General Data 3' },
];

const planningGeneralDataRouter = Router({ mergeParams: true });

// json-server resolvía este segmento como `id` del recurso (semántica /:resource/:id).
// En los datos originales id === trialId, así que el comportamiento es idéntico.
planningGeneralDataRouter.get('/planning-general-data/:id', (req: Request, res: Response) => {
  const item = PLANNING_GENERAL_DATA.find((entry) => entry.id === req.params.id);

  if (!item) {
    res.status(404).send({});
    return;
  }

  res.send(item);
});

export { planningGeneralDataRouter };

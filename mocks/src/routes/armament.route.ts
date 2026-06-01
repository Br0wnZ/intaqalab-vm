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

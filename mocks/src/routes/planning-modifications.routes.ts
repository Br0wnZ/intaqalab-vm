import { Router } from 'express';

import { applyPlanningChanges, getPlanningChanges } from '../fixtures/execution/planning-changes-store';
import {
  approveModification,
  getPlanningModifications,
  isModificationStatus,
  isSubmitModificationsRequest,
  isUpdateClassificationRequest,
  parseDraftPayload,
  rejectModification,
  saveDraftModifications,
  submitModifications,
  updateModificationClassification,
} from '../fixtures/execution/planning-modifications-store';

export const planningModificationsRouter = Router();

// GET /centers/:centerId/fire-trials/:fireTrialId/planning/modifications
planningModificationsRouter.get('/:centerId/fire-trials/:fireTrialId/planning/modifications', (req, res) => {
  if (req.query['error'] === 'true') {
    res.status(500).json({
      title: 'Internal Server Error',
      status: 500,
      detail: 'Simulated error loading planning modifications',
    });
    return;
  }

  const statusParam = req.query['status'];
  if (statusParam !== undefined && !isModificationStatus(statusParam)) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid status filter. Expected BORRADOR, PENDIENTE, ACEPTADO, or RECHAZADO.',
    });
    return;
  }

  const modifications = getPlanningModifications(
    req.params['fireTrialId'],
    isModificationStatus(statusParam) ? statusParam : undefined,
  );
  res.status(200).json(modifications);
});

// POST /centers/:centerId/fire-trials/:fireTrialId/planning/modifications (save draft)
planningModificationsRouter.post('/:centerId/fire-trials/:fireTrialId/planning/modifications', (req, res) => {
  const parsed = parseDraftPayload(req.body);
  if (!parsed) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'INVALID_PLANNING_MODIFICATION_DRAFT',
    });
    return;
  }

  const saved = saveDraftModifications(req.params['fireTrialId'], parsed.items);
  if (parsed.wasSingle) {
    res.status(201).json(saved[0]);
    return;
  }
  if (parsed.wasWrapped) {
    res.status(201).json({ modifications: saved });
    return;
  }
  res.status(201).json(saved);
});

// POST /centers/:centerId/fire-trials/:fireTrialId/planning/modifications/submit
planningModificationsRouter.post('/:centerId/fire-trials/:fireTrialId/planning/modifications/submit', (req, res) => {
  if (!isSubmitModificationsRequest(req.body)) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'INVALID_SUBMIT_MODIFICATIONS_REQUEST',
    });
    return;
  }

  const updated = submitModifications(req.params['fireTrialId'], req.body ?? undefined);
  res.status(200).json(updated);
});

// PUT /centers/:centerId/fire-trials/:fireTrialId/planning/modifications/:modId (update classification)
planningModificationsRouter.put('/:centerId/fire-trials/:fireTrialId/planning/modifications/:modId', (req, res) => {
  if (!isUpdateClassificationRequest(req.body)) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'INVALID_MODIFICATION_CLASSIFICATION',
    });
    return;
  }

  const updated = updateModificationClassification(
    req.params['fireTrialId'],
    req.params['modId'],
    req.body.classification,
  );
  if (!updated) {
    res.status(404).json({
      title: 'Not Found',
      status: 404,
      detail: `Modification ${req.params['modId']} not found`,
    });
    return;
  }

  res.status(200).json(updated);
});

// PUT /centers/:centerId/fire-trials/:fireTrialId/planning/modifications/:modId/approve
planningModificationsRouter.put(
  '/:centerId/fire-trials/:fireTrialId/planning/modifications/:modId/approve',
  (req, res) => {
    const result = approveModification(req.params['fireTrialId'], req.params['modId']);
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({
        title: 'Not Found',
        status: 404,
        detail: `Modification ${req.params['modId']} not found`,
      });
      return;
    }
    if (result.error === 'INVALID_STATUS') {
      res.status(409).json({
        title: 'Conflict',
        status: 409,
        detail: 'Only PENDIENTE modifications can be approved',
      });
      return;
    }

    res.status(200).json(result.modification);
  },
);

// PUT /centers/:centerId/fire-trials/:fireTrialId/planning/modifications/:modId/reject
planningModificationsRouter.put(
  '/:centerId/fire-trials/:fireTrialId/planning/modifications/:modId/reject',
  (req, res) => {
    const result = rejectModification(req.params['fireTrialId'], req.params['modId']);
    if (result.error === 'NOT_FOUND') {
      res.status(404).json({
        title: 'Not Found',
        status: 404,
        detail: `Modification ${req.params['modId']} not found`,
      });
      return;
    }
    if (result.error === 'INVALID_STATUS') {
      res.status(409).json({
        title: 'Conflict',
        status: 409,
        detail: 'Only PENDIENTE modifications can be rejected',
      });
      return;
    }

    res.status(200).json(result.modification);
  },
);

// GET /centers/:centerId/fire-trials/:fireTrialId/planning/changes
planningModificationsRouter.get('/:centerId/fire-trials/:fireTrialId/planning/changes', (req, res) => {
  if (req.query['error'] === 'true') {
    res.status(500).json({
      title: 'Internal Server Error',
      status: 500,
      detail: 'Simulated error loading planning changes',
    });
    return;
  }

  const changes = getPlanningChanges(req.params['fireTrialId']);
  res.status(200).json(changes);
});

// POST /centers/:centerId/fire-trials/:fireTrialId/planning/changes/apply
planningModificationsRouter.post('/:centerId/fire-trials/:fireTrialId/planning/changes/apply', (req, res) => {
  if (req.query['error'] === 'true') {
    res.status(500).json({
      title: 'Internal Server Error',
      status: 500,
      detail: 'Simulated error applying planning changes',
    });
    return;
  }

  const body = req.body as { changes?: Array<{ id: string; requiresApproval: boolean; requestClient: boolean }> };
  if (!body || !Array.isArray(body.changes) || body.changes.length === 0) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'INVALID_APPLY_CHANGES_REQUEST',
    });
    return;
  }

  const hasInvalidItem = body.changes.some((c) => c.requiresApproval && c.requestClient);
  if (hasInvalidItem) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'requiresApproval and requestClient cannot both be true',
    });
    return;
  }

  const applied = applyPlanningChanges(req.params['fireTrialId'], body.changes);
  res.status(200).json(applied);
});

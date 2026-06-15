import { Router } from 'express';

import {
  approvePlanning,
  bumpPlanningVersion,
  getCountdownState,
  getExecutionState,
  getPlanningState,
  getReadiness,
  setExecutionStatus,
  setProfileReadiness,
  updateCountdownState,
} from '../fixtures/execution/execution-store';
import { getFixture } from '../utils';

export const executionRouter = Router();

// ==========================================
// EXECUTION STATE
// ==========================================

// Obtener estado de la ejecución para polling
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/state', (req, res) => {
  const state = getExecutionState(req.params['fireTrialId']);
  res.status(200).json(state);
});

// Obtener progreso actual de series y disparos
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/progress', (req, res) => {
  const progress = getFixture('fixtures/execution', 'execution-progress-fixture.json');
  res.status(200).json(progress);
});

// Obtener estado actual de la cuenta atrás
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/security-countdown', (req, res) => {
  const state = getCountdownState(req.params['fireTrialId']);
  res.status(200).json(state);
});

// Gestionar cuenta de seguridad
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/security-countdown', (req, res) => {
  const { action, durationSeconds } = req.body;
  const updated = updateCountdownState(req.params['fireTrialId'], action, durationSeconds);
  res.status(200).json(updated);
});

// ==========================================
// EXECUTION TRANSITIONS
// ==========================================

// Iniciar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/start', (req, res) => {
  setExecutionStatus(req.params['fireTrialId'], 'STARTED');
  res.status(204).send();
});

// Pausar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/pause', (req, res) => {
  setExecutionStatus(req.params['fireTrialId'], 'PAUSED');
  res.status(204).send();
});

// Interrumpir ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/interrupt', (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: "El campo 'reason' es obligatorio" });
    return;
  }
  setExecutionStatus(req.params['fireTrialId'], 'INTERRUPTED');
  res.status(204).send();
});

// Reanudar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/resume', (req, res) => {
  setExecutionStatus(req.params['fireTrialId'], 'IN_PROGRESS');
  res.status(204).send();
});

// Cancelar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/cancel', (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: "El campo 'reason' es obligatorio" });
    return;
  }
  setExecutionStatus(req.params['fireTrialId'], 'CANCELED');
  res.status(204).send();
});

// Finalizar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/finish', (req, res) => {
  setExecutionStatus(req.params['fireTrialId'], 'FINISHED');
  const response = getFixture('fixtures/execution', 'execution-finish-fixture.json');
  res.status(200).json(response);
});

// ==========================================
// EXECUTION PLANNING
// ==========================================

// Obtener planificación actual para la ejecución
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/planning', (req, res) => {
  const planning = getFixture('fixtures/execution', 'execution-planning-fixture.json');
  res.status(200).json(planning);
});

// Modificar planificación actual
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/planning', (req, res) => {
  bumpPlanningVersion(req.params['fireTrialId']);
  const base = getFixture('fixtures/execution', 'execution-planning-fixture.json');
  res.status(200).json({ ...base, ...req.body });
});

// Obtener estado actual de la planificación
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/planning/state', (req, res) => {
  const state = getPlanningState(req.params['fireTrialId']);
  res.status(200).json(state);
});

// Aprobar planificación como cliente
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/planning/approve', (req, res) => {
  approvePlanning(req.params['fireTrialId'], req.body.approved ?? true);
  res.status(204).send();
});

// ==========================================
// WIDGET PREFERENCES
// ==========================================

// Obtener preferencias de widgets por rol
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/preferences/roles/:roleName', (req, res) => {
  const preferences = getFixture('fixtures/execution', 'execution-preferences-fixture.json');
  res.status(200).json(preferences);
});

// Actualizar preferencias de widgets por rol
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/preferences/roles/:roleName', (req, res) => {
  res.status(200).json(req.body);
});

// Obtener preferencias de widgets por usuario
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/preferences/users/:username', (req, res) => {
  const preferences = getFixture('fixtures/execution', 'execution-preferences-fixture.json');
  res.status(200).json(preferences);
});

// Actualizar preferencias de widgets por usuario
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/preferences/users/:username', (req, res) => {
  res.status(200).json(req.body);
});

// ==========================================
// EXECUTION READINESS
// ==========================================

// Obtener readiness de todos los perfiles
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/readiness', (req, res) => {
  const readiness = getReadiness(req.params['fireTrialId']);
  res.status(200).json(readiness);
});

// Registrar readiness de un perfil
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/readiness/profiles/:profile', (req, res) => {
  const { profile, fireTrialId } = req.params as { profile: string; fireTrialId: string };
  const { seriesReadiness } = req.body as { seriesReadiness?: unknown[] };

  if (!seriesReadiness || !Array.isArray(seriesReadiness)) {
    res
      .status(400)
      .json({
        title: 'Bad Request',
        status: 400,
        detail: "El campo 'seriesReadiness' es obligatorio y debe ser un array",
      });
    return;
  }

  const updated = setProfileReadiness(fireTrialId, profile as never, seriesReadiness as never);
  res.status(200).json(updated);
});

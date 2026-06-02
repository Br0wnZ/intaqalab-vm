import { Router } from 'express';

import { seriesAndShotsDispatcher } from '../fixtures/trial-planning/series-and-shots-dispatcher';
import { conditionsDispatcher } from '../fixtures/trial-planning/shooting-conditions-dispatcher';
import { specimensCreateDispatcher } from '../fixtures/trial-planning/specimens-create-dispatcher';
import { specimensDispatcher } from '../fixtures/trial-planning/specimens-dispatcher';
import { trialPlanningInfoDispatcher } from '../fixtures/trial-planning/trial-planning-info-dispatcher';
import { usersDispatcher } from '../fixtures/trial-planning/users-dispatcher';
import { setTrialSchedule, trialScheduleDispatchById } from '../fixtures/trial-schedule/trial-schedule-dispatcher';
import { trialsDocumentsDispatch } from '../fixtures/trials-docs/trials-docs-dispatcher';
import { setTrialStatus } from '../fixtures/trials/trial-transitions-store';
import { trialsDispatch, trialsDispatchById } from '../fixtures/trials/trials-dispatcher';
import { trialsGenerator } from '../fixtures/trials/trials-generator';
import { getFixture } from '../utils';

export const trialsRouter = Router();

// Listar pruebas de fuego de un centro
trialsRouter.get('/:centerId/fire-trials', (req, res) => res.send(trialsDispatch(req)));

// Obtener detalle de una prueba de fuego
trialsRouter.get('/:centerId/fire-trials/:fireTrialId', (req, res) =>
  res.send(trialsDispatchById(req.params['fireTrialId'])),
);

// Modificar datos de una prueba de fuego
trialsRouter.put('/:centerId/fire-trials/:trialId', (req, res) => res.status(200).send(req.body));

// Crear ua nueva prueba de fuego en un centro
trialsRouter.post('/:centerId/fire-trials', (req, res) =>
  res.status(201).send(trialsGenerator().generateTrial(req.body)),
);

// Obtiene la programación actual de una prueba de fuego específica
trialsRouter.get('/:centerId/fire-trials/:id/schedule', (req, res) =>
  res.send(trialScheduleDispatchById(req.params['id'])),
);

// Reemplaza todas las fechas programadas de una prueba de fuego con las nuevas fechas proporcionadas.
trialsRouter.put('/:centerId/fire-trials/:trialId/schedule', (req, res) => {
  const trialId = req.params['trialId'];
  const schedule = req.body;
  setTrialSchedule(trialId, schedule);
  res.send(schedule);
});

// Obtener planificación
trialsRouter.get('/:centerId/fire-trials/:fireTrialId/planning/info', (req, res) =>
  res.send(trialPlanningInfoDispatcher(req)),
);

// Actualizar planificación
trialsRouter.put('/:centerId/fire-trials/:fireTrialId/planning/info', (req, res) => {
  const data = trialPlanningInfoDispatcher(req);
  res.status(200).send({ ...data, ...req.body });
});

// Listar series de la prueba
trialsRouter.get('/:centerId/fire-trials/:fireTrialId/planning/series', (req, res) =>
  res.send(seriesAndShotsDispatcher(req)),
);

// Crear nueva serie
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/planning/series', (req, res) =>
  res.status(201).send(seriesAndShotsDispatcher(req)),
);

// Modificar serie
trialsRouter.put('/:centerId/planning/series/:serieId', (req, res) => {
  res.status(200).send({});
});

// Reordenar series
trialsRouter.put('/:centerId/fire-trials/:fireTrialId/planning/series/reorder', (req, res) => {
  const dataToSend = seriesAndShotsDispatcher(req);
  res.status(201).send(dataToSend);
});

// Eliminar serie
trialsRouter.delete('/:centerId/planning/series/:serieId', (req, res) => {
  res.status(204).send({});
});

// Añadir disparo a una serie
trialsRouter.post('/:centerId/planning/series/:serieId/shots', (req, res) => {
  res.status(201).send({});
});

// Modificar disparo de una serie
trialsRouter.put('/:centerId/planning/shots/:shotId', (req, res) => {
  res.status(200).send({});
});

// Eliminar disparo de una serie
trialsRouter.delete('/:centerId/planning/shots/:shotId', (req, res) => {
  res.status(204).send({});
});

// Listar especímenes
trialsRouter.get('/:centerId/specimens', (req, res) => {
  const dataToSend = specimensDispatcher(req);
  res.status(200).send(dataToSend);
});

// Crear espécimen
trialsRouter.post('/:centerId/specimens', (req, res) => {
  const dataToSend = specimensCreateDispatcher(req);
  res.status(201).send(dataToSend);
});

// Modificar espécimen
trialsRouter.put('/:centerId/specimens/:specimenId', (req, res) => {
  res.status(200).send({});
});

// Eliminar espécimen
trialsRouter.delete('/:centerId/specimens/:specimenId', (req, res) => {
  res.status(204).send({});
});

// Listar usuarios de planificación
trialsRouter.get('/:centerId/planning-users', (req, res) => {
  const dataToSend = usersDispatcher(req);
  res.status(200).send(dataToSend);
});

// Obtener documentos de una prueba de fuego
trialsRouter.get('/:centerId/fire-trials/:fireTrialId/documents', (req, res) => {
  const dataToSend = trialsDocumentsDispatch(req);
  res.send(dataToSend);
});

// Subir un documento a una prueba de fuego
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/documents', (req, res) => {
  res.status(201).send({});
});

// Desvincular un documento de una prueba de fuego
trialsRouter.delete('/:centerId/fire-trials/:fireTrialId/documents/:documentId', (req, res) => {
  res.status(200).send({});
});

// Obtener condiciones de disparos
trialsRouter.get('/:centerId/fire-trials/:fireTrialId/planning/conditions', (req, res) => {
  const dataToSend = conditionsDispatcher(req);
  res.send(dataToSend);
});

// Actualizar condiciones de disparos
trialsRouter.put('/:centerId/fire-trials/:fireTrialId/planning/conditions', (req, res) => {
  res.status(200).send({});
});

// ==========================================
// PLANNING API - CATALOG ENDPOINTS
// ==========================================

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

// --- Target Materials ---
trialsRouter.get('/:centerId/target-materials', (_req, res) => {
  const data = getFixture('fixtures/trial-planning', 'target-materials-fixture.json');
  res.status(200).send(data);
});
trialsRouter.post('/:centerId/target-materials', (req, res) => {
  res.status(201).send({ id: 'new-target-material-id', ...req.body, label: req.body?.name?.es ?? '' });
});
trialsRouter.put('/:centerId/target-materials/:targetMaterialId', (req, res) => {
  res.status(200).send({ id: req.params['targetMaterialId'], ...req.body, label: req.body?.name?.es ?? '' });
});
trialsRouter.delete('/:centerId/target-materials/:targetMaterialId', (req, res) => {
  res.status(204).send({});
});

// --- Target Dimensions ---
trialsRouter.get('/:centerId/target-dimensions', (_req, res) => {
  const data = getFixture('fixtures/trial-planning', 'target-dimensions-fixture.json');
  res.status(200).send(data);
});
trialsRouter.post('/:centerId/target-dimensions', (req, res) => {
  const body = req.body as { width?: number; height?: number; diameter?: number; active?: boolean };
  const label = body.diameter ? `${body.diameter} cm` : `${body.width ?? 0} x ${body.height ?? 0} cm`;
  res.status(201).send({ ...body, label });
});
trialsRouter.put('/:centerId/target-dimensions/:targetDimensionId', (req, res) => {
  const body = req.body as { width?: number; height?: number; diameter?: number; active?: boolean };
  const label = body.diameter ? `${body.diameter} cm` : `${body.width ?? 0} x ${body.height ?? 0} cm`;
  res.status(200).send({ ...body, label });
});
trialsRouter.delete('/:centerId/target-dimensions/:targetDimensionId', (req, res) => {
  res.status(204).send({});
});

// --- Target Thicknesses ---
trialsRouter.get('/:centerId/target-thicknesses', (_req, res) => {
  const data = getFixture('fixtures/trial-planning', 'target-thicknesses-fixture.json');
  res.status(200).send(data);
});
trialsRouter.post('/:centerId/target-thicknesses', (req, res) => {
  res.status(201).send({ id: 'new-target-thickness-id', ...req.body });
});
trialsRouter.put('/:centerId/target-thicknesses/:targetThicknessId', (req, res) => {
  res.status(200).send({ id: req.params['targetThicknessId'], ...req.body });
});
trialsRouter.delete('/:centerId/target-thicknesses/:targetThicknessId', (req, res) => {
  res.status(204).send({});
});

// --- Impact Zones ---
trialsRouter.get('/:centerId/impact-zones', (_req, res) => {
  const data = getFixture('fixtures/trial-planning', 'impact-zones-fixture.json');
  res.status(200).send(data);
});
trialsRouter.post('/:centerId/impact-zones', (req, res) => {
  res.status(201).send({ id: 'new-impact-zone-id', ...req.body, label: req.body?.name?.es ?? '' });
});
trialsRouter.put('/:centerId/impact-zones/:impactZoneId', (req, res) => {
  res.status(200).send({ id: req.params['impactZoneId'], ...req.body, label: req.body?.name?.es ?? '' });
});
trialsRouter.delete('/:centerId/impact-zones/:impactZoneId', (req, res) => {
  res.status(204).send({});
});

// --- Loading Zones ---
trialsRouter.get('/:centerId/loading-zone', (_req, res) => {
  const data = getFixture('fixtures/trial-planning', 'loading-zones-fixture.json');
  res.status(200).send(data);
});
trialsRouter.post('/:centerId/loading-zone', (req, res) => {
  res.status(201).send({ id: 'new-loading-zone-id', ...req.body });
});
trialsRouter.put('/:centerId/loading-zone/:loadingZoneId', (req, res) => {
  res.status(200).send({ id: req.params['loadingZoneId'], ...req.body });
});
trialsRouter.delete('/:centerId/loading-zone/:loadingZoneId', (req, res) => {
  res.status(204).send({});
});

// ==========================================
// STANAG CRITERIA
// ==========================================

// Listar criterios STANAG
trialsRouter.get('/:centerId/stanag-criteria', (_req, res) => {
  const data = getFixture('fixtures/trial-planning', 'stanag-criteria-fixture.json');
  res.status(200).send(data);
});

// Obtener criterio STANAG por ID
trialsRouter.get('/:centerId/stanag-criteria/:criterionId', (req, res) => {
  const data = getFixture('fixtures/trial-planning', 'stanag-criteria-fixture.json') as { items: { id: string }[] };
  const item = data.items.find((i: { id: string }) => i.id === req.params['criterionId']);
  res.status(200).send(item ?? data.items[0]);
});

// Crear criterio STANAG
trialsRouter.post('/:centerId/stanag-criteria', (req, res) => {
  res.status(201).send({ id: 'new-stanag-criterion-id', ...req.body, label: req.body?.name?.es ?? '' });
});

// Actualizar criterio STANAG
trialsRouter.put('/:centerId/stanag-criteria/:criterionId', (req, res) => {
  res.status(200).send({ id: req.params['criterionId'], ...req.body, label: req.body?.name?.es ?? '' });
});

// Eliminar criterio STANAG
trialsRouter.delete('/:centerId/stanag-criteria/:criterionId', (req, res) => {
  res.status(204).send({});
});

// ==========================================
// PLANNING LIFECYCLE
// ==========================================

// Validar planificación
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/planning/validate', (req, res) => {
  res.status(200).send({});
});

// Desbloquear planificación
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/planning/modify', (req, res) => {
  res.status(200).send({});
});

// ==========================================
// TRIAL TRANSITIONS
// ==========================================

// Cancelar prueba de fuego
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/cancel', (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: "El campo 'reason' es obligatorio" });
    return;
  }
  setTrialStatus(req.params['fireTrialId'], 'CANCELLED', reason);
  res.status(204).send();
});

// Anular prueba de fuego
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/void', (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: "El campo 'reason' es obligatorio" });
    return;
  }
  setTrialStatus(req.params['fireTrialId'], 'VOIDED', reason);
  res.status(204).send();
});

// Cerrar prueba de fuego
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/close', (req, res) => {
  setTrialStatus(req.params['fireTrialId'], 'CLOSED');
  res.status(204).send();
});

// Reabrir prueba de fuego
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/reopen', (req, res) => {
  setTrialStatus(req.params['fireTrialId'], 'PLANNED');
  res.status(204).send();
});

// Reactivar prueba de fuego
trialsRouter.post('/:centerId/fire-trials/:fireTrialId/reactivate', (req, res) => {
  setTrialStatus(req.params['fireTrialId'], 'IN_PROGRESS');
  res.status(204).send();
});

// Eliminar prueba de fuego
trialsRouter.delete('/:centerId/fire-trials/:fireTrialId/delete', (req, res) => {
  setTrialStatus(req.params['fireTrialId'], 'DELETED');
  res.status(204).send();
});

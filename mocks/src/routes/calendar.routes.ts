import { Router } from 'express';

import { calendarEventsDispatch } from '../fixtures/calendar-events/calendar-events-dispatcher';
import { getFixture } from '../utils';

export const calendarRouter = Router();

// Listar eventos del calendario de un centro
calendarRouter.get('/:centerId/calendar/events', (req, res) => {
  const dataToSend = calendarEventsDispatch(req);
  res.send(dataToSend);
});

calendarRouter.post('/:centerId/fire-trials/:id/:action', (req, res) => {
  res.send({});
});

// Marcar días como festivos o no-OTAN
calendarRouter.post('/:centerId/calendar/:type(holidays|no-notams)', (req, res) => {
  res.send({});
});

// Desmarcar días como festivos o no-OTAN
calendarRouter.delete('/:centerId/calendar/:type(holidays|no-notams)', (req, res) => {
  res.send({});
});

// Añadir una observación a un día específico del calendario
calendarRouter.post('/:centerId/calendar/days/:day/observations', (req, res) => {
  res.status(201).send({});
});

// Actualizar una observación de un día específico del calendario
calendarRouter.put('/:centerId/calendar/days/:day/observations/:eventId', (req, res) => {
  res.status(200).send(req.body);
});

// Eliminar una observación de un día específico del calendario
calendarRouter.delete('/:centerId/calendar/days/:day/observations/:eventId', (req, res) => {
  res.status(204).send();
});

// listado de lineas de tiro (legacy path, kept for compatibility)
calendarRouter.get('/:centerId/lines-of-shot', (req, res) => {
  const data = getFixture('fixtures/calendar-events', 'lines-of-shot-fixture.json');
  res.send(data);
});

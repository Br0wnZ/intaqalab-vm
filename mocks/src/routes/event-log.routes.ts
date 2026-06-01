import { Router } from 'express';

import { eventLogDocumentsDispatcher } from '../fixtures/event-log/documents/documents-dispatcher';
import { eventLogGeneralDataDispatcher } from '../fixtures/event-log/general-data/general-data-dispatcher';
import { measuresDispatcher } from '../fixtures/event-log/measures/measures-dispatcher';
import { eventLogSeriesAndShootsDispatcher } from '../fixtures/event-log/series-and-shoots/series-and-shoots-dispatcher';
import { eventLogUsersDispatcher } from '../fixtures/event-log/users/users-dispatcher';
import { docsSubtypesDispatcher } from '../fixtures/trials-docs/docs-subtypes-dispatcher';

export const eventLogRouter = Router();

eventLogRouter.get('/:centerId/event-log/users', (req, res) => {
  const dataToSend = eventLogUsersDispatcher();
  res.send(dataToSend);
});

eventLogRouter.get('/:centerId/event-log/document-types', (req, res) => {
  const dataToSend = docsSubtypesDispatcher();
  res.send(dataToSend);
});

eventLogRouter.get('/:centerId/event-log/documents', (req, res) => {
  const dataToSend = eventLogDocumentsDispatcher(req.query);
  res.status(200).send(dataToSend);
});

eventLogRouter.get('/:centerId/event-log/general-data', (req, res) => {
  const dataToSend = eventLogGeneralDataDispatcher(req.query);
  res.status(200).send(dataToSend);
});

eventLogRouter.get('/:centerId/event-log/series-and-shoots', (req, res) => {
  const dataToSend = eventLogSeriesAndShootsDispatcher(req.query);
  res.status(200).send(dataToSend);
});

eventLogRouter.get('/:centerId/event-log/measures', (req, res) => {
  const dataToSend = measuresDispatcher(req.query);
  res.status(200).send(dataToSend);
});

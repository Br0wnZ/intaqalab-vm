import { Router } from 'express';

import { trialsDocDetailsDispatch } from '../fixtures/trials-docs/doc-details-dispatcher';
import {
  addDocObservation,
  addDocVersion,
  centerDocumentsDispatch,
  deleteDocObservation,
  deleteMockDocument,
  getDocAssociations,
  getDocObservations,
  getDocVersions,
  setActiveDocVersion,
  setDocAssociations,
  updateDocObservation,
  updateMockDocument,
} from '../fixtures/trials-docs/trials-docs-dispatcher';

export const documentsRouter = Router();

// Listar documentos de un centro
documentsRouter.get('/:centerId/documents', (req, res) => {
  res.status(200).send(centerDocumentsDispatch(req));
});

// Obtener datos de un documento
documentsRouter.get('/:centerId/documents/:documentId', (req, res) => {
  res.send(trialsDocDetailsDispatch(req));
});

// Modificar datos de un documento
documentsRouter.put('/:centerId/documents/:documentId', (req, res) => {
  const { name, category, typeId } = req.body || {};
  const docId = req.params['documentId'];
  const updated = updateMockDocument(docId, {
    name,
    category,
    type: typeId ? { id: typeId, name: 'Tipo de Documento' } : undefined,
  });
  if (updated) {
    res.send(trialsDocDetailsDispatch(req));
  } else {
    res.status(404).json({ title: 'Not Found', status: 404, detail: 'Document not found' });
  }
});

// Eliminar un documento del sistema
documentsRouter.delete('/:centerId/documents/:documentId', (req, res) => {
  deleteMockDocument(req.params['documentId']);
  res.status(204).send();
});

// Descargar archivo de un documento
documentsRouter.get('/:centerId/documents/:documentId/file', (req, res) => {
  const base64Pdf =
    'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvUmVzb3VyY2VzIDQgMCBSIC9NZWRpYUJveCBbMCAwIDUwMCA1MDBdIC9Db250ZW50cyA2IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago2IDAgb2JqCjw8IC9MZW5ndGggNTMgPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgoxMDAgMjUwIFRkCihEdW1teSBQREYgZmlsZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMjIgMDAwMDAgbiAKMDAwMDAwMDI2NSAwMDAwMCBuIAowMDAwMDAwMzM2IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNyAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDQwCiUlRU9GCg==';
  const dummyPdf = Buffer.from(base64Pdf, 'base64');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="dummy.pdf"');
  res.send(dummyPdf);
});

// Obtener observaciones de un documento
documentsRouter.get('/:centerId/documents/:documentId/observations', (req, res) => {
  res.send(getDocObservations(req.params['documentId']));
});

// Añadir una observación a un documento
documentsRouter.post('/:centerId/documents/:documentId/observations', (req, res) => {
  const { description } = req.body || {};
  if (!description) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: "El campo 'description' es obligatorio" });
    return;
  }
  const newObs = addDocObservation(req.params['documentId'], description);
  res.status(201).send(newObs);
});

// Modificar una observación de un documento
documentsRouter.put('/:centerId/documents/:documentId/observations/:observationId', (req, res) => {
  const { description } = req.body || {};
  if (!description) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: "El campo 'description' es obligatorio" });
    return;
  }
  const updated = updateDocObservation(req.params['documentId'], req.params['observationId'], description);
  if (updated) {
    res.status(200).send(updated);
  } else {
    res.status(404).json({ title: 'Not Found', status: 404, detail: 'Observation not found' });
  }
});

// Eliminar una observación de un documento
documentsRouter.delete('/:centerId/documents/:documentId/observations/:observationId', (req, res) => {
  deleteDocObservation(req.params['documentId'], req.params['observationId']);
  res.status(204).send();
});

// Obtener versiones de un documento
documentsRouter.get('/:centerId/documents/:documentId/versions', (req, res) => {
  res.send(getDocVersions(req.params['documentId']));
});

// Crear una nueva versión de un documento
documentsRouter.post('/:centerId/documents/:documentId/versions', (req, res) => {
  const newVersion = addDocVersion(req.params['documentId']);
  res.status(201).send(newVersion);
});

// Establecer una versión como activa
documentsRouter.post('/:centerId/documents/:documentId/versions/:versionId/set-active', (req, res) => {
  const updated = setActiveDocVersion(req.params['documentId'], req.params['versionId']);
  if (updated) {
    res.status(200).send(updated);
  } else {
    res.status(404).json({ title: 'Not Found', status: 404, detail: 'Version not found' });
  }
});

// Obtener pruebas de fuego asociadas a un documento
documentsRouter.get('/:centerId/documents/:documentId/fire-trials', (req, res) => {
  res.send({ fireTrialIds: getDocAssociations(req.params['documentId']) });
});

// Sincronizar asociaciones de un documento a las pruebas de fuego
documentsRouter.put('/:centerId/documents/:documentId/fire-trials', (req, res) => {
  const { fireTrialIds } = req.body || {};
  if (!fireTrialIds || !Array.isArray(fireTrialIds)) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid fireTrialIds list' });
    return;
  }
  setDocAssociations(req.params['documentId'], fireTrialIds);
  res.status(200).send({ fireTrialIds: getDocAssociations(req.params['documentId']) });
});

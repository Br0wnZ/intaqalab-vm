import { Router } from 'express';
import * as path from 'path';

import { trialsDocAssociatedTrialsDispatch } from '../fixtures/trials-docs/doc-associated-trials-dispatcher';
import { trialsDocDetailsDispatch } from '../fixtures/trials-docs/doc-details-dispatcher';
import { trialsDocVersionsDispatch } from '../fixtures/trials-docs/doc-versions-dispatcher';

export const documentsRouter = Router();

// Obtener datos de un documento
documentsRouter.get('/:centerId/documents/:documentId', (req, res) => {
  res.send(trialsDocDetailsDispatch(req));
});

// Obtener observaciones de un documento
documentsRouter.get('/:centerId/documents/:documentId/observations', (req, res) => {
  res.send([
    {
      id: '019a2ad8-f9cc-7c55-b18b-f075b2dd091f',
      description: 'Revisar sección 4.2 para cumplimiento de normativas.',
      createdBy: 'username',
      createdAt: '2025-12-02T10:15:00Z',
    },
  ]);
});

// Añadir una observación a un documento
documentsRouter.post('/:centerId/documents/:documentId/observations', (req, res) => {
  res.status(201).send({
    id: '019a2ad8-f9cc-7c55-b18b-f075b2dd0000',
    ...req.body,
    createdBy: 'username',
    createdAt: new Date().toISOString(),
  });
});

// Modificar una observación de un documento
documentsRouter.put('/:centerId/documents/:documentId/observations/:observationId', (req, res) => {
  res.status(200).send({
    id: req.params['observationId'],
    ...req.body,
    createdBy: 'username',
    createdAt: '2025-12-02T10:15:00Z',
  });
});

// Eliminar una observación de un documento
documentsRouter.delete('/:centerId/documents/:documentId/observations/:observationId', (req, res) => {
  res.status(204).send();
});

// Obtener versiones de un documento
documentsRouter.get('/:centerId/documents/:documentId/versions', (req, res) => {
  res.send(trialsDocVersionsDispatch(req));
});

// Obtener pruebas de fuego asociadas a un documento
documentsRouter.get('/:centerId/documents/:documentId/fire-trials', (req, res) => {
  res.send(trialsDocAssociatedTrialsDispatch(req));
});

// Sincronizar asocianoes de un documento a las pruebas de fuego
documentsRouter.put('/:centerId/documents/:documentId/fire-trials', (req, res) => {
  res.send({});
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

// Listar documentos de un centro
documentsRouter.get('/:centerId/documents', (req, res) => {
  res.status(200).send({
    page: 1,
    pageSize: 25,
    totalElements: 0,
    items: [],
  });
});

// Subir un documento a una prueba de fuego (también montado en trialsRouter, pero aquí para el flow documents-api)
documentsRouter.post('/:centerId/documents', (req, res) => {
  res.status(200).send(req.body);
});

// Modificar datos de un documento
documentsRouter.put('/:centerId/documents/:documentId', (req, res) => {
  res.status(200).send(req.body);
});

// Eliminar un documento del sistema
documentsRouter.delete('/:centerId/documents/:documentId', (req, res) => {
  res.status(204).send({});
});

// Establecer una versión como activa
documentsRouter.post('/:centerId/documents/:documentId/versions/:versionId/set-active', (req, res) => {
  res.status(200).send({});
});

// Crear una nueva versión de un documento
documentsRouter.post('/:centerId/documents/:documentId/versions', (req, res) => {
  res.status(201).send({});
});

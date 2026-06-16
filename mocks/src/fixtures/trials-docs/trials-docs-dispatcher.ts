import type { Request } from 'express';

import { getFixture, getPagination, paginate } from '../../utils';

type DocumentType = {
  id: string;
  name: string;
};

export enum TrialDocsStatus {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  OBSOLETE = 'OBSOLETE',
}

type TrialDocsFilter = {
  category: string;
  status: TrialDocsStatus;
  type: DocumentType['id'];
};

type DocumentsResponse = {
  page: number;
  pageSize: number;
  totalElements: number;
  items: FireTrialDocument[];
};

type FireTrialDocument = {
  id: string;
  name: string;
  fileName?: string;
  category: 'SPECIFIC' | 'GENERAL';
  type: DocumentType;
  version: string;
  status: TrialDocsStatus;
  createdAt: string;
  updatedAt: string;
};

let trialsDocsStore: FireTrialDocument[] | null = null;

export function getDocsStore(): FireTrialDocument[] {
  if (!trialsDocsStore) {
    const documents = getFixture('fixtures/trials-docs', 'trials-docs-fixture.json') as DocumentsResponse;
    trialsDocsStore = documents.items;
  }
  return trialsDocsStore;
}

export function addMockDocument(doc: FireTrialDocument) {
  const store = getDocsStore();
  store.unshift(doc);
  return doc;
}

export function deleteMockDocument(id: string) {
  const store = getDocsStore();
  trialsDocsStore = store.filter((d) => d.id !== id);
}

export function updateMockDocument(id: string, updateData: Partial<FireTrialDocument>) {
  const store = getDocsStore();
  const docIndex = store.findIndex((d) => d.id === id);
  if (docIndex > -1) {
    store[docIndex] = { ...store[docIndex], ...updateData, updatedAt: new Date().toISOString() } as FireTrialDocument;
    return store[docIndex];
  }
  return null;
}

export function trialsDocumentsDispatch(req: Request) {
  const allDocs = getDocsStore();
  const filters: TrialDocsFilter = {
    category: req.query.category?.toString() || '',
    status: req.query.status ? (req.query.status.toString() as TrialDocsStatus) : TrialDocsStatus.ALL,
    type: req.query.typeId?.toString() || req.query.type?.toString() || '',
  };

  const shouldFilterCategory = filters.category && filters.category !== 'ALL';
  const shouldFilterStatus = filters.status && filters.status !== TrialDocsStatus.ALL;
  const shouldFilterType = filters.type && filters.type !== 'ALL';

  const filteredDocuments = allDocs.filter((doc: FireTrialDocument) => {
    let categoryMatch = true;
    let statusMatch = true;
    let typeMatch = true;

    if (shouldFilterCategory) {
      categoryMatch = doc.category === filters.category;
    }
    if (shouldFilterStatus) {
      statusMatch = doc.status === filters.status;
    }
    if (shouldFilterType) {
      typeMatch = doc.type && doc.type.id === filters.type;
    }
    return categoryMatch && statusMatch && typeMatch;
  });

  return {
    page: 1,
    pageSize: filteredDocuments.length,
    totalElements: filteredDocuments.length,
    items: filteredDocuments,
  };
}

export function centerDocumentsDispatch(req: Request) {
  const allDocs = getDocsStore();

  const category = req.query.category?.toString() || '';
  const typeId = req.query.typeId?.toString() || req.query.type?.toString() || '';

  const filtered = allDocs.filter((doc: FireTrialDocument) => {
    let match = true;
    if (category && category !== 'ALL') {
      match = match && doc.category === category;
    }
    if (typeId && typeId !== 'ALL') {
      match = match && doc.type?.id === typeId;
    }
    return match;
  });

  const listItems = filtered.map((doc: FireTrialDocument) => ({
    id: doc.id,
    name: doc.name,
    category: doc.category,
    type: doc.type,
    activeVersion: doc.version,
    updatedAt: doc.updatedAt,
  }));

  const pagination = getPagination(req);
  return paginate(listItems, pagination);
}

// Stateful Doc Associations
const associationsStore: Record<string, string[]> = {};

export function getDocAssociations(docId: string): string[] {
  if (!associationsStore[docId]) {
    associationsStore[docId] = ['019a2ad8-f9cc-7c55-b18b-f075b2dd091f', '019a2ad8-f9cc-7c55-b18b-f075b2dd091a'];
  }
  return associationsStore[docId];
}

export function setDocAssociations(docId: string, fireTrialIds: string[]) {
  associationsStore[docId] = fireTrialIds;
}

export function detachDocFromTrial(docId: string, fireTrialId: string) {
  const current = getDocAssociations(docId);
  setDocAssociations(
    docId,
    current.filter((id) => id !== fireTrialId),
  );
}

// Stateful Doc Observations
const observationsStore: Record<string, { id: string; description: string; createdBy: string; createdAt: string }[]> =
  {};

export function getDocObservations(docId: string) {
  if (!observationsStore[docId]) {
    observationsStore[docId] = [
      {
        id: '019a2ad8-f9cc-7c55-b18b-f075b2dd091f',
        description: 'Revisar sección 4.2 para cumplimiento de normativas.',
        createdBy: 'username',
        createdAt: '2025-12-02T10:15:00Z',
      },
    ];
  }
  return observationsStore[docId];
}

export function addDocObservation(docId: string, description: string) {
  const obs = getDocObservations(docId);
  const newObs = {
    id: `019a2ad8-f9cc-7c55-b18b-f075b2dd${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`,
    description,
    createdBy: 'username',
    createdAt: new Date().toISOString(),
  };
  obs.push(newObs);
  return newObs;
}

export function updateDocObservation(docId: string, obsId: string, description: string) {
  const obs = getDocObservations(docId);
  const found = obs.find((o) => o.id === obsId);
  if (found) {
    found.description = description;
    return found;
  }
  return null;
}

export function deleteDocObservation(docId: string, obsId: string) {
  const obs = getDocObservations(docId);
  observationsStore[docId] = obs.filter((o) => o.id !== obsId);
}

// Stateful Doc Versions
const docVersionsStore: Record<
  string,
  { id: string; versionTag: string; isActive: boolean; createdAt: string; createdBy: string }[]
> = {};

export function getDocVersions(docId: string) {
  if (!docVersionsStore[docId]) {
    docVersionsStore[docId] = getFixture('fixtures/trials-docs', 'documents-versions-fixture.json');
  }
  return docVersionsStore[docId];
}

export function addDocVersion(docId: string) {
  const versions = getDocVersions(docId);
  const nextVerNum = versions.length + 1;
  const newVersion = {
    id: `019a2ad8-f9cc-7c55-b18b-f075b2dd${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`,
    versionTag: `v${nextVerNum}`,
    isActive: false,
    createdAt: new Date().toISOString(),
    createdBy: 'username',
  };
  versions.push(newVersion);
  return newVersion;
}

export function setActiveDocVersion(docId: string, versionId: string) {
  const versions = getDocVersions(docId);
  const found = versions.find((v) => v.id === versionId);
  if (found) {
    versions.forEach((v) => {
      v.isActive = v.id === versionId;
    });
    return found;
  }
  return null;
}

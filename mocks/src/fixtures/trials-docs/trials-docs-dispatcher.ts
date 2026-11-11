import type { Request } from 'express';

import { getFixture, getPagination, paginate } from '../../utils';
import { getTrialById } from '../trials/trial-transitions-store';

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
  versionId: string;
  name: string;
  fileName?: string;
  category: 'SPECIFIC' | 'GENERAL';
  type: DocumentType;
  version: string;
  status: TrialDocsStatus;
  createdAt: string;
  updatedAt: string;
  associatedFireTrialIds?: string[];
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
  if (doc.associatedFireTrialIds) {
    associationsStore[doc.id] = [...doc.associatedFireTrialIds];
  }
  store.unshift(doc);
  return doc;
}

export function associateMockDocumentWithTrial(documentId: string, fireTrialId: string): void {
  const associations = getDocAssociations(documentId);
  if (!associations.includes(fireTrialId)) {
    setDocAssociations(documentId, [...associations, fireTrialId]);
  }
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
  const fireTrialId = req.params['fireTrialId'];
  if (!fireTrialId || !getTrialById(fireTrialId)) {
    throw new Error('FIRE_TRIAL_NOT_FOUND');
  }
  const filters: TrialDocsFilter = {
    category: req.query.category?.toString() || '',
    status: req.query.status ? (req.query.status.toString() as TrialDocsStatus) : TrialDocsStatus.ALL,
    type: req.query.typeId?.toString() || req.query.type?.toString() || '',
  };

  if (
    filters.status !== TrialDocsStatus.ALL &&
    filters.status !== TrialDocsStatus.ACTIVE &&
    filters.status !== TrialDocsStatus.OBSOLETE
  ) {
    throw new Error('Invalid document status filter');
  }

  if (filters.category && filters.category !== 'GENERAL' && filters.category !== 'SPECIFIC') {
    throw new Error('Invalid document category filter');
  }
  if (filters.type && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.type)) {
    throw new Error('Invalid document type UUID');
  }

  const rawPage = req.query['page'];
  const rawPageSize = req.query['pageSize'];
  const page = rawPage === undefined ? 1 : Number(rawPage);
  const pageSize = rawPageSize === undefined ? 25 : Number(rawPageSize);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) {
    throw new Error('Invalid pagination parameters');
  }

  const shouldFilterCategory = filters.category && filters.category !== 'ALL';
  const shouldFilterStatus = filters.status && filters.status !== TrialDocsStatus.ALL;
  const shouldFilterType = filters.type && filters.type !== 'ALL';

  const filteredDocuments = allDocs.filter((doc: FireTrialDocument) => {
    const associatedWithTrial = fireTrialId ? getDocAssociations(doc.id).includes(fireTrialId) : false;
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
    return associatedWithTrial && categoryMatch && statusMatch && typeMatch;
  });

  const selectedDocuments = filteredDocuments.filter((doc) => {
    const isActive = doc.status === TrialDocsStatus.ACTIVE;
    if (filters.status === TrialDocsStatus.ACTIVE) return isActive;
    if (filters.status === TrialDocsStatus.OBSOLETE) return !isActive;
    return true;
  });

  const sortValues = req.query['sort'];
  const sortCriteria = Array.isArray(sortValues)
    ? sortValues.filter((value): value is string => typeof value === 'string')
    : typeof sortValues === 'string'
      ? [sortValues]
      : [];
  const sortCriteriaReversed = [...sortCriteria].reverse();
  if (sortCriteria.some((criterion) => !/^[A-Za-z][A-Za-z0-9]*;(asc|desc)$/.test(criterion))) {
    throw new Error('Invalid sort parameter');
  }
  const sortedDocuments = [...selectedDocuments];
  for (const criterion of sortCriteriaReversed) {
    const [field, direction] = criterion.split(';');
    if (direction !== 'asc' && direction !== 'desc') continue;
    sortedDocuments.sort((left, right) => {
      const leftValue = left[field as keyof FireTrialDocument];
      const rightValue = right[field as keyof FireTrialDocument];
      const order = String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
      return direction === 'asc' ? order : -order;
    });
  }

  const items = sortedDocuments.map((doc) => ({
    id: doc.id,
    versionId: doc.versionId,
    name: doc.name,
    category: doc.category,
    type: doc.type,
    version: doc.version,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));

  return paginate(items, { page, pageSize });
}

export function getActiveTrialMetcmDocumentId(fireTrialId: string): string | null {
  return (
    getDocsStore().find(
      (doc) =>
        doc.type.id === 'd8869239-caee-4c21-a462-ad538b9d84cd' &&
        doc.status === TrialDocsStatus.ACTIVE &&
        getDocAssociations(doc.id).includes(fireTrialId),
    )?.id ?? null
  );
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
    const document = getDocsStore().find((item) => item.id === docId);
    associationsStore[docId] = [...(document?.associatedFireTrialIds ?? [])];
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

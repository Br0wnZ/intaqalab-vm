import type { Request } from 'express';

import { getFixture } from '../../utils';

type DocumentType = {
  id: string;
  name: string;
};

enum TrialDocsStatus {
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

export function trialsDocumentsDispatch(req: Request) {
  const documents = getFixture('fixtures/trials-docs', 'trials-docs-fixture.json') as DocumentsResponse;
  const filters: TrialDocsFilter = {
    category: req.query.category?.toString() || '',
    status: req.query.status ? (req.query.status.toString() as TrialDocsStatus) : TrialDocsStatus.ALL,
    type: req.query.type?.toString() || '',
  };

  const shouldFilterCategory = filters.category && filters.category !== 'ALL';
  const shouldFilterStatus = filters.status && filters.status !== TrialDocsStatus.ALL;
  const shouldFilterType = filters.type && filters.type !== 'ALL';

  const filteredDocuments = documents.items.filter((doc: FireTrialDocument) => {
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
